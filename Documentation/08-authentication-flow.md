# 08 — Authentication Flow

## Purpose

Explain how identity works end to end: sign-up, session storage, SSR, server functions and
route protection.

## Providers

| Method | Status |
| --- | --- |
| Email + password | Enabled |
| Google OAuth | Enabled |
| Phone/SMS, Apple, SAML | Supported by the platform, not configured |
| Anonymous sign-in | **Disabled by design** |

Configure providers from the backend Auth settings — see
[Supabase Configuration](./18-supabase-configuration.md).

## Sign-up sequence

```text
/auth  →  supabase.auth.signUp({ email, password, options.data.full_name })
            │
            ▼  Postgres trigger on auth.users
        handle_new_user()
            ├── INSERT public.profiles (id, full_name, email, avatar_url)
            ├── INSERT public.user_roles (user_id, 'customer')
            └── INSERT public.wallets (user_id)
            │
            ▼
        session issued → JWT stored by supabase-js → app redirects
```

Every new account is a **customer**. Elevated roles (`vendor`, `farmer`, `delivery`,
`admin`) are granted by inserting into `user_roles`, either by an admin in `/admin/people`
or via a migration for the first admin.

## OAuth redirect rules

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

- ✅ Always a full, same-origin URL built from `window.location.origin`.
- ⚠️ Never point `redirectTo` at a protected route such as `/vendor`. Store the intended
  path (e.g. in `sessionStorage`) and navigate after the session hydrates.

## Session handling in the app

`src/hooks/use-auth.tsx` owns session state:

```tsx
const { user, session, profile, loading, signIn, signUp, signOut } = useAuth();
```

Implementation rules it follows — keep them if you refactor:

1. Register `supabase.auth.onAuthStateChange` **before** calling `getSession()`, so no
   event is missed during hydration.
2. Never `await` Supabase calls inside the auth callback (deadlock risk); defer follow-up
   fetches with `setTimeout(..., 0)` or a query invalidation.
3. Treat `loading` as a real state — render skeletons, not a flash of the signed-out UI.

## Roles in the client

`src/features/roles/hooks.ts` reads `user_roles` for the current user and exposes helpers
such as `useRoles()`, `useIsAdmin()` and a `RoleGate`. This is **UX only**; the database
enforces the real rule via `has_role()` / `is_admin()` inside RLS policies.

## SSR and server functions

- Public routes render anonymously. Their loaders may only read data the `anon` role can
  see.
- Protected server functions use `.middleware([requireSupabaseAuth])`; the handler receives
  `context.supabase` (acting as the user), `context.userId` and `context.claims`.
- The browser attaches the bearer token through the `functionMiddleware` registered in
  `src/start.ts`. If protected calls suddenly return 401, that registration is the first
  thing to check.

```ts
// src/lib/example.functions.ts
export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });
```

⚠️ Calling that from a **public** route loader breaks the production build with
`Error: Unauthorized`, because prerender has no session. Call it from the component via
`useServerFn` inside `useQuery`, or move the route under an authenticated gate.

## Sign-out and suspension

- `signOut()` clears the local session; the JWT expires server-side on schedule.
- `profiles.is_suspended` blocks a user at the policy level. Suspended shoppers can read
  but not transact; the UI shows `suspended_reason`.

## Password and account safety

- Leaked-password protection (HIBP) should be switched on in Auth settings.
- Minimum password length is enforced by the provider config, not by client code.
- Email confirmation is on by default; do not auto-confirm unless product asks for it.

## Common mistakes

- ⚠️ Deriving admin status from `localStorage` or a client flag. Always ask the database.
- ⚠️ Reading `session` synchronously on first render and redirecting — you will bounce
  signed-in users. Wait for `loading === false`.
- ⚠️ Adding a foreign key to `auth.users` from a new profile-like table instead of
  referencing `profiles`.

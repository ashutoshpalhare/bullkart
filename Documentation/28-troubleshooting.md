# 28 — Common Errors & Fixes (Troubleshooting)

## Purpose

A symptom → cause → fix index for the failures this stack actually produces.

---

## Build and tooling

### `Error: Unauthorized` during `bun run build:dev`
**Cause:** a public route loader calls a server function guarded by `requireSupabaseAuth`;
prerender has no session.
**Fix:** call it from the component with `useServerFn` inside `useQuery`, or move the route
under an authenticated gate.

### `createServerFn is not a function`
**Cause:** wrong import.
**Fix:** `import { createServerFn } from "@tanstack/react-start"` — not `@tanstack/start`
or `@tanstack/react-router`.

### `ReferenceError: <helper> is not defined` at runtime, but types pass
**Cause:** a `.functions.ts` module contained runtime helpers alongside the server
function. Splitting removes the siblings.
**Fix:** move every helper, constant and mock generator into an imported module, or inside
the handler.

### Build fails citing a `*.server` import the component never made
**Cause:** a hook or shared util in the import chain pulls a server-only module into the
client graph.
**Fix:** break the chain at the leaf; don't just change the route.

### `[unenv] X is not implemented yet!` / `__dirname is not defined`
**Cause:** a Node-only package in the Worker runtime.
**Fix:** replace it with a Worker-compatible or fetch-based alternative. See
[Installing Dependencies](./16-installing-dependencies.md).

### Works in dev, breaks in production
**Cause:** dev runs on Node; production runs on `workerd`.
**Fix:** always validate with `bun run build` before shipping.

### `Cannot find module '@/hooks/use-toast'` or `@/components/ui/toaster`
**Cause:** those don't exist in this stack.
**Fix:** `import { toast } from "sonner"`; `<Toaster />` from `@/components/ui/sonner` is
mounted in `__root.tsx`.

---

## Routing

### A new route 404s
**Checks:** file exists under `src/routes/`; the `createFileRoute("/path")` string matches
the filename (dots = nesting); the dev server has regenerated `src/routeTree.gen.ts`.
**Never** hand-edit the generated tree.

### Duplicate `/` route error
**Cause:** both `src/routes/index.tsx` and something like `src/routes/_app/index.tsx`
claim the root.
**Fix:** keep `src/routes/index.tsx`, delete the other.

### Child route renders nothing
**Cause:** the parent route component doesn't render `<Outlet />`.

---

## Data and database

### `permission denied for table X`
**Cause:** missing `GRANT` — RLS alone is not enough.
**Fix:**
```sql
grant select, insert, update, delete on public.x to authenticated;
grant all on public.x to service_role;
```

### A query returns `[]` for a signed-in user who should see rows
**Cause:** RLS policy doesn't match, or the user id in the row differs.
**Fix:** check the policy `using` expression against `auth.uid()`; verify the row's
`user_id`. Remember: RLS filters silently, it doesn't error.

### `infinite recursion detected in policy for relation ...`
**Cause:** a policy queries the table it protects.
**Fix:** use a `SECURITY DEFINER` helper (`is_admin()`, `owns_seller()`, `has_role()`).

### `Expected 3 parts in JWT; got 1`
**Cause:** a publishable/secret key was sent as `Authorization: Bearer <key>`. These keys
are opaque, not JWTs.
**Fix:** use the generated clients, which send the `apikey` header.

### Stale TypeScript types after a migration
**Fix:** `src/integrations/supabase/types.ts` regenerates after the migration is applied;
restart the TS server in your editor.

---

## Auth

### Protected server functions suddenly return 401
**Cause:** the client `functionMiddleware` that attaches the bearer token is missing from
`src/start.ts`.
**Fix:** restore/append `attachSupabaseAuth` (or the project's equivalent) — append to the
array, don't replace it.

### Google sign-in: "Unsupported provider"
**Cause:** the provider isn't enabled in Auth settings.

### OAuth redirects to a login loop or a blank page
**Cause:** `redirectTo` points at a protected route, or the origin isn't in the redirect
allow-list.
**Fix:** redirect to `${window.location.origin}/auth/callback`, store the intended path
separately, and add every origin (localhost:8080, preview, production) to the allow-list.

### Signed-in user briefly sees the signed-out UI
**Cause:** rendering before `loading` resolves.
**Fix:** gate on `useAuth().loading`.

### Auth state hangs
**Cause:** an `await`ed Supabase call inside `onAuthStateChange`.
**Fix:** defer with `setTimeout(..., 0)` or invalidate a query instead.

---

## Checkout and orders

### `Your cart is empty.` with items visible
**Cause:** cart rows belong to a different (previous) session user.
**Fix:** confirm `auth.uid()` matches `cart_items.user_id`; re-add after sign-in.

### `Only N left of <product>.`
Working as intended — stock changed between page load and checkout. Refresh the cart.

### Order placed but stock unchanged
Impossible via `place_order` (one transaction). If observed, someone bypassed the RPC with
direct table writes — that path must be removed.

### Delivery can't be completed
**Cause:** `set_order_status('delivered')` is refused while an OTP exists.
**Fix:** use `verify_delivery_otp`.

---

## UI

### Hydration mismatch warning
**Cause:** reading `localStorage`/`window` during render or in a `useState` initializer.
**Fix:** read in `useEffect` or behind a hydration guard.

### Styles missing for a new class
**Cause:** a dynamically constructed class name (`` `bg-${color}-500` ``) — Tailwind can't
see it.
**Fix:** map to complete class strings.

### Dark mode looks wrong
**Cause:** hardcoded colour utilities instead of semantic tokens.

### Stale UI after a deploy
**Cause:** an old service worker.
**Fix:** DevTools → Application → Unregister, hard reload. In dev, enable "Update on
reload".

---

## Still stuck?

1. Read the whole error, including `hint` and `details` from Postgres.
2. Check the browser console *and* the network tab (status + response body).
3. Reproduce in a production build.
4. Isolate: does the raw query work in SQL? Does the component work with fixture data?
5. Fix the category, not just the instance — if one route had the bug, check its siblings.

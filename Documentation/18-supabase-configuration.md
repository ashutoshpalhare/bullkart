# 18 — Supabase / Cloud Configuration

## Purpose

Document the backend configuration: clients, auth settings, policies, functions and the
things that must never be edited by hand.

BullKart uses Lovable Cloud, which provisions Postgres, Auth, Storage and the PostgREST
API. Everything below is managed through migrations and the platform's backend settings.

## Generated files — do not edit

```text
src/integrations/supabase/
├── client.ts            browser client (anon key, RLS applies)
├── client.server.ts     server + admin (service-role) clients
├── types.ts             generated database types
├── auth-middleware.ts   requireSupabaseAuth for server functions
└── auth-attacher.ts     attachSupabaseAuth client function middleware
supabase/config.toml
```

Regenerated automatically after migrations. Hand edits are lost and can break the build.

## Choosing a client

| Situation | Client |
| --- | --- |
| Component / hook in the browser | `import { supabase } from "@/integrations/supabase/client"` |
| Server function acting **as the user** | `.middleware([requireSupabaseAuth])` → `context.supabase` |
| Public server-side read | Publishable client created **inside** the handler |
| Privileged work after verifying the caller | `await import("@/integrations/supabase/client.server")` → `supabaseAdmin` |

⚠️ `supabaseAdmin` bypasses RLS entirely. Never use it for an ordinary read, and never use
it to decide whether the caller is an admin — check the role through `context.supabase`
first.

⚠️ Publishable/secret keys are opaque strings, not JWTs. Never send them as
`Authorization: Bearer <key>`; use the `apikey` header (the generated clients do this).

## Auth settings

| Setting | Value |
| --- | --- |
| Email + password | Enabled, confirmation on |
| Google OAuth | Enabled |
| Anonymous sign-in | Disabled |
| Leaked password protection (HIBP) | Should be enabled |
| JWT expiry / refresh rotation | Platform defaults |

Redirect URLs must include the local origin (`http://localhost:8080`), the preview URL and
the production domain, each with the `/auth/callback` path used by the app.

## Client middleware

`src/start.ts` registers a client-side `functionMiddleware` that attaches the Supabase
bearer token to server function calls:

```ts
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
```

Append to the array; never replace it. Losing this is the usual cause of sudden 401s from
protected server functions.

## Row Level Security

Every table in `public` has RLS enabled. The house style:

```sql
-- 1. create
create table public.example (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. grant  (REQUIRED — RLS alone is not enough)
grant select, insert, update, delete on public.example to authenticated;
grant all on public.example to service_role;
-- grant select on public.example to anon;  -- only if a policy allows anon reads

-- 3. enable
alter table public.example enable row level security;

-- 4. policy
create policy "owner manages own rows" on public.example
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Skipping step 2 produces "permission denied for table" even though the policy is right.

## Database functions

Business logic that touches money, stock or roles lives in `SECURITY DEFINER` functions
with `SET search_path = public`. See [API Documentation](./10-api-documentation.md) for
each signature. Rules:

- Re-derive `auth.uid()` inside the function and authorize explicitly.
- Raise exceptions with sentences a shopper can read.
- Keep them transactional — no partial writes.

## Triggers

| Trigger function | Fires on |
| --- | --- |
| `handle_new_user()` | `auth.users` insert → profile, role, wallet |
| `set_updated_at()` | before update on timestamped tables |
| `products_search_vector_update()` | product insert/update → `search_vector` |
| `refresh_product_rating()` | review change → product rating/count |
| `mark_verified_review()` | review insert → `is_verified` |
| `notify_order_status()` | order status change → notification + `delivered_at` |

## Settings table

Operational configuration lives in `public.settings` as JSON, not in code:

```sql
select value from public.settings where key = 'commerce';
-- {"tax_rate":0.05,"delivery_fee":49,"express_fee":99,"free_delivery_threshold":999}
```

Edit from `/admin/settings`. `commerce_settings()` supplies defaults if the row is absent.

## Never touch

Schemas `auth`, `storage`, `realtime`, `supabase_functions`, `vault` — including triggers
on them. The one supported exception is the platform-managed `handle_new_user` trigger on
`auth.users`.

## Common mistakes

- ⚠️ Creating a table without grants.
- ⚠️ A policy that queries its own table (recursion) instead of using
  `is_admin()` / `owns_seller()`.
- ⚠️ Using the admin client in a route module at import time — it enters the client graph.

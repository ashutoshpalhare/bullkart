# 09 — User Roles & Permissions

## Purpose

Define who may do what, and where each rule is enforced.

## Roles

`app_role` enum: `customer`, `vendor`, `farmer`, `delivery`, `admin`.

Roles are rows in `public.user_roles` — a user may hold several (a farmer is also a
customer). They are **never** stored on `profiles`, because a self-updatable profile row
would let a user promote themselves.

```sql
-- grant a role (admin action or migration)
insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'admin')
on conflict (user_id, role) do nothing;
```

## Permission matrix

| Capability | Customer | Vendor | Farmer | Delivery | Admin |
| --- | :--: | :--: | :--: | :--: | :--: |
| Browse catalogue, read reviews | ✅ (public) | ✅ | ✅ | ✅ | ✅ |
| Cart, wishlist, addresses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Place / cancel own order | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review a delivered product | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create & edit own products | — | ✅ | ✅ | — | ✅ |
| Adjust own stock (`adjust_stock`) | — | ✅ | ✅ | — | ✅ |
| See orders containing own items | — | ✅ | ✅ | — | ✅ |
| Advance order status | — | ✅ (own items) | ✅ (own items) | ✅ (assigned) | ✅ |
| Publish harvest updates | — | — | ✅ | — | ✅ |
| Read own `seller_finance` | — | ✅ | ✅ | — | ✅ |
| Read own payouts | — | ✅ | ✅ | — | ✅ |
| Accept delivery, verify OTP | — | — | — | ✅ | ✅ |
| Assign delivery partner | — | — | — | — | ✅ |
| Verify/suspend sellers & users | — | — | — | — | ✅ |
| Coupons, banners, blogs, settings | — | — | — | — | ✅ |
| Broadcast notifications | — | — | — | — | ✅ |
| Platform metrics (`admin_metrics`) | — | — | — | — | ✅ |

## Enforcement layers

1. **Route/UI gate** — `src/features/roles/hooks.ts` + `DashboardLayout` hide links and
   redirect. Cosmetic.
2. **RLS policies** — the real boundary. Typical shapes:

```sql
-- owner-scoped
using (user_id = auth.uid())

-- seller-scoped, via a security-definer helper (no recursive RLS)
using (public.owns_seller(auth.uid(), seller_id) or public.is_admin(auth.uid()))

-- public catalogue read
for select to anon, authenticated using (is_active and deleted_at is null)
```

3. **RPC re-checks** — every `SECURITY DEFINER` function derives `auth.uid()` itself and
   raises a plain-English exception when the caller is not permitted, e.g.
   `Only admins can assign deliveries.`

## Helper functions

| Function | Use |
| --- | --- |
| `public.has_role(uid, role)` | Generic role test |
| `public.is_admin(uid)` | Shorthand used across policies |
| `public.owns_seller(uid, seller_id)` | Seller ownership without recursive policy evaluation |

All three are `STABLE SECURITY DEFINER` with `SET search_path = public`. That combination
is what prevents infinite recursion when a policy on table A queries table B whose policy
queries A.

## Adding a new role

1. `ALTER TYPE public.app_role ADD VALUE 'support';` (own migration — enum additions can't
   share a transaction with their use).
2. Add policies referencing `has_role(auth.uid(), 'support')`.
3. Extend the role hooks and navigation.
4. Add a permission-matrix row here.
5. Add a test that a non-`support` user is refused.

## Common mistakes

- ⚠️ Writing a policy that selects from the same table it protects → recursion. Use a
  security-definer helper.
- ⚠️ Granting `anon` on a table whose policies all reference `auth.uid()`.
- ⚠️ Checking roles only in React. A `curl` with a valid customer JWT must fail too.

# 06 — System Architecture

## Purpose

Describe how a request travels through BullKart, where each responsibility lives, and
which boundaries must not be crossed.

## Layer diagram

```text
┌──────────────────────────── Browser ────────────────────────────┐
│  React 19 components (src/routes, src/components)               │
│  TanStack Router  ·  TanStack Query cache  ·  react-hook-form   │
│  hooks in src/features/*  ← the ONLY place that talks to data   │
└───────────┬───────────────────────────────┬─────────────────────┘
            │ supabase-js (JWT of the user) │ createServerFn (typed RPC)
            ▼                               ▼
┌──────────────────────┐        ┌──────────────────────────────────┐
│ PostgREST + Auth     │        │ Worker runtime (Nitro/workerd)   │
│  · RLS as auth.uid() │        │  · SSR render                    │
│  · SECURITY DEFINER  │        │  · secret-bearing calls          │
│    RPC functions     │        │  · admin client (service role)   │
└─────────┬────────────┘        └────────────────┬─────────────────┘
          │                                      │
          ▼                                      ▼
┌─────────────────────────── Postgres ────────────────────────────┐
│ tables · enums · triggers · indexes · storage buckets           │
└─────────────────────────────────────────────────────────────────┘
```

## Request lifecycles

### 1. Server-rendered page load

1. Worker receives `GET /product/organic-turmeric`.
2. `src/routes/__root.tsx` renders the shell; the leaf route's `head()` emits SEO tags.
3. The route loader calls `context.queryClient.ensureQueryData(productQuery(slug))`.
4. Query executes against PostgREST **anonymously** (public catalogue policies allow it).
5. HTML streams to the browser with a dehydrated Query cache; hydration is a no-op fetch.

✅ Public routes must only load data readable by `anon`. A loader calling an
auth-protected server function will 401 during prerender.

### 2. Authenticated mutation (add to cart)

1. Component calls `useAddToCart()` from `src/features/cart/hooks.ts`.
2. `supabase.from('cart_items').upsert(...)` sends the user's JWT.
3. RLS policy `user_id = auth.uid()` decides row visibility/writability.
4. On success the hook invalidates `['cart']`; dependent UI re-renders.

### 3. Money path (place order)

1. `/checkout` calls `supabase.rpc('place_order', { _address, _payment_method, … })`.
2. Inside one transaction the function:
   - locks cart rows joined to `products` (`FOR UPDATE OF p`),
   - re-validates availability, quantity and stock,
   - recomputes subtotal, tax, delivery and express fees from `commerce_settings()`,
   - validates the coupon, applies wallet balance,
   - inserts `orders` + `order_items`, decrements stock, writes
     `inventory_movements`, `payments`, `wallet_transactions`, `coupon_redemptions`,
   - inserts a notification and clears the cart.
3. Any failure rolls the whole thing back and raises a human-readable message.

**Client totals are display-only.** The order row is the truth.

### 4. Fulfilment

`assign_delivery_partner` (admin) → generates/persists the OTP and notifies the partner →
partner moves status via `set_order_status` → `verify_delivery_otp` completes delivery and
flips COD payments to `paid`.

## Boundary rules

| Boundary | Rule |
| --- | --- |
| Component ↔ data | Components never call `supabase` directly; go through `src/features/*` |
| Client ↔ secrets | `process.env` is server-only and must be read **inside** a handler |
| Client ↔ admin client | `supabaseAdmin` is imported dynamically inside a handler, after verifying the caller |
| SSR ↔ browser APIs | Browser-only libs are dynamically imported behind `<ClientOnly>` |
| App logic ↔ external HTTP | Internal → `createServerFn`; external callers → `src/routes/api/public/*` |

## Authorization model (defence in depth)

1. **UI gate** — `src/features/roles/hooks.ts` hides or redirects. UX only.
2. **RLS** — every table has policies; grants are issued per role.
3. **RPC re-check** — each `SECURITY DEFINER` function re-derives `auth.uid()` and calls
   `is_admin()` / `owns_seller()` before mutating.

Removing layer 1 is a cosmetic bug. Removing layer 2 or 3 is a security incident.

## Failure handling

- Route-level error boundaries render `src/lib/error-page.ts` output.
- `src/lib/errors.ts` maps Postgres/PostgREST errors to sentences a shopper can act on.
- `src/lib/error-capture.ts` + `monitoring.ts` forward to the configured provider.
- Offline is surfaced by `network-status.tsx`; the service worker serves cached shells.

## Common mistakes

- ⚠️ Calling a `requireSupabaseAuth` server function from a public route loader → build
  fails with `Error: Unauthorized`.
- ⚠️ Doing multi-table money logic in the client with several `await`s. Not atomic.
- ⚠️ Reading `process.env` at module scope in a server function file.

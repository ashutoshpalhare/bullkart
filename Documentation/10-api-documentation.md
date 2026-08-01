# 10 — API Documentation

## Purpose

Reference for every callable interface: Postgres RPCs, PostgREST table access, TanStack
server functions and HTTP server routes.

There is no separate REST service. "The API" is (a) PostgREST over the schema, (b) SQL
functions, (c) server functions in the Worker.

---

## 1. PostgREST table access

Called through `@supabase/supabase-js`. Authorization is RLS — an unauthorized read simply
returns zero rows, an unauthorized write errors.

```ts
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase
  .from("products")
  .select("id, slug, name, price, mrp, rating, images, seller:sellers(name, verified)")
  .eq("is_active", true)
  .is("deleted_at", null)
  .order("rating", { ascending: false })
  .limit(24);
```

Always: select explicit columns, filter `deleted_at`, and wrap in a `queryOptions` inside
`src/features/*`.

---

## 2. SQL RPCs

Invoke with `supabase.rpc(name, params)`. Every parameter is prefixed with `_`.
All of these raise exceptions with user-facing text — surface `error.message` directly.

### `commerce_settings() → jsonb`
Fees and thresholds; falls back to
`{"tax_rate":0.05,"delivery_fee":49,"express_fee":99,"free_delivery_threshold":999}`.

### `validate_coupon(_code text, _subtotal numeric) → jsonb`
Returns `{ valid, coupon_id, code, discount, description }` or
`{ valid:false, message }`. Checks activity window, min order, global and per-user limits
and `first_order_only`.

### `place_order(_address jsonb, _payment_method text = 'cod', _delivery_option text = 'standard', _coupon text = null, _use_wallet numeric = 0) → jsonb`

```ts
const { data, error } = await supabase.rpc("place_order", {
  _address: { full_name, phone, line1, city, state, pincode },
  _payment_method: "cod",          // cod | razorpay | wallet
  _delivery_option: "standard",    // standard | express
  _coupon: coupon || null,
  _use_wallet: walletToApply,      // rupees
});
```

Atomic: validates cart against live products with row locks, computes subtotal/tax/
delivery/discount, applies wallet, inserts `orders`, `order_items`, `payments`,
`inventory_movements`, `wallet_transactions`, `coupon_redemptions`, generates the invoice
number, notifies the shopper and clears the cart. Returns the order row as JSON.

Typical errors: `Your cart is empty.`, `Only 3 left of Turmeric.`,
`Please sign in to place an order.`, `A complete delivery address is required.`

### `cancel_order(_order_id uuid, _reason text = null) → jsonb`
Owner or admin. Refuses once shipped/out_for_delivery/delivered/cancelled/returned.
Restocks items, refunds wallet usage, marks paid orders `refunded`.

### `set_order_status(_order_id uuid, _status order_status, _note text = null) → jsonb`
Allowed for admin, the assigned delivery partner, or a seller with items on the order.
Refuses `delivered` when an OTP exists and the caller is not an admin. Mirrors state into
`delivery_assignments` and settles COD on delivery.

### `assign_delivery_partner(_order_id uuid, _partner_user_id uuid) → jsonb`
Admin only. Generates/persists a 6-digit `delivery_otp`, moves `placed|confirmed → packed`,
creates the assignment row and notifies the partner.

### `verify_delivery_otp(_order_id uuid, _otp text) → jsonb`
Assigned partner or admin. On match: status `delivered`, `delivered_at = now()`, COD
payment → `paid`, assignment closed.

### `adjust_stock(_product_id uuid, _change integer, _note text = null) → integer`
Seller-owner or admin. Clamps at zero, returns the new quantity, writes a `manual`
`inventory_movements` row.

### `admin_metrics() → jsonb`
Admin only. Keys: `revenue`, `revenue_30d`, `orders`, `pending_orders`, `customers`,
`vendors`, `farmers`, `products`, `low_stock`, `pending_verification`, `reviews`,
`daily[]`, `categories[]`, `top_products[]`.

### `broadcast_notification(_title text, _body text = null, _link text = null, _audience text = 'all', _type notification_type = 'system') → integer`
Admin only. Audience: `all | customer | vendor | farmer | delivery | admin`. Returns the
number of notifications created.

### `search_products(_q text, _limit integer = 20) → setof products`
Rank-ordered full-text search with an `ILIKE` fallback; limit is capped at 100.

### Helpers
`has_role(uid, role)`, `is_admin(uid)`, `owns_seller(uid, seller_id)` — usable in SQL and
callable from the client for gating UI.

---

## 3. Server functions (`createServerFn`)

Located in `src/lib/*.functions.ts`. Use these when the work needs a secret, privileged
access, or third-party HTTP.

```ts
// src/lib/payments.functions.ts (shape)
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"]!;      // read inside the handler
    const keySecret = process.env["RAZORPAY_KEY_SECRET"]!;
    /* … create order with Razorpay, persist provider ids on public.payments … */
  });
```

Calling from a component:

```tsx
const create = useServerFn(createRazorpayOrder);
const { mutate } = useMutation({ mutationFn: (orderId: string) => create({ data: { orderId } }) });
```

Rules:
- The module may contain only imports, types and exported server functions.
- Read `process.env` inside the handler, never at module scope.
- Never call a protected server function from a public route loader.

---

## 4. HTTP server routes

Under `src/routes/api/`. Anything external must live under `src/routes/api/public/*`,
which bypasses site auth — so the handler is responsible for its own verification.

```ts
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");
        // 1. verify HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET (timing-safe)
        // 2. parse + validate with zod
        // 3. update public.payments / public.orders
        return new Response("ok");
      },
    },
  },
});
```

Existing machine routes: `/sitemap.xml` (`src/routes/sitemap[.]xml.ts`) and
`public/robots.txt`.

Stable URLs for external configuration:
`project--{project-id}.lovable.app` (production) and
`project--{project-id}-dev.lovable.app` (preview).

---

## Error contract

| Source | Shape | Handling |
| --- | --- | --- |
| PostgREST | `{ code, message, details, hint }` | Map via `src/lib/errors.ts`, toast with sonner |
| RPC `RAISE EXCEPTION` | `message` is already human-readable | Show verbatim |
| Server function | Thrown `Error` / `Response` | Boundary renders the error page |

## Common mistakes

- ⚠️ Re-implementing coupon or total maths client-side.
- ⚠️ Using the admin (service-role) client for an ordinary read; it bypasses RLS.
- ⚠️ Putting a webhook outside `/api/public/` and wondering why the provider gets a login
  page.

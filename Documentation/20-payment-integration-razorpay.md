# 20 — Payment Integration (Razorpay)

## Purpose

Describe the payment architecture, the currently active path (COD + wallet), and the exact
steps to switch Razorpay on.

## Current status

| Method | Status |
| --- | --- |
| Cash on Delivery (`cod`) | ✅ Live |
| Wallet (`wallet`) | ✅ Live — balance applied inside `place_order` |
| Razorpay (`razorpay`) | ⏸ Code present, **dormant** until keys are configured |

Checkout defaults to COD. The Razorpay option should stay hidden while the keys are unset;
the server function throws a clear "Payments are not configured yet." error if called.

## Data model

| Table | Role |
| --- | --- |
| `orders.payment_method` | `cod` \| `razorpay` \| `wallet` |
| `orders.payment_status` | `pending` \| `paid` \| `failed` \| `refunded` |
| `payments` | One row per attempt: provider, method, status, amount, `provider_order_id`, `provider_payment_id`, `provider_signature`, `error_code`, `raw jsonb` |
| `refunds` | Provider refund id, amount, status, reason |
| `wallets` / `wallet_transactions` | Credit ledger; refunds land here for cancelled orders |

`place_order` always inserts a `payments` row — `internal` provider for COD/wallet,
`razorpay` otherwise.

## Flow (once enabled)

```text
Checkout
  │ 1. supabase.rpc('place_order', { _payment_method: 'razorpay', … })
  │    → order row, payment row (pending), stock reserved
  │ 2. createRazorpayOrder({ orderId })            [server function]
  │    → Razorpay Orders API using RAZORPAY_KEY_ID/SECRET
  │    → persists provider_order_id on public.payments
  │ 3. Razorpay Checkout opens in the browser (src/features/payments/razorpay.ts)
  │ 4a. Client handler → verifyRazorpayPayment({ order_id, payment_id, signature })
  │     → HMAC-SHA256(order_id|payment_id, KEY_SECRET) compared timing-safely
  │ 4b. Webhook  POST /api/public/razorpay-webhook  (source of truth)
  │     → verify X-Razorpay-Signature with RAZORPAY_WEBHOOK_SECRET
  │     → payment.captured → orders.payment_status = 'paid'
  │     → payment.failed   → 'failed'
  ▼
Order confirmed
```

**The webhook is authoritative.** Client callbacks can be lost when a user closes the tab;
never mark an order paid on the client handler alone.

## Enabling Razorpay — step by step

1. Create a Razorpay account and generate API keys (Dashboard → Settings → API Keys).
2. Store three secrets via the platform secret form:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET` — a strong random value you generate yourself
     (`openssl rand -hex 32`), because you must paste the *same* value into Razorpay.
3. Deploy so the webhook route exists, then register the endpoint in Razorpay:
   `https://project--{project-id}.lovable.app/api/public/razorpay-webhook`
   Subscribe to `payment.captured`, `payment.failed`, `refund.processed`.
4. Enable the UI option in `src/routes/checkout.tsx`.
5. Test in Razorpay test mode with the official test cards before switching to live keys.

## Code locations

| Concern | File |
| --- | --- |
| Browser checkout launcher | `src/features/payments/razorpay.ts` |
| Server functions (create order, verify) | `src/lib/payments.functions.ts` |
| Webhook route | `src/routes/api/public/razorpay-webhook.ts` |
| Checkout UI | `src/routes/checkout.tsx` |

## Signature verification

```ts
import { createHmac, timingSafeEqual } from "crypto";

const expected = createHmac("sha256", process.env["RAZORPAY_KEY_SECRET"]!)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest("hex");

const ok =
  signature.length === expected.length &&
  timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
if (!ok) throw new Error("Payment verification failed.");
```

Webhook bodies are verified against the **raw text body** with `RAZORPAY_WEBHOOK_SECRET` —
parse JSON only after the signature checks out.

## Refunds

1. Admin triggers a refund on a paid order.
2. Server function calls the Razorpay refund API, inserts into `public.refunds` and
   updates `payments.refunded_amount`.
3. `orders.payment_status` becomes `refunded`.
4. For wallet-funded portions, `cancel_order` already credits `wallets` and writes a
   `wallet_transactions` row.

## Idempotency

Webhooks retry. Before applying an event, check whether `payments.provider_payment_id` is
already recorded with the same status and exit early if so. Double-crediting a wallet is
the worst bug this system can have.

## Common mistakes

- ⚠️ Trusting the client callback and skipping the webhook.
- ⚠️ Verifying the signature against a re-serialised JSON body instead of the raw text.
- ⚠️ Exposing `RAZORPAY_KEY_SECRET` via a `VITE_` variable. Only `KEY_ID` may reach the
  browser.
- ⚠️ Creating the Razorpay order before `place_order`, leaving payments with no order to
  attach to.

# 31 — Future Roadmap

## Purpose

Where BullKart is heading. Items are grouped by horizon, each with the rough shape of the
work so anyone can pick one up. Nothing here is committed scope — treat it as an
opportunity backlog.

## Now (next release)

| Item | Notes |
| --- | --- |
| **Activate Razorpay** | Keys + webhook; see [20](./20-payment-integration-razorpay.md). Unblocks prepaid orders and reduces COD returns. |
| **Referral programme UI** | `public.referrals` already exists — needs share links, attribution on sign-up, and wallet credit on first delivered order. |
| **Transactional email** | Order placed / shipped / delivered / cancelled. Templates + a send hook on `notify_order_status`. |
| **Return & refund flow** | `orders.return_reason` / `return_requested_at` exist; needs shopper request UI, admin approval, and a `refunds` write path. |
| **Product variants on the storefront** | `product_variants` is managed but the PDP does not yet let shoppers pick a size/pack. |

## Next (1–2 quarters)

| Item | Shape |
| --- | --- |
| **Subscriptions / weekly boxes** | New `subscriptions` + `subscription_items` tables, scheduled order generation via a cron-triggered `/api/public/*` route. |
| **Pincode-based serviceability** | Check `delivery_partners.service_pincodes` and seller location at cart time; show ETA before checkout. |
| **Delivery slots** | Time-window selection at checkout, capacity per slot per pincode. |
| **Seller analytics** | Per-seller revenue, conversion, low-stock alerts, best sellers — mirror of `admin_metrics` scoped by `owns_seller`. |
| **Automated payouts** | Scheduled settlement runs that create `payouts` rows from delivered `order_items` minus commission. |
| **Ratings & Q&A** | Product question threads answered by the seller; adds unique SEO content. |
| **Search upgrades** | Synonyms, typo tolerance, facet counts, and search-term analytics to drive merchandising. |
| **Multi-language (Hindi first)** | i18n layer, translated category/product fields, `hreflang` in the sitemap. |

## Later (exploratory)

- **Farm traceability QR** — scan a pack to see the exact `harvest_updates` timeline.
- **Loyalty tiers** — spend-based tiers with wallet cashback.
- **B2B / bulk ordering** — GST invoices, tiered pricing, purchase orders.
- **Live inventory sync** — CSV/API import for larger vendors.
- **Recommendations** — "bought together" and personalised shelves from order history.
- **Native app shell** — only if PWA metrics prove insufficient.
- **Carbon/packaging transparency** — per-order impact estimate.

## Technical debt to retire

| Debt | Why it matters |
| --- | --- |
| `src/lib/mock-data.ts` | Should disappear once every surface reads live data. |
| `docs/DEPLOYMENT.md` | Superseded by [21](./21-deployment.md); delete after one release. |
| E2E coverage | Only a smoke path exists; fulfilment and admin flows need specs. |
| Image pipeline | Client-side compression only; consider an image CDN with on-the-fly resizing. |
| Notification fan-out | `broadcast_notification` writes a row per user; fine now, needs batching at scale. |
| Observability | Monitoring is wired but no provider is configured in production. |

## How to propose an addition

1. Write the user problem in one sentence.
2. Name the affected roles and surfaces.
3. Sketch the schema change, if any, and its RLS implications.
4. State the metric that will prove it worked.
5. Open a proposal per [Contributing Guidelines](./29-contributing-guidelines.md).

## Guiding constraint

Every addition must preserve the three properties that make the product credible:
**verified supply, transparent provenance, and server-authoritative money.** A feature
that erodes any of them is not worth the GMV.

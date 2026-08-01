# 03 — Features

## Purpose

A complete inventory of shipped functionality, grouped by role, with the code that
implements each. Use this to find the right file quickly.

## Storefront (public)

| Feature | Implementation |
| --- | --- |
| Home: hero, category rail, featured / best-seller / new-arrival shelves, farmer spotlight | `src/routes/index.tsx`, `src/components/commerce/section.tsx` |
| Category directory and per-category listing | `src/routes/categories.tsx`, `src/routes/category.$slug.tsx` |
| Faceted product browsing (price, rating, badges, certification, sort) | `src/components/commerce/product-browser.tsx`, `src/features/catalog/queries.ts` |
| Full-text search backed by `tsvector` | `src/routes/search.tsx` → `search_products()` RPC |
| Product detail: gallery, variants, nutrition, certifications, seller card, reviews | `src/routes/product.$slug.tsx` |
| Farmer/vendor directory and stories | `src/routes/farmers.tsx` |
| Skeletons, empty states, error states | `src/components/commerce/skeletons.tsx`, `states.tsx` |
| SEO meta + JSON-LD + sitemap | `src/lib/seo.ts`, `src/routes/sitemap[.]xml.ts` |
| PWA install prompt, offline banner | `src/components/layout/install-prompt.tsx`, `network-status.tsx` |

## Shopper account

| Feature | Implementation |
| --- | --- |
| Cart (server-persisted per user) | `src/features/cart/hooks.ts`, `src/routes/cart.tsx`, table `cart_items` |
| Wishlist | `src/features/wishlist/hooks.ts`, `src/routes/wishlist.tsx`, table `wishlist_items` |
| Address book with default address | `src/routes/profile.tsx`, table `addresses` |
| Multi-step checkout: address → delivery option → coupon/wallet → payment | `src/routes/checkout.tsx` |
| Coupon validation with human error messages | `validate_coupon()` RPC |
| Wallet credit and transaction ledger | `wallets`, `wallet_transactions` |
| Atomic order placement (stock, tax, wallet, coupon, invoice) | `place_order()` RPC |
| Order history, timeline, cancel, invoice number | `src/routes/orders.tsx`, `cancel_order()` |
| Verified reviews with images | `src/features/reviews/hooks.ts`, trigger `mark_verified_review` |
| Notifications feed | table `notifications` |
| Recently viewed | `src/hooks/use-recent-list.ts` |

## Vendor workspace (`/vendor`)

- Overview KPIs and revenue charts — `src/components/dashboard/seller-overview.tsx`.
- Product CRUD with slug generation, gallery upload, badges, certifications, nutrition —
  `src/components/dashboard/product-manager.tsx`.
- Variants (`product_variants`) and stock adjustments via `adjust_stock()` with an audit
  trail in `inventory_movements`.
- Order fulfilment (`set_order_status`) — `src/components/dashboard/seller-orders.tsx`.
- Payout ledger — `src/components/dashboard/seller-payouts.tsx`.
- Store profile + private finance fields (GST, payout account) in `seller_finance` —
  `src/features/seller/finance.ts`.
- Onboarding gate when no seller row exists — `src/components/dashboard/store-gate.tsx`.

## Farmer workspace (`/farmer`)

Everything the vendor has, plus:

- **Harvest updates** (`harvest_updates`): stage, harvest date, photo, publish toggle —
  `src/routes/farmer.harvests.tsx`. These render on the product page as provenance.

## Delivery workspace (`/delivery`)

- Partner onboarding into `delivery_partners` (vehicle, service pincodes, availability).
- Assignment queue from `delivery_assignments` — `src/features/delivery/hooks.ts`.
- Status transitions: assigned → picked_up → in_transit → delivered.
- Maps deep link for navigation from the shipping address.
- **OTP handover**: `verify_delivery_otp()` marks the order delivered and settles COD
  payment status in one transaction.
- Earnings summary.

## Admin console (`/admin`)

| Screen | Capability |
| --- | --- |
| Overview | `admin_metrics()` — revenue, orders, 30-day series, category mix, top products (Recharts) |
| People | Users, roles, suspension (`profiles.is_suspended`), seller verification |
| Catalog | Cross-seller product moderation, soft delete, categories |
| Orders | Full order list, status override, `assign_delivery_partner()` |
| Marketing | Coupons, banners, blogs, `broadcast_notification()` |
| Moderation | Review takedown, flagged content |
| Settings | `public.settings` — commerce fees, thresholds, feature flags |

## Cross-cutting

- Role-aware navigation and gates — `src/features/roles/hooks.ts`.
- Reusable data table with sorting, search and CSV export — `src/components/dashboard/data-table.tsx`, `src/lib/csv.ts`.
- Error boundaries and human error mapping — `src/lib/errors.ts`, `error-page.ts`.
- Monitoring hooks for Sentry/PostHog/GA and Core Web Vitals — `src/lib/monitoring.ts`.
- INR currency and Indian date formatting — `src/lib/format.ts`.

## Dormant / flagged

- **Razorpay.** Code exists (`src/features/payments/razorpay.ts`,
  `src/lib/payments.functions.ts`) but stays disabled until keys are set. Checkout
  defaults to COD. See [Payment Integration](./20-payment-integration-razorpay.md).
- **Referrals.** Table `referrals` exists; UI not yet built.

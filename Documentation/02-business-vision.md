# 02 — Business Vision

## Purpose

Explain *why* BullKart exists, so engineering decisions can be judged against intent
rather than taste. When a trade-off is unclear, resolve it in favour of the principles
listed at the bottom of this page.

## The problem

India's organic market is large, growing, and badly served online:

- **Trust gap.** "Organic" is claimed far more often than it is certified. Shoppers cannot
  tell a certified farm from a relabeller.
- **Margin capture.** Traditional distribution takes most of the retail price; the farmer
  receives a fraction.
- **Discovery.** Small certified producers have no channel to reach urban buyers.
- **Freshness.** Produce moves through too many hops.

## The proposition

> A marketplace where every seller is verified, every claim is evidenced, and the person
> who grew the food is visible on the product page.

Three levers:

1. **Verification as a product feature.** `sellers.verified`, `products.certifications`
   and `products.is_organic_certified` are surfaced in UI, not buried in admin.
2. **Traceability.** `harvest_updates` lets farmers publish the lifecycle of a crop —
   sowing, growing, harvested — with dates and photos linked to the product.
3. **Direct economics.** Sellers hold their own catalogue and see payouts
   (`public.payouts`) with commission broken out.

## Personas

| Persona | Goal | Primary surface |
| --- | --- | --- |
| **Anita, urban shopper (32)** | Trustworthy groceries in under 3 minutes, on mobile | `/`, `/search`, `/cart` |
| **Ramesh, certified farmer (45)** | Sell direct, prove authenticity, get paid on time | `/farmer` |
| **Kavya, D2C brand ops (28)** | Manage SKUs, variants and stock at scale | `/vendor` |
| **Imran, delivery partner (26)** | Clear route list, fast handover, visible earnings | `/delivery` |
| **Platform ops** | Keep GMV healthy, catch fraud, verify sellers | `/admin` |

## Unit economics model (as implemented)

| Element | Where it lives |
| --- | --- |
| Item subtotal | Sum of `order_items.price × quantity` |
| Tax | Per-product `products.tax_rate`, falling back to `settings.commerce.tax_rate` (5%) |
| Delivery fee | `settings.commerce.delivery_fee` (₹49), free over `free_delivery_threshold` (₹999) |
| Express surcharge | `settings.commerce.express_fee` (₹99) |
| Discounts | `public.coupons` + `validate_coupon()` |
| Wallet | `public.wallets` / `wallet_transactions`, applied inside `place_order` |
| Seller payout | `public.payouts.amount` minus `payouts.commission` |

All of these are data, not constants in code — change them via the `settings` table or the
admin settings screen rather than a redeploy.

## Success metrics

- Repeat purchase rate within 30 days.
- Share of GMV from verified farmers (vs. resellers).
- Median order-to-delivery hours.
- Catalogue health: % of live SKUs above the low-stock threshold.
- Review coverage: % of delivered items with a verified review.

`admin_metrics()` already returns revenue, revenue_30d, orders, pending orders, customers,
vendors, farmers, products, low stock, pending verification, reviews, a 30-day daily
series, category revenue and top products.

## Product principles

1. **Trust beats conversion.** Never dark-pattern an organic claim.
2. **Mobile-first, thumb-first.** Most shoppers arrive on a mid-range Android phone.
3. **The seller is a first-class user**, not an afterthought CMS login.
4. **Money logic belongs in the database.** Totals, stock and wallet moves are computed in
   `place_order`, atomically — never in the browser.
5. **Everything configurable is data.** Fees, thresholds, banners, coupons.
6. **Fail honestly.** Show the real, human-readable error from the RPC.

## Common mistakes

- ⚠️ Recomputing order totals client-side "for speed". The server total is canonical.
- ⚠️ Hiding verification status because it clutters a card. It *is* the product.

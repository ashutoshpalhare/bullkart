# 07 — Database Schema

## Purpose

Document every table, enum, function and relationship in the `public` schema, plus the
conventions all new tables must follow.

## Conventions

- Primary keys: `uuid` with `gen_random_uuid()`.
- Timestamps: `created_at` and `updated_at` (`timestamptz not null default now()`), kept
  fresh by the `set_updated_at()` trigger function.
- Soft delete: `deleted_at timestamptz` on catalogue-ish tables (`products`, `categories`,
  `sellers`, `product_variants`, `blogs`). Queries must filter `deleted_at is null`.
- Money: `numeric`, rupees, never floats.
- Ownership: user-owned rows carry `user_id uuid references auth.users`.
  **No foreign keys into `auth.users` from denormalised profile data — use `profiles`.**
- Every new `public` table needs `GRANT`s *and* RLS policies (see
  [Migrations](./22-database-migration-guide.md)).

## ERD (logical)

```text
auth.users ─1:1─ profiles
     │  1:N  user_roles (role: customer|vendor|farmer|delivery|admin)
     │  1:1  wallets ─1:N─ wallet_transactions
     │  1:N  addresses, notifications, cart_items, wishlist_items, reviews
     │  1:1  delivery_partners
     └─ owner_id ─1:N─ sellers
                          │ 1:1 seller_finance   (private: GST, payout account)
                          │ 1:N products ─1:N─ product_images
                          │            ├─1:N─ product_variants
                          │            └─1:N─ inventory_movements
                          │ 1:N harvest_updates
                          └─1:N payouts

categories ─self ref parent_id─ categories
categories 1:N products

orders ─1:N─ order_items ─N:1─ products / sellers
orders ─1:N─ payments ─1:N─ refunds
orders ─1:N─ delivery_assignments ─N:1─ delivery_partners(user_id)
orders ─1:N─ inventory_movements
coupons ─1:N─ coupon_redemptions ─N:1─ orders

banners · blogs · settings · referrals   (standalone)
```

## Enums

| Enum | Values |
| --- | --- |
| `app_role` | customer, vendor, farmer, delivery, admin |
| `order_status` | placed, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, returned |
| `payment_status` | pending, paid, failed, refunded |
| `delivery_status` | assigned, picked_up, in_transit, delivered, failed |
| `seller_type` | farmer, vendor, brand |
| `notification_type` | order, promo, system, payout, delivery |
| `txn_type` | credit, debit |

## Tables

### Identity

| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | `id` (= auth user), `full_name`, `email`, `phone`, `avatar_url`, `is_suspended`, `suspended_reason` | Created by the `handle_new_user()` trigger |
| `user_roles` | `user_id`, `role` (unique together) | **Roles live here, never on `profiles`** — prevents privilege escalation |
| `addresses` | label, full_name, phone, line1/2, city, state, pincode, `is_default` | Owner-scoped |
| `wallets` / `wallet_transactions` | `balance`; `type`, `amount`, `balance_after`, `order_id` | Ledger is insert-only via RPCs |
| `referrals` | `code`, `referrer_id`, `referee_id`, `reward_amount` | Schema ready, UI pending |

### Catalogue

| Table | Key columns | Notes |
| --- | --- | --- |
| `categories` | `slug`, `name`, `parent_id`, `sort_order`, `is_active` | Self-referencing tree |
| `sellers` | `slug`, `name`, `type`, `location`, `verified`, `story`, `owner_id` | Public-readable; **no financial data here** |
| `seller_finance` | `seller_id` PK, `gst_number`, `payout_account` | Owner/admin only |
| `products` | `slug`, `price`, `mrp`, `unit`, `images[]`, `badges[]`, `certifications[]`, `nutrition jsonb`, `stock_qty`, `low_stock_threshold`, `tax_rate`, `rating`, `review_count`, feature flags, `search_vector` | `search_vector` maintained by `products_search_vector_update()` |
| `product_images` | `url`, `alt`, `sort_order` | Gallery beyond `products.images` |
| `product_variants` | `sku`, `name`, `unit`, `price`, `mrp`, `stock_qty` | Optional per-product SKUs |
| `harvest_updates` | `stage`, `harvest_date`, `image_url`, `is_published` | Farmer provenance feed |
| `reviews` | `rating`, `title`, `body`, `images[]`, `is_verified`, `order_id` | Triggers refresh `products.rating` |

### Commerce

| Table | Key columns | Notes |
| --- | --- | --- |
| `cart_items` / `wishlist_items` | `user_id`, `product_id`, `quantity` | Server-persisted |
| `coupons` | `code`, `discount_type`, `discount_value`, `min_order`, `max_discount`, `usage_limit`, `per_user_limit`, `first_order_only`, `valid_from/to` | Evaluated by `validate_coupon()` |
| `coupon_redemptions` | coupon, user, order, amount | Insert only via `place_order` |
| `orders` | `order_number`, `invoice_number`, `status`, `payment_method`, `payment_status`, `subtotal`, `tax`, `discount`, `delivery_fee`, `wallet_used`, `total`, `shipping_address jsonb`, `delivery_option`, `delivery_partner_id`, `delivery_otp`, `delivered_at` | Never deletable |
| `order_items` | denormalised `product_name`, `emoji`, `unit`, `price`, `quantity`, `tax`, `seller_id` | Snapshot at purchase time |
| `payments` / `refunds` | provider, method, status, amount, provider ids, `raw jsonb` | Razorpay-ready |
| `inventory_movements` | `change`, `reason` (order/cancellation/manual), `note` | Append-only audit |

### Operations

| Table | Purpose |
| --- | --- |
| `delivery_partners` | Vehicle, service pincodes, availability, verification |
| `delivery_assignments` | Per-order fulfilment state machine |
| `payouts` | Seller settlement with commission and period |
| `notifications` | In-app feed; inserted only by triggers/RPCs |
| `banners`, `blogs` | Merchandising and content |
| `settings` | Key/value `jsonb` config; `commerce` key holds fees and thresholds |

## Functions (RPCs)

Full signatures and error strings are in [API Documentation](./10-api-documentation.md).

| Function | Kind | Summary |
| --- | --- | --- |
| `handle_new_user()` | trigger | Creates profile + `customer` role + wallet on sign-up |
| `has_role(uid, role)` / `is_admin(uid)` / `owns_seller(uid, seller)` | helper | Security-definer checks used inside policies |
| `commerce_settings()` | read | Fees/thresholds with safe defaults |
| `validate_coupon(code, subtotal)` | read | `{valid, discount, message}` |
| `place_order(...)` | write | Atomic checkout |
| `cancel_order(id, reason)` | write | Restocks, refunds wallet, marks cancelled |
| `set_order_status(id, status, note)` | write | Seller/partner/admin transitions |
| `assign_delivery_partner(order, partner)` | write | Admin only; issues OTP |
| `verify_delivery_otp(order, otp)` | write | Completes handover |
| `adjust_stock(product, change, note)` | write | Manual stock with audit row |
| `admin_metrics()` | read | Dashboard aggregate |
| `broadcast_notification(...)` | write | Admin announcements |
| `search_products(q, limit)` | read | Ranked full-text search |
| `products_search_vector_update()`, `refresh_product_rating()`, `mark_verified_review()`, `notify_order_status()`, `set_updated_at()` | trigger | Derived data maintenance |

## Indexing

Indexes exist for catalogue browsing (`category_id`, `seller_id`, `is_active`,
`deleted_at`), the GIN index on `search_vector`, order fulfilment (`user_id`, `status`,
`created_at`, `delivery_partner_id`) and social tables. Add an index with any new
high-cardinality filter — see [Performance](./25-performance-optimizations.md).

## Common mistakes

- ⚠️ `CREATE TABLE` without `GRANT` → PostgREST returns "permission denied" even with
  correct RLS.
- ⚠️ Storing a role on `profiles`.
- ⚠️ A `CHECK` constraint using `now()` — non-immutable; use a trigger instead.
- ⚠️ Forgetting `deleted_at is null` in a new catalogue query.

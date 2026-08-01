# 23 — Backup & Restore Guide

## Purpose

Protect the data that cannot be regenerated — orders, payments, wallet ledgers, seller
records and media — and know how to recover quickly.

## What matters

| Asset | Criticality | Recovery source |
| --- | --- | --- |
| `orders`, `order_items`, `payments`, `refunds` | Critical — financial record | Database backup |
| `wallets`, `wallet_transactions`, `coupon_redemptions` | Critical — money | Database backup |
| `profiles`, `user_roles`, `sellers`, `seller_finance` | Critical | Database backup |
| `products`, `categories`, `reviews` | High — re-creatable but painful | Database backup + CSV exports |
| Storage objects (images) | High | Bucket export |
| Application code | Medium | Git |
| Secrets | Critical | Provider dashboards (Razorpay etc.); the platform store is not exportable |

## Automatic backups

The managed Postgres takes periodic automated backups with point-in-time recovery inside
the platform's retention window. This covers accidental deletes and bad migrations, and it
is the primary recovery mechanism. Restores are performed by the platform — raise a
support request with the exact timestamp you need.

## Manual logical backup

For an independent copy (recommended before any risky migration and monthly):

```bash
# full schema + data
pg_dump "$SUPABASE_DB_URL" \
  --no-owner --no-privileges --schema=public \
  --file=bullkart-$(date +%F).sql

# data only, for a specific table
pg_dump "$SUPABASE_DB_URL" --data-only --table=public.orders \
  --file=orders-$(date +%F).sql
```

Store dumps encrypted, off-platform, with a retention policy. They contain personal data —
treat them as production secrets.

## Table-level export from the app

The admin console's `DataTable` exports CSV (`src/lib/csv.ts`) for orders, products,
payouts and users. This is convenient for finance and reconciliation, **not** a backup —
it loses relationships and types.

## Storage backup

Objects are not covered by database backups. Export bucket contents on a schedule:

```bash
# pseudo-workflow: list objects per bucket, download preserving paths
# buckets: product-images, seller-media, avatars, review-images
```

Paths encode ownership (`<seller_id>/…`, `<user_id>/…`), so a restore must preserve the
directory structure exactly or storage policies will deny access afterwards.

## Restore procedures

### A. Accidental row deletion (recent)

1. Put the affected surface into a read-only state if money is involved.
2. Request a point-in-time restore to just before the deletion, into a **clone**.
3. Copy the missing rows out of the clone into production.
4. Reconcile derived data: product `rating`/`review_count`, wallet balances, stock.

### B. Bad migration

1. Do not "undo" by editing tables ad hoc.
2. Write a compensating migration.
3. If a column was dropped with data, restore that column's data from the latest dump or
   a PITR clone, then re-apply.

### C. Full disaster recovery

1. Provision a new backend.
2. Restore the newest dump: `psql "$NEW_DB_URL" -f bullkart-YYYY-MM-DD.sql`.
3. Re-create storage buckets and re-upload objects with identical paths.
4. Re-enter secrets.
5. Re-point `VITE_SUPABASE_*` and redeploy.
6. Verify: sign-in, catalogue read, checkout, admin metrics.

## Restore drill

A backup you have never restored is a rumour. Twice a year:

1. Restore the latest dump into a scratch database.
2. Run the app against it locally.
3. Time the exercise and record the result.

Targets: **RPO ≤ 24h** (manual dumps) / minutes (PITR); **RTO ≤ 4h**.

## Before any risky change

```text
[ ] Fresh pg_dump taken and downloaded
[ ] Row counts recorded for orders, payments, wallet_transactions
[ ] Migration reviewed by a second engineer
[ ] Rollback (compensating migration) written in advance
[ ] Change made outside peak shopping hours
```

## Common mistakes

- ⚠️ Treating CSV exports as backups.
- ⚠️ Forgetting storage objects entirely.
- ⚠️ Storing dumps in the repository or an unencrypted bucket.
- ⚠️ Restoring rows without recomputing derived aggregates, leaving ratings and stock
  silently wrong.

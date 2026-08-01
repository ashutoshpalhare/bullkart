# 01 — Project Overview

## Purpose

BullKart is a production-grade, multi-vendor e-commerce platform for certified organic and
natural products in India. It connects three kinds of supply (farmers, vendors/brands,
ethical manufacturers) to consumers, with delivery partners fulfilling last-mile and an
admin team operating the marketplace.

This document explains what exists, at a level a new engineer can hold in their head
before reading code.

## What the product does

- **Shoppers** browse a certified-organic catalogue, filter and search, add to cart or
  wishlist, apply coupons and wallet credit, and check out with Cash on Delivery (Razorpay
  is wired but dormant until keys are configured).
- **Farmers** list produce, publish harvest updates ("sowing → growing → harvested"),
  fulfil orders and track payouts.
- **Vendors/brands** manage a catalogue with variants and images, fulfil orders, and
  reconcile payouts.
- **Delivery partners** see assigned orders, navigate via maps deep links, and complete
  handover with a 6-digit OTP.
- **Admins** run analytics, verify sellers, moderate catalogue and reviews, assign
  deliveries, manage coupons/blogs/banners and broadcast notifications.

## Surfaces (routes)

| Surface | Routes |
| --- | --- |
| Storefront | `/`, `/categories`, `/category/$slug`, `/product/$slug`, `/search`, `/farmers` |
| Shopper account | `/cart`, `/checkout`, `/orders`, `/wishlist`, `/profile` |
| Identity | `/auth` |
| Vendor | `/vendor`, `/vendor/products`, `/vendor/orders`, `/vendor/payouts`, `/vendor/profile` |
| Farmer | `/farmer`, `/farmer/produce`, `/farmer/harvests`, `/farmer/orders`, `/farmer/profile` |
| Delivery | `/delivery` |
| Admin | `/admin`, `/admin/people`, `/admin/catalog`, `/admin/orders`, `/admin/marketing`, `/admin/moderation`, `/admin/settings` |
| Machine | `/sitemap.xml`, `/robots.txt`, `src/routes/api/*` |

Route files live in `src/routes/`. TanStack Router generates `src/routeTree.gen.ts` —
**never edit that file by hand.**

## High-level shape

```text
Browser (React 19 SPA + SSR)
   │  TanStack Query cache
   ├── supabase-js  ──────────►  Postgres (RLS enforced as the signed-in user)
   ├── SECURITY DEFINER RPCs ─►  place_order / cancel_order / set_order_status / …
   └── createServerFn ────────►  Worker runtime (privileged / secret-bearing work)
```

Every read and write is authorized twice: once in the UI (route gates, role hooks) and
once in the database (RLS policies + RPC re-checks). The UI gate is UX; the database gate
is security.

## Glossary

| Term | Meaning |
| --- | --- |
| **Seller** | Row in `public.sellers`; a farmer, vendor or brand. Owned by one auth user via `owner_id`. |
| **Workspace** | The dashboard a seller/partner/admin operates in (`/vendor`, `/farmer`, `/delivery`, `/admin`). |
| **RPC** | A Postgres function called through PostgREST via `supabase.rpc(...)`. |
| **Server function** | `createServerFn` from `@tanstack/react-start`; typed RPC into the Worker runtime. |
| **RLS** | Row Level Security — per-row Postgres authorization. |
| **Handover OTP** | 6-digit code on `orders.delivery_otp`, verified by `verify_delivery_otp`. |
| **Jaivik** | Hindi/Sanskrit for "organic"; used for the harvest-transparency feature. |

## Non-goals (deliberately out of scope today)

- Native mobile apps (the PWA is the mobile story).
- Real-time chat/support inbox.
- Subscriptions and recurring boxes (see [Roadmap](./31-future-roadmap.md)).
- Multi-currency — the platform is INR-only.

## Common mistakes

- ⚠️ Assuming the frontend enforces authorization. It does not, meaningfully. Always add
  the RLS policy too.
- ⚠️ Editing `src/routeTree.gen.ts` or `src/integrations/supabase/*` generated files.
- ⚠️ Adding a second router (`react-router-dom`). TanStack Router is fixed.

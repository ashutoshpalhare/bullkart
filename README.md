# BullKart

India's premium multi-vendor organic marketplace — certified organic groceries, A2 dairy,
ayurveda, khadi clothing and eco-living essentials, sold direct by verified farmers, vendors
and ethical brands.

## Overview

| Area | Stack |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR, file-based routing) |
| Build | Vite 7, Nitro (Cloudflare Worker target) |
| Styling | Tailwind CSS v4 (`src/styles.css` `@theme` tokens) + shadcn/ui |
| Data | TanStack Query v5 |
| Backend | Lovable Cloud (Postgres, Auth, Storage, RLS, SQL RPCs) |
| Payments | Razorpay bridge (dormant until keys are set) — COD works today |
| Tests | Vitest + Testing Library (unit/component), Playwright (e2e) |

### Roles and surfaces

- **Customer** — `/`, `/categories`, `/category/$slug`, `/product/$slug`, `/search`,
  `/wishlist`, `/cart`, `/checkout`, `/orders`, `/profile`
- **Vendor** — `/vendor` (overview, products, orders, payouts, profile)
- **Farmer** — `/farmer` (overview, produce, harvests, orders, profile)
- **Delivery partner** — `/delivery` (assignments, OTP handover, earnings)
- **Admin** — `/admin` (analytics, people, catalogue, orders, marketing, moderation, settings)

Authorization is enforced twice: `RoleGate` in the UI and Row Level Security plus
`SECURITY DEFINER` RPCs in the database. The RPCs (`place_order`, `cancel_order`,
`set_order_status`, `verify_delivery_otp`, `adjust_stock`, `admin_metrics`,
`broadcast_notification`) each re-check `auth.uid()` server-side, so a tampered client
cannot escalate.

## Folder structure

```text
src/
  routes/            file-based routes (incl. api/ server routes, sitemap[.]xml.ts)
  features/          domain logic: catalog, cart, wishlist, orders, reviews,
                     payments, seller, delivery, admin, roles, dashboard
  components/
    commerce/        product cards, sections, skeletons, empty/error states
    dashboard/       DataTable, StatCard, charts, ProductManager, SellerOrders…
    layout/          navbar, footer, mobile tab bar, network status, install prompt
    ui/              shadcn primitives
  hooks/             use-auth, use-mobile, use-recent-list, use-theme
  lib/               format, cart maths, seo, monitoring, pwa, storage, csv, errors
  integrations/      generated Supabase clients and types (do not edit)
  types/             shared domain types
tests/               vitest suites + tests/e2e Playwright specs
public/              icons, manifest, robots.txt, favicon
```

## Environment variables

Generated automatically by Lovable Cloud and injected at build time:

| Name | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client + server | Backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client + server | Publishable (anon) key — safe in the bundle |
| `VITE_SUPABASE_PROJECT_ID` | build | Project reference |

Server-only secrets (never exposed to the browser, read inside handlers via `process.env`):

| Name | Required for |
| --- | --- |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Online payments |
| `RAZORPAY_WEBHOOK_SECRET` | Payment webhook signature verification |
| `LOVABLE_API_KEY` | AI + managed email APIs |

Until the Razorpay secrets exist, online checkout degrades gracefully to a "choose Cash on
Delivery" message and the webhook returns 503. Secrets are managed through Lovable, not a
committed `.env`.

## Local setup

```bash
bun install
bun run dev          # http://localhost:8080
```

## Scripts

```bash
bun run dev          # dev server
bun run build        # production build (client + SSR worker + service worker)
bun run preview      # preview the production build
bun run typecheck    # TypeScript, no emit
bun run lint         # ESLint
bun run test         # Vitest unit + component suites
bun run test:coverage
bunx playwright test # e2e smoke suite (needs `bunx playwright install chromium`)
```

## Database migrations

- All schema changes are SQL migrations applied through Lovable Cloud; never edit tables by hand.
- Every `public` table has explicit `GRANT`s plus RLS policies. Roles live in `user_roles`
  (never on `profiles`) and are read through the `has_role` / `is_admin` security-definer helpers.
- Business-critical writes go through RPCs so stock, wallet, coupons and payments stay atomic.
- Hot query paths are indexed (products by category/seller/flags/price/rating, orders by
  user/status/partner, cart, wishlist, reviews, notifications, payouts).
- Regenerate types after schema changes — `src/integrations/supabase/types.ts` is generated.

## Production notes

- **SEO** — per-route `head()` titles, descriptions, OG/Twitter tags, relative canonicals,
  breadcrumb + Organization + WebSite JSON-LD, `noindex` on cart/checkout/account/dashboards,
  `public/robots.txt`, and a dynamic `/sitemap.xml` that lists live categories and products.
- **PWA** — `public/manifest.webmanifest`, maskable icons, Workbox service worker
  (network-first navigations, stale-while-revalidate assets, cache-first images), install
  prompt and an offline banner. The worker never registers in dev, iframes or Lovable
  previews; `?sw=off` unregisters it.
- **Monitoring** — `src/lib/monitoring.ts` exposes `captureError`, `trackEvent`,
  `trackPageView`, `trackTiming`, `identifyUser` plus Core Web Vitals reporting. Register a
  provider at boot to plug in Sentry, PostHog, GA or Clarity without touching feature code.
- **Deployment** — see `docs/DEPLOYMENT.md`.

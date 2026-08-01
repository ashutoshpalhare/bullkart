<div align="center">

# 🌱 BullKart

**India's premium multi-vendor organic marketplace.**

Certified organic groceries, A2 dairy, ayurveda, khadi clothing and eco-living
essentials — sold direct by verified farmers, vendors and ethical brands.

[Documentation](./Documentation/README.md) ·
[Architecture](./Documentation/06-system-architecture.md) ·
[API](./Documentation/10-api-documentation.md) ·
[Deployment](./Documentation/21-deployment.md)

</div>

---

## Introduction

BullKart connects certified organic producers directly to Indian households. Farmers and
brands manage their own storefronts, delivery partners handle last-mile with OTP handover,
and an admin team operates the marketplace — all in one server-rendered React application
backed by Postgres with Row Level Security.

Three ideas make it different:

1. **Verification is a feature.** Seller verification and product certifications are
   surfaced in the UI, not buried in an admin table.
2. **Provenance is visible.** Farmers publish harvest updates — sowing to harvest — that
   appear on the product page.
3. **Money is server-authoritative.** Totals, tax, stock, wallet and coupons are computed
   inside a single atomic Postgres transaction, never in the browser.

## Features

<details open>
<summary><strong>Shoppers</strong></summary>

- Faceted catalogue browsing, full-text search, category and farmer directories
- Product pages with gallery, variants, nutrition, certifications and verified reviews
- Server-persisted cart and wishlist
- Multi-step checkout: address book → delivery option → coupon → wallet → payment
- Cash on Delivery today; Razorpay wired and ready to enable
- Order history, tracking timeline, cancellation with automatic restock and wallet refund
- Wallet ledger, notifications, recently viewed
- Installable PWA with offline support

</details>

<details>
<summary><strong>Vendors & Farmers</strong></summary>

- Guided store/farm onboarding
- Product CRUD with images, badges, certifications, nutrition and variants
- Stock adjustments with a full inventory audit trail
- Order fulfilment and status transitions scoped to their own items
- Payout ledger with commission breakdown
- Private finance details (GST, payout account) isolated from public data
- Farmers only: harvest updates with stage, date and photos

</details>

<details>
<summary><strong>Delivery partners</strong></summary>

- Partner onboarding with vehicle and service pincodes
- Assignment queue and status transitions
- Maps deep links for navigation
- 6-digit OTP handover that settles COD in the same transaction
- Earnings summary

</details>

<details>
<summary><strong>Admins</strong></summary>

- Platform analytics: revenue, orders, 30-day trend, category mix, top products
- User and seller management: roles, verification, suspension
- Cross-seller catalogue moderation and review takedown
- Delivery partner assignment
- Coupons, banners, blogs and broadcast notifications
- Commerce settings (tax, delivery fee, express fee, free-delivery threshold) as data

</details>

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR, file-based routing) |
| Build | Vite 8 + Nitro (Cloudflare Worker target) |
| Language | TypeScript 5.8 (strict) |
| Styling | Tailwind CSS v4 (`@theme` tokens) + shadcn/ui + Radix |
| Data | TanStack Query v5 |
| Backend | Lovable Cloud — Postgres, Auth, Storage, RLS, SQL RPCs |
| Forms | react-hook-form + zod |
| Charts | Recharts · **Icons** lucide-react · **Toasts** sonner |
| Payments | Razorpay (dormant) + COD + wallet |
| Testing | Vitest, Testing Library, Playwright |
| PWA | vite-plugin-pwa (`generateSW`) |

Full rationale: [Tech Stack](./Documentation/05-tech-stack.md).

## Installation

**Prerequisites:** Node.js ≥ 20, Bun ≥ 1.1, Git.

```bash
git clone <repository-url> bullkart
cd bullkart
bun install
```

## Configuration

The repository ships a generated `.env` with public backend configuration:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

These are **public by design** and safe in the client — RLS still applies. Private values
(`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_*`) are stored as server secrets and read inside
handlers only. Never prefix a secret with `VITE_`.

See [Environment Variables](./Documentation/14-environment-variables.md).

## Local setup

```bash
bun run dev          # http://localhost:8080
```

Then:

1. Sign up at `/auth` — a profile, `customer` role and wallet are created automatically.
2. Grant yourself an elevated role to reach a workspace:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict (user_id, role) do nothing;
```

3. From `/admin` create a category and a seller, then add a product from `/vendor`, then
   buy it. That loop exercises the riskiest code in the app.

Detailed walkthrough: [Local Development Setup](./Documentation/15-local-development-setup.md).

## Build commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server with HMR on port 8080 |
| `bun run build` | Production build (client + Worker SSR) |
| `bun run build:dev` | Dev-mode build with prerender — catches SSR/auth errors |
| `bun run preview` | Serve the production build locally |
| `bun run typecheck` | `tsgo --noEmit` |
| `bun run lint` / `bun run format` | ESLint / Prettier |
| `bun run test` / `test:watch` / `test:coverage` | Vitest |
| `bunx playwright test` | End-to-end specs |

## Deployment

**Lovable publish (default):** run the
[Release Checklist](./Documentation/30-release-checklist.md), click **Publish**, then
optionally attach a custom domain. Frontend changes go live on *Update*; backend changes
(migrations, server functions) apply immediately — so ship schema changes additively.

**Vercel:** import the repo, install with `bun install`, build with `bun run build`, add
the environment variables above, then update the auth redirect allow-list, the Razorpay
webhook URL and the sitemap `BASE_URL`.

Full instructions: [Deployment](./Documentation/21-deployment.md).

## Folder structure

```text
.
├── Documentation/          31 guides — architecture, schema, API, ops
├── public/                 static assets, PWA manifest, icons, robots.txt
├── src/
│   ├── routes/             file-based routes (+ api/, sitemap[.]xml.ts)
│   ├── components/
│   │   ├── ui/             shadcn primitives
│   │   ├── commerce/       storefront blocks
│   │   ├── dashboard/      workspace blocks
│   │   └── layout/         navbar, footer, mobile tab bar, PWA prompts
│   ├── features/           domain hooks & queries (catalog, cart, orders, seller, …)
│   ├── hooks/              use-auth, use-mobile, use-theme, use-recent-list
│   ├── integrations/       GENERATED Supabase clients & types — do not edit
│   ├── lib/                seo, format, storage, csv, errors, monitoring, pwa
│   ├── types/              shared TypeScript types
│   ├── styles.css          Tailwind v4 design tokens
│   ├── router.tsx          router + QueryClient
│   └── start.ts            request/function middleware
├── tests/                  Vitest suites + tests/e2e Playwright specs
├── supabase/               generated backend config
└── vite.config.ts
```

More detail — including *where new code belongs*:
[Folder Structure](./Documentation/04-folder-structure.md).

## Screenshots

> Replace these placeholders with real captures before launch
> (`docs/screenshots/`, 1440×900 desktop and 390×844 mobile).

| Home | Product detail | Cart & checkout |
| --- | --- | --- |
| _`![Home](docs/screenshots/home.png)`_ | _`![Product](docs/screenshots/product.png)`_ | _`![Checkout](docs/screenshots/checkout.png)`_ |

| Vendor workspace | Farmer harvests | Admin analytics |
| --- | --- | --- |
| _`![Vendor](docs/screenshots/vendor.png)`_ | _`![Harvests](docs/screenshots/harvests.png)`_ | _`![Admin](docs/screenshots/admin.png)`_ |

| Delivery (OTP handover) | Mobile PWA |
| --- | --- |
| _`![Delivery](docs/screenshots/delivery.png)`_ | _`![Mobile](docs/screenshots/mobile.png)`_ |

## Documentation

| Area | Start here |
| --- | --- |
| Orientation | [Project Overview](./Documentation/01-project-overview.md) · [Business Vision](./Documentation/02-business-vision.md) · [Features](./Documentation/03-features.md) |
| Engineering | [Architecture](./Documentation/06-system-architecture.md) · [Database Schema](./Documentation/07-database-schema.md) · [API](./Documentation/10-api-documentation.md) · [State Management](./Documentation/13-state-management.md) |
| Design | [Component Library](./Documentation/11-component-library.md) · [UI Design System](./Documentation/12-ui-design-system.md) |
| Backend & ops | [Supabase Config](./Documentation/18-supabase-configuration.md) · [Storage](./Documentation/19-storage-configuration.md) · [Migrations](./Documentation/22-database-migration-guide.md) · [Backup & Restore](./Documentation/23-backup-and-restore.md) |
| Quality | [Security](./Documentation/24-security-best-practices.md) · [Performance](./Documentation/25-performance-optimizations.md) · [SEO](./Documentation/26-seo-strategy.md) · [Testing](./Documentation/27-testing-guide.md) |
| Help | [Troubleshooting](./Documentation/28-troubleshooting.md) |

## Contributing

1. Branch from `main` using `feat/`, `fix/`, `chore/`, `docs/` or `refactor/`.
2. Follow Conventional Commits (`feat(cart): clamp quantity to stock`).
3. Schema first (migration → regenerated types → code).
4. Data access lives in `src/features/*`; components stay presentational.
5. Semantic design tokens only — never hardcoded colours.
6. Every new `public` table needs GRANTs, RLS and policies in its migration.
7. Before opening a PR: `bun run typecheck && bun run lint && bun run test && bun run build`.
8. Update the matching file in `Documentation/` in the same PR.

Full guide: [Contributing Guidelines](./Documentation/29-contributing-guidelines.md).

## Security

Report vulnerabilities privately to the maintainers rather than opening a public issue.
Authorization is enforced in the database (RLS + `SECURITY DEFINER` RPCs), not in the UI —
see [Security Best Practices](./Documentation/24-security-best-practices.md).

## License

Proprietary — © BullKart. All rights reserved.
Replace this section with your chosen license (e.g. MIT) and add a `LICENSE` file if the
project is open-sourced.

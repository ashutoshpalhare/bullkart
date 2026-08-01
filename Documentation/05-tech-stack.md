# 05 — Tech Stack

## Purpose

List every significant dependency, what it does here, and why it was chosen — so you can
evaluate replacements honestly instead of by fashion.

## Runtime and framework

| Tech | Version | Role | Why |
| --- | --- | --- | --- |
| **React** | 19 | UI | Concurrent rendering, `use` + transitions, stable ecosystem |
| **TanStack Start** | v1 | Full-stack framework | File routing + SSR + typed server functions in one Vite app |
| **TanStack Router** | v1 | Routing | End-to-end type-safe params, loaders, search params |
| **Vite** | 8 | Build/dev | Instant HMR, single config for client + SSR |
| **Nitro / Cloudflare Worker** | — | Server runtime | Edge SSR, cheap cold starts |
| **TypeScript** | 5.8 | Types | Strict mode; `tsgo --noEmit` for fast checks |

⚠️ Do not add `react-router-dom`, `BrowserRouter` or Next.js patterns. The router is fixed.

## Data and backend

| Tech | Role |
| --- | --- |
| **Lovable Cloud (Postgres)** | Primary database with Row Level Security |
| **PostgREST** | Auto REST API consumed by `@supabase/supabase-js` |
| **Supabase Auth** | Email/password + Google OAuth, JWT sessions |
| **Supabase Storage** | Private buckets for product, seller, avatar and review media |
| **SQL `SECURITY DEFINER` RPCs** | Atomic money/stock logic (`place_order`, …) |
| **TanStack Query v5** | Client cache, invalidation, optimistic updates |
| **Zod 3** | Runtime validation on forms and server function inputs |
| **react-hook-form** | Form state; paired with `@hookform/resolvers` |

## UI

| Tech | Role |
| --- | --- |
| **Tailwind CSS v4** | Styling; tokens declared with `@theme` in `src/styles.css` |
| **shadcn/ui + Radix** | Accessible primitives, owned in `src/components/ui` |
| **lucide-react** | Icon set |
| **Recharts** | Dashboard analytics |
| **sonner** | Toasts (`<Toaster />` mounted once in `__root.tsx`) |
| **embla-carousel-react**, **vaul**, **cmdk**, **input-otp** | Carousels, drawers, command palette, OTP entry |
| **class-variance-authority**, **tailwind-merge**, **clsx** | Variant + class composition (`cn()`) |
| **date-fns** | Date maths; formatting is centralised in `src/lib/format.ts` |

## Quality and ops

| Tech | Role |
| --- | --- |
| **Vitest 3 + jsdom** | Unit and component tests |
| **@testing-library/react + user-event** | Behaviour-driven component tests |
| **Playwright** | End-to-end smoke flows (`tests/e2e/`) |
| **ESLint 9 + typescript-eslint + Prettier** | Lint and format |
| **vite-plugin-pwa** | Service worker (`generateSW`) and runtime caching |
| **src/lib/monitoring.ts** | Pluggable Sentry / PostHog / GA + Core Web Vitals |

## Version policy

- **Pinned by the platform:** React, TanStack Start/Router, Vite, Tailwind. Upgrade these
  only deliberately, with a full build + e2e run.
- **Free to bump:** leaf libraries (icons, charts, date-fns) within semver minor.
- Run `bun install` after any dependency change and commit the lockfile.

## Rejected / avoided

| Not used | Reason |
| --- | --- |
| Redux / Zustand for server data | TanStack Query already owns the server cache |
| Prisma / Drizzle | RLS-first design means SQL + PostgREST is the contract |
| `sharp`, `canvas`, `child_process` | Unavailable in the Worker runtime |
| Node-only npm packages | The backend is `workerd`; see [Troubleshooting](./28-troubleshooting.md) |
| CSS-in-JS | Tailwind tokens keep theming in one file |

# 04 — Folder Structure

## Purpose

Show where everything lives and, more usefully, **where new code belongs**.

## Top level

```text
.
├── Documentation/        ← you are here
├── docs/                 legacy deployment note (superseded by Documentation/21)
├── public/               static assets served as-is
│   ├── icons/            PWA icons
│   ├── manifest.webmanifest
│   ├── robots.txt
│   └── favicon.png
├── src/                  application source (detailed below)
├── supabase/             generated backend config — do not hand-edit config.toml
├── tests/                Vitest unit/component tests + tests/e2e Playwright specs
├── components.json       shadcn/ui generator config
├── eslint.config.js
├── playwright.config.ts
├── vitest.config.ts
├── vite.config.ts        Vite + TanStack Start + Tailwind 4 + PWA plugin
└── package.json
```

## `src/`

```text
src/
├── routes/              file-based routes → URLs
├── routeTree.gen.ts     GENERATED. never edit.
├── router.tsx           router + QueryClient wiring
├── start.ts             createStart(): request/function middleware
├── server.ts            SSR entry
├── styles.css           Tailwind v4 @theme design tokens
├── components/
│   ├── ui/              shadcn primitives (button, dialog, table, …)
│   ├── commerce/        storefront blocks (product-card, product-browser, states)
│   ├── dashboard/       workspace blocks (data-table, stat-card, product-manager)
│   └── layout/          navbar, footer, mobile-tab-bar, network-status, install-prompt
├── features/            DOMAIN LOGIC — hooks + query options, one folder per domain
│   ├── catalog/  cart/  wishlist/  orders/  reviews/
│   ├── commerce/ payments/ seller/ delivery/ admin/ roles/ dashboard/
├── hooks/               cross-cutting React hooks (use-auth, use-mobile, use-theme)
├── integrations/
│   └── supabase/        GENERATED clients, types, auth middleware — do not edit
├── lib/                 framework-agnostic helpers
│   ├── seo.ts  format.ts  csv.ts  storage.ts  utils.ts
│   ├── errors.ts  error-page.ts  error-capture.ts
│   ├── monitoring.ts  pwa.ts
│   ├── admin.functions.ts  payments.functions.ts   ← server functions
│   └── mock-data.ts
└── types/               shared TypeScript types (catalog.ts, …)
```

## Where does my new code go?

| I am adding… | Put it in |
| --- | --- |
| A new page/URL | `src/routes/<name>.tsx` (dots = nesting: `vendor.orders.tsx` → `/vendor/orders`) |
| A data hook or `queryOptions` | `src/features/<domain>/hooks.ts` or `queries.ts` |
| A presentational block used by 2+ routes | `src/components/<area>/` |
| A pure helper (no React) | `src/lib/` |
| Server-only logic called from the client | `src/lib/<name>.functions.ts` (`createServerFn`) |
| A webhook / public HTTP endpoint | `src/routes/api/public/<name>.ts` |
| A schema change | a migration (see [22](./22-database-migration-guide.md)) |

## Naming rules

- Files: `kebab-case.tsx`. Components: `PascalCase`. Hooks: `useThing`.
- Server function modules **must** end in `.functions.ts` and contain nothing but imports,
  types and exported `createServerFn` declarations — helpers go in a sibling module.
- Server-only helpers end in `.server.ts` so the bundler keeps them off the client.

## Files you must never edit

- `src/routeTree.gen.ts` (regenerated on every route change)
- `src/integrations/supabase/client.ts`, `client.server.ts`, `types.ts`,
  `auth-middleware.ts`, `auth-attacher.ts`
- `supabase/config.toml`
- `.env` keys prefixed `VITE_SUPABASE_`

## Common mistakes

- ⚠️ Putting fetch logic directly in a route component. Route → hook → Supabase keeps
  caching consistent and testable.
- ⚠️ Creating `src/pages/` or an `App.tsx` route switcher. Neither exists in this stack.
- ⚠️ Importing a `.server.ts` module from a component; it breaks the client build.

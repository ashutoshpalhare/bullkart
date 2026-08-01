# 17 — Running the Project

## Purpose

Every script, what it does, and when to use it.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Vite dev server with HMR at http://localhost:8080 |
| `bun run build` | Production build (client + Worker SSR bundle) |
| `bun run build:dev` | Development-mode build; also prerenders — catches SSR/auth errors early |
| `bun run preview` | Serve the production build locally |
| `bun run typecheck` | `tsgo --noEmit`, fast full-project type check |
| `bun run lint` | ESLint across the repo |
| `bun run format` | Prettier write |
| `bun run test` | Vitest, single run |
| `bun run test:watch` | Vitest in watch mode |
| `bun run test:coverage` | Vitest with V8 coverage |
| `bunx playwright test` | End-to-end specs in `tests/e2e/` |

## Everyday workflows

### Feature work

```bash
bun run dev            # terminal 1
bun run test:watch     # terminal 2
```

Before pushing:

```bash
bun run typecheck && bun run lint && bun run test && bun run build
```

### Verifying SSR behaviour

`bun run dev` renders on the server too, but prerender problems (auth-protected loaders,
browser globals at module scope) usually surface only in a build:

```bash
bun run build:dev
```

An `Error: Unauthorized` here means a public route loader is calling a protected server
function — see [Authentication Flow](./08-authentication-flow.md).

### Testing the PWA / service worker

The service worker is only generated in a production build:

```bash
bun run build && bun run preview
```

Then in DevTools → Application: confirm the manifest, the registered worker and the
offline fallback. Use "Update on reload" while iterating so you aren't served a stale
worker.

## Ports and URLs

| Thing | URL |
| --- | --- |
| Dev server | http://localhost:8080 |
| Preview (built) | printed by `bun run preview` |
| Sitemap | `/sitemap.xml` |
| Robots | `/robots.txt` |

Keep 8080 — OAuth redirect allow-lists and the Playwright config assume it.

## Seeding useful local data

1. Sign up at `/auth`.
2. Grant yourself `admin` (see [Local Setup](./15-local-development-setup.md)).
3. From `/admin`, create a category, then a seller, then verify it.
4. Switch to `/vendor` or `/farmer` and add a product with stock.
5. Shop it end to end: cart → checkout (COD) → `/orders` → cancel or fulfil from `/admin`.

That loop exercises `place_order`, `set_order_status`, `assign_delivery_partner`,
`verify_delivery_otp` and `cancel_order` — the riskiest code in the app.

## Restarting cleanly

```bash
rm -rf node_modules .vite dist
bun install
bun run dev
```

Do this after switching branches with dependency changes, or when Vite serves stale
modules.

## Common mistakes

- ⚠️ Judging performance from `bun run dev`. Measure a production build.
- ⚠️ Leaving an old service worker registered and debugging a "cached" bug that no longer
  exists in the source.
- ⚠️ Running Playwright without a server — the config starts one; don't also run `dev` on
  the same port.

# 25 — Performance Optimizations

## Purpose

Document what has been done for speed and the rules that keep BullKart fast on a mid-range
Android phone over 4G — the target device.

## Budgets

| Metric | Target |
| --- | --- |
| LCP (mobile, 4G) | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Initial JS (gzipped) | < 200KB |
| Product list query | < 150ms server time |
| Checkout RPC | < 500ms |

Measure with a production build (`bun run build && bun run preview`), never the dev server.

## Frontend

### Rendering
- SSR through TanStack Start gives real HTML on first paint.
- Route loaders call `ensureQueryData`, so data is in the cache before the component
  renders — no request waterfalls after hydration.
- `useSuspenseQuery` in components pairs with skeleton fallbacks.

### Code splitting
- Every route is a separate chunk automatically.
- Heavy, rarely-used modules (Recharts dashboards, the product editor) load lazily.
- Browser-only libraries are dynamically imported behind `<ClientOnly>`, keeping them out
  of the SSR bundle.

### Images
- `loading="lazy"` on everything below the fold; the hero is eager.
- Explicit `width`/`height` or `AspectRatio` to prevent CLS.
- WebP, compressed client-side before upload (the Worker runtime has no `sharp`).
- Emoji fallback (`products.emoji`) avoids a network request for catalogue gaps.

### Caching
- TanStack Query `staleTime` tiers — see [State Management](./13-state-management.md).
- Service worker (`vite-plugin-pwa`, `generateSW`) with runtime caching: cache-first for
  static assets and fonts, network-first for API responses, offline fallback shell.
- Prefetch on link hover for product cards.

### Bundle discipline
- Import icons individually from `lucide-react`.
- Prefer `date-fns` functions over moment-style whole-library imports.
- Run a bundle analysis before adding anything over ~30KB gzipped.

## Database

### Indexes in place
- Catalogue: `products(category_id)`, `products(seller_id)`, partial indexes on
  `is_active` / `deleted_at is null`.
- Search: GIN on `products.search_vector`.
- Fulfilment: `orders(user_id)`, `orders(status)`, `orders(created_at)`,
  `orders(delivery_partner_id)`, `order_items(order_id)`, `order_items(seller_id)`.
- Social: `reviews(product_id)`, `cart_items(user_id)`, `wishlist_items(user_id)`.

### Query rules
- Select explicit columns; `select('*')` on `products` drags `search_vector` and
  `nutrition` into every list response.
- Always paginate: `.range(from, to)` with a sensible page size (24 for grids).
- Filter `deleted_at is null` and `is_active` — both are indexed.
- Push aggregation into SQL. `admin_metrics()` returns one JSON payload instead of a dozen
  round trips.
- Denormalise deliberately: `products.rating` / `review_count` are maintained by trigger so
  listings never aggregate reviews at read time; `order_items` snapshots product fields so
  history renders without joins.

### Avoid
- ⚠️ N+1 patterns — fetch related rows with a nested select, not a loop.
- ⚠️ `ILIKE '%term%'` as the primary search path; `search_products()` uses the tsvector
  index with ILIKE only as a fallback.
- ⚠️ Counting large tables on every page load; cache counts or approximate.

## Network
- HTTP/2 and Brotli come from the edge platform.
- Fonts are preconnected and `font-display: swap`.
- The Worker runs SSR at the edge, close to Indian users.

## Monitoring

`src/lib/monitoring.ts` observes Core Web Vitals and forwards them to the configured
provider. Watch LCP on `/` and `/category/$slug`, and INP on `/cart` and `/checkout` —
those are the pages where regressions cost money.

## Regression checklist for a PR

```text
[ ] No new blocking third-party script
[ ] New images have dimensions and lazy loading
[ ] New list query is paginated and indexed
[ ] No new library over 30KB gzipped without justification
[ ] Lighthouse mobile still ≥ 90 on / and /product/$slug
```

## Common mistakes

- ⚠️ Optimising the dev build.
- ⚠️ Adding an index for every column "just in case" — writes slow down.
- ⚠️ Fetching the full catalogue to compute a filter count client-side.
- ⚠️ Making the hero image lazy, which delays LCP.

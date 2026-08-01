# 13 — State Management

## Purpose

Explain which state lives where, so nobody reaches for Redux.

## The four kinds of state

| Kind | Owner | Example |
| --- | --- | --- |
| **Server state** | TanStack Query | Products, orders, cart rows, metrics |
| **URL state** | TanStack Router search params | Search text, filters, page, tab |
| **Form state** | react-hook-form + zod | Checkout address, product editor |
| **Ephemeral UI state** | `useState` in the component | Dialog open, hovered card |

There is no global store, and none is needed. If you think you need one, the data is
almost certainly server state that belongs in a query.

## TanStack Query

Wired in `src/router.tsx`; the `queryClient` is exposed on the router context so loaders
can prefetch.

### Preferred pattern

```ts
// src/features/catalog/queries.ts
export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => { /* supabase call */ },
    staleTime: 60_000,
  });
```

```tsx
// src/routes/product.$slug.tsx
export const Route = createFileRoute("/product/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.slug)),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
}
```

⚠️ Do not fetch in `useEffect`, and do not hand-roll `isLoading` flags where a loader plus
`useSuspenseQuery` will do.

### Query key conventions

| Domain | Key |
| --- | --- |
| Catalogue list | `["products", filters]` |
| Single product | `["product", slug]` |
| Categories | `["categories"]` |
| Cart | `["cart", userId]` |
| Wishlist | `["wishlist", userId]` |
| Orders | `["orders", userId]` / `["order", id]` |
| Reviews | `["reviews", productId]` |
| Roles | `["roles", userId]` |
| Seller scope | `["seller", sellerId, "products" \| "orders" \| "payouts"]` |
| Admin | `["admin", "metrics" \| "people" \| "orders"]` |

Keys are arrays, most-general segment first, so prefix invalidation works:
`queryClient.invalidateQueries({ queryKey: ["seller", sellerId] })`.

### Stale times

| Data | `staleTime` |
| --- | --- |
| Categories, settings | 10 min |
| Product lists / details | 1 min |
| Cart, wishlist, orders | 0 (always fresh after mutation) |
| Admin metrics | 30 s |

### Mutations

```ts
const qc = useQueryClient();
const addToCart = useMutation({
  mutationFn: async (input) => { /* supabase upsert */ },
  onMutate: async (input) => {
    await qc.cancelQueries({ queryKey: ["cart"] });
    const prev = qc.getQueryData(["cart"]);
    qc.setQueryData(["cart"], optimistic(prev, input));
    return { prev };
  },
  onError: (err, _v, ctx) => { qc.setQueryData(["cart"], ctx?.prev); toast.error(message(err)); },
  onSettled: () => qc.invalidateQueries({ queryKey: ["cart"] }),
});
```

Optimistic updates are used for cart quantity and wishlist toggles. Money-moving actions
(`place_order`, `cancel_order`) are **never** optimistic — wait for the server.

## URL state

Filters and search live in the URL so results are shareable and back/forward works:

```tsx
const { q, sort, page } = Route.useSearch();
navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) });
```

Validate search params with zod in the route definition.

## Auth state

`src/hooks/use-auth.tsx` provides a context with `user`, `session`, `profile` and
`loading`. Role data is a query (`["roles", userId]`) rather than context, so it
invalidates cleanly when an admin grants a role.

## Local persistence

- Cart and wishlist are **server-side** (`cart_items`, `wishlist_items`) so they survive
  device changes. There is no localStorage cart to reconcile.
- `src/hooks/use-recent-list.ts` keeps recently viewed products in localStorage; read it
  in `useEffect` (or behind a hydration guard) to avoid SSR mismatch.
- Theme preference: `src/hooks/use-theme.ts`.

## Common mistakes

- ⚠️ Reading localStorage in a `useState` initializer → hydration mismatch.
- ⚠️ Duplicating server data into `useState` and letting it drift.
- ⚠️ Invalidating `["products"]` after every tiny mutation — scope your keys.
- ⚠️ Forgetting `userId` in a per-user key, leaking one user's cache to the next session.

# 11 — Component Library

## Purpose

Catalogue the reusable components, what they're for, and the rules for adding more.

Three tiers:

1. `src/components/ui/` — shadcn/Radix primitives. Owned code, edit freely, but keep the
   API shadcn-compatible so future generator output still fits.
2. `src/components/commerce/` — storefront blocks.
3. `src/components/dashboard/` + `src/components/layout/` — workspace and shell blocks.

---

## Primitives (`src/components/ui/`)

accordion · alert · alert-dialog · aspect-ratio · avatar · badge · breadcrumb · button ·
calendar · card · carousel · chart · checkbox · collapsible · command · context-menu ·
dialog · drawer · dropdown-menu · form · hover-card · input · input-otp · label · menubar ·
navigation-menu · pagination · popover · progress · radio-group · resizable · scroll-area ·
select · separator · sheet · sidebar · skeleton · slider · sonner · switch · table · tabs ·
textarea · toggle · toggle-group · tooltip

Variants use `class-variance-authority`; merge classes with `cn()` from `src/lib/utils.ts`.

⚠️ There is **no** `@/hooks/use-toast` and no `@/components/ui/toaster` in this stack.
Use `sonner`:

```tsx
import { toast } from "sonner";
toast.success("Added to cart");
```

`<Toaster />` is mounted once in `src/routes/__root.tsx`.

---

## Commerce blocks (`src/components/commerce/`)

| Component | Purpose | Key props |
| --- | --- | --- |
| `ProductCard` | Grid tile: image/emoji, name, price + MRP strike, rating, badges, wishlist toggle, add-to-cart | `product`, `compact?` |
| `CategoryCard` | Category tile with emoji/image and tagline | `category` |
| `ProductBrowser` | Full listing surface: facets (price, rating, badges, certification), sort, pagination, empty/loading states | `filters`, `title` |
| `Section` | Titled shelf with optional "view all" and horizontal scroll on mobile | `title`, `action`, `children` |
| `StarRating` | Read-only or interactive rating | `value`, `onChange?`, `size` |
| `Skeletons` | `ProductCardSkeleton`, `ListSkeleton`, `DetailSkeleton` | — |
| `States` | `EmptyState`, `ErrorState`, `LoadingState` with icon, title, description, action | `title`, `description`, `action?` |

Every async surface should render one of: skeleton → content → empty → error. Tests in
`tests/states.test.tsx` cover this contract.

---

## Dashboard blocks (`src/components/dashboard/`)

| Component | Purpose |
| --- | --- |
| `DashboardLayout` | Sidebar + header shell used by all four workspaces; `noindex` meta |
| `DataTable` | Sortable, searchable table with row actions, pagination and CSV export (`src/lib/csv.ts`) |
| `StatCard` | KPI tile: label, value, delta, icon |
| `Charts` | Recharts wrappers: `RevenueAreaChart`, `CategoryBarChart`, `OrdersLineChart` |
| `ProductManager` | Full product create/edit: slug generation, pricing, stock, images, badges, certifications, nutrition, variants |
| `SellerOrders` | Seller-scoped order list with status transitions |
| `SellerOverview` | KPI + chart summary for a seller |
| `SellerPayouts` | Payout ledger with commission breakdown |
| `StoreGate` | Onboarding when the signed-in user owns no `sellers` row |
| `StoreProfile` | Brand details + private finance fields (`seller_finance`) |
| `FormField` | Label + control + description + error, wired to react-hook-form |
| `ConfirmDialog` | Destructive-action confirmation |

### `DataTable` example

```tsx
<DataTable
  data={orders}
  columns={[
    { key: "order_number", header: "Order" },
    { key: "total", header: "Total", render: (o) => formatINR(o.total) },
    { key: "status", header: "Status", render: (o) => <Badge>{o.status}</Badge> },
  ]}
  searchKeys={["order_number"]}
  exportFileName="orders"
/>
```

---

## Layout (`src/components/layout/`)

| Component | Purpose |
| --- | --- |
| `Navbar` | Sticky header: search, cart badge, account menu, role-aware workspace links |
| `Footer` | Sitemap links, trust badges, legal |
| `MobileTabBar` | Bottom navigation on small screens |
| `DashboardShell` | Shared chrome for workspace routes |
| `NetworkStatus` | Offline banner |
| `InstallPrompt` | PWA install CTA (deferred `beforeinstallprompt`) |

---

## Authoring rules

1. **Presentational by default.** Take data as props; fetch in `src/features/*`.
2. **Semantic tokens only.** `bg-primary`, `text-muted-foreground` — never `bg-[#2E7D32]`
   or `text-white`.
3. **Accessible.** Real `<button>`, labelled inputs, `aria-label` on icon-only controls,
   visible focus rings, ≥44px touch targets.
4. **Small.** Over ~200 lines, split.
5. **Responsive.** Mobile layout first, then `sm:`/`md:`/`lg:`.
6. **Loading and empty states are part of the component**, not an afterthought.

## Common mistakes

- ⚠️ Hardcoding colours — breaks theming and dark mode.
- ⚠️ Importing a browser-only library at module scope in an SSR-rendered component.
- ⚠️ Duplicating a shadcn primitive instead of extending it with a variant.

# 26 — SEO Strategy

## Purpose

Document how BullKart becomes discoverable, and the rules for every new page.

## Principles

- Server-rendered HTML means crawlers see real content — don't undo that with
  client-only rendering of primary content.
- One page, one intent, one `<h1>`.
- Structured data on everything that maps to a schema.org type.
- Private surfaces (dashboards, cart, checkout, orders, profile) are `noindex, nofollow`.

## Implementation

Meta and JSON-LD are produced by `src/lib/seo.ts` and applied through the route `head()`
option — there is no `react-helmet`.

```tsx
// src/routes/product.$slug.tsx
export const Route = createFileRoute("/product/$slug")({
  head: ({ loaderData }) => buildSeo({
    title: `${loaderData.name} — Certified Organic | BullKart`,
    description: loaderData.description?.slice(0, 155),
    canonical: `/product/${loaderData.slug}`,
    image: loaderData.heroUrl,          // absolute https URL, leaf routes only
    jsonLd: productJsonLd(loaderData),
  }),
});
```

### Rules for `head()`

| Field | Rule |
| --- | --- |
| `title` | < 60 chars, keyword first, brand last |
| `description` | < 160 chars, benefit-led, unique per page |
| `og:title` / `og:description` | Always set alongside title/description |
| `og:type` | `website` for listings, `product` for PDPs, `article` for blogs |
| `twitter:card` | `summary_large_image` |
| `og:image` / `twitter:image` | Only on leaf routes, only absolute https URLs, never on `__root` |
| `canonical` | Relative path until a production domain is fixed |

⚠️ Never ship the placeholder strings "Lovable App" or "Lovable Generated Project".

## Structured data (JSON-LD)

| Page | Types |
| --- | --- |
| Root | `Organization`, `WebSite` (+ `SearchAction`) |
| Product detail | `Product` with `Offer` (price, INR, availability), `AggregateRating`, `Review` |
| Category / listing | `BreadcrumbList`, `ItemList` |
| Seller/farmer page | `Organization` / `LocalBusiness` |
| Blog post | `Article` with `datePublished`, `author` |
| FAQ blocks | `FAQPage` |

Only mark up what is visible on the page — invented ratings are a manual-action risk.

## Sitemap

`src/routes/sitemap[.]xml.ts` generates `/sitemap.xml` at request time from live data:
static routes, categories, active products (`is_active and deleted_at is null`), sellers
and published blogs.

Rules:
- Mirror the route loader's filters exactly — don't publish URLs that 404.
- `BASE_URL` is empty until a production domain exists; set it at launch.
- Omit `<lastmod>` unless there is an authoritative per-page timestamp
  (`products.updated_at`, `blogs.published_at`). Never derive it from `now()`.
- Exclude `/cart`, `/checkout`, `/orders`, `/profile`, `/wishlist`, `/auth`, all
  dashboards and any `/lovable/` path.

## robots.txt

`public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /vendor
Disallow: /farmer
Disallow: /delivery
Disallow: /checkout
Disallow: /cart
Disallow: /orders
Disallow: /profile
```

Add a `Sitemap:` directive once the production domain is final.

## Content strategy

- **Category pages** are the primary ranking surface: unique intro copy, FAQ, internal
  links to top products.
- **Product pages** need genuine descriptions, certifications, nutrition and reviews —
  not manufacturer boilerplate duplicated across SKUs.
- **Farmer stories** (`sellers.story`) and **harvest updates** are unique content nobody
  else has. Lean on them.
- **Blog** targets informational queries ("is A2 milk better", "organic certification
  India") and links into commercial pages.

## Technical checklist for a new page

```text
[ ] Unique title and description via head()
[ ] Exactly one <h1>
[ ] Semantic landmarks: header, nav, main, footer
[ ] Descriptive alt text on every meaningful image
[ ] Canonical set
[ ] JSON-LD if a schema.org type applies
[ ] Added to the sitemap (or deliberately excluded)
[ ] Internal links in and out
[ ] Mobile Lighthouse SEO = 100
```

## Common mistakes

- ⚠️ Duplicate titles across category pages.
- ⚠️ `og:image` on `__root`, or a relative image URL — link previews break.
- ⚠️ Indexing filtered/faceted URLs, creating thin duplicate pages. Canonicalise to the
  base category.
- ⚠️ Adding a route and forgetting the sitemap.

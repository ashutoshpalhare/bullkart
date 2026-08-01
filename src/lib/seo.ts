/**
 * Shared SEO helpers so every route builds head metadata the same way.
 * Canonical URLs are relative on purpose — crawlers resolve them against the
 * serving origin, which keeps preview, staging and production correct.
 */

type MetaTag = Record<string, string>;

export interface PageSeoInput {
  title: string;
  description: string;
  /** Absolute https URL of a meaningful hero/cover image, when one exists. */
  image?: string;
  type?: "website" | "article" | "product";
}

export function pageMeta({ title, description, image, type = "website" }: PageSeoInput): MetaTag[] {
  const tags: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (image) {
    tags.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
  }
  return tags;
}

export function canonical(path: string) {
  return { rel: "canonical", href: path };
}

export function jsonLd(data: Record<string, unknown>) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

export function breadcrumbLd(items: Array<{ name: string; item: string }>) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  });
}

export const organizationLd = jsonLd({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BullKart",
  description:
    "India's premium multi-vendor marketplace for certified organic groceries, dairy, ayurveda and eco-living products.",
  url: "/",
  areaServed: "IN",
});

export const websiteLd = jsonLd({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BullKart",
  url: "/",
  potentialAction: {
    "@type": "SearchAction",
    target: "/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
});

/** Turns a URL slug into a readable label: "raw-forest-honey" -> "Raw Forest Honey". */
export function prettySlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

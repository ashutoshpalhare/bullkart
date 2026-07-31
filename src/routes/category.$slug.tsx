import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@/components/commerce/section";
import { ProductBrowser } from "@/components/commerce/product-browser";
import { EmptyState } from "@/components/commerce/states";
import { categoriesQuery } from "@/features/catalog/queries";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const pretty = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${pretty} — Organic ${pretty} Online | BullKart` },
        {
          name: "description",
          content: `Shop certified organic ${pretty.toLowerCase()} on BullKart, sourced direct from verified Indian farmers and ethical makers.`,
        },
        { property: "og:title", content: `${pretty} — BullKart` },
        {
          property: "og:description",
          content: `Certified organic ${pretty.toLowerCase()} delivered across India.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ params }) => ({ slug: params.slug }),
  component: CategoryPage,
  errorComponent: ({ error }) => (
    <Section>
      <p role="alert" className="text-sm text-destructive">
        {error.message}
      </p>
    </Section>
  ),
  notFoundComponent: () => (
    <Section>
      <EmptyState
        title="Category not found"
        description="This aisle doesn't exist yet."
        action={{ label: "All categories", to: "/categories" }}
      />
    </Section>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: categories, isLoading } = useQuery(categoriesQuery());
  const category = (categories ?? []).find((c) => c.slug === slug);

  if (!isLoading && categories && !category) throw notFound();

  return (
    <Section>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/categories">Categories</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category?.name ?? slug}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-8 flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-leaf text-3xl" aria-hidden>
          {category?.emoji ?? "🌿"}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl sm:text-3xl">{category?.name ?? "Category"}</h1>
          {category?.tagline && <p className="text-sm text-muted-foreground">{category.tagline}</p>}
        </div>
      </header>

      <ProductBrowser base={{ categorySlug: slug }} showCategoryFilter={false} />
    </Section>
  );
}

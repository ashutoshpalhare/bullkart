import { createFileRoute, notFound } from "@tanstack/react-router";
import { Section } from "@/components/commerce/section";
import { ProductCard } from "@/components/commerce/product-card";
import type { Product } from "@/types/catalog";
import { getCategory, productsByCategory } from "@/lib/mock-data";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { category, products: productsByCategory(params.slug) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Category not found | BullKart" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.category.name} — Organic ${loaderData.category.name} | BullKart`;
    const description = `${loaderData.category.tagline}. Shop certified organic ${loaderData.category.name.toLowerCase()} from verified Indian farmers and ethical brands on BullKart.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category, products } = Route.useLoaderData();

  return (
    <Section>
      <div className="mb-8 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-leaf text-3xl" aria-hidden>
          {category.emoji}
        </span>
        <div>
          <h1 className="text-3xl">{category.name}</h1>
          <p className="text-muted-foreground">
            {category.tagline} · {category.productCount} products
          </p>
        </div>
      </div>

      {products.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p: Product) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Catalogue for this aisle is being onboarded. Check back shortly.
        </p>
      )}
    </Section>
  );
}

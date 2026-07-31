import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/commerce/section";
import { ProductCard } from "@/components/commerce/product-card";
import { products, categories } from "@/lib/mock-data";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Organic Products | BullKart" },
      {
        name: "description",
        content: "Search 2,100+ certified organic products across grocery, dairy, ayurveda, clothing and eco-living on BullKart.",
      },
      { property: "og:title", content: "Search Organic Products | BullKart" },
      { property: "og:description", content: "Find certified organic products from verified Indian sellers." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  return (
    <Section>
      <h1 className="text-3xl">Search</h1>
      <div className="relative mt-5 max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Try “bilona ghee”, “lakadong turmeric”, “khadi kurta”"
          aria-label="Search products"
          className="h-12 rounded-full pl-11"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {categories.slice(0, 8).map((c) => (
          <Badge key={c.id} variant="outline" className="rounded-full px-3 py-1 text-xs">
            {c.name}
          </Badge>
        ))}
      </div>

      <h2 className="mb-6 mt-10 text-xl">Popular right now</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Section>
  );
}

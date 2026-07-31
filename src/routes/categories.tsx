import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Section, SectionHeader } from "@/components/commerce/section";
import { CategoryCard } from "@/components/commerce/category-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/commerce/states";
import { categoriesQuery } from "@/features/catalog/queries";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Organic Categories — BullKart" },
      {
        name: "description",
        content:
          "Browse every BullKart aisle: organic groceries, A2 dairy, ayurveda, khadi clothing, bamboo living and more.",
      },
      { property: "og:title", content: "All Organic Categories — BullKart" },
      { property: "og:description", content: "Browse every organic aisle on BullKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data, isLoading, isError, error, refetch } = useQuery(categoriesQuery());

  return (
    <Section>
      <SectionHeader eyebrow="Explore" title="All categories" />
      {isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(data ?? []).map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      )}
    </Section>
  );
}

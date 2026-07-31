import { createFileRoute } from "@tanstack/react-router";
import { Section, SectionHeader } from "@/components/commerce/section";
import { CategoryCard } from "@/components/commerce/category-card";
import { categories } from "@/lib/mock-data";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Organic Categories | BullKart" },
      {
        name: "description",
        content:
          "Browse every BullKart aisle — organic grocery, produce, dairy, honey, spices, ayurveda, personal care, clothing, furniture, gardening and eco-friendly living.",
      },
      { property: "og:title", content: "All Organic Categories | BullKart" },
      { property: "og:description", content: "Fourteen organic aisles, thousands of verified products." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Browse" title="All categories" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((c) => (
          <CategoryCard key={c.id} category={c} />
        ))}
      </div>
    </Section>
  );
}

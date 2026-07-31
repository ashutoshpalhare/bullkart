import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/commerce/section";
import { ProductCard } from "@/components/commerce/product-card";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist | BullKart" },
      { name: "description", content: "Saved organic products you plan to buy later on BullKart." },
      { property: "og:title", content: "Wishlist | BullKart" },
      { property: "og:description", content: "Saved organic products you plan to buy later." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  return (
    <Section>
      <h1 className="text-3xl">Wishlist</h1>
      <p className="mt-2 text-muted-foreground">Saved for later — move items to your cart anytime.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.slice(4, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Section>
  );
}

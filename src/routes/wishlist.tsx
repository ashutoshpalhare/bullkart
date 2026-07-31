import { createFileRoute } from "@tanstack/react-router";
import { Heart, LogIn } from "lucide-react";
import { Section, SectionHeader } from "@/components/commerce/section";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGridSkeleton } from "@/components/commerce/skeletons";
import { EmptyState, ErrorState } from "@/components/commerce/states";
import { useWishlist } from "@/features/wishlist/hooks";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — BullKart" },
      { name: "description", content: "Everything you've saved for later on BullKart, ready to add to cart." },
      { property: "og:title", content: "Your Wishlist — BullKart" },
      { property: "og:description", content: "Saved organic products on BullKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const { data, isLoading, isError, error, refetch } = useWishlist();

  const items = (data ?? []).filter((w) => w.product);

  return (
    <Section>
      <SectionHeader eyebrow="Saved for later" title="Your wishlist" />
      {!user && !loading ? (
        <EmptyState
          icon={<LogIn className="size-7" />}
          title="Sign in to see your wishlist"
          description="Your saved products sync across every device once you sign in."
          action={{ label: "Sign in", to: "/auth" }}
        />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : isLoading || loading ? (
        <ProductGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-7" />}
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here."
          action={{ label: "Browse products", to: "/categories" }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((w) => (
            <ProductCard key={w.id} product={w.product!} />
          ))}
        </div>
      )}
    </Section>
  );
}

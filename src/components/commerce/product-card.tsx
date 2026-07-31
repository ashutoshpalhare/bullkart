import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/commerce/star-rating";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice } from "@/lib/format";
import { useAddToCart } from "@/features/cart/hooks";
import { useToggleWishlist, useWishlistIds } from "@/features/wishlist/hooks";
import type { ProductSummary } from "@/types/db";

export function ProductCard({
  product,
  layout = "grid",
}: {
  product: ProductSummary;
  layout?: "grid" | "list";
}) {
  const off = discountPercent(Number(product.price), Number(product.mrp));
  const inStock = product.stock_qty > 0;
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const wishlisted = useWishlistIds().has(product.id);

  const media = (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className={cn(
        "relative flex items-center justify-center bg-cream",
        layout === "list" ? "size-32 shrink-0 rounded-2xl sm:size-40" : "aspect-square text-6xl",
      )}
      aria-label={product.name}
    >
      <span aria-hidden className={layout === "list" ? "text-5xl" : ""}>
        {product.emoji ?? "🌿"}
      </span>
      {off > 0 && (
        <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">{off}% off</Badge>
      )}
      {!inStock && (
        <span className="absolute inset-0 grid place-items-center bg-card/70 text-xs font-medium text-muted-foreground">
          Out of stock
        </span>
      )}
    </Link>
  );

  const body = (
    <div className="flex flex-1 flex-col p-4">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-leaf-foreground">
        {product.seller?.name ?? "BullKart"}
      </p>
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="mt-1 line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
      >
        {product.name}
      </Link>
      <div className="mt-1.5 flex items-center gap-1.5">
        <StarRating value={Number(product.rating)} />
        <span className="text-xs text-muted-foreground">({product.review_count})</span>
      </div>
      {layout === "list" && product.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-base font-bold">{formatPrice(product.price)}</span>
        {off > 0 && (
          <span className="text-xs text-muted-foreground line-through">{formatPrice(product.mrp)}</span>
        )}
        <span className="text-xs text-muted-foreground">/ {product.unit}</span>
      </div>
      <Button
        size="sm"
        className="mt-3 w-full rounded-full"
        disabled={!inStock || addToCart.isPending}
        onClick={() => addToCart.mutate({ productId: product.id })}
      >
        <ShoppingCart className="size-4" />
        {inStock ? "Add to cart" : "Notify me"}
      </Button>
    </div>
  );

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        layout === "list" ? "flex gap-4 p-3" : "flex flex-col",
      )}
    >
      {media}
      {body}
      <button
        type="button"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
        onClick={() => toggleWishlist.mutate(product.id)}
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/90 text-muted-foreground shadow-soft transition hover:text-destructive"
      >
        <Heart className={cn("size-4", wishlisted && "fill-destructive text-destructive")} />
      </button>
    </article>
  );
}

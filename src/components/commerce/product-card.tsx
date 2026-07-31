import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative flex aspect-square items-center justify-center bg-cream text-6xl"
        aria-label={product.name}
      >
        <span aria-hidden>{product.emoji}</span>
        {off > 0 && (
          <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">{off}% off</Badge>
        )}
        {!product.inStock && (
          <span className="absolute inset-0 grid place-items-center bg-card/70 text-sm font-medium text-muted-foreground">
            Out of stock
          </span>
        )}
      </Link>

      <button
        type="button"
        aria-label="Add to wishlist"
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full glass text-muted-foreground transition-colors hover:text-destructive"
      >
        <Heart className="size-4" />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium text-leaf-foreground">
          {product.seller.name}
          {product.seller.verified && " · Verified"}
        </p>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-accent text-accent" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviewCount.toLocaleString("en-IN")})</span>
          <span className="mx-1">·</span>
          <span>{product.unit}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-base font-semibold text-foreground">₹{product.price.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground line-through">₹{product.mrp.toLocaleString("en-IN")}</p>
          </div>
          <Button size="sm" disabled={!product.inStock} className={cn("rounded-full px-4")}>
            Add
          </Button>
        </div>
      </div>
    </article>
  );
}

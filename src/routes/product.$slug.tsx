import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Star, ShieldCheck, Truck, RotateCcw, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section } from "@/components/commerce/section";
import { ProductCard } from "@/components/commerce/product-card";
import { getProduct, products, productsByCategory } from "@/lib/mock-data";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    const related = productsByCategory(product.categorySlug)
      .filter((p) => p.id !== product.id)
      .concat(products.filter((p) => p.categorySlug !== product.categorySlug))
      .slice(0, 4);
    return { product, related };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found | BullKart" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    const title = `${product.name} — ₹${product.price} | BullKart`;
    return {
      meta: [
        { title },
        { name: "description", content: product.description },
        { property: "og:title", content: title },
        { property: "og:description", content: product.description },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <>
      <Section className="pb-0">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/category/$slug" params={{ slug: product.categorySlug }} className="hover:text-primary">
            {product.categorySlug.replace(/-/g, " ")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="grid aspect-square place-items-center rounded-3xl border border-border bg-cream text-[8rem] shadow-soft">
            <span aria-hidden>{product.emoji}</span>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {product.badges.map((b) => (
                <Badge key={b} className="rounded-full bg-leaf text-leaf-foreground">
                  {b}
                </Badge>
              ))}
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-success-foreground">
                <Star className="size-3.5 fill-current" />
                {product.rating}
              </span>
              <span className="text-muted-foreground">
                {product.reviewCount.toLocaleString("en-IN")} verified reviews
              </span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-3xl font-semibold">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <span className="pb-1 text-muted-foreground line-through">
                ₹{product.mrp.toLocaleString("en-IN")}
              </span>
              <span className="pb-1 font-medium text-primary">{off}% off</span>
              <span className="pb-1 text-sm text-muted-foreground">/ {product.unit}</span>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Sold by</p>
              <p className="mt-1 font-semibold">
                {product.seller.name}{" "}
                {product.seller.verified && (
                  <ShieldCheck className="inline size-4 text-primary" aria-label="Verified seller" />
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {product.seller.type} · {product.seller.location}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full px-8" disabled={!product.inStock}>
                Add to cart
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
                <Link to="/checkout">Buy now</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full" aria-label="Save to wishlist">
                <Heart className="size-5" />
              </Button>
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                [Truck, "Delivered in 48h"],
                [RotateCcw, "7-day easy returns"],
                [ShieldCheck, "Lab-tested batch"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Truck;
                return (
                  <li key={label as string} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <I className="size-4 text-primary" />
                    {label as string}
                  </li>
                );
              })}
            </ul>

            <Tabs defaultValue="about" className="mt-8">
              <TabsList className="rounded-full">
                <TabsTrigger value="about" className="rounded-full">
                  About
                </TabsTrigger>
                <TabsTrigger value="story" className="rounded-full">
                  Farm story
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-full">
                  Reviews
                </TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="pt-4 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </TabsContent>
              <TabsContent value="story" className="pt-4 text-sm leading-relaxed text-muted-foreground">
                {product.seller.name} has been farming in {product.seller.location} across multiple seasons,
                audited annually for organic compliance. Harvest and batch details appear here once Cloud is
                connected.
              </TabsContent>
              <TabsContent value="reviews" className="pt-4 text-sm leading-relaxed text-muted-foreground">
                Verified purchase reviews with photos will load from the reviews table once Cloud is enabled.
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="mb-6 text-xl sm:text-2xl">You may also like</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>
    </>
  );
}

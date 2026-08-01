import { useEffect, useState } from "react";
import { breadcrumbLd, canonical, prettySlug } from "@/lib/seo";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Heart,
  Leaf,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/commerce/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StarRating } from "@/components/commerce/star-rating";
import { ProductCard } from "@/components/commerce/product-card";
import { EmptyState } from "@/components/commerce/states";
import { ProductGridSkeleton } from "@/components/commerce/skeletons";
import {
  productQuery,
  productsByIdsQuery,
  relatedProductsQuery,
  reviewsQuery,
} from "@/features/catalog/queries";
import { useAddToCart } from "@/features/cart/hooks";
import { useToggleWishlist, useWishlistIds } from "@/features/wishlist/hooks";
import { useAddReview } from "@/features/reviews/hooks";
import { useRecentlyViewed } from "@/hooks/use-recent-list";
import { useAuth } from "@/hooks/use-auth";
import { discountPercent, estimatedDelivery, formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const pretty = prettySlug(params.slug);
    return {
      meta: [
        { title: `${pretty} — Buy Organic Online | BullKart` },
        {
          name: "description",
          content: `Buy ${pretty} on BullKart — certified organic, farm traceable and delivered fresh across India.`,
        },
        { property: "og:title", content: `${pretty} — BullKart` },
        { property: "og:description", content: `Certified organic ${pretty}, delivered fresh.` },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [canonical(`/product/${params.slug}`)],
      scripts: [
        breadcrumbLd([
          { name: "Home", item: "/" },
          { name: "Shop", item: "/categories" },
          { name: pretty, item: `/product/${params.slug}` },
        ]),
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <Section>
      <EmptyState
        title="Product not found"
        description="This product may have been removed or renamed."
        action={{ label: "Keep shopping", to: "/categories" }}
      />
    </Section>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const product = useQuery(productQuery(slug));
  const recent = useRecentlyViewed();
  const [qty, setQty] = useState(1);

  const p = product.data;

  useEffect(() => {
    if (p?.id) recent.push(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  const reviews = useQuery({ ...reviewsQuery(p?.id ?? ""), enabled: Boolean(p?.id) });
  const related = useQuery(relatedProductsQuery(p?.category_id, p?.id ?? ""));
  const recentlyViewed = useQuery(productsByIdsQuery(recent.items.filter((id) => id !== p?.id)));

  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const wishlisted = useWishlistIds().has(p?.id ?? "");
  const addReview = useAddReview(p?.id ?? "");

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  if (product.isLoading) {
    return (
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </Section>
    );
  }

  if (!p) throw notFound();

  const off = discountPercent(Number(p.price), Number(p.mrp));
  const inStock = p.stock_qty > 0;
  const reviewRows = reviews.data ?? [];
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewRows.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <Section>
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {p.category && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/category/$slug" params={{ slug: p.category.slug }}>
                    {p.category.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">{p.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative grid aspect-square place-items-center rounded-3xl border border-border bg-cream text-[9rem] shadow-soft">
            <span aria-hidden>{p.emoji ?? "🌿"}</span>
            {off > 0 && (
              <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground">{off}% off</Badge>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid size-16 place-items-center rounded-2xl border border-border bg-cream text-2xl"
                aria-hidden
              >
                {p.emoji ?? "🌿"}
              </div>
            ))}
          </div>
        </div>

        <div>
          {p.seller && (
            <Link
              to="/farmers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-leaf-foreground"
            >
              {p.seller.name}
              {p.seller.verified && <BadgeCheck className="size-4 text-primary" />}
            </Link>
          )}
          <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">{p.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StarRating value={Number(p.rating)} size="md" />
            <span className="text-sm text-muted-foreground">
              {Number(p.rating).toFixed(1)} · {p.review_count} reviews
            </span>
            {p.is_organic_certified && (
              <Badge variant="secondary" className="gap-1">
                <Leaf className="size-3.5" /> Certified organic
              </Badge>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-semibold">{formatPrice(p.price)}</span>
            {off > 0 && (
              <span className="text-base text-muted-foreground line-through">{formatPrice(p.mrp)}</span>
            )}
            <span className="text-sm text-muted-foreground">per {p.unit}</span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

          {p.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.badges.map((b) => (
                <Badge key={b} variant="outline" className="rounded-full">
                  {b}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <Button
                size="icon"
                variant="ghost"
                className="size-10 rounded-full"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <Button
                size="icon"
                variant="ghost"
                className="size-10 rounded-full"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(p.stock_qty || 10, q + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className="flex-1 rounded-full sm:flex-none sm:px-8"
              disabled={!inStock || addToCart.isPending}
              onClick={() => addToCart.mutate({ productId: p.id, quantity: qty })}
            >
              <ShoppingCart className="size-4" />
              {inStock ? "Add to cart" : "Out of stock"}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full"
              disabled={!inStock}
              onClick={() => {
                addToCart.mutate(
                  { productId: p.id, quantity: qty },
                  { onSuccess: () => void navigate({ to: "/checkout" }) },
                );
              }}
            >
              Buy now
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="size-11 rounded-full"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              onClick={() => toggleWishlist.mutate(p.id)}
            >
              <Heart className={cn("size-4", wishlisted && "fill-destructive text-destructive")} />
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {inStock ? `${p.stock_qty} in stock` : "Currently unavailable"} · Delivery by{" "}
            <span className="font-medium text-foreground">{estimatedDelivery(3)}</span>
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Free delivery over ₹999" },
              { icon: RotateCcw, label: "7-day easy returns" },
              { icon: BadgeCheck, label: "Verified seller" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-4 shrink-0 text-primary" />
                {label}
              </div>
            ))}
          </div>

          <Tabs defaultValue="details" className="mt-8">
            <TabsList className="w-full justify-start rounded-full">
              <TabsTrigger value="details" className="rounded-full">
                Details
              </TabsTrigger>
              <TabsTrigger value="seller" className="rounded-full">
                Seller
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-full">
                Shipping
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-4 text-sm leading-relaxed text-muted-foreground">
              {p.ingredients && (
                <p>
                  <span className="font-semibold text-foreground">Ingredients: </span>
                  {p.ingredients}
                </p>
              )}
              {p.certifications.length > 0 && (
                <p className="mt-2">
                  <span className="font-semibold text-foreground">Certifications: </span>
                  {p.certifications.join(", ")}
                </p>
              )}
              <p className="mt-2">
                <span className="font-semibold text-foreground">Unit: </span>
                {p.unit}
              </p>
            </TabsContent>
            <TabsContent value="seller" className="pt-4 text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">{p.seller?.name}</p>
              <p>{p.seller?.location}</p>
            </TabsContent>
            <TabsContent value="shipping" className="pt-4 text-sm leading-relaxed text-muted-foreground">
              Same-day delivery in metros, 48 hours pan-India. Free above ₹999, otherwise ₹49.
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Separator className="my-12" />

      <section id="reviews">
        <SectionHeader eyebrow="What shoppers say" title={`Reviews (${reviewRows.length})`} />
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <p className="font-display text-4xl font-semibold">{Number(p.rating).toFixed(1)}</p>
            <StarRating value={Number(p.rating)} size="md" className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Based on {p.review_count} reviews</p>
            <div className="mt-4 space-y-2">
              {buckets.map((b) => (
                <div key={b.star} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-muted-foreground">{b.star}★</span>
                  <Progress
                    value={reviewRows.length ? (b.count / reviewRows.length) * 100 : 0}
                    className="h-2"
                  />
                  <span className="w-6 text-right text-xs text-muted-foreground">{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {user ? (
              <form
                className="mb-8 rounded-3xl border border-border bg-card p-5 shadow-soft"
                onSubmit={(e) => {
                  e.preventDefault();
                  addReview.mutate(
                    { rating, title, body, images: [] },
                    {
                      onSuccess: () => {
                        setTitle("");
                        setBody("");
                        setRating(5);
                      },
                    },
                  );
                }}
              >
                <p className="font-semibold">Write a review</p>
                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-label={`Rate ${r} stars`}
                      onClick={() => setRating(r)}
                      className={cn(
                        "grid size-9 place-items-center rounded-full border text-sm font-semibold",
                        rating >= r ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-3">
                  <div>
                    <Label htmlFor="review-title">Title</Label>
                    <Input
                      id="review-title"
                      value={title}
                      maxLength={100}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Sums up your experience"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="review-body">Review</Label>
                    <Textarea
                      id="review-body"
                      value={body}
                      maxLength={1000}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="What did you think of the quality, freshness and packaging?"
                      className="mt-1.5 min-h-24"
                    />
                  </div>
                </div>
                <Button type="submit" className="mt-4 rounded-full" disabled={addReview.isPending}>
                  Submit review
                </Button>
              </form>
            ) : (
              <div className="mb-8 rounded-3xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                <Link to="/auth" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>{" "}
                to write a review.
              </div>
            )}

            {reviewRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
            ) : (
              <ul className="space-y-4">
                {reviewRows.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{r.author_name ?? "Verified shopper"}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                    </div>
                    <StarRating value={r.rating} className="mt-1" />
                    {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                    {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      <SectionHeader eyebrow="You may also like" title="Related products" />
      {related.isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(related.data ?? []).slice(0, 4).map((r) => (
            <ProductCard key={r.id} product={r} />
          ))}
        </div>
      )}

      {(recentlyViewed.data ?? []).length > 0 && (
        <>
          <Separator className="my-12" />
          <SectionHeader eyebrow="Pick up where you left off" title="Recently viewed" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(recentlyViewed.data ?? []).slice(0, 4).map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

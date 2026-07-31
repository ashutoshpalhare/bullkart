import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2, LogIn } from "lucide-react";
import { Section, SectionHeader } from "@/components/commerce/section";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ListSkeleton } from "@/components/commerce/skeletons";
import { EmptyState, ErrorState } from "@/components/commerce/states";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/features/cart/hooks";
import { cartTotals } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — BullKart" },
      { name: "description", content: "Review your organic basket and checkout securely on BullKart." },
      { property: "og:title", content: "Your Cart — BullKart" },
      { property: "og:description", content: "Review your organic basket on BullKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const { data, isLoading, isError, error, refetch } = useCart();
  const updateQty = useUpdateCartQuantity();
  const remove = useRemoveFromCart();

  const lines = (data ?? []).filter((l) => l.product);
  const totals = cartTotals(lines);

  if (!user && !loading) {
    return (
      <Section>
        <SectionHeader eyebrow="Your basket" title="Shopping cart" />
        <EmptyState
          icon={<LogIn className="size-7" />}
          title="Sign in to view your cart"
          description="Your basket is saved to your account so it follows you everywhere."
          action={{ label: "Sign in", to: "/auth" }}
        />
      </Section>
    );
  }

  return (
    <Section>
      <SectionHeader eyebrow="Your basket" title="Shopping cart" />

      {isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : isLoading || loading ? (
        <ListSkeleton rows={3} />
      ) : lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="size-7" />}
          title="Your cart is empty"
          description="Add some farm-fresh organic goodness to get started."
          action={{ label: "Start shopping", to: "/categories" }}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="space-y-4">
            {lines.map((line) => {
              const p = line.product!;
              return (
                <li
                  key={line.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
                >
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="grid size-20 shrink-0 place-items-center rounded-2xl bg-cream text-4xl sm:size-24"
                    aria-label={p.name}
                  >
                    <span aria-hidden>{p.emoji ?? "🌿"}</span>
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to="/product/$slug"
                          params={{ slug: p.slug }}
                          className="line-clamp-2 font-semibold hover:text-primary"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.seller?.name} · {p.unit}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => remove.mutate(line.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-border">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full"
                          aria-label="Decrease quantity"
                          onClick={() => updateQty.mutate({ id: line.id, quantity: line.quantity - 1 })}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full"
                          aria-label="Increase quantity"
                          disabled={line.quantity >= p.stock_qty}
                          onClick={() => updateQty.mutate({ id: line.id, quantity: line.quantity + 1 })}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <p className="font-semibold">{formatPrice(Number(p.price) * line.quantity)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <p className="font-semibold">Order summary</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatPrice(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd>{totals.deliveryFee === 0 ? "Free" : formatPrice(totals.deliveryFee)}</dd>
                </div>
                {totals.savings > 0 && (
                  <div className="flex justify-between text-primary">
                    <dt>You save</dt>
                    <dd>-{formatPrice(totals.savings)}</dd>
                  </div>
                )}
              </dl>
              <Separator className="my-4" />
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-semibold">
                  {formatPrice(totals.subtotal + totals.deliveryFee)}
                </span>
              </div>
              <Button asChild size="lg" className="mt-5 w-full rounded-full">
                <Link to="/checkout">Proceed to checkout</Link>
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
                <Link to="/categories">Continue shopping</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </Section>
  );
}

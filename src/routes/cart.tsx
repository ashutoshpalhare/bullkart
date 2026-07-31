import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/components/commerce/section";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | BullKart" },
      { name: "description", content: "Review your organic basket and checkout securely on BullKart." },
      { property: "og:title", content: "Your Cart | BullKart" },
      { property: "og:description", content: "Review your organic basket and checkout securely." },
    ],
  }),
  component: CartPage,
});

const lines = products.slice(0, 3).map((p, i) => ({ product: p, qty: i + 1 }));

function CartPage() {
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const delivery = subtotal > 999 ? 0 : 49;

  return (
    <Section>
      <h1 className="text-3xl">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {lines.map(({ product, qty }) => (
            <div
              key={product.id}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-cream text-3xl" aria-hidden>
                {product.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.seller.name} · {product.unit}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-border">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Decrease">
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{qty}</span>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Increase">
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
              <p className="font-semibold">₹{(product.price * qty).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg">Order summary</h2>
          <div className="mt-4 flex gap-2">
            <Input placeholder="Coupon code" className="rounded-full" aria-label="Coupon code" />
            <Button variant="outline" className="rounded-full">
              Apply
            </Button>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>₹{subtotal.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{delivery === 0 ? "Free" : `₹${delivery}`}</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <div className="flex justify-between font-display text-lg font-semibold">
            <span>Total</span>
            <span>₹{(subtotal + delivery).toLocaleString("en-IN")}</span>
          </div>
          <Button asChild size="lg" className="mt-5 w-full rounded-full">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
        </aside>
      </div>
    </Section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/commerce/section";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders | BullKart" },
      { name: "description", content: "Track your organic orders, delivery status and invoices on BullKart." },
      { property: "og:title", content: "My Orders | BullKart" },
      { property: "og:description", content: "Track your organic orders and delivery status." },
    ],
  }),
  component: OrdersPage,
});

const orders = [
  { id: "BK-24098", status: "Out for delivery", date: "31 Jul 2026", items: products.slice(0, 2), total: 1898 },
  { id: "BK-23871", status: "Delivered", date: "24 Jul 2026", items: products.slice(2, 4), total: 818 },
  { id: "BK-23610", status: "Delivered", date: "12 Jul 2026", items: products.slice(4, 5), total: 299 },
];

function OrdersPage() {
  return (
    <Section>
      <h1 className="text-3xl">My orders</h1>
      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <article key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Order {o.id}</p>
                <p className="text-xs text-muted-foreground">Placed {o.date}</p>
              </div>
              <Badge
                className={
                  o.status === "Delivered"
                    ? "rounded-full bg-leaf text-leaf-foreground"
                    : "rounded-full bg-accent text-accent-foreground"
                }
              >
                {o.status}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {o.items.map((p) => (
                <span key={p.id} className="grid size-14 place-items-center rounded-xl bg-cream text-2xl" aria-hidden>
                  {p.emoji}
                </span>
              ))}
              <p className="ml-auto font-semibold">₹{o.total.toLocaleString("en-IN")}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full">
                Track order
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                Invoice
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

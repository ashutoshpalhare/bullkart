import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, PackageSearch } from "lucide-react";
import { Section, SectionHeader } from "@/components/commerce/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListSkeleton } from "@/components/commerce/skeletons";
import { EmptyState, ErrorState } from "@/components/commerce/states";
import { formatDate, formatPrice } from "@/lib/format";
import { useOrders, useUpdateOrderStatus } from "@/features/orders/hooks";
import { useAuth } from "@/hooks/use-auth";
import type { OrderWithItems } from "@/types/db";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Your Orders — BullKart" },
      { name: "description", content: "Track every BullKart order, view invoices, cancel or request returns." },
      { property: "og:title", content: "Your Orders — BullKart" },
      { property: "og:description", content: "Track your organic orders on BullKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

const statusFlow = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"] as const;
const filters = ["all", "pending", "shipped", "delivered", "cancelled"] as const;

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function OrdersPage() {
  const { user, loading } = useAuth();
  const { data, isLoading, isError, error, refetch } = useOrders();
  const update = useUpdateOrderStatus();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [active, setActive] = useState<OrderWithItems | null>(null);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"cancel" | "return">("cancel");

  const orders = (data ?? []).filter((o) => (filter === "all" ? true : o.status === filter));

  if (!user && !loading) {
    return (
      <Section>
        <SectionHeader eyebrow="Order history" title="Your orders" />
        <EmptyState
          icon={<LogIn className="size-7" />}
          title="Sign in to see your orders"
          description="Order history, tracking and returns live in your account."
          action={{ label: "Sign in", to: "/auth" }}
        />
      </Section>
    );
  }

  return (
    <Section>
      <SectionHeader eyebrow="Order history" title="Your orders" />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList className="flex-wrap rounded-full">
          {filters.map((f) => (
            <TabsTrigger key={f} value={f} className="rounded-full capitalize">
              {f}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isError ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
      ) : isLoading || loading ? (
        <ListSkeleton rows={3} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-7" />}
          title="No orders here yet"
          description="When you place an order it'll show up here with live tracking."
          action={{ label: "Start shopping", to: "/categories" }}
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const stepIndex = statusFlow.indexOf(o.status as (typeof statusFlow)[number]);
            const cancellable = ["pending", "confirmed", "packed"].includes(o.status);
            const returnable = o.status === "delivered";
            return (
              <li key={o.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Placed {formatDate(o.created_at)} · {o.items.length} item
                      {o.items.length === 1 ? "" : "s"} · {formatPrice(o.total)}
                    </p>
                  </div>
                  <Badge
                    variant={o.status === "cancelled" ? "destructive" : "secondary"}
                    className="shrink-0 capitalize"
                  >
                    {statusLabel(o.status)}
                  </Badge>
                </div>

                {stepIndex >= 0 && (
                  <ol className="mt-4 flex flex-wrap gap-1.5">
                    {statusFlow.map((s, i) => (
                      <li
                        key={s}
                        className={`h-1.5 min-w-10 flex-1 rounded-full ${
                          i <= stepIndex ? "bg-primary" : "bg-muted"
                        }`}
                        aria-label={statusLabel(s)}
                      />
                    ))}
                  </ol>
                )}

                <Separator className="my-4" />

                <ul className="space-y-2">
                  {o.items.slice(0, 3).map((it) => (
                    <li key={it.id} className="flex items-center gap-3 text-sm">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cream text-xl" aria-hidden>
                        {it.emoji ?? "🌿"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {it.product_slug ? (
                          <Link
                            to="/product/$slug"
                            params={{ slug: it.product_slug }}
                            className="hover:text-primary"
                          >
                            {it.product_name}
                          </Link>
                        ) : (
                          it.product_name
                        )}{" "}
                        × {it.quantity}
                      </span>
                      <span className="shrink-0 font-medium">{formatPrice(Number(it.price) * it.quantity)}</span>
                    </li>
                  ))}
                  {o.items.length > 3 && (
                    <li className="text-xs text-muted-foreground">+{o.items.length - 3} more</li>
                  )}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  {cancellable && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setActive(o);
                        setMode("cancel");
                        setReason("");
                      }}
                    >
                      Cancel order
                    </Button>
                  )}
                  {returnable && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setActive(o);
                        setMode("return");
                        setReason("");
                      }}
                    >
                      Request return
                    </Button>
                  )}
                  <Button asChild size="sm" variant="ghost" className="rounded-full">
                    <Link to="/categories">Buy again</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "cancel" ? "Cancel this order" : "Request a return"}</DialogTitle>
            <DialogDescription>
              Tell us what went wrong so we can make it right — {active?.order_number}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setActive(null)}>
              Keep order
            </Button>
            <Button
              className="rounded-full"
              disabled={update.isPending}
              onClick={() => {
                if (!active) return;
                update.mutate(
                  mode === "cancel"
                    ? { id: active.id, status: "cancelled", cancel_reason: reason || "Not specified" }
                    : { id: active.id, status: "returned", return_reason: reason || "Not specified" },
                  { onSuccess: () => setActive(null) },
                );
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

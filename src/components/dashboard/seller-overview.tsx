import { AlertTriangle, IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  ChartCard,
  HorizontalBarChart,
  OrdersBarChart,
  RevenueAreaChart,
} from "@/components/dashboard/charts";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSellerOrderItems, useSellerProducts, useSellerStats } from "@/features/seller/hooks";
import { formatPrice } from "@/lib/format";

/** KPI + chart overview shared by the vendor and farmer workspaces. */
export function SellerOverview({
  sellerId,
  kind,
}: {
  sellerId: string;
  kind: "vendor" | "farmer";
}) {
  const items = useSellerOrderItems(sellerId);
  const products = useSellerProducts(sellerId);
  const stats = useSellerStats(items.data);
  const loading = items.isLoading || products.isLoading;

  const rows = products.data ?? [];
  const lowStock = rows.filter((p) => p.stock_qty <= p.low_stock_threshold);
  const catalogueHref = kind === "farmer" ? "/farmer/produce" : "/vendor/products";

  return (
    <div className="space-y-8">
      <StatGrid>
        <StatCard
          label="Revenue (30 days)"
          value={formatPrice(stats.revenue30d)}
          hint={`${formatPrice(stats.revenue)} lifetime`}
          icon={<IndianRupee className="size-5" />}
          loading={loading}
        />
        <StatCard
          label="Orders"
          value={stats.orders}
          hint={`${stats.pending} awaiting fulfilment`}
          icon={<ShoppingBag className="size-5" />}
          loading={loading}
        />
        <StatCard
          label={kind === "farmer" ? "Listings" : "Live SKUs"}
          value={rows.filter((p) => p.is_active).length}
          hint={`${stats.units} units sold`}
          icon={<Package className="size-5" />}
          loading={loading}
        />
        <StatCard
          label="Low stock"
          value={lowStock.length}
          hint={lowStock.length ? "Restock to stay listed" : "Everything well stocked"}
          tone={lowStock.length ? "warning" : "positive"}
          icon={<AlertTriangle className="size-5" />}
          loading={loading}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Revenue trend"
          description="Last 30 days of settled sales"
          loading={loading}
          empty={stats.daily.length === 0}
        >
          <RevenueAreaChart data={stats.daily} />
        </ChartCard>
        <ChartCard
          title="Orders per day"
          description="Line items placed with your store"
          loading={loading}
          empty={stats.dailyOrders.length === 0}
        >
          <OrdersBarChart data={stats.dailyOrders} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Best sellers"
          description="Units shipped by product"
          loading={loading}
          empty={stats.topProducts.length === 0}
        >
          <HorizontalBarChart data={stats.topProducts} />
        </ChartCard>

        <SectionCard title="Restock queue" description="Products at or below their low-stock threshold">
          <Card className="rounded-2xl shadow-soft">
            <CardContent className="p-5">
              {lowStock.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nothing needs restocking right now.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {lowStock.slice(0, 6).map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {product.emoji} {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Threshold {product.low_stock_threshold} {product.unit}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full text-destructive">
                        {product.stock_qty} left
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="outline" className="mt-4 w-full rounded-full">
                <Link to={catalogueHref as never}>Manage catalogue</Link>
              </Button>
            </CardContent>
          </Card>
        </SectionCard>
      </div>

      <StatGrid>
        <StatCard
          label="Repeat customers"
          value={stats.customers}
          hint="Unique buyers so far"
          icon={<Users className="size-5" />}
          loading={loading}
        />
      </StatGrid>
    </div>
  );
}

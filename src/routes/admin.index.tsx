import { createFileRoute } from "@tanstack/react-router";
import { IndianRupee, Package, ShoppingBag, Sprout, Store, TriangleAlert, Users } from "lucide-react";
import {
  CategoryPieChart,
  ChartCard,
  HorizontalBarChart,
  OrdersBarChart,
  RevenueAreaChart,
} from "@/components/dashboard/charts";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { useAdminMetrics } from "@/features/admin/hooks";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading, error, refetch } = useAdminMetrics();

  if (error) {
    return (
      <div className="rounded-2xl border border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">We couldn't load the marketplace metrics.</p>
        <Button className="mt-4 rounded-full" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const daily = (data?.daily ?? []).map((d) => ({ label: d.day.slice(5), value: Number(d.revenue) }));
  const dailyOrders = (data?.daily ?? []).map((d) => ({ label: d.day.slice(5), value: Number(d.orders) }));
  const categories = (data?.categories ?? []).map((c) => ({ label: c.name, value: Number(c.revenue) }));
  const topProducts = (data?.top_products ?? []).map((p) => ({ label: p.name, value: Number(p.units) }));

  return (
    <div className="space-y-8">
      <StatGrid>
        <StatCard
          label="Revenue (30 days)"
          value={formatPrice(data?.revenue_30d ?? 0)}
          hint={`${formatPrice(data?.revenue ?? 0)} lifetime`}
          icon={<IndianRupee className="size-5" />}
          loading={isLoading}
        />
        <StatCard
          label="Orders"
          value={data?.orders ?? 0}
          hint={`${data?.pending_orders ?? 0} awaiting fulfilment`}
          icon={<ShoppingBag className="size-5" />}
          loading={isLoading}
        />
        <StatCard
          label="Customers"
          value={data?.customers ?? 0}
          hint={`${data?.reviews ?? 0} reviews written`}
          icon={<Users className="size-5" />}
          loading={isLoading}
        />
        <StatCard
          label="Low stock"
          value={data?.low_stock ?? 0}
          hint="Listings at or below their alert level"
          tone="warning"
          icon={<TriangleAlert className="size-5" />}
          loading={isLoading}
        />
      </StatGrid>

      <StatGrid>
        <StatCard label="Vendors" value={data?.vendors ?? 0} icon={<Store className="size-5" />} loading={isLoading} />
        <StatCard label="Farmers" value={data?.farmers ?? 0} icon={<Sprout className="size-5" />} loading={isLoading} />
        <StatCard
          label="Live products"
          value={data?.products ?? 0}
          icon={<Package className="size-5" />}
          loading={isLoading}
        />
        <StatCard
          label="Pending verification"
          value={data?.pending_verification ?? 0}
          hint="Stores waiting on approval"
          tone="warning"
          icon={<TriangleAlert className="size-5" />}
          loading={isLoading}
        />
      </StatGrid>

      <SectionCard title="Trends" description="Rolling 30-day marketplace performance.">
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Revenue" description="Daily gross merchandise value" loading={isLoading}>
            <RevenueAreaChart data={daily} />
          </ChartCard>
          <ChartCard title="Orders" description="Daily order volume" loading={isLoading}>
            <OrdersBarChart data={dailyOrders} />
          </ChartCard>
          <ChartCard title="Revenue by category" loading={isLoading}>
            <CategoryPieChart data={categories} />
          </ChartCard>
          <ChartCard title="Best sellers" description="Units sold" loading={isLoading}>
            <HorizontalBarChart data={topProducts} />
          </ChartCard>
        </div>
      </SectionCard>
    </div>
  );
}

import { IndianRupee, Wallet } from "lucide-react";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { useSellerOrderItems, useSellerPayouts, useSellerStats } from "@/features/seller/hooks";
import { formatDate, formatPrice } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

type Payout = Tables<"payouts">;

const TONE: Record<string, string> = {
  paid: "bg-leaf text-leaf-foreground",
  processing: "bg-accent text-accent-foreground",
  pending: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

/** Settlement history and commission summary for a store. */
export function SellerPayouts({ sellerId }: { sellerId: string }) {
  const payouts = useSellerPayouts(sellerId);
  const items = useSellerOrderItems(sellerId);
  const stats = useSellerStats(items.data);

  const rows = payouts.data ?? [];
  const paid = rows.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = rows
    .filter((p) => p.status !== "paid" && p.status !== "failed")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const commission = rows.reduce((sum, p) => sum + Number(p.commission), 0);

  const columns: Column<Payout>[] = [
    {
      key: "period",
      header: "Period",
      sortable: true,
      value: (p) => p.period_start ?? p.created_at,
      cell: (p) => (
        <div>
          <p className="font-medium">
            {p.period_start ? formatDate(p.period_start) : "—"}
            {p.period_end ? ` → ${formatDate(p.period_end)}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">Raised {formatDate(p.created_at)}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", sortable: true, value: (p) => Number(p.amount), cell: (p) => formatPrice(p.amount) },
    {
      key: "commission",
      header: "Commission",
      sortable: true,
      hideOnMobile: true,
      value: (p) => Number(p.commission),
      cell: (p) => formatPrice(p.commission),
    },
    {
      key: "reference",
      header: "Reference",
      hideOnMobile: true,
      value: (p) => p.reference ?? "",
      cell: (p) => <span className="text-xs text-muted-foreground">{p.reference ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (p) => p.status,
      cell: (p) => (
        <Badge className={`rounded-full capitalize ${TONE[p.status] ?? TONE['pending']}`}>{p.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <StatGrid>
        <StatCard
          label="Settled to date"
          value={formatPrice(paid)}
          icon={<Wallet className="size-5" />}
          loading={payouts.isLoading}
        />
        <StatCard
          label="Awaiting settlement"
          value={formatPrice(pending)}
          hint="Released after the delivery window"
          icon={<IndianRupee className="size-5" />}
          loading={payouts.isLoading}
        />
        <StatCard
          label="Platform commission"
          value={formatPrice(commission)}
          hint="Deducted across all payouts"
          loading={payouts.isLoading}
        />
        <StatCard
          label="Gross sales"
          value={formatPrice(stats.revenue)}
          hint={`${stats.orders} orders`}
          loading={items.isLoading}
        />
      </StatGrid>

      <SectionCard title="Payout history" description="Every settlement cycle raised by the BullKart finance team.">
        <DataTable
          rows={rows}
          columns={columns}
          getId={(p) => p.id}
          loading={payouts.isLoading}
          error={payouts.error}
          onRetry={() => payouts.refetch()}
          searchPlaceholder="Search payouts…"
          emptyTitle="No payouts yet"
          emptyDescription="Settlements appear here once your first orders are delivered."
          exportName="payouts"
        />
      </SectionCard>
    </div>
  );
}

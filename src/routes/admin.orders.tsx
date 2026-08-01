import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Truck } from "lucide-react";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminOrders,
  useAssignPartner,
  useDeliveryPartners,
  useOrderItems,
  useRefunds,
  useSetOrderStatus,
  type AdminOrder,
} from "@/features/admin/hooks";
import { formatDate, formatPrice } from "@/lib/format";
import type { Enums, Tables } from "@/integrations/supabase/types";

type ShippingAddress = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES: Enums<"order_status">[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive"> = {
  delivered: "default",
  cancelled: "destructive",
  returned: "destructive",
};

function AdminOrders() {
  return (
    <Tabs defaultValue="orders">
      <TabsList className="rounded-full">
        <TabsTrigger value="orders" className="rounded-full">
          Orders
        </TabsTrigger>
        <TabsTrigger value="refunds" className="rounded-full">
          Refunds
        </TabsTrigger>
      </TabsList>
      <TabsContent value="orders" className="pt-6">
        <OrdersPanel />
      </TabsContent>
      <TabsContent value="refunds" className="pt-6">
        <RefundsPanel />
      </TabsContent>
    </Tabs>
  );
}

function OrdersPanel() {
  const orders = useAdminOrders();
  const partners = useDeliveryPartners();
  const assign = useAssignPartner();
  const setStatus = useSetOrderStatus();
  const [detail, setDetail] = useState<AdminOrder | null>(null);

  const columns: Column<AdminOrder>[] = [
    {
      key: "order",
      header: "Order",
      sortable: true,
      value: (o) => o.order_number,
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{o.order_number}</p>
          <p className="truncate text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Ship to",
      hideOnMobile: true,
      value: (o) => String((o.shipping_address as ShippingAddress | null)?.full_name ?? "—"),
      cell: (o) => {
        const address = o.shipping_address as ShippingAddress | null;
        return (
          <div className="min-w-0">
            <p className="truncate">{address?.full_name ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[address?.city, address?.pincode].filter(Boolean).join(" · ")}
            </p>
          </div>
        );
      },
    },
    { key: "total", header: "Total", sortable: true, value: (o) => Number(o.total), cell: (o) => formatPrice(o.total) },
    {
      key: "payment",
      header: "Payment",
      hideOnMobile: true,
      sortable: true,
      value: (o) => `${o.payment_method} · ${o.payment_status}`,
      cell: (o) => (
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {o.payment_method} · {o.payment_status}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (o) => o.status,
      cell: (o) => (
        <Select
          value={o.status}
          onValueChange={(value) =>
            setStatus.mutate({ _order_id: o.id, _status: value as Enums<"order_status"> })
          }
        >
          <SelectTrigger className="h-8 w-40 rounded-full text-xs" aria-label={`Status for ${o.order_number}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "partner",
      header: "Partner",
      hideOnMobile: true,
      value: (o) => o.delivery_partner_id ?? "",
      cell: (o) => (
        <Select
          value={o.delivery_partner_id ?? ""}
          onValueChange={(value) => assign.mutate({ _order_id: o.id, _partner_user_id: value })}
        >
          <SelectTrigger className="h-8 w-44 rounded-full text-xs" aria-label={`Assign partner for ${o.order_number}`}>
            <SelectValue placeholder="Assign partner" />
          </SelectTrigger>
          <SelectContent>
            {(partners.data ?? []).map((p) => (
              <SelectItem key={p.user_id} value={p.user_id}>
                {p.full_name} {p.is_available ? "" : "(offline)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (o) => (
        <Button variant="ghost" size="icon" aria-label="View order" onClick={() => setDetail(o)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <SectionCard title="Orders" description="Track fulfilment, assign delivery partners and resolve issues.">
      <DataTable
        rows={orders.data}
        columns={columns}
        getId={(o) => o.id}
        loading={orders.isLoading}
        error={orders.error}
        onRetry={orders.refetch}
        searchPlaceholder="Search by order number, city or status…"
        exportName="bullkart-orders"
        emptyTitle="No orders yet"
        pageSize={12}
        bulkActions={[
          {
            label: "Mark packed",
            onSelect: (rows) => rows.forEach((r) => setStatus.mutate({ _order_id: r.id, _status: "packed" })),
          },
          {
            label: "Mark shipped",
            onSelect: (rows) => rows.forEach((r) => setStatus.mutate({ _order_id: r.id, _status: "shipped" })),
          },
        ]}
      />
      <OrderDetailDialog order={detail} onClose={() => setDetail(null)} />
    </SectionCard>
  );
}

function OrderDetailDialog({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const items = useOrderItems(order?.id ?? null);
  const address = (order?.shipping_address ?? null) as ShippingAddress | null;

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{order?.order_number}</DialogTitle>
          <DialogDescription>
            Placed {order ? formatDate(order.created_at) : ""} ·{" "}
            <Badge variant={STATUS_TONE[order?.status ?? ""] ?? "secondary"} className="rounded-full capitalize">
              {order?.status.replace(/_/g, " ")}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {(items.data ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              <span className="min-w-0 truncate">
                {item.emoji} {item.product_name} × {item.quantity}
              </span>
              <span className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-1 rounded-xl bg-muted/50 p-4 text-sm">
          <Row label="Subtotal" value={formatPrice(order?.subtotal ?? 0)} />
          <Row label="Tax" value={formatPrice(order?.tax ?? 0)} />
          <Row label="Delivery" value={formatPrice(order?.delivery_fee ?? 0)} />
          {Number(order?.discount ?? 0) > 0 && <Row label="Discount" value={`− ${formatPrice(order?.discount ?? 0)}`} />}
          {Number(order?.wallet_used ?? 0) > 0 && (
            <Row label="Wallet" value={`− ${formatPrice(order?.wallet_used ?? 0)}`} />
          )}
          <Row label="Total" value={formatPrice(order?.total ?? 0)} strong />
        </dl>

        {address && (
          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Truck className="size-4" /> {address.full_name}
            </p>
            <p className="mt-1 text-muted-foreground">
              {[address.line1, address.line2, address.city, address.state, address.pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-muted-foreground">{address.phone}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-1 font-semibold" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function RefundsPanel() {
  const refunds = useRefunds();

  const columns: Column<Tables<"refunds">>[] = [
    { key: "created", header: "Requested", sortable: true, value: (r) => r.created_at, cell: (r) => formatDate(r.created_at) },
    { key: "amount", header: "Amount", sortable: true, value: (r) => Number(r.amount), cell: (r) => formatPrice(r.amount) },
    { key: "status", header: "Status", sortable: true, value: (r) => r.status },
    { key: "reason", header: "Reason", hideOnMobile: true, value: (r) => r.reason ?? "—" },
  ];

  return (
    <SectionCard title="Refunds" description="Money returned to customers for cancelled or returned orders.">
      <DataTable
        rows={refunds.data}
        columns={columns}
        getId={(r) => r.id}
        loading={refunds.isLoading}
        error={refunds.error}
        onRetry={refunds.refetch}
        searchPlaceholder="Search refunds…"
        exportName="bullkart-refunds"
        emptyTitle="No refunds"
        emptyDescription="Cancelled prepaid orders will appear here."
      />
    </SectionCard>
  );
}

import { useState } from "react";
import { Eye } from "lucide-react";
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
import { useSetOrderStatus } from "@/features/admin/hooks";
import { useSellerOrderItems, type SellerOrderItem } from "@/features/seller/hooks";
import { formatDate, formatPrice } from "@/lib/format";
import type { Enums } from "@/integrations/supabase/types";

type ShippingAddress = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

/** Fulfilment statuses a seller is allowed to drive. */
const SELLER_STATUSES: Enums<"order_status">[] = ["confirmed", "packed", "shipped"];

/** Order lines for one store, with pack-and-ship controls. */
export function SellerOrders({ sellerId, title }: { sellerId: string; title?: string }) {
  const items = useSellerOrderItems(sellerId);
  const setStatus = useSetOrderStatus([["seller", "order-items", sellerId]]);
  const [detail, setDetail] = useState<SellerOrderItem | null>(null);

  const columns: Column<SellerOrderItem>[] = [
    {
      key: "order",
      header: "Order",
      sortable: true,
      value: (i) => i.orders?.order_number ?? "",
      cell: (i) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{i.orders?.order_number}</p>
          <p className="truncate text-xs text-muted-foreground">
            {i.orders ? formatDate(i.orders.created_at) : ""}
          </p>
        </div>
      ),
    },
    {
      key: "item",
      header: "Item",
      sortable: true,
      value: (i) => i.product_name,
      cell: (i) => (
        <span>
          {i.emoji} {i.product_name} × {i.quantity}
        </span>
      ),
    },
    {
      key: "value",
      header: "Line total",
      sortable: true,
      value: (i) => Number(i.price) * i.quantity,
      cell: (i) => formatPrice(Number(i.price) * i.quantity),
    },
    {
      key: "ship",
      header: "Ship to",
      hideOnMobile: true,
      value: (i) => {
        const a = i.orders?.shipping_address as ShippingAddress | null;
        return [a?.['city'], a?.['pincode']].filter(Boolean).join(" · ");
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (i) => i.orders?.status ?? "",
      cell: (i) => (
        <Badge variant={i.orders?.status === "delivered" ? "default" : "secondary"} className="rounded-full capitalize">
          {(i.orders?.status ?? "").replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (i) => (
        <div className="flex items-center justify-end gap-1">
          <Select
            value=""
            onValueChange={(value) =>
              i.orders && setStatus.mutate({ _order_id: i.orders.id, _status: value as Enums<"order_status"> })
            }
          >
            <SelectTrigger className="h-8 w-32 rounded-full text-xs" aria-label="Update fulfilment">
              <SelectValue placeholder="Update" />
            </SelectTrigger>
            <SelectContent>
              {SELLER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  Mark {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" aria-label="View order" onClick={() => setDetail(i)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const address = (detail?.orders?.shipping_address ?? null) as ShippingAddress | null;

  return (
    <SectionCard title={title ?? "Orders"} description="Every line item customers ordered from your store.">
      <DataTable
        rows={items.data}
        columns={columns}
        getId={(i) => i.id}
        loading={items.isLoading}
        error={items.error}
        onRetry={items.refetch}
        searchPlaceholder="Search by order number, item or city…"
        exportName="bullkart-store-orders"
        emptyTitle="No orders yet"
        emptyDescription="Orders containing your products will show up here."
        pageSize={12}
      />

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{detail?.orders?.order_number}</DialogTitle>
            <DialogDescription>
              {detail?.orders ? formatDate(detail.orders.created_at) : ""} ·{" "}
              <span className="capitalize">{(detail?.orders?.status ?? "").replace(/_/g, " ")}</span>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            {detail?.emoji} <span className="font-medium">{detail?.product_name}</span> × {detail?.quantity} ·{" "}
            {formatPrice(Number(detail?.price ?? 0) * (detail?.quantity ?? 0))}
          </p>
          {address && (
            <div className="rounded-xl border border-border p-4 text-sm">
              <p className="font-medium">{address['full_name']}</p>
              <p className="mt-1 text-muted-foreground">
                {[address['line1'], address['line2'], address['city'], address['state'], address['pincode']]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-muted-foreground">{address['phone']}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

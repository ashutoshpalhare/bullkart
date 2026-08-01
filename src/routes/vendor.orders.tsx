import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SellerOrders } from "@/components/dashboard/seller-orders";
import { useMyStore } from "@/features/roles/hooks";

export const Route = createFileRoute("/vendor/orders")({
  component: VendorOrders,
});

function VendorOrders() {
  const store = useMyStore("vendor");
  if (!store.data) return <Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" />;
  return <SellerOrders sellerId={store.data.id} title="Order fulfilment" />;
}

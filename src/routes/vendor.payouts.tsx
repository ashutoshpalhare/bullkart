import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SellerPayouts } from "@/components/dashboard/seller-payouts";
import { useMyStore } from "@/features/roles/hooks";

export const Route = createFileRoute("/vendor/payouts")({
  component: VendorPayouts,
});

function VendorPayouts() {
  const store = useMyStore("vendor");
  if (!store.data) return <Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" />;
  return <SellerPayouts sellerId={store.data.id} />;
}

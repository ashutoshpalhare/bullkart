import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SellerOverview } from "@/components/dashboard/seller-overview";
import { useMyStore } from "@/features/roles/hooks";

export const Route = createFileRoute("/farmer/")({
  component: FarmerOverview,
});

function FarmerOverview() {
  const store = useMyStore("farmer");
  if (!store.data) return <Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" />;
  return <SellerOverview sellerId={store.data.id} kind="farmer" />;
}

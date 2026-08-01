import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { StoreProfile } from "@/components/dashboard/store-profile";
import { useMyStore } from "@/features/roles/hooks";

export const Route = createFileRoute("/vendor/profile")({
  component: VendorProfile,
});

function VendorProfile() {
  const store = useMyStore("vendor");
  if (!store.data) return <Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" />;
  return <StoreProfile store={store.data} kind="vendor" />;
}

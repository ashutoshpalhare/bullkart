import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ProductManager } from "@/components/dashboard/product-manager";
import { useMyStore } from "@/features/roles/hooks";

export const Route = createFileRoute("/vendor/products")({
  component: VendorProducts,
});

function VendorProducts() {
  const store = useMyStore("vendor");
  if (!store.data) return <Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" />;
  return <ProductManager sellerId={store.data.id} kind="vendor" />;
}

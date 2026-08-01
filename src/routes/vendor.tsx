import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BarChart3, Package, ShoppingBag, Store, Wallet } from "lucide-react";
import { DashboardLayout, RoleGate } from "@/components/dashboard/dashboard-layout";
import { StoreGate } from "@/components/dashboard/store-gate";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Workspace — BullKart" },
      {
        name: "description",
        content:
          "Run your BullKart storefront: catalogue, inventory, order fulfilment, payouts and store profile.",
      },
      { property: "og:title", content: "Vendor Workspace — BullKart" },
      { property: "og:description", content: "Catalogue, inventory, orders and payouts for BullKart vendors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VendorLayoutRoute,
});

const NAV = [
  { to: "/vendor", label: "Overview", icon: <BarChart3 className="size-4" /> },
  { to: "/vendor/products", label: "Products", icon: <Package className="size-4" /> },
  { to: "/vendor/orders", label: "Orders", icon: <ShoppingBag className="size-4" /> },
  { to: "/vendor/payouts", label: "Payouts", icon: <Wallet className="size-4" /> },
  { to: "/vendor/profile", label: "Store profile", icon: <Store className="size-4" /> },
];

function VendorLayoutRoute() {
  return (
    <RoleGate allow={["vendor", "admin"]}>
      <DashboardLayout
        role="Vendor"
        title="Vendor workspace"
        subtitle="Catalogue, fulfilment and settlements for your organic storefront."
        nav={NAV}
      >
        <StoreGate type="vendor">{() => <Outlet />}</StoreGate>
      </DashboardLayout>
    </RoleGate>
  );
}

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BarChart3, Leaf, ShoppingBag, Sprout, Tractor } from "lucide-react";
import { DashboardLayout, RoleGate } from "@/components/dashboard/dashboard-layout";
import { StoreGate } from "@/components/dashboard/store-gate";

export const Route = createFileRoute("/farmer")({
  head: () => ({
    meta: [
      { title: "Farmer Workspace — BullKart" },
      {
        name: "description",
        content:
          "Manage your farm profile, produce listings, harvest updates and incoming orders on BullKart.",
      },
      { property: "og:title", content: "Farmer Workspace — BullKart" },
      { property: "og:description", content: "Farm profile, produce, harvest updates and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FarmerLayoutRoute,
});

const NAV = [
  { to: "/farmer", label: "Overview", icon: <BarChart3 className="size-4" /> },
  { to: "/farmer/produce", label: "Produce", icon: <Sprout className="size-4" /> },
  { to: "/farmer/harvests", label: "Harvests", icon: <Leaf className="size-4" /> },
  { to: "/farmer/orders", label: "Orders", icon: <ShoppingBag className="size-4" /> },
  { to: "/farmer/profile", label: "Farm profile", icon: <Tractor className="size-4" /> },
];

function FarmerLayoutRoute() {
  return (
    <RoleGate allow={["farmer", "admin"]}>
      <DashboardLayout
        role="Farmer"
        title="Farmer workspace"
        subtitle="Publish harvests, sell direct and keep buyers close to the soil."
        nav={NAV}
      >
        <StoreGate type="farmer">{() => <Outlet />}</StoreGate>
      </DashboardLayout>
    </RoleGate>
  );
}

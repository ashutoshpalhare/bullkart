import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  LayoutGrid,
  MessageSquareWarning,
  Package,
  Settings,
  Users,
} from "lucide-react";
import { DashboardLayout, RoleGate } from "@/components/dashboard/dashboard-layout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — BullKart" },
      {
        name: "description",
        content:
          "Run the BullKart marketplace: analytics, people, catalogue, orders, marketing and platform settings.",
      },
      { property: "og:title", content: "Admin Console — BullKart" },
      { property: "og:description", content: "Marketplace operations for the BullKart team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayoutRoute,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: <BarChart3 className="size-4" /> },
  { to: "/admin/people", label: "People", icon: <Users className="size-4" /> },
  { to: "/admin/catalog", label: "Catalogue", icon: <LayoutGrid className="size-4" /> },
  { to: "/admin/orders", label: "Orders", icon: <Package className="size-4" /> },
  { to: "/admin/marketing", label: "Marketing", icon: <BookOpen className="size-4" /> },
  { to: "/admin/moderation", label: "Moderation", icon: <MessageSquareWarning className="size-4" /> },
  { to: "/admin/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

function AdminLayoutRoute() {
  return (
    <RoleGate allow={["admin"]}>
      <DashboardLayout
        role="Admin"
        title="Marketplace console"
        subtitle="Everything that keeps BullKart running — people, produce, orders and payouts."
        nav={NAV}
      >
        <Outlet />
      </DashboardLayout>
    </RoleGate>
  );
}

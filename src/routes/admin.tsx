import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console | BullKart" },
      { name: "description", content: "Marketplace control centre — users, catalogue, orders, verification, coupons, reviews and analytics." },
      { property: "og:title", content: "Admin Console | BullKart" },
      { property: "og:description", content: "Marketplace control centre for BullKart operations." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <DashboardShell
      role="Admin"
      title="Admin console"
      subtitle="Operate the marketplace: onboarding, catalogue integrity, disputes and growth."
      stats={[
        { label: "GMV (30d)", value: "₹3.4 Cr", delta: "+24% MoM" },
        { label: "Active users", value: "1,84,220" },
        { label: "Pending verifications", value: "37", delta: "12 farmers · 25 vendors" },
        { label: "Open disputes", value: "9" },
      ]}
      modules={[
        { label: "Dashboard", description: "GMV, AOV, retention and category performance at a glance." },
        { label: "Users", description: "Search, impersonate-safe view, role assignment and suspensions." },
        { label: "Products", description: "Catalogue moderation, certificate checks and takedowns." },
        { label: "Categories", description: "Aisle tree, attributes and merchandising order." },
        { label: "Orders", description: "Full order lifecycle, refunds and delivery escalations." },
        { label: "Coupons", description: "Platform-wide campaigns, budgets and usage caps." },
        { label: "Reviews", description: "Spam detection, verified-purchase gating and takedowns." },
        { label: "Farmer verification", description: "Certificate review workflow with audit trail." },
        { label: "Vendor approval", description: "KYC, GST/FSSAI validation and go-live approvals." },
        { label: "Analytics", description: "Cohorts, funnel, city-level demand and supply gaps." },
        { label: "Settings", description: "Commission slabs, delivery fees, banners and feature flags." },
      ]}
    />
  );
}

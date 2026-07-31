import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Dashboard | BullKart" },
      { name: "description", content: "Manage your BullKart storefront: products, inventory, orders, coupons, payouts and analytics." },
      { property: "og:title", content: "Vendor Dashboard | BullKart" },
      { property: "og:description", content: "Products, inventory, orders, coupons and payouts in one place." },
    ],
  }),
  component: VendorDashboard,
});

function VendorDashboard() {
  return (
    <DashboardShell
      role="Vendor"
      title="Vendor dashboard"
      subtitle="Run your organic storefront — catalogue, fulfilment, promotions and settlements."
      stats={[
        { label: "Revenue (30d)", value: "₹4,82,300", delta: "+18% vs last month" },
        { label: "Orders", value: "1,284", delta: "96% on-time dispatch" },
        { label: "Live SKUs", value: "142" },
        { label: "Next payout", value: "₹1,12,400" },
      ]}
      modules={[
        { label: "Vendor profile", description: "Brand story, GST & FSSAI documents, pickup addresses." },
        { label: "Products", description: "Create listings with variants, images, HSN codes and organic certificates." },
        { label: "Orders", description: "Accept, pack and hand over to delivery partners with SLA tracking." },
        { label: "Inventory", description: "Stock levels per warehouse, low-stock alerts and restock forecasts." },
        { label: "Analytics", description: "Conversion, repeat rate, category share and return reasons." },
        { label: "Coupons", description: "Store-level discounts, BOGO and first-order offers." },
        { label: "Payouts", description: "Settlement cycles, commission breakdown and invoices." },
      ]}
    />
  );
}

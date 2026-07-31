import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Partner Dashboard | BullKart" },
      { name: "description", content: "Assigned orders, route navigation, OTP-verified handover and daily earnings for BullKart delivery partners." },
      { property: "og:title", content: "Delivery Partner Dashboard | BullKart" },
      { property: "og:description", content: "Assigned orders, navigation, OTP handover and earnings." },
    ],
  }),
  component: DeliveryDashboard,
});

function DeliveryDashboard() {
  return (
    <DashboardShell
      role="Delivery partner"
      title="Delivery dashboard"
      subtitle="Pick up, navigate and hand over with OTP verification — earnings update in real time."
      stats={[
        { label: "Today's earnings", value: "₹1,340" },
        { label: "Deliveries today", value: "18", delta: "100% OTP verified" },
        { label: "Active route", value: "Indiranagar" },
        { label: "Rating", value: "4.9★" },
      ]}
      modules={[
        { label: "Assigned orders", description: "Queue of pickups grouped by vendor and delivery cluster." },
        { label: "Navigation", description: "Turn-by-turn routing (Google Maps integration ready)." },
        { label: "Order status", description: "Picked up, in transit, arrived, delivered — synced to the customer." },
        { label: "OTP delivery", description: "Six-digit handover confirmation captured at the doorstep." },
        { label: "Earnings", description: "Per-trip payouts, incentives, surge and weekly settlement." },
      ]}
    />
  );
}

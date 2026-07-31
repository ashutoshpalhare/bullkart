import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/farmer")({
  head: () => ({
    meta: [
      { title: "Farmer Dashboard | BullKart" },
      { name: "description", content: "Manage your farm profile, certifications, harvest updates, produce listings and orders on BullKart." },
      { property: "og:title", content: "Farmer Dashboard | BullKart" },
      { property: "og:description", content: "Farm profile, certification, harvests, listings and orders." },
    ],
  }),
  component: FarmerDashboard,
});

function FarmerDashboard() {
  return (
    <DashboardShell
      role="Farmer"
      title="Farmer dashboard"
      subtitle="Tell your farm story, publish harvests and sell directly to customers with fair payouts."
      stats={[
        { label: "Earnings (30d)", value: "₹1,96,750", delta: "82% of sale value retained" },
        { label: "Orders fulfilled", value: "612" },
        { label: "Active listings", value: "24" },
        { label: "Certification", value: "Verified", delta: "Renews Mar 2027" },
      ]}
      modules={[
        { label: "Farm profile", description: "Land size, crops, soil reports and photo gallery." },
        { label: "Farm story", description: "Long-form story and video shown on every product you list." },
        { label: "Verification", description: "Upload Jaivik Bharat / NPOP certificates for admin approval." },
        { label: "Products", description: "List produce by season with grading, unit price and MOQ." },
        { label: "Harvest updates", description: "Publish sowing, harvest and dispatch milestones to buyers." },
        { label: "Orders", description: "Incoming demand, packing lists and pickup schedules." },
        { label: "Analytics", description: "Demand trends by city, repeat buyers and price realisation." },
      ]}
    />
  );
}

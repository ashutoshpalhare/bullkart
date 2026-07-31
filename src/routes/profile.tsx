import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Bell, Wallet, Gift, Package, Heart, LogOut } from "lucide-react";
import { Section } from "@/components/commerce/section";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile | BullKart" },
      { name: "description", content: "Manage your BullKart addresses, notifications, wallet and referrals." },
      { property: "og:title", content: "My Profile | BullKart" },
      { property: "og:description", content: "Manage addresses, notifications, wallet and referrals." },
    ],
  }),
  component: ProfilePage,
});

const tiles = [
  { icon: Package, label: "Orders", copy: "Track and reorder", to: "/orders" },
  { icon: Heart, label: "Wishlist", copy: "Saved products", to: "/wishlist" },
  { icon: MapPin, label: "Addresses", copy: "Home, work & more" },
  { icon: Bell, label: "Notifications", copy: "Order & offer alerts" },
  { icon: Wallet, label: "Wallet", copy: "Coming soon" },
  { icon: Gift, label: "Referrals", copy: "Coming soon" },
];

function ProfilePage() {
  return (
    <Section>
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-leaf font-display text-2xl font-semibold text-leaf-foreground">
          AR
        </span>
        <div>
          <h1 className="text-3xl">Ananya Rao</h1>
          <p className="text-muted-foreground">ananya@example.com · Bengaluru 560001</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ icon: Icon, label, copy, to }) => {
          const inner = (
            <>
              <span className="grid size-10 place-items-center rounded-xl bg-leaf text-leaf-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{copy}</p>
              </div>
            </>
          );
          const cls =
            "flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift";
          return to ? (
            <Link key={label} to={to as never} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={label} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>

      <Button variant="outline" className="mt-8 rounded-full">
        <LogOut className="size-4" /> Sign out
      </Button>
    </Section>
  );
}

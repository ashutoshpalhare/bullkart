import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Heart, ShoppingCart, User } from "lucide-react";

const tabs = [
  { label: "Home", to: "/", icon: Home },
  { label: "Categories", to: "/categories", icon: LayoutGrid },
  { label: "Wishlist", to: "/wishlist", icon: Heart },
  { label: "Cart", to: "/cart", icon: ShoppingCart },
  { label: "Profile", to: "/profile", icon: User },
] as const;

export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border glass pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map(({ label, to, icon: Icon }) => (
          <li key={label} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

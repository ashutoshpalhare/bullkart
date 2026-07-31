import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All categories", to: "/categories" },
      { label: "Fresh produce", to: "/category/$slug", params: { slug: "fruits-vegetables" } },
      { label: "Dairy", to: "/category/$slug", params: { slug: "dairy" } },
      { label: "Ayurveda", to: "/category/$slug", params: { slug: "ayurveda" } },
    ],
  },
  {
    title: "Sell with us",
    links: [
      { label: "Vendor dashboard", to: "/vendor" },
      { label: "Farmer dashboard", to: "/farmer" },
      { label: "Delivery partner", to: "/delivery" },
      { label: "Admin console", to: "/admin" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/auth" },
      { label: "My orders", to: "/orders" },
      { label: "Wishlist", to: "/wishlist" },
      { label: "Profile", to: "/profile" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div className="max-w-sm">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold">BullKart</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            India's premium organic marketplace. Certified produce, verified farmers and ethical
            brands — delivered with full traceability from farm to doorstep.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">
              {col.title}
            </h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to as never}
                    params={("params" in link ? link.params : undefined) as never}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} BullKart Organic Commerce Pvt. Ltd.</p>
          <p>Jaivik Bharat & India Organic certified sellers only</p>
        </div>
      </div>
    </footer>
  );
}

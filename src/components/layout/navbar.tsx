import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Heart, User, Menu, Leaf, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { categories } from "@/lib/mock-data";

const primaryNav = [
  { label: "Home", to: "/" },
  { label: "Categories", to: "/categories" },
  { label: "Farmers", to: "/farmers" },
  { label: "Orders", to: "/orders" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-20 lg:gap-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-display">Shop organic</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-1 overflow-y-auto px-4 pb-8">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-leaf"
                >
                  <span aria-hidden>{c.emoji}</span>
                  {c.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">BullKart</span>
        </Link>

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted xl:flex"
        >
          <MapPin className="size-4 text-primary" />
          Deliver to <span className="font-semibold text-foreground">560001</span>
        </button>

        <div className="relative ml-auto hidden max-w-xl flex-1 lg:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organic ghee, millets, khadi…"
            className="h-11 rounded-full border-border bg-background pl-11"
            aria-label="Search products"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-1 lg:ml-0 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-primary" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5">
          <Button asChild variant="ghost" size="icon" className="lg:hidden" aria-label="Search">
            <Link to="/search">
              <Search className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist" className="hidden sm:inline-flex">
            <Link to="/wishlist">
              <Heart className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Cart" className="relative">
            <Link to="/cart">
              <ShoppingCart className="size-5" />
              <span className="absolute -right-0.5 -top-0.5 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                3
              </span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Account" className="hidden sm:inline-flex">
            <Link to="/profile">
              <User className="size-5" />
            </Link>
          </Button>
          <Button asChild className="ml-2 hidden rounded-full lg:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

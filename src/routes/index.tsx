import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, Sprout, BadgeCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/commerce/section";
import { CategoryCard } from "@/components/commerce/category-card";
import { ProductCard } from "@/components/commerce/product-card";
import { categories, products, featuredFarmers } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BullKart — Premium Organic Marketplace in India" },
      {
        name: "description",
        content:
          "Shop certified organic groceries, A2 dairy, raw honey, ayurveda, khadi clothing and eco-living products direct from verified Indian farmers and ethical brands.",
      },
      { property: "og:title", content: "BullKart — Premium Organic Marketplace in India" },
      {
        property: "og:description",
        content: "Certified organic products delivered direct from verified farmers and ethical brands.",
      },
    ],
  }),
  component: Home,
});

const trust = [
  { icon: ShieldCheck, title: "Certified organic", copy: "Jaivik Bharat & India Organic verified sellers only." },
  { icon: Sprout, title: "Farm traceable", copy: "Every batch links back to the farm and harvest date." },
  { icon: Truck, title: "Cold-chain delivery", copy: "Same-day in metros, 48 hours pan-India." },
  { icon: BadgeCheck, title: "Fair trade payouts", copy: "Farmers keep up to 82% of every rupee you spend." },
];

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-cream">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <Badge className="rounded-full bg-leaf text-leaf-foreground">
              12,400+ verified farmers & artisans
            </Badge>
            <h1 className="mt-5 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Everything organic,
              <br />
              straight from the source.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Groceries, dairy, ayurveda, handloom, bamboo furniture and eco-living essentials —
              sourced from farms and workshops we've walked through ourselves.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/categories">
                  Start shopping <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/farmers">Meet the farmers</Link>
              </Button>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {[
                ["2,100+", "organic products"],
                ["18 states", "sourcing network"],
                ["4.8★", "average rating"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-semibold">{v}</dt>
                  <dd className="text-xs uppercase tracking-wider text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {products.slice(0, 4).map((p, i) => (
                <div
                  key={p.id}
                  className={`flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft ${
                    i % 2 === 1 ? "translate-y-6" : ""
                  }`}
                >
                  <span className="grid h-24 place-items-center rounded-2xl bg-cream text-5xl" aria-hidden>
                    {p.emoji}
                  </span>
                  <p className="text-sm font-semibold leading-snug">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.seller.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trust.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf text-leaf-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <Section>
        <SectionHeader
          eyebrow="Shop by category"
          title="Fourteen aisles of organic"
          action={{ label: "View all", to: "/categories" }}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {categories.slice(0, 14).map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </Section>

      {/* Bestsellers */}
      <Section className="pt-0">
        <SectionHeader eyebrow="Loved this week" title="Bestsellers" action={{ label: "See all", to: "/search" }} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {/* Farmer stories */}
      <section className="bg-leaf/60">
        <Section>
          <SectionHeader
            eyebrow="Behind your basket"
            title="The farmers you're buying from"
            action={{ label: "All farmers", to: "/farmers" }}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {featuredFarmers.map((f) => (
              <article key={f.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <span className="grid size-14 place-items-center rounded-2xl bg-cream text-3xl" aria-hidden>
                  {f.emoji}
                </span>
                <h3 className="mt-4 text-lg">{f.name}</h3>
                <p className="text-sm text-muted-foreground">{f.location}</p>
                <p className="mt-3 text-sm leading-relaxed">
                  Growing <span className="font-medium">{f.crop}</span> for {f.years} years, certified organic
                  and audited every season.
                </p>
              </article>
            ))}
          </div>
        </Section>
      </section>

      {/* Seller CTA */}
      <Section>
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl">Grow, craft or deliver with BullKart</h2>
              <p className="mt-3 text-muted-foreground">
                Onboard in a day with dedicated dashboards for farmers, vendors and delivery partners —
                inventory, orders, payouts and analytics included.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-6">
                <Link to="/farmer">Farmer dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link to="/vendor">Vendor dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link to="/delivery">Delivery partner</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

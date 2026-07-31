import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Section, SectionHeader } from "@/components/commerce/section";
import { featuredFarmers } from "@/lib/mock-data";

export const Route = createFileRoute("/farmers")({
  head: () => ({
    meta: [
      { title: "Verified Organic Farmers | BullKart" },
      {
        name: "description",
        content: "Meet the certified organic farmers, gaushalas and artisan collectives supplying BullKart across 18 Indian states.",
      },
      { property: "og:title", content: "Verified Organic Farmers | BullKart" },
      { property: "og:description", content: "Meet the certified farmers and collectives behind BullKart." },
    ],
  }),
  component: FarmersPage,
});

function FarmersPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Our network" title="Verified farmers & collectives" />
      <div className="grid gap-4 md:grid-cols-3">
        {featuredFarmers.map((f) => (
          <article key={f.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <span className="grid size-14 place-items-center rounded-2xl bg-leaf text-3xl" aria-hidden>
              {f.emoji}
            </span>
            <h2 className="mt-4 text-lg">
              {f.name} <ShieldCheck className="inline size-4 text-primary" aria-label="Verified" />
            </h2>
            <p className="text-sm text-muted-foreground">{f.location}</p>
            <p className="mt-3 text-sm leading-relaxed">
              {f.crop} · {f.years} years of certified organic cultivation, audited every season with soil and
              residue testing.
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

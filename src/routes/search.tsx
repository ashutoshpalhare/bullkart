import { useEffect, useState } from "react";
import { canonical } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Search as SearchIcon, X } from "lucide-react";
import { Section } from "@/components/commerce/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductBrowser } from "@/components/commerce/product-browser";
import { useSearchHistory } from "@/hooks/use-recent-list";

const searchSchema = z.object({ q: z.string().optional().catch(undefined) });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search Organic Products — BullKart" },
      {
        name: "description",
        content: "Search thousands of certified organic groceries, dairy, ayurveda and eco-living products on BullKart.",
      },
      { property: "og:title", content: "Search Organic Products — BullKart" },
      { property: "og:description", content: "Find the organic products you need on BullKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [canonical("/search")],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q ?? "");
  const history = useSearchHistory();

  useEffect(() => {
    setTerm(q ?? "");
    if (q) history.push(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const submit = (value: string) => {
    const next = value.trim();
    void navigate({ to: "/search", search: next ? { q: next } : {} });
  };

  return (
    <Section>
      <h1 className="text-2xl sm:text-3xl">{q ? `Results for "${q}"` : "Search BullKart"}</h1>

      <form
        className="relative mt-5 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          submit(term);
        }}
        role="search"
      >
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search ghee, millets, khadi, honey…"
          aria-label="Search products"
          className="h-12 rounded-full pl-11 pr-28"
        />
        <Button type="submit" className="absolute right-1.5 top-1.5 h-9 rounded-full px-5">
          Search
        </Button>
      </form>

      {history.items.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Recent</span>
          {history.items.map((h) => (
            <Badge
              key={h}
              variant="secondary"
              className="cursor-pointer gap-1 rounded-full pr-1"
              onClick={() => submit(h)}
            >
              {h}
              <button
                type="button"
                aria-label={`Remove ${h} from recent searches`}
                onClick={(e) => {
                  e.stopPropagation();
                  history.remove(h);
                }}
                className="grid size-4 place-items-center rounded-full hover:bg-muted"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-8">
        <ProductBrowser base={{ search: q }} emptyLabel={q ? `No results for "${q}"` : "Start typing to search"} />
      </div>
    </Section>
  );
}

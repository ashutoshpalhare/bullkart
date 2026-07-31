import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { LayoutGrid, List, SlidersHorizontal, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGridSkeleton } from "@/components/commerce/skeletons";
import { EmptyState, ErrorState } from "@/components/commerce/states";
import { formatPrice } from "@/lib/format";
import { PAGE_SIZE, categoriesQuery, fetchProducts, sellersQuery } from "@/features/catalog/queries";
import type { ProductFilters } from "@/features/catalog/queries";
import type { SortKey } from "@/types/db";

const MAX_PRICE = 5000;

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest first" },
];

export function ProductBrowser({
  base,
  showCategoryFilter = true,
  emptyLabel = "No products match your filters",
}: {
  base: ProductFilters;
  showCategoryFilter?: boolean;
  emptyLabel?: string;
}) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [sellerSlugs, setSellerSlugs] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);

  const categories = useQuery(categoriesQuery());
  const sellers = useQuery(sellersQuery());

  const filters = useMemo<ProductFilters>(
    () => ({
      ...base,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < MAX_PRICE ? priceRange[1] : undefined,
      minRating: minRating || undefined,
      inStockOnly,
      organicOnly,
      categorySlugs: categorySlugs.length ? categorySlugs : undefined,
      sellerSlugs: sellerSlugs.length ? sellerSlugs : undefined,
      sort,
    }),
    [base, priceRange, minRating, inStockOnly, organicOnly, categorySlugs, sellerSlugs, sort],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["products", filters, page],
    queryFn: () => fetchProducts(filters, page),
    placeholderData: keepPreviousData,
  });

  const activeCount =
    (priceRange[0] > 0 || priceRange[1] < MAX_PRICE ? 1 : 0) +
    (minRating ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (organicOnly ? 1 : 0) +
    categorySlugs.length +
    sellerSlugs.length;

  const reset = () => {
    setPriceRange([0, MAX_PRICE]);
    setMinRating(0);
    setInStockOnly(false);
    setOrganicOnly(false);
    setCategorySlugs([]);
    setSellerSlugs([]);
    setPage(0);
  };

  const toggle = (list: string[], value: string, set: (v: string[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setPage(0);
  };

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold">Price range</p>
        <Slider
          value={priceRange}
          min={0}
          max={MAX_PRICE}
          step={50}
          onValueChange={(v) => setPriceRange([v[0] ?? 0, v[1] ?? MAX_PRICE])}
          onValueCommit={() => setPage(0)}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-3 text-sm font-semibold">Customer rating</p>
        <div className="flex flex-wrap gap-2">
          {[4, 3, 2].map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant={minRating === r ? "default" : "outline"}
              className="rounded-full"
              onClick={() => {
                setMinRating(minRating === r ? 0 : r);
                setPage(0);
              }}
            >
              {r}★ & up
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(v) => {
              setInStockOnly(Boolean(v));
              setPage(0);
            }}
          />
          In stock only
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={organicOnly}
            onCheckedChange={(v) => {
              setOrganicOnly(Boolean(v));
              setPage(0);
            }}
          />
          Certified organic
        </label>
      </div>

      {showCategoryFilter && (
        <>
          <Separator />
          <div>
            <p className="mb-3 text-sm font-semibold">Category</p>
            <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
              {(categories.data ?? []).map((c) => (
                <label key={c.id} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={categorySlugs.includes(c.slug)}
                    onCheckedChange={() => toggle(categorySlugs, c.slug, setCategorySlugs)}
                  />
                  <span className="truncate">
                    {c.emoji} {c.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div>
        <p className="mb-3 text-sm font-semibold">Seller</p>
        <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
          {(sellers.data ?? []).map((s) => (
            <label key={s.id} className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={sellerSlugs.includes(s.slug)}
                onCheckedChange={() => toggle(sellerSlugs, s.slug, setSellerSlugs)}
              />
              <span className="truncate">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full rounded-full" onClick={reset}>
        Clear filters
      </Button>
    </div>
  );

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (base.limit ?? PAGE_SIZE)));

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">Filters</p>
            {activeCount > 0 && <Badge variant="secondary">{activeCount}</Badge>}
          </div>
          {filterPanel}
        </div>
      </aside>

      <div>
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {isLoading ? "Loading products…" : `${total} product${total === 1 ? "" : "s"}`}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full lg:hidden">
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeCount > 0 && <Badge variant="secondary">{activeCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-10">{filterPanel}</div>
              </SheetContent>
            </Sheet>

            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as SortKey);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-[168px] rounded-full" aria-label="Sort products">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="hidden rounded-full border border-border p-0.5 sm:flex">
              <Button
                size="icon"
                variant={layout === "grid" ? "secondary" : "ghost"}
                className="size-8 rounded-full"
                aria-label="Grid view"
                onClick={() => setLayout("grid")}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                size="icon"
                variant={layout === "list" ? "secondary" : "ghost"}
                className="size-8 rounded-full"
                aria-label="List view"
                onClick={() => setLayout("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={() => void refetch()} />
        ) : isLoading ? (
          <ProductGridSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="size-7" />}
            title={emptyLabel}
            description="Try widening your price range or clearing a few filters."
            action={{ label: "Browse all categories", to: "/categories" }}
          />
        ) : (
          <div
            className={
              layout === "grid"
                ? "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col gap-4"
            }
            aria-busy={isFetching}
          >
            {rows.map((p) => (
              <ProductCard key={p.id} product={p} layout={layout} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryRow, ProductSummary, ReviewRow, SellerRow, SortKey } from "@/types/db";

export const PRODUCT_SELECT =
  "*, category:categories(id,name,slug,emoji), seller:sellers(id,name,slug,type,location,verified,emoji)";

export const PAGE_SIZE = 12;

export type ProductFilters = {
  categorySlug?: string;
  categorySlugs?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  organicOnly?: boolean;
  sellerSlugs?: string[];
  sort?: SortKey;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  limit?: number;
};

function applySort<T>(q: T, sort: SortKey | undefined): T {
  const b = q as unknown as {
    order: (c: string, o?: { ascending?: boolean }) => unknown;
  };
  switch (sort) {
    case "price-asc":
      return b.order("price", { ascending: true }) as T;
    case "price-desc":
      return b.order("price", { ascending: false }) as T;
    case "rating":
      return b.order("rating", { ascending: false }) as T;
    case "newest":
      return b.order("created_at", { ascending: false }) as T;
    default:
      return b.order("is_featured", { ascending: false }) as T;
  }
}

export async function fetchProducts(filters: ProductFilters, page = 0) {
  const limit = filters.limit ?? PAGE_SIZE;
  let query = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" }).eq("is_active", true);

  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    query = query.eq("category_id", cat?.id ?? "00000000-0000-0000-0000-000000000000");
  }
  if (filters.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.minRating) query = query.gte("rating", filters.minRating);
  if (filters.inStockOnly) query = query.gt("stock_qty", 0);
  if (filters.organicOnly) query = query.eq("is_organic_certified", true);
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.bestSeller) query = query.eq("is_best_seller", true);
  if (filters.newArrival) query = query.eq("is_new_arrival", true);

  query = applySort(query, filters.sort);
  query = query.range(page * limit, page * limit + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  let rows = (data ?? []) as unknown as ProductSummary[];
  if (filters.categorySlugs?.length) {
    rows = rows.filter((p) => filters.categorySlugs!.includes(p.category?.slug ?? ""));
  }
  if (filters.sellerSlugs?.length) {
    rows = rows.filter((p) => filters.sellerSlugs!.includes(p.seller?.slug ?? ""));
  }
  return { rows, count: count ?? rows.length };
}

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<CategoryRow[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const sellersQuery = () =>
  queryOptions({
    queryKey: ["sellers"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SellerRow[]> => {
      const { data, error } = await supabase.from("sellers").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

export const productsQuery = (filters: ProductFilters) =>
  queryOptions({
    queryKey: ["products", filters],
    staleTime: 60_000,
    queryFn: () => fetchProducts(filters, 0),
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<ProductSummary | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ProductSummary) ?? null;
    },
  });

export const relatedProductsQuery = (categoryId: string | null | undefined, excludeId: string) =>
  queryOptions({
    queryKey: ["related", categoryId, excludeId],
    enabled: Boolean(categoryId),
    queryFn: async (): Promise<ProductSummary[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("category_id", categoryId!)
        .neq("id", excludeId)
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as ProductSummary[];
    },
  });

export const productsByIdsQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ["products-by-ids", ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<ProductSummary[]> => {
      const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).in("id", ids);
      if (error) throw error;
      return (data ?? []) as unknown as ProductSummary[];
    },
  });

export const searchSuggestionsQuery = (term: string) =>
  queryOptions({
    queryKey: ["search-suggestions", term],
    enabled: term.trim().length > 1,
    queryFn: async (): Promise<ProductSummary[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .ilike("name", `%${term.trim()}%`)
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as ProductSummary[];
    },
  });

export const reviewsQuery = (productId: string) =>
  queryOptions({
    queryKey: ["reviews", productId],
    queryFn: async (): Promise<ReviewRow[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const couponsQuery = () =>
  queryOptions({
    queryKey: ["coupons"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

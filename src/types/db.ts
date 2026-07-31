import type { Tables } from "@/integrations/supabase/types";

export type CategoryRow = Tables<"categories">;
export type SellerRow = Tables<"sellers">;
export type ProductRow = Tables<"products">;
export type ReviewRow = Tables<"reviews">;
export type AddressRow = Tables<"addresses">;
export type CouponRow = Tables<"coupons">;
export type ProfileRow = Tables<"profiles">;
export type OrderRow = Tables<"orders">;
export type OrderItemRow = Tables<"order_items">;

export type ProductSummary = ProductRow & {
  category: Pick<CategoryRow, "id" | "name" | "slug" | "emoji"> | null;
  seller: Pick<SellerRow, "id" | "name" | "slug" | "type" | "location" | "verified" | "emoji"> | null;
};

export type CartLine = Tables<"cart_items"> & { product: ProductSummary | null };
export type WishlistLine = Tables<"wishlist_items"> & { product: ProductSummary | null };
export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

export type ShippingAddress = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  label?: string;
};

export type SortKey = "relevance" | "price-asc" | "price-desc" | "rating" | "newest";

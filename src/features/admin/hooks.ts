/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notifyError, retryPolicy } from "@/lib/errors";
import { tbl, useCrud, useRows, useRpc } from "@/features/dashboard/db";
import { deleteUserAccount } from "@/lib/admin.functions";
import type { Enums, Tables } from "@/integrations/supabase/types";

export type AdminMetrics = {
  revenue: number;
  revenue_30d: number;
  orders: number;
  pending_orders: number;
  customers: number;
  vendors: number;
  farmers: number;
  products: number;
  low_stock: number;
  pending_verification: number;
  reviews: number;
  daily: { day: string; orders: number; revenue: number }[];
  categories: { name: string; revenue: number; units: number }[];
  top_products: { name: string; units: number; revenue: number }[];
};

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ["admin", "metrics"],
    staleTime: 60_000,
    retry: retryPolicy,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_metrics");
      if (error) throw error;
      return data as AdminMetrics;
    },
  });
}

/* ---------------------------------------------------------------- people */

export type AdminUser = Tables<"profiles"> & { roles: Enums<"app_role">[] };

export function useAdminUsers() {
  const profiles = useRows<Tables<"profiles">>(["admin", "profiles"], () =>
    tbl("profiles").select("*").order("created_at", { ascending: false }),
  );
  const roles = useRows<Tables<"user_roles">>(["admin", "user_roles"], () =>
    tbl("user_roles").select("*"),
  );

  const data = useMemo<AdminUser[]>(() => {
    const byUser = new Map<string, Enums<"app_role">[]>();
    (roles.data ?? []).forEach((r) => {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    });
    return (profiles.data ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
  }, [profiles.data, roles.data]);

  return {
    data,
    isLoading: profiles.isLoading || roles.isLoading,
    error: profiles.error ?? roles.error,
    refetch: () => {
      profiles.refetch();
      roles.refetch();
    },
  };
}

export function useUserAdminActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
  };

  const updateProfile = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await tbl("profiles").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Profile updated");
    },
    onError: (error: unknown) => notifyError(error),
  });

  const setSuspended = useMutation({
    mutationFn: async ({ ids, suspended }: { ids: string[]; suspended: boolean }) => {
      const { error } = await tbl("profiles")
        .update({ is_suspended: suspended, suspended_reason: suspended ? "Suspended by admin" : null })
        .in("id", ids);
      if (error) throw error;
      return { count: ids.length, suspended };
    },
    onSuccess: ({ count, suspended }) => {
      invalidate();
      toast.success(`${count} account${count === 1 ? "" : "s"} ${suspended ? "suspended" : "reinstated"}`);
    },
    onError: (error: unknown) => notifyError(error),
  });

  const toggleRole = useMutation({
    mutationFn: async ({
      userId,
      role,
      grant,
    }: {
      userId: string;
      role: Enums<"app_role">;
      grant: boolean;
    }) => {
      if (grant) {
        const { error } = await tbl("user_roles").insert({ user_id: userId, role });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await tbl("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Roles updated");
    },
    onError: (error: unknown) => notifyError(error),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => deleteUserAccount({ data: { userId } }),
    onSuccess: () => {
      invalidate();
      toast.success("Account deleted");
    },
    onError: (error: unknown) => notifyError(error),
  });

  return { updateProfile, setSuspended, toggleRole, deleteUser };
}

/* --------------------------------------------------------------- sellers */

export type SellerRow = Tables<"sellers">;

export function useSellers(type?: Enums<"seller_type">) {
  return useRows<SellerRow>(["admin", "sellers", type ?? "all"], () => {
    let q = tbl("sellers").select("*").order("created_at", { ascending: false });
    if (type) q = q.eq("type", type);
    return q;
  });
}

export function useSellerCrud() {
  return useCrud("sellers", ["admin", "sellers"], { entity: "Store" });
}

/* -------------------------------------------------------------- catalogue */

export type AdminProduct = Tables<"products"> & {
  categories: { name: string } | null;
  sellers: { name: string; type: Enums<"seller_type"> } | null;
};

export function useAdminProducts() {
  return useRows<AdminProduct>(["admin", "products"], () =>
    tbl("products")
      .select("*, categories(name), sellers(name, type)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );
}

export function useProductCrud(invalidate: unknown[] = ["admin", "products"]) {
  return useCrud("products", invalidate, { entity: "Product" });
}

export function useAdminCategories() {
  return useRows<Tables<"categories">>(["admin", "categories"], () =>
    tbl("categories").select("*").is("deleted_at", null).order("sort_order"),
  );
}

export function useCategoryCrud() {
  return useCrud("categories", ["admin", "categories"], { entity: "Category" });
}

/* ---------------------------------------------------------------- orders */

export type AdminOrder = Tables<"orders">;

export function useAdminOrders() {
  return useRows<AdminOrder>(["admin", "orders"], () =>
    tbl("orders").select("*").order("created_at", { ascending: false }).limit(500),
  );
}

export function useOrderItems(orderId: string | null) {
  return useRows<Tables<"order_items">>(
    ["admin", "order-items", orderId],
    () => tbl("order_items").select("*").eq("order_id", orderId),
    { enabled: Boolean(orderId) },
  );
}

export function useDeliveryPartners() {
  return useRows<Tables<"delivery_partners">>(["admin", "delivery-partners"], () =>
    tbl("delivery_partners").select("*").order("full_name"),
  );
}

export function useAssignPartner() {
  return useRpc<{ _order_id: string; _partner_user_id: string }>(
    "assign_delivery_partner",
    [["admin", "orders"]],
    "Delivery partner assigned",
  );
}

export function useSetOrderStatus(invalidate: unknown[][] = [["admin", "orders"]]) {
  return useRpc<{ _order_id: string; _status: Enums<"order_status">; _note?: string }>(
    "set_order_status",
    invalidate,
    "Order updated",
  );
}

export function useRefunds() {
  return useRows<Tables<"refunds">>(["admin", "refunds"], () =>
    tbl("refunds").select("*").order("created_at", { ascending: false }),
  );
}

/* ------------------------------------------------------------- marketing */

export function useCoupons(sellerId?: string | null) {
  return useRows<Tables<"coupons">>(["admin", "coupons", sellerId ?? "platform"], () => {
    const q = tbl("coupons").select("*").order("created_at", { ascending: false });
    return sellerId ? q.eq("seller_id", sellerId) : q;
  });
}

export function useCouponCrud(invalidate: unknown[] = ["admin", "coupons"]) {
  return useCrud("coupons", invalidate, { entity: "Coupon" });
}

export function useBanners() {
  return useRows<Tables<"banners">>(["admin", "banners"], () =>
    tbl("banners").select("*").order("sort_order"),
  );
}

export function useBannerCrud() {
  return useCrud("banners", ["admin", "banners"], { entity: "Banner" });
}

export function useBlogs() {
  return useRows<Tables<"blogs">>(["admin", "blogs"], () =>
    tbl("blogs").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
  );
}

export function useBlogCrud() {
  return useCrud("blogs", ["admin", "blogs"], { entity: "Post" });
}

export function useBroadcast() {
  return useRpc<{ _title: string; _body?: string; _link?: string; _audience: string }>(
    "broadcast_notification",
    [["notifications"]],
    "Announcement sent",
  );
}

/* ------------------------------------------------------------ moderation */

export type AdminReview = Tables<"reviews"> & { products: { name: string; slug: string } | null };

export function useAdminReviews() {
  return useRows<AdminReview>(["admin", "reviews"], () =>
    tbl("reviews")
      .select("*, products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(500),
  );
}

export function useReviewCrud() {
  return useCrud("reviews", ["admin", "reviews"], { entity: "Review" });
}

/* -------------------------------------------------------------- settings */

export function useAllSettings() {
  return useRows<Tables<"settings">>(["admin", "settings"], () =>
    tbl("settings").select("*").order("key"),
  );
}

export function useSaveSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      value,
      description,
      isPublic,
    }: {
      key: string;
      value: Record<string, unknown>;
      description?: string;
      isPublic?: boolean;
    }) => {
      const { error } = await tbl("settings").upsert(
        {
          key,
          value,
          ...(description !== undefined ? { description } : {}),
          ...(isPublic !== undefined ? { is_public: isPublic } : {}),
        },
        { onConflict: "key" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (error: unknown) => notifyError(error),
  });
}

/* --------------------------------------------------------------- payouts */

export function usePayouts(sellerId?: string | null) {
  return useRows<Tables<"payouts">>(["admin", "payouts", sellerId ?? "all"], () => {
    const q = tbl("payouts").select("*").order("created_at", { ascending: false });
    return sellerId ? q.eq("seller_id", sellerId) : q;
  });
}

export function usePayoutCrud() {
  return useCrud("payouts", ["admin", "payouts"], { entity: "Payout" });
}

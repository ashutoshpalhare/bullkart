/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notifyError } from "@/lib/errors";
import { tbl, useCrud, useRows } from "@/features/dashboard/db";
import type { Tables } from "@/integrations/supabase/types";

export type SellerProduct = Tables<"products"> & { categories: { name: string } | null };
export type SellerOrderItem = Tables<"order_items"> & { orders: Tables<"orders"> | null };

/** Catalogue owned by one store. */
export function useSellerProducts(sellerId: string | null | undefined) {
  return useRows<SellerProduct>(
    ["seller", "products", sellerId],
    () =>
      tbl("products")
        .select("*, categories(name)")
        .eq("seller_id", sellerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    { enabled: Boolean(sellerId) },
  );
}

export function useSellerProductCrud(sellerId: string | null | undefined) {
  return useCrud("products", ["seller", "products", sellerId], { entity: "Product" });
}

export function useProductImages(productId: string | null) {
  return useRows<Tables<"product_images">>(
    ["seller", "product-images", productId],
    () => tbl("product_images").select("*").eq("product_id", productId).order("sort_order"),
    { enabled: Boolean(productId) },
  );
}

export function useProductImageCrud(productId: string | null) {
  return useCrud("product_images", ["seller", "product-images", productId], { entity: "Image" });
}

export function useProductVariants(productId: string | null) {
  return useRows<Tables<"product_variants">>(
    ["seller", "variants", productId],
    () =>
      tbl("product_variants")
        .select("*")
        .eq("product_id", productId)
        .is("deleted_at", null)
        .order("created_at"),
    { enabled: Boolean(productId) },
  );
}

export function useVariantCrud(productId: string | null) {
  return useCrud("product_variants", ["seller", "variants", productId], { entity: "Variant" });
}

/** Manual stock movement through the audited RPC. */
export function useAdjustStock(sellerId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, change, note }: { productId: string; change: number; note?: string }) => {
      const { data, error } = await (supabase.rpc as any)("adjust_stock", {
        _product_id: productId,
        _change: change,
        _note: note ?? null,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (qty) => {
      qc.invalidateQueries({ queryKey: ["seller", "products", sellerId] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(`Stock updated — ${qty} in hand`);
    },
    onError: (error: unknown) => notifyError(error),
  });
}

/** Order lines belonging to this store, with the parent order attached. */
export function useSellerOrderItems(sellerId: string | null | undefined) {
  return useRows<SellerOrderItem>(
    ["seller", "order-items", sellerId],
    () =>
      tbl("order_items")
        .select("*, orders(*)")
        .eq("seller_id", sellerId)
        .order("id", { ascending: false })
        .limit(1000),
    { enabled: Boolean(sellerId) },
  );
}

export type SellerStats = {
  revenue: number;
  revenue30d: number;
  orders: number;
  pending: number;
  customers: number;
  units: number;
  daily: { label: string; value: number }[];
  dailyOrders: { label: string; value: number }[];
  topProducts: { label: string; value: number }[];
};

/** Derives store KPIs and chart series from the order lines. */
export function useSellerStats(items: SellerOrderItem[] | undefined): SellerStats {
  return useMemo(() => {
    const rows = (items ?? []).filter((i) => i.orders && i.orders.status !== "cancelled");
    const cutoff = Date.now() - 30 * 86_400_000;
    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();
    const unitsByProduct = new Map<string, number>();
    const orderIds = new Set<string>();
    const customers = new Set<string>();
    let revenue = 0;
    let revenue30d = 0;
    let units = 0;
    let pending = 0;

    rows.forEach((item) => {
      const order = item.orders!;
      const line = Number(item.price) * item.quantity;
      revenue += line;
      units += item.quantity;
      orderIds.add(order.id);
      customers.add(order.user_id);
      if (["placed", "confirmed", "packed"].includes(order.status)) pending += 1;

      const time = new Date(order.created_at).getTime();
      if (time >= cutoff) {
        revenue30d += line;
        const day = new Date(order.created_at).toISOString().slice(5, 10);
        revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + line);
        ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);
      }
      unitsByProduct.set(item.product_name, (unitsByProduct.get(item.product_name) ?? 0) + item.quantity);
    });

    const series = (map: Map<string, number>) =>
      [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));

    return {
      revenue,
      revenue30d,
      orders: orderIds.size,
      pending,
      customers: customers.size,
      units,
      daily: series(revenueByDay),
      dailyOrders: series(ordersByDay),
      topProducts: [...unitsByProduct.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value })),
    };
  }, [items]);
}

/* ------------------------------------------------------- harvest updates */

export function useHarvestUpdates(sellerId: string | null | undefined) {
  return useRows<Tables<"harvest_updates">>(
    ["seller", "harvests", sellerId],
    () =>
      tbl("harvest_updates")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false }),
    { enabled: Boolean(sellerId) },
  );
}

export function useHarvestCrud(sellerId: string | null | undefined) {
  return useCrud("harvest_updates", ["seller", "harvests", sellerId], { entity: "Update" });
}

/* -------------------------------------------------------- store & payout */

export function useStoreCrud() {
  return useCrud("sellers", ["my-store"], { entity: "Store" });
}

export function useSellerPayouts(sellerId: string | null | undefined) {
  return useRows<Tables<"payouts">>(
    ["seller", "payouts", sellerId],
    () => tbl("payouts").select("*").eq("seller_id", sellerId).order("created_at", { ascending: false }),
    { enabled: Boolean(sellerId) },
  );
}

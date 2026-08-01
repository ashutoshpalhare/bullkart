/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notifyError } from "@/lib/errors";
import { tbl, useRows, useRpc } from "@/features/dashboard/db";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";

export type DeliveryOrder = Tables<"orders">;

/** Orders routed to the signed-in delivery partner. */
export function useMyDeliveries() {
  const { user } = useAuth();
  return useRows<DeliveryOrder>(
    ["delivery", "orders", user?.id],
    () =>
      tbl("orders")
        .select("*")
        .eq("delivery_partner_id", user?.id)
        .order("created_at", { ascending: false }),
    { enabled: Boolean(user) },
  );
}

export function useMyAssignments() {
  const { user } = useAuth();
  return useRows<Tables<"delivery_assignments">>(
    ["delivery", "assignments", user?.id],
    () =>
      tbl("delivery_assignments")
        .select("*")
        .eq("partner_user_id", user?.id)
        .order("assigned_at", { ascending: false }),
    { enabled: Boolean(user) },
  );
}

export function useDeliveryStatus() {
  const { user } = useAuth();
  return useRpc<{ _order_id: string; _status: Tables<"orders">["status"] }>(
    "set_order_status",
    [["delivery", "orders", user?.id], ["delivery", "assignments", user?.id]],
    "Delivery updated",
  );
}

export function useVerifyOtp() {
  const { user } = useAuth();
  return useRpc<{ _order_id: string; _otp: string }>(
    "verify_delivery_otp",
    [["delivery", "orders", user?.id], ["delivery", "assignments", user?.id]],
    "Delivered — OTP verified",
  );
}

/** Availability switch on the partner's own record. */
export function useToggleAvailability() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (available: boolean) => {
      const { error } = await tbl("delivery_partners")
        .update({ is_available: available })
        .eq("user_id", user!.id);
      if (error) throw error;
      return available;
    },
    onSuccess: (available) => {
      qc.invalidateQueries({ queryKey: ["my-delivery-partner", user?.id] });
      toast.success(available ? "You're online for deliveries" : "You're offline");
    },
    onError: (error: unknown) => notifyError(error),
  });
}

/** Creates the partner record the first time someone opens the workspace. */
export function useCreateDeliveryProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { full_name: string; phone: string; vehicle_type?: string; vehicle_number?: string }) => {
      const { error } = await (supabase.from("delivery_partners") as any).insert({
        user_id: user!.id,
        ...values,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-delivery-partner", user?.id] });
      toast.success("Delivery profile created");
    },
    onError: (error: unknown) => notifyError(error),
  });
}

export type DeliveryEarnings = {
  perDelivery: number;
  completed: number;
  today: number;
  week: number;
  total: number;
  daily: { label: string; value: number }[];
};

const FEE_PER_DELIVERY = 45;

/** Delivery fees are settled per completed drop. */
export function useDeliveryEarnings(orders: DeliveryOrder[] | undefined): DeliveryEarnings {
  return useMemo(() => {
    const delivered = (orders ?? []).filter((o) => o.status === "delivered");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = Date.now() - 7 * 86_400_000;
    const byDay = new Map<string, number>();

    let today = 0;
    let week = 0;
    delivered.forEach((order) => {
      const at = new Date(order.delivered_at ?? order.updated_at);
      if (at >= startOfDay) today += FEE_PER_DELIVERY;
      if (at.getTime() >= weekAgo) week += FEE_PER_DELIVERY;
      const day = at.toISOString().slice(5, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + FEE_PER_DELIVERY);
    });

    return {
      perDelivery: FEE_PER_DELIVERY,
      completed: delivered.length,
      today,
      week,
      total: delivered.length * FEE_PER_DELIVERY,
      daily: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([label, value]) => ({ label, value })),
    };
  }, [orders]);
}

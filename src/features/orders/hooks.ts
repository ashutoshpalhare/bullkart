import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { notifyError } from "@/lib/errors";
import type { AddressRow, OrderWithItems, ProfileRow, ShippingAddress } from "@/types/db";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<ProfileRow, "full_name" | "phone" | "avatar_url">>) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null, ...patch })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddresses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["addresses", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<AddressRow[]> => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddAddress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ShippingAddress & { is_default?: boolean }) => {
      if (!user) throw new Error("Not signed in");
      if (input.is_default) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
      }
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          label: input.label ?? "Home",
          full_name: input.full_name,
          phone: input.phone,
          line1: input.line1,
          line2: input.line2 ?? null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          is_default: input.is_default ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderWithItems[];
    },
  });
}

export function useOrder(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["order", id, user?.id],
    enabled: Boolean(user && id),
    queryFn: async (): Promise<OrderWithItems | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as OrderWithItems) ?? null;
    },
  });
}

export type PlaceOrderInput = {
  coupon_code?: string | null;
  payment_method: "cod" | "razorpay";
  delivery_option: string;
  use_wallet?: number;
  shipping_address: ShippingAddress;
};

export type PlacedOrder = {
  order_id: string;
  order_number: string;
  total: number;
  payment_method: string;
  payment_status: string;
};

/**
 * Places an order through the atomic `place_order` RPC. The database re-reads
 * the cart, re-prices every line, re-checks stock, recomputes tax/delivery and
 * revalidates the coupon — the browser only supplies intent.
 */
export function usePlaceOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlaceOrderInput): Promise<PlacedOrder> => {
      if (!user) throw new Error("Please sign in to place an order.");
      const { data, error } = await supabase.rpc("place_order", {
        _address: input.shipping_address as unknown as Record<string, string>,
        ...(input.coupon_code ? { _coupon: input.coupon_code } : {}),
        _delivery_option: input.delivery_option,
        _payment_method: input.payment_method,
        _use_wallet: input.use_wallet ?? 0,
      });
      if (error) throw error;
      return data as unknown as PlacedOrder;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["cart"] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => notifyError(e, "We couldn't place your order."),
  });
}

/**
 * Cancels an order via RPC so stock is restored and any paid amount is
 * credited back to the wallet inside a single transaction.
 */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("cancel_order", {
        _order_id: id,
        ...(reason ? { _reason: reason } : {}),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["order"] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Order cancelled — any amount paid is back in your wallet");
    },
    onError: (e) => notifyError(e, "We couldn't cancel that order."),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const cancelOrder = useCancelOrder();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      cancel_reason,
      return_reason,
    }: {
      id: string;
      status: "cancelled" | "returned";
      cancel_reason?: string;
      return_reason?: string;
    }) => {
      if (status === "cancelled") {
        await cancelOrder.mutateAsync({ id, ...(cancel_reason ? { reason: cancel_reason } : {}) });
        return;
      }
      const { error } = await supabase
        .from("orders")
        .update({
          status: "returned",
          return_reason: return_reason ?? null,
          return_requested_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["order"] });
      if (vars.status === "returned") toast.success("Return requested");
    },
    onError: (e) => notifyError(e),
  });
}


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
  items: {
    product_id: string;
    product_name: string;
    product_slug: string | null;
    emoji: string | null;
    unit: string | null;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  delivery_option: string;
  shipping_address: ShippingAddress;
};

export function usePlaceOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlaceOrderInput) => {
      if (!user) throw new Error("Please sign in to place an order.");
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          subtotal: input.subtotal,
          discount: input.discount,
          delivery_fee: input.delivery_fee,
          total: input.total,
          coupon_code: input.coupon_code,
          payment_method: input.payment_method,
          payment_status: input.payment_method === "cod" ? "pending" : "paid",
          delivery_option: input.delivery_option,
          shipping_address: input.shipping_address as unknown as Record<string, string>,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(input.items.map((item) => ({ ...item, order_id: order.id })));
      if (itemsError) throw itemsError;

      await supabase.from("cart_items").delete().eq("user_id", user.id);
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
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
      const patch: {
        status: "cancelled" | "returned";
        cancel_reason?: string;
        return_reason?: string;
        return_requested_at?: string;
      } = { status };
      if (cancel_reason) patch.cancel_reason = cancel_reason;
      if (return_reason) {
        patch.return_reason = return_reason;
        patch.return_requested_at = new Date().toISOString();
      }
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
      toast.success(vars.status === "cancelled" ? "Order cancelled" : "Return requested");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

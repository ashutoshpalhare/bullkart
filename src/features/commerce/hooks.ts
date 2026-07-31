import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { notifyError, retryPolicy } from "@/lib/errors";
import type { Tables } from "@/integrations/supabase/types";

export type NotificationRow = Tables<"notifications">;

export type CommerceSettings = {
  tax_rate: number;
  delivery_fee: number;
  express_fee: number;
  free_delivery_threshold: number;
  currency: string;
};

export const DEFAULT_SETTINGS: CommerceSettings = {
  tax_rate: 0.05,
  delivery_fee: 49,
  express_fee: 99,
  free_delivery_threshold: 999,
  currency: "INR",
};

/** Store-wide pricing config; cached hard because it changes rarely. */
export function commerceSettingsQuery() {
  return queryOptions({
    queryKey: ["settings", "commerce"],
    staleTime: 10 * 60_000,
    retry: retryPolicy,
    queryFn: async (): Promise<CommerceSettings> => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "commerce")
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULT_SETTINGS, ...((data?.value as Partial<CommerceSettings> | null) ?? {}) };
    },
  });
}

export function useCommerceSettings() {
  return useQuery(commerceSettingsQuery());
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user),
    retry: retryPolicy,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUnreadCount(): number {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.is_read).length;
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      if (!user) throw new Error("Please sign in.");
      const query = supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
      const { error } = ids?.length ? await query.in("id", ids) : await query.eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => notifyError(e),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e) => notifyError(e),
  });
}

export type WalletSummary = { balance: number; transactions: Tables<"wallet_transactions">[] };

export function useWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet", user?.id],
    enabled: Boolean(user),
    retry: retryPolicy,
    queryFn: async (): Promise<WalletSummary> => {
      const [wallet, txns] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", user!.id).maybeSingle(),
        supabase
          .from("wallet_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (wallet.error) throw wallet.error;
      if (txns.error) throw txns.error;
      return { balance: Number(wallet.data?.balance ?? 0), transactions: txns.data ?? [] };
    },
  });
}

export type CouponCheck =
  | { valid: true; coupon_id: string; code: string; discount: number; description: string | null }
  | { valid: false; message: string };

/**
 * Server-side coupon validation — the browser never decides the discount.
 * Checks activity window, minimum order, global + per-user limits and
 * first-order-only rules inside Postgres.
 */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, subtotal }: { code: string; subtotal: number }): Promise<CouponCheck> => {
      const trimmed = code.trim();
      if (trimmed.length < 3 || trimmed.length > 32) {
        return { valid: false, message: "Enter a valid coupon code." };
      }
      const { data, error } = await supabase.rpc("validate_coupon", {
        _code: trimmed,
        _subtotal: subtotal,
      });
      if (error) throw error;
      return data as unknown as CouponCheck;
    },
    onSuccess: (result) => {
      if (result.valid) toast.success(`Coupon ${result.code} applied`);
      else toast.error(result.message);
    },
    onError: (e) => notifyError(e, "We couldn't check that coupon."),
  });
}

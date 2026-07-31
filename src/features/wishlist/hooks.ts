import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PRODUCT_SELECT } from "@/features/catalog/queries";
import type { WishlistLine } from "@/types/db";

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<WishlistLine[]> => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(`*, product:products(${PRODUCT_SELECT})`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WishlistLine[];
    },
  });
}

export function useWishlistIds() {
  const { data } = useWishlist();
  return new Set((data ?? []).map((w) => w.product_id));
}

export function useToggleWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in to save items.");
      const { data: existing } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("product_id", productId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result === "added" ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

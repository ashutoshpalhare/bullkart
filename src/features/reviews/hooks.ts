import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useAddReview(productId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rating: number; title: string; body: string; images: string[] }) => {
      if (!user) throw new Error("Please sign in to write a review.");
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating: input.rating,
        title: input.title || null,
        body: input.body || null,
        images: input.images,
        author_name: (user.user_metadata?.['full_name'] as string) ?? user.email?.split("@")[0] ?? "Shopper",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["product"] });
      toast.success("Thanks for your review!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

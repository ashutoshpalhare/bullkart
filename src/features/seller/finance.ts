import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type SellerFinance = {
  seller_id: string;
  gst_number: string | null;
  payout_account: string | null;
};

const key = (sellerId: string | undefined) => ["seller-finance", sellerId] as const;

/**
 * GST and payout details live in `seller_finance`, which is readable only by the
 * owning seller and admins — they are deliberately absent from the public
 * `sellers` row that shoppers can read.
 */
export function useSellerFinance(sellerId: string | undefined) {
  return useQuery({
    queryKey: key(sellerId),
    enabled: Boolean(sellerId),
    queryFn: async (): Promise<SellerFinance | null> => {
      const { data, error } = await supabase
        .from("seller_finance")
        .select("seller_id, gst_number, payout_account")
        .eq("seller_id", sellerId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveSellerFinance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SellerFinance) => {
      const { error } = await supabase.from("seller_finance").upsert(
        {
          seller_id: values.seller_id,
          gst_number: values.gst_number?.trim() || null,
          payout_account: values.payout_account?.trim() || null,
        },
        { onConflict: "seller_id" },
      );
      if (error) throw error;
      return values;
    },
    onSuccess: (values) => {
      queryClient.invalidateQueries({ queryKey: key(values.seller_id) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

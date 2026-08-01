import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { retryPolicy } from "@/lib/errors";
import type { Enums, Tables } from "@/integrations/supabase/types";

export type AppRole = Enums<"app_role">;
export type SellerRow = Tables<"sellers">;

export function rolesQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["roles", userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    retry: retryPolicy,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
}

/** Roles for the signed-in user, plus convenience predicates. */
export function useRoles() {
  const { user, loading } = useAuth();
  const query = useQuery(rolesQuery(user?.id));
  const roles = query.data ?? [];
  return {
    roles,
    loading: loading || (Boolean(user) && query.isLoading),
    signedIn: Boolean(user),
    has: (role: AppRole) => roles.includes(role),
    hasAny: (wanted: AppRole[]) => wanted.some((r) => roles.includes(r)),
  };
}

/** The store (vendor or farmer) owned by the signed-in user. */
export function useMyStore(type?: "vendor" | "farmer") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-store", user?.id, type ?? "any"],
    enabled: Boolean(user),
    retry: retryPolicy,
    queryFn: async (): Promise<SellerRow | null> => {
      let q = supabase.from("sellers").select("*").eq("owner_id", user!.id).is("deleted_at", null);
      if (type) q = q.eq("type", type);
      const { data, error } = await q.order("created_at").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** The delivery-partner record for the signed-in user. */
export function useMyDeliveryProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-delivery-partner", user?.id],
    enabled: Boolean(user),
    retry: retryPolicy,
    queryFn: async (): Promise<Tables<"delivery_partners"> | null> => {
      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

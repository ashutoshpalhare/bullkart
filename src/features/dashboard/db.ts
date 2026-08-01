/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notifyError, retryPolicy } from "@/lib/errors";

/**
 * Thin, loosely-typed accessor used by the management dashboards. The generated
 * row types stay in place at the call sites; only the query-builder plumbing is
 * relaxed so one generic CRUD helper can serve every admin table.
 */
export function tbl(name: string): any {
  return supabase.from(name as never) as any;
}

export function useRows<T>(
  key: unknown[],
  build: () => any,
  options: { enabled?: boolean; staleTime?: number } = {},
) {
  return useQuery<T[]>({
    queryKey: key,
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 30_000,
    retry: retryPolicy,
    queryFn: async () => {
      const { data, error } = await build();
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

/** Create / update / delete for a single table, with cache invalidation + toasts. */
export function useCrud(table: string, invalidate: unknown[], labels?: { entity?: string }) {
  const qc = useQueryClient();
  const entity = labels?.entity ?? "Record";
  const done = (message: string) => {
    qc.invalidateQueries({ queryKey: invalidate });
    toast.success(message);
  };

  const create = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await tbl(table).insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => done(`${entity} created`),
    onError: (error: unknown) => notifyError(error),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await tbl(table).update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => done(`${entity} updated`),
    onError: (error: unknown) => notifyError(error),
  });

  const remove = useMutation({
    mutationFn: async (ids: string | string[]) => {
      const list = Array.isArray(ids) ? ids : [ids];
      const { error } = await tbl(table).delete().in("id", list);
      if (error) throw error;
      return list.length;
    },
    onSuccess: (count) => done(`${count} ${entity.toLowerCase()}${count === 1 ? "" : "s"} deleted`),
    onError: (error: unknown) => notifyError(error),
  });

  const patchMany = useMutation({
    mutationFn: async ({ ids, values }: { ids: string[]; values: Record<string, unknown> }) => {
      const { error } = await tbl(table).update(values).in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => done(`${count} ${entity.toLowerCase()}${count === 1 ? "" : "s"} updated`),
    onError: (error: unknown) => notifyError(error),
  });

  return { create, update, remove, patchMany };
}

/** Calls a database function and refreshes the given cache keys. */
export function useRpc<TArgs extends Record<string, unknown>>(
  fn: string,
  invalidate: unknown[][],
  successMessage?: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: TArgs) => {
      const { data, error } = await (supabase.rpc as any)(fn, args);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      if (successMessage) toast.success(successMessage);
    },
    onError: (error: unknown) => notifyError(error),
  });
}

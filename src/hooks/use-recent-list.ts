import { useCallback, useEffect, useState } from "react";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Persisted, de-duplicated most-recent-first string list backed by localStorage. */
export function useRecentList(key: string, max = 8) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(read(key));
  }, [key]);

  const push = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setItems((prev) => {
        const next = [trimmed, ...prev.filter((v) => v !== trimmed)].slice(0, max);
        window.localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key, max],
  );

  const remove = useCallback(
    (value: string) => {
      setItems((prev) => {
        const next = prev.filter((v) => v !== value);
        window.localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    window.localStorage.removeItem(key);
    setItems([]);
  }, [key]);

  return { items, push, remove, clear };
}

export const useSearchHistory = () => useRecentList("bk:search-history", 8);
export const useRecentlyViewed = () => useRecentList("bk:recently-viewed", 8);

import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { toAppError } from "@/lib/errors";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  /** Sortable / searchable / exportable primitive for the row. */
  value?: (row: T) => string | number | null | undefined;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
};

export type BulkAction<T> = {
  label: string;
  onSelect: (rows: T[]) => void;
  destructive?: boolean;
};

export function DataTable<T>({
  rows,
  columns,
  getId,
  loading,
  error,
  onRetry,
  searchPlaceholder = "Search…",
  emptyTitle = "Nothing here yet",
  emptyDescription,
  toolbar,
  bulkActions,
  exportName,
  pageSize = 10,
}: {
  rows: T[] | undefined;
  columns: Column<T>[];
  getId: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  bulkActions?: BulkAction<T>[];
  exportName?: string;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const data = rows ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((c) => String(c.value?.(row) ?? "").toLowerCase().includes(q)),
    );
  }, [data, columns, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.value) return filtered;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.value!(a) ?? "";
      const bv = col.value!(b) ?? "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv), "en", { numeric: true }) * factor;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(current * pageSize, current * pageSize + pageSize);
  const selectedRows = data.filter((r) => selected[getId(r)]);

  const allOnPageChecked = pageRows.length > 0 && pageRows.every((r) => selected[getId(r)]);

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-medium">We couldn't load this list</p>
        <p className="mt-1 text-sm text-muted-foreground">{toAppError(error).message}</p>
        {onRetry && (
          <Button variant="outline" className="mt-4 rounded-full" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="rounded-full pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
        {toolbar}
        {exportName && (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() =>
              downloadCsv(
                exportName,
                columns.map((c) => c.header),
                sorted.map((row) => columns.map((c) => c.value?.(row) ?? "")),
              )
            }
          >
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        )}
      </div>

      {bulkActions && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">{selectedRows.length} selected</span>
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.destructive ? "destructive" : "secondary"}
              className="rounded-full"
              onClick={() => {
                action.onSelect(selectedRows);
                setSelected({});
              }}
            >
              {action.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setSelected({})}>
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {bulkActions && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPageChecked}
                    aria-label="Select all rows on this page"
                    onCheckedChange={(checked) =>
                      setSelected((prev) => {
                        const next = { ...prev };
                        pageRows.forEach((r) => {
                          if (checked) next[getId(r)] = true;
                          else delete next[getId(r)];
                        });
                        return next;
                      })
                    }
                  />
                </TableHead>
              )}
              {columns.map((c) => (
                <TableHead key={c.key} className={cn(c.className, c.hideOnMobile && "hidden md:table-cell")}>
                  {c.sortable && c.value ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      onClick={() =>
                        setSort((prev) =>
                          prev?.key === c.key
                            ? { key: c.key, dir: prev.dir === "asc" ? "desc" : "asc" }
                            : { key: c.key, dir: "asc" },
                        )
                      }
                    >
                      {c.header}
                      <ArrowUpDown className="size-3.5 opacity-60" />
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {bulkActions && (
                    <TableCell>
                      <Skeleton className="size-4 rounded" />
                    </TableCell>
                  )}
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn(c.hideOnMobile && "hidden md:table-cell")}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (bulkActions ? 1 : 0)} className="py-14 text-center">
                  <p className="font-medium">{query ? "No matches" : emptyTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {query ? "Try a different search term." : emptyDescription}
                  </p>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              pageRows.map((row) => {
                const id = getId(row);
                return (
                  <TableRow key={id} data-state={selected[id] ? "selected" : undefined}>
                    {bulkActions && (
                      <TableCell>
                        <Checkbox
                          checked={Boolean(selected[id])}
                          aria-label="Select row"
                          onCheckedChange={(checked) =>
                            setSelected((prev) => {
                              const next = { ...prev };
                              if (checked) next[id] = true;
                              else delete next[id];
                              return next;
                            })
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((c) => (
                      <TableCell
                        key={c.key}
                        className={cn(c.className, c.hideOnMobile && "hidden md:table-cell")}
                      >
                        {c.cell ? c.cell(row) : (c.value?.(row) ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {current + 1} of {pageCount} · {sorted.length} rows
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

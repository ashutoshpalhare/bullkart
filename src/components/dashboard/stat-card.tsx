import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  hint,
  icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  tone?: "default" | "warning" | "positive";
}) {
  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-7 w-24" />
          ) : (
            <p className="mt-2 truncate font-display text-2xl font-semibold">{value}</p>
          )}
          {hint && !loading && (
            <p
              className={
                tone === "warning"
                  ? "mt-1 text-xs text-destructive"
                  : tone === "positive"
                    ? "mt-1 text-xs text-primary"
                    : "mt-1 text-xs text-muted-foreground"
              }
            >
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf text-leaf-foreground">
            {icon}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      {icon && (
        <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-leaf text-leaf-foreground">
          {icon}
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button asChild className="mt-6 rounded-full">
          <Link to={action.to as never}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center"
    >
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {message ?? "We couldn't load this right now. Please try again."}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-6 rounded-full" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

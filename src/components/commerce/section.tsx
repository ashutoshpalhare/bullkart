import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-leaf-foreground">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl">{title}</h2>
      </div>
      {action && (
        <Link
          to={action.to as never}
          className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14 ${className}`}>
      {children}
    </section>
  );
}

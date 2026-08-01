import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Loader2, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { useRoles, type AppRole } from "@/features/roles/hooks";
import { cn } from "@/lib/utils";

export type DashboardNavLink = { to: string; label: string; icon?: ReactNode };

/**
 * Client-side role gate for the management area. Data access is still enforced
 * by RLS — this only keeps the wrong workspace from rendering.
 */
export function RoleGate({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { loading, signedIn, hasAny } = useRoles();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Checking your access…</span>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <AccessNotice
        title="Sign in to continue"
        body="This workspace is only available to signed-in team members."
        cta={{ to: "/auth", label: "Sign in" }}
      />
    );
  }

  if (!hasAny(allow)) {
    return (
      <AccessNotice
        title="You don't have access to this workspace"
        body={`This area is limited to ${allow.join(", ")} accounts. Ask an admin to grant you the role.`}
        cta={{ to: "/", label: "Back to shopping" }}
      />
    );
  }

  return <>{children}</>;
}

function AccessNotice({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl sm:text-3xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      <Button asChild className="mt-6 rounded-full">
        <Link to={cta.to as never}>{cta.label}</Link>
      </Button>
    </div>
  );
}

export function DashboardLayout({
  role,
  title,
  subtitle,
  nav,
  actions,
  children,
}: {
  role: string;
  title: string;
  subtitle?: string;
  nav: DashboardNavLink[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();

  return (
    <div className="mx-auto w-full max-w-[110rem] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="rounded-full bg-leaf text-leaf-foreground">{role}</Badge>
          <h1 className="mt-3 text-2xl sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label={`${role} sections`} className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to} className="shrink-0">
                  <Link
                    to={item.to as never}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors lg:rounded-xl",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-56 rounded-full" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

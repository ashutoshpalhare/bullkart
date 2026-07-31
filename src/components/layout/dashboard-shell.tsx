import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DashboardNavItem {
  label: string;
  description: string;
}

export function DashboardShell({
  role,
  title,
  subtitle,
  stats,
  modules,
  children,
}: {
  role: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string; delta?: string }[];
  modules: DashboardNavItem[];
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="rounded-full bg-leaf text-leaf-foreground">{role}</Badge>
        <Badge variant="outline" className="rounded-full">
          Preview — connects to live data once Cloud is enabled
        </Badge>
      </div>
      <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-border shadow-soft">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">{s.value}</p>
              {s.delta && <p className="mt-1 text-xs text-primary">{s.delta}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Card key={m.label} className="rounded-2xl border-border shadow-soft transition-shadow hover:shadow-lift">
            <CardHeader>
              <CardTitle className="text-base">{m.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">{m.description}</CardContent>
          </Card>
        ))}
      </div>

      {children}

      <p className="mt-10 text-sm text-muted-foreground">
        Not your workspace?{" "}
        <Link to="/auth" className="font-medium text-primary hover:underline">
          Switch role
        </Link>
      </p>
    </div>
  );
}

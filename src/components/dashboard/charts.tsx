import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PALETTE = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-leaf-foreground)",
  "var(--color-muted-foreground)",
  "var(--color-ring)",
];

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    color: "var(--color-card-foreground)",
    fontSize: 12,
  },
} as const;

export function ChartCard({
  title,
  description,
  loading,
  empty,
  children,
  action,
}: {
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="h-[260px] pt-0">
        {loading ? (
          <Skeleton className="size-full rounded-xl" />
        ) : empty ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No data for this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as never}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function RevenueAreaChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="label" {...axisProps} />
      <YAxis {...axisProps} width={56} />
      <Tooltip {...tooltipStyle} />
      <Area
        type="monotone"
        dataKey="value"
        stroke="var(--color-primary)"
        strokeWidth={2}
        fill="url(#revFill)"
        name="Revenue"
      />
    </AreaChart>
  );
}

export function OrdersBarChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="label" {...axisProps} />
      <YAxis {...axisProps} allowDecimals={false} width={40} />
      <Tooltip {...tooltipStyle} />
      <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Orders" />
    </BarChart>
  );
}

export function TrendLineChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="label" {...axisProps} />
      <YAxis {...axisProps} width={56} />
      <Tooltip {...tooltipStyle} />
      <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
    </LineChart>
  );
}

export function CategoryPieChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <PieChart>
      <Tooltip {...tooltipStyle} />
      <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={95} paddingAngle={2}>
        {data.map((entry, i) => (
          <Cell key={entry.label} fill={PALETTE[i % PALETTE.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}

export function HorizontalBarChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
      <XAxis type="number" {...axisProps} allowDecimals={false} />
      <YAxis type="category" dataKey="label" {...axisProps} width={110} />
      <Tooltip {...tooltipStyle} />
      <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} name="Units" />
    </BarChart>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, CheckCircle2, IndianRupee, MapPin, Navigation, Package, ShieldCheck } from "lucide-react";
import { ChartCard, RevenueAreaChart } from "@/components/dashboard/charts";
import { DashboardLayout, RoleGate, SectionCard } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FormField } from "@/components/dashboard/form-field";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useDeliveryEarnings,
  useDeliveryStatus,
  useMyDeliveries,
  useToggleAvailability,
  useVerifyOtp,
  useCreateDeliveryProfile,
  type DeliveryOrder,
} from "@/features/delivery/hooks";
import { useMyDeliveryProfile } from "@/features/roles/hooks";
import { formatDate, formatPrice } from "@/lib/format";
import type { Enums } from "@/integrations/supabase/types";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Workspace — BullKart" },
      {
        name: "description",
        content:
          "Assigned pickups, route details, OTP-verified handover and daily earnings for BullKart delivery partners.",
      },
      { property: "og:title", content: "Delivery Workspace — BullKart" },
      { property: "og:description", content: "Assigned orders, OTP handover and earnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeliveryRoute,
});

const NAV = [{ to: "/delivery", label: "Today", icon: <Bike className="size-4" /> }];

const RIDER_STATUSES: Enums<"order_status">[] = ["shipped", "out_for_delivery"];

type Address = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

function address(order: DeliveryOrder): Address {
  return (order.shipping_address ?? {}) as Address;
}

function addressLine(a: Address) {
  return [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ");
}

function DeliveryRoute() {
  return (
    <RoleGate allow={["delivery", "admin"]}>
      <DashboardLayout
        role="Delivery partner"
        title="Delivery workspace"
        subtitle="Pick up, navigate and hand over with OTP verification — earnings update in real time."
        nav={NAV}
      >
        <DeliveryWorkspace />
      </DashboardLayout>
    </RoleGate>
  );
}

function DeliveryWorkspace() {
  const profile = useMyDeliveryProfile();
  const orders = useMyDeliveries();
  const earnings = useDeliveryEarnings(orders.data);
  const setStatus = useDeliveryStatus();
  const verifyOtp = useVerifyOtp();
  const toggleAvailability = useToggleAvailability();

  const [otpFor, setOtpFor] = useState<DeliveryOrder | null>(null);
  const [otp, setOtp] = useState("");

  const rows = orders.data ?? [];
  const active = useMemo(
    () => rows.filter((o) => !["delivered", "cancelled", "returned"].includes(o.status)),
    [rows],
  );

  if (profile.isLoading) return null;
  if (!profile.data) return <PartnerOnboarding />;

  const columns: Column<DeliveryOrder>[] = [
    {
      key: "order",
      header: "Order",
      sortable: true,
      value: (o) => o.order_number,
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{o.order_number}</p>
          <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Drop",
      value: (o) => `${address(o).full_name ?? ""} ${addressLine(address(o))}`,
      cell: (o) => {
        const a = address(o);
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{a.full_name ?? "Customer"}</p>
            <p className="truncate text-xs text-muted-foreground">{addressLine(a) || "—"}</p>
          </div>
        );
      },
    },
    {
      key: "total",
      header: "Collect",
      sortable: true,
      hideOnMobile: true,
      value: (o) => Number(o.total),
      cell: (o) => (
        <div>
          <p className="font-medium">{o.payment_status === "paid" ? "Prepaid" : formatPrice(o.total)}</p>
          <p className="text-xs uppercase text-muted-foreground">{o.payment_method}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (o) => o.status,
      cell: (o) =>
        o.status === "delivered" ? (
          <Badge className="rounded-full bg-leaf text-leaf-foreground">Delivered</Badge>
        ) : (
          <Select
            value={o.status}
            onValueChange={(value) =>
              setStatus.mutate({ _order_id: o.id, _status: value as Enums<"order_status"> })
            }
          >
            <SelectTrigger className="h-9 w-[168px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={o.status} disabled className="capitalize">
                {o.status.replace(/_/g, " ")}
              </SelectItem>
              {RIDER_STATUSES.filter((s) => s !== o.status).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (o) => {
        const a = address(o);
        const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine(a))}`;
        return (
          <div className="flex justify-end gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Navigate to drop">
              <a href={maps} target="_blank" rel="noreferrer">
                <Navigation className="size-4" />
              </a>
            </Button>
            {o.status !== "delivered" && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setOtpFor(o);
                  setOtp("");
                }}
              >
                <ShieldCheck className="mr-1 size-4" /> OTP
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl shadow-soft">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-lg font-semibold">{profile.data.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {profile.data.vehicle_type ?? "Vehicle not set"}
              {profile.data.vehicle_number ? ` · ${profile.data.vehicle_number}` : ""} ·{" "}
              {profile.data.rating}★
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {profile.data.is_available ? "Online" : "Offline"}
            </span>
            <Switch
              checked={profile.data.is_available}
              onCheckedChange={(v) => toggleAvailability.mutate(v)}
              aria-label="Toggle availability"
            />
          </div>
        </CardContent>
      </Card>

      <StatGrid>
        <StatCard
          label="Today's earnings"
          value={formatPrice(earnings.today)}
          hint={`${formatPrice(earnings.perDelivery)} per drop`}
          icon={<IndianRupee className="size-5" />}
          loading={orders.isLoading}
        />
        <StatCard
          label="This week"
          value={formatPrice(earnings.week)}
          hint={`${formatPrice(earnings.total)} lifetime`}
          loading={orders.isLoading}
        />
        <StatCard
          label="Active runs"
          value={active.length}
          hint="Assigned and not yet delivered"
          icon={<Package className="size-5" />}
          loading={orders.isLoading}
        />
        <StatCard
          label="Completed drops"
          value={earnings.completed}
          hint="OTP verified"
          tone="positive"
          icon={<CheckCircle2 className="size-5" />}
          loading={orders.isLoading}
        />
      </StatGrid>

      <SectionCard title="Assigned orders" description="Everything routed to you, newest first.">
        <DataTable
          rows={rows}
          columns={columns}
          getId={(o) => o.id}
          loading={orders.isLoading}
          error={orders.error}
          onRetry={() => orders.refetch()}
          searchPlaceholder="Search by order or address…"
          emptyTitle="No deliveries assigned yet"
          emptyDescription="Go online and an admin will route the next order to you."
          exportName="my-deliveries"
        />
      </SectionCard>

      <ChartCard
        title="Earnings trend"
        description="Settled per completed drop"
        loading={orders.isLoading}
        empty={earnings.daily.length === 0}
      >
        <RevenueAreaChart data={earnings.daily} />
      </ChartCard>

      <Dialog open={Boolean(otpFor)} onOpenChange={(open) => !open && setOtpFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm handover</DialogTitle>
            <DialogDescription>
              Ask the customer for their six-digit code to complete {otpFor?.order_number}.
            </DialogDescription>
          </DialogHeader>

          {otpFor && (
            <div className="rounded-xl border border-border p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <MapPin className="size-4 text-primary" /> {address(otpFor).full_name}
              </p>
              <p className="mt-1 text-muted-foreground">{addressLine(address(otpFor))}</p>
              {address(otpFor).phone && (
                <a className="mt-2 inline-block text-primary" href={`tel:${address(otpFor).phone}`}>
                  {address(otpFor).phone}
                </a>
              )}
            </div>
          )}

          <FormField label="Delivery OTP">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="text-center text-lg tracking-[0.4em]"
            />
          </FormField>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOtpFor(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={otp.length !== 6 || verifyOtp.isPending}
              onClick={() =>
                otpFor &&
                verifyOtp.mutate(
                  { _order_id: otpFor.id, _otp: otp },
                  { onSuccess: () => setOtpFor(null) },
                )
              }
            >
              {verifyOtp.isPending ? "Verifying…" : "Mark delivered"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PartnerOnboarding() {
  const create = useCreateDeliveryProfile();
  const [form, setForm] = useState({ full_name: "", phone: "", vehicle_type: "", vehicle_number: "" });

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-leaf text-leaf-foreground">
          <Bike className="size-5" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold">Create your rider profile</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          We need your contact and vehicle details before orders can be routed to you.
        </p>

        <form
          className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate({
              full_name: form.full_name.trim(),
              phone: form.phone.trim(),
              vehicle_type: form.vehicle_type.trim() || undefined,
              vehicle_number: form.vehicle_number.trim() || undefined,
            });
          }}
        >
          <FormField label="Full name">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Vehicle type">
            <Input
              value={form.vehicle_type}
              onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
              placeholder="Two wheeler"
            />
          </FormField>
          <FormField label="Vehicle number">
            <Input
              value={form.vehicle_number}
              onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
              placeholder="KA 01 AB 1234"
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-full" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Start delivering"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

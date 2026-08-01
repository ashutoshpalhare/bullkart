import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, CheckCircle2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FormField } from "@/components/dashboard/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminUsers,
  useSellerCrud,
  useSellers,
  useUserAdminActions,
  type AdminUser,
  type SellerRow,
} from "@/features/admin/hooks";
import { formatDate } from "@/lib/format";
import type { Enums } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/people")({
  component: AdminPeople,
});

const ROLES: Enums<"app_role">[] = ["customer", "vendor", "farmer", "delivery", "admin"];

function AdminPeople() {
  return (
    <Tabs defaultValue="users">
      <TabsList className="rounded-full">
        <TabsTrigger value="users" className="rounded-full">
          Users
        </TabsTrigger>
        <TabsTrigger value="vendors" className="rounded-full">
          Vendors
        </TabsTrigger>
        <TabsTrigger value="farmers" className="rounded-full">
          Farmers
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="pt-6">
        <UsersPanel />
      </TabsContent>
      <TabsContent value="vendors" className="pt-6">
        <SellersPanel type="vendor" />
      </TabsContent>
      <TabsContent value="farmers" className="pt-6">
        <SellersPanel type="farmer" />
      </TabsContent>
    </Tabs>
  );
}

function UsersPanel() {
  const users = useAdminUsers();
  const actions = useUserAdminActions();
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Member",
      sortable: true,
      value: (u) => u.full_name ?? u.email ?? "",
      cell: (u) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{u.full_name ?? "Unnamed"}</p>
          <p className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", hideOnMobile: true, value: (u) => u.phone ?? "—" },
    {
      key: "roles",
      header: "Roles",
      value: (u) => u.roles.join(", "),
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 && <span className="text-xs text-muted-foreground">customer</span>}
          {u.roles.map((r) => (
            <Badge key={r} variant="secondary" className="rounded-full capitalize">
              {r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (u) => ((u as never as { is_suspended?: boolean }).is_suspended ? "Suspended" : "Active"),
      cell: (u) =>
        (u as never as { is_suspended?: boolean }).is_suspended ? (
          <Badge variant="destructive" className="rounded-full">
            Suspended
          </Badge>
        ) : (
          <Badge className="rounded-full">Active</Badge>
        ),
    },
    { key: "joined", header: "Joined", hideOnMobile: true, sortable: true, value: (u) => u.created_at, cell: (u) => formatDate(u.created_at) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Manage roles" onClick={() => setEditing(u)}>
            <ShieldCheck className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete account">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
            title={`Delete ${u.full_name ?? u.email}?`}
            description="The account and its sign-in credentials are permanently removed."
            confirmLabel="Delete account"
            destructive
            onConfirm={() => actions.deleteUser.mutateAsync(u.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <SectionCard title="Users" description="Every registered account, their roles and standing.">
      <DataTable
        rows={users.data}
        columns={columns}
        getId={(u) => u.id}
        loading={users.isLoading}
        error={users.error}
        onRetry={users.refetch}
        searchPlaceholder="Search by name, email or role…"
        exportName="bullkart-users"
        emptyTitle="No accounts yet"
        bulkActions={[
          {
            label: "Suspend",
            destructive: true,
            onSelect: (rows) => actions.setSuspended.mutate({ ids: rows.map((r) => r.id), suspended: true }),
          },
          {
            label: "Reinstate",
            onSelect: (rows) => actions.setSuspended.mutate({ ids: rows.map((r) => r.id), suspended: false }),
          },
        ]}
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.full_name ?? editing?.email}</DialogTitle>
            <DialogDescription>Grant or revoke workspace access for this account.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {ROLES.map((role) => {
              const granted = editing?.roles.includes(role) ?? false;
              return (
                <li key={role} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm font-medium capitalize">{role}</span>
                  <Switch
                    checked={granted}
                    aria-label={`${granted ? "Revoke" : "Grant"} ${role}`}
                    onCheckedChange={(checked) => {
                      if (!editing) return;
                      actions.toggleRole.mutate({ userId: editing.id, role, grant: checked });
                      setEditing({
                        ...editing,
                        roles: checked ? [...editing.roles, role] : editing.roles.filter((r) => r !== role),
                      });
                    }}
                  />
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button className="rounded-full" onClick={() => setEditing(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

type SellerForm = {
  name: string;
  slug: string;
  location: string;
  emoji: string;
  story: string;
  years_active: string;
  verified: boolean;
  is_active: boolean;
  gst_number: string;
  payout_account: string;
};

const EMPTY_SELLER: SellerForm = {
  name: "",
  slug: "",
  location: "",
  emoji: "🌾",
  story: "",
  years_active: "",
  verified: false,
  is_active: true,
  gst_number: "",
  payout_account: "",
};

function SellersPanel({ type }: { type: "vendor" | "farmer" }) {
  const sellers = useSellers(type);
  const crud = useSellerCrud();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SellerRow | null>(null);
  const [form, setForm] = useState<SellerForm>(EMPTY_SELLER);

  const openEdit = (row: SellerRow | null) => {
    setEditing(row);
    setForm(
      row
        ? {
            name: row.name,
            slug: row.slug,
            location: row.location ?? "",
            emoji: row.emoji ?? "🌾",
            story: row.story ?? "",
            years_active: row.years_active ? String(row.years_active) : "",
            verified: row.verified,
            is_active: row.is_active,
            gst_number: row.gst_number ?? "",
            payout_account: row.payout_account ?? "",
          }
        : EMPTY_SELLER,
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = {
      type,
      name: form.name.trim(),
      slug:
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      location: form.location.trim() || null,
      emoji: form.emoji || "🌾",
      story: form.story.trim() || null,
      years_active: form.years_active ? Number(form.years_active) : null,
      verified: form.verified,
      is_active: form.is_active,
      gst_number: form.gst_number.trim() || null,
      payout_account: form.payout_account.trim() || null,
    };
    if (editing) await crud.update.mutateAsync({ id: editing.id, values });
    else await crud.create.mutateAsync(values);
    setOpen(false);
  };

  const label = type === "vendor" ? "Vendor" : "Farmer";

  const columns: Column<SellerRow>[] = [
    {
      key: "name",
      header: label,
      sortable: true,
      value: (s) => s.name,
      cell: (s) => (
        <div className="flex items-center gap-2">
          <span aria-hidden>{s.emoji ?? "🌾"}</span>
          <div className="min-w-0">
            <p className="truncate font-medium">{s.name}</p>
            <p className="truncate text-xs text-muted-foreground">{s.location ?? "Location not set"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "verified",
      header: "Verification",
      sortable: true,
      value: (s) => (s.verified ? "Verified" : "Pending"),
      cell: (s) => (
        <Badge variant={s.verified ? "default" : "secondary"} className="rounded-full">
          {s.verified ? "Verified" : "Pending"}
        </Badge>
      ),
    },
    { key: "gst", header: "GST", hideOnMobile: true, value: (s) => s.gst_number ?? "—" },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (s) => (s.is_active ? "Active" : "Paused"),
      cell: (s) => (s.is_active ? "Active" : "Paused"),
    },
    { key: "joined", header: "Joined", hideOnMobile: true, sortable: true, value: (s) => s.created_at, cell: (s) => formatDate(s.created_at) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={s.verified ? "Revoke verification" : "Verify store"}
            onClick={() => crud.update.mutate({ id: s.id, values: { verified: !s.verified } })}
          >
            {s.verified ? <Ban className="size-4" /> : <CheckCircle2 className="size-4 text-primary" />}
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => openEdit(s)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      title={`${label}s`}
      description={
        type === "vendor"
          ? "Brands and shops selling on BullKart."
          : "Farms and growers supplying fresh produce."
      }
    >
      <DataTable
        rows={sellers.data}
        columns={columns}
        getId={(s) => s.id}
        loading={sellers.isLoading}
        error={sellers.error}
        onRetry={sellers.refetch}
        searchPlaceholder={`Search ${label.toLowerCase()}s…`}
        exportName={`bullkart-${type}s`}
        emptyTitle={`No ${label.toLowerCase()}s yet`}
        toolbar={
          <Button className="rounded-full" onClick={() => openEdit(null)}>
            <Plus className="mr-2 size-4" /> New {label.toLowerCase()}
          </Button>
        }
        bulkActions={[
          { label: "Verify", onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { verified: true } }) },
          {
            label: "Pause",
            destructive: true,
            onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_active: false } }),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : `New ${label.toLowerCase()}`}</DialogTitle>
            <DialogDescription>Store profile shown on the storefront and used for payouts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </FormField>
            <FormField label="Slug">
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </FormField>
            <FormField label="Location">
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </FormField>
            <FormField label="Emoji">
              <Input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
            </FormField>
            <FormField label="Years active">
              <Input
                type="number"
                value={form.years_active}
                onChange={(e) => setForm((f) => ({ ...f, years_active: e.target.value }))}
              />
            </FormField>
            <FormField label="GST number">
              <Input value={form.gst_number} onChange={(e) => setForm((f) => ({ ...f, gst_number: e.target.value }))} />
            </FormField>
            <FormField label="Payout account">
              <Input
                value={form.payout_account}
                onChange={(e) => setForm((f) => ({ ...f, payout_account: e.target.value }))}
              />
            </FormField>
            <FormField label="Story" className="sm:col-span-2">
              <Textarea rows={4} value={form.story} onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))} />
            </FormField>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={form.verified} onCheckedChange={(c) => setForm((f) => ({ ...f, verified: c }))} />
              Verified store
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
              Active on the storefront
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={!form.name.trim()} onClick={submit}>
              {editing ? "Save changes" : `Create ${label.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

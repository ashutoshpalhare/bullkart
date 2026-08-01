import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useMyStore } from "@/features/roles/hooks";
import { useHarvestCrud, useHarvestUpdates, useSellerProducts } from "@/features/seller/hooks";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/farmer/harvests")({
  component: FarmerHarvestsRoute,
});

type Harvest = Tables<"harvest_updates">;

const STAGES = ["sowing", "growing", "harvest", "packing", "dispatch"] as const;

type FormState = {
  title: string;
  body: string;
  stage: string;
  harvest_date: string;
  image_url: string;
  product_id: string;
  is_published: boolean;
};

const EMPTY: FormState = {
  title: "",
  body: "",
  stage: "harvest",
  harvest_date: "",
  image_url: "",
  product_id: "none",
  is_published: true,
};

function FarmerHarvestsRoute() {
  const store = useMyStore("farmer");
  if (!store.data) return <Loader2 className="mx-auto my-16 size-6 animate-spin text-muted-foreground" />;
  return <Harvests sellerId={store.data.id} />;
}

function Harvests({ sellerId }: { sellerId: string }) {
  const { user } = useAuth();
  const updates = useHarvestUpdates(sellerId);
  const crud = useHarvestCrud(sellerId);
  const products = useSellerProducts(sellerId);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Harvest | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const startEdit = (row: Harvest) => {
    setEditing(row);
    setForm({
      title: row.title,
      body: row.body ?? "",
      stage: row.stage,
      harvest_date: row.harvest_date ?? "",
      image_url: row.image_url ?? "",
      product_id: row.product_id ?? "none",
      is_published: row.is_published,
    });
    setOpen(true);
  };

  const submit = () => {
    const values = {
      seller_id: sellerId,
      title: form.title.trim(),
      body: form.body.trim() || null,
      stage: form.stage,
      harvest_date: form.harvest_date || null,
      image_url: form.image_url.trim() || null,
      product_id: form.product_id === "none" ? null : form.product_id,
      is_published: form.is_published,
      created_by: user?.id ?? null,
    };
    if (editing) {
      crud.update.mutate({ id: editing.id, values }, { onSuccess: () => setOpen(false) });
    } else {
      crud.create.mutate(values, { onSuccess: () => setOpen(false) });
    }
  };

  const columns: Column<Harvest>[] = [
    {
      key: "title",
      header: "Update",
      sortable: true,
      value: (r) => r.title,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.title}</p>
          <p className="truncate text-xs text-muted-foreground">{r.body ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      value: (r) => r.stage,
      cell: (r) => (
        <Badge variant="outline" className="rounded-full capitalize">
          {r.stage}
        </Badge>
      ),
    },
    {
      key: "harvest_date",
      header: "Harvest date",
      sortable: true,
      hideOnMobile: true,
      value: (r) => r.harvest_date ?? "",
      cell: (r) => (r.harvest_date ? formatDate(r.harvest_date) : "—"),
    },
    {
      key: "published",
      header: "Visible",
      sortable: true,
      value: (r) => (r.is_published ? "Published" : "Draft"),
      cell: (r) => (
        <Switch
          checked={r.is_published}
          onCheckedChange={(v) => crud.update.mutate({ id: r.id, values: { is_published: v } })}
          aria-label="Toggle published"
        />
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit update" onClick={() => startEdit(r)}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete update">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
            title="Delete this update?"
            description="Buyers following this crop will no longer see it."
            confirmLabel="Delete"
            destructive
            onConfirm={() => crud.remove.mutateAsync(r.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      title="Harvest updates"
      description="Share sowing, harvest and dispatch milestones with the people buying your produce."
      actions={
        <Button className="rounded-full" onClick={startCreate}>
          <Plus className="mr-1 size-4" /> New update
        </Button>
      }
    >
      <DataTable
        rows={updates.data}
        columns={columns}
        getId={(r) => r.id}
        loading={updates.isLoading}
        error={updates.error}
        onRetry={() => updates.refetch()}
        searchPlaceholder="Search updates…"
        emptyTitle="No harvest updates yet"
        emptyDescription="Post your first milestone — buyers love following the crop."
        exportName="harvest-updates"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit update" : "New harvest update"}</DialogTitle>
            <DialogDescription>Keep it short and specific — one milestone per post.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Alphonso harvest begins"
              />
            </FormField>
            <FormField label="Story" className="sm:col-span-2">
              <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={4} />
            </FormField>
            <FormField label="Stage">
              <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage} className="capitalize">
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Harvest date">
              <Input
                type="date"
                value={form.harvest_date}
                onChange={(e) => set("harvest_date", e.target.value)}
              />
            </FormField>
            <FormField label="Linked produce" className="sm:col-span-2">
              <Select value={form.product_id} onValueChange={(v) => set("product_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Not linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {(products.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Image URL" className="sm:col-span-2">
              <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} />
            </FormField>
            <div className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Publish now</p>
                <p className="text-xs text-muted-foreground">Drafts stay private to your farm.</p>
              </div>
              <Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={submit}
              disabled={!form.title.trim() || crud.create.isPending || crud.update.isPending}
            >
              {editing ? "Save update" : "Publish update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminCategories,
  useAdminProducts,
  useCategoryCrud,
  useProductCrud,
  type AdminProduct,
} from "@/features/admin/hooks";
import { formatPrice } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/catalog")({
  component: AdminCatalog,
});

function AdminCatalog() {
  return (
    <Tabs defaultValue="products">
      <TabsList className="rounded-full">
        <TabsTrigger value="products" className="rounded-full">
          Products
        </TabsTrigger>
        <TabsTrigger value="categories" className="rounded-full">
          Categories
        </TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="pt-6">
        <ProductsPanel />
      </TabsContent>
      <TabsContent value="categories" className="pt-6">
        <CategoriesPanel />
      </TabsContent>
    </Tabs>
  );
}

function ProductsPanel() {
  const products = useAdminProducts();
  const crud = useProductCrud();

  const columns: Column<AdminProduct>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      value: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span aria-hidden>{p.emoji ?? "🌿"}</span>
          <div className="min-w-0">
            <p className="truncate font-medium">{p.name}</p>
            <p className="truncate text-xs text-muted-foreground">{p.sellers?.name ?? "Unassigned store"}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", hideOnMobile: true, sortable: true, value: (p) => p.categories?.name ?? "—" },
    { key: "price", header: "Price", sortable: true, value: (p) => Number(p.price), cell: (p) => formatPrice(p.price) },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      value: (p) => p.stock_qty,
      cell: (p) => (
        <span className={p.stock_qty <= p.low_stock_threshold ? "font-medium text-destructive" : undefined}>
          {p.stock_qty}
        </span>
      ),
    },
    {
      key: "flags",
      header: "Merchandising",
      hideOnMobile: true,
      value: (p) => [p.is_featured && "Featured", p.is_best_seller && "Best seller"].filter(Boolean).join(", "),
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.is_featured && (
            <Badge variant="secondary" className="rounded-full">
              Featured
            </Badge>
          )}
          {p.is_best_seller && (
            <Badge variant="secondary" className="rounded-full">
              Best seller
            </Badge>
          )}
          {p.is_new_arrival && (
            <Badge variant="secondary" className="rounded-full">
              New
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (p) => (p.is_active ? "Live" : "Hidden"),
      cell: (p) => (
        <Badge variant={p.is_active ? "default" : "secondary"} className="rounded-full">
          {p.is_active ? "Live" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (p) => (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label="Remove listing">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          }
          title={`Remove ${p.name}?`}
          description="The listing is hidden from the storefront. Order history is unaffected."
          confirmLabel="Remove"
          destructive
          onConfirm={() =>
            crud.update.mutateAsync({
              id: p.id,
              values: { deleted_at: new Date().toISOString(), is_active: false },
            })
          }
        />
      ),
    },
  ];

  return (
    <SectionCard title="All products" description="Moderate listings across every vendor and farm.">
      <DataTable
        rows={products.data}
        columns={columns}
        getId={(p) => p.id}
        loading={products.isLoading}
        error={products.error}
        onRetry={products.refetch}
        searchPlaceholder="Search products, stores or categories…"
        exportName="bullkart-catalogue"
        emptyTitle="No products yet"
        pageSize={12}
        bulkActions={[
          { label: "Publish", onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_active: true } }) },
          {
            label: "Hide",
            destructive: true,
            onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_active: false } }),
          },
          { label: "Feature", onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_featured: true } }) },
          {
            label: "Unfeature",
            onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_featured: false } }),
          },
          {
            label: "Mark best seller",
            onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_best_seller: true } }),
          },
        ]}
      />
    </SectionCard>
  );
}

type CategoryForm = {
  name: string;
  slug: string;
  tagline: string;
  emoji: string;
  image_url: string;
  sort_order: string;
  is_active: boolean;
};

const EMPTY_CATEGORY: CategoryForm = {
  name: "",
  slug: "",
  tagline: "",
  emoji: "🥬",
  image_url: "",
  sort_order: "0",
  is_active: true,
};

function CategoriesPanel() {
  const categories = useAdminCategories();
  const crud = useCategoryCrud();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"categories"> | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_CATEGORY);

  const openForm = (row: Tables<"categories"> | null) => {
    setEditing(row);
    setForm(
      row
        ? {
            name: row.name,
            slug: row.slug,
            tagline: row.tagline ?? "",
            emoji: row.emoji ?? "🥬",
            image_url: row.image_url ?? "",
            sort_order: String(row.sort_order),
            is_active: row.is_active,
          }
        : EMPTY_CATEGORY,
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = {
      name: form.name.trim(),
      slug:
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      tagline: form.tagline.trim() || null,
      emoji: form.emoji || "🥬",
      image_url: form.image_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    if (editing) await crud.update.mutateAsync({ id: editing.id, values });
    else await crud.create.mutateAsync(values);
    setOpen(false);
  };

  const columns: Column<Tables<"categories">>[] = [
    {
      key: "name",
      header: "Category",
      sortable: true,
      value: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-2">
          <span aria-hidden>{c.emoji ?? "🥬"}</span>
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name}</p>
            <p className="truncate text-xs text-muted-foreground">{c.tagline ?? c.slug}</p>
          </div>
        </div>
      ),
    },
    { key: "order", header: "Order", sortable: true, value: (c) => c.sort_order },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (c) => (c.is_active ? "Visible" : "Hidden"),
      cell: (c) => (
        <Badge variant={c.is_active ? "default" : "secondary"} className="rounded-full">
          {c.is_active ? "Visible" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit category" onClick={() => openForm(c)}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete category">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
            title={`Delete ${c.name}?`}
            description="Products keep their data but lose this category."
            confirmLabel="Delete"
            destructive
            onConfirm={() =>
              crud.update.mutateAsync({ id: c.id, values: { deleted_at: new Date().toISOString(), is_active: false } })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <SectionCard title="Categories" description="Storefront navigation and product grouping.">
      <DataTable
        rows={categories.data}
        columns={columns}
        getId={(c) => c.id}
        loading={categories.isLoading}
        error={categories.error}
        onRetry={categories.refetch}
        searchPlaceholder="Search categories…"
        exportName="bullkart-categories"
        emptyTitle="No categories yet"
        toolbar={
          <Button className="rounded-full" onClick={() => openForm(null)}>
            <Plus className="mr-2 size-4" /> New category
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "New category"}</DialogTitle>
            <DialogDescription>Shown in navigation, the category grid and filters.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </FormField>
            <FormField label="Slug">
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </FormField>
            <FormField label="Emoji">
              <Input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
            </FormField>
            <FormField label="Sort order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </FormField>
            <FormField label="Image URL">
              <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
            </FormField>
            <FormField label="Tagline" className="sm:col-span-2">
              <Textarea rows={2} value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
            </FormField>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
              Visible on the storefront
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={!form.name.trim()} onClick={submit}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

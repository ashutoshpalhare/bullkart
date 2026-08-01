import { useEffect, useState } from "react";
import { Images, Layers, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { useRows, tbl } from "@/features/dashboard/db";
import {
  useAdjustStock,
  useProductImageCrud,
  useProductImages,
  useProductVariants,
  useSellerProductCrud,
  useSellerProducts,
  useVariantCrud,
  type SellerProduct,
} from "@/features/seller/hooks";
import { formatPrice } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

type FormState = {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  price: string;
  mrp: string;
  unit: string;
  emoji: string;
  stock_qty: string;
  low_stock_threshold: string;
  badges: string;
  is_active: boolean;
  is_organic_certified: boolean;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  description: "",
  category_id: "",
  price: "",
  mrp: "",
  unit: "1 kg",
  emoji: "🌿",
  stock_qty: "0",
  low_stock_threshold: "5",
  badges: "",
  is_active: true,
  is_organic_certified: false,
};

/** Catalogue manager shared by the vendor and farmer workspaces. */
export function ProductManager({ sellerId, kind }: { sellerId: string; kind: "vendor" | "farmer" }) {
  const products = useSellerProducts(sellerId);
  const crud = useSellerProductCrud(sellerId);
  const adjustStock = useAdjustStock(sellerId);
  const categories = useRows<Tables<"categories">>(["categories", "options"], () =>
    tbl("categories").select("id, name").eq("is_active", true).order("name"),
  );

  const [editing, setEditing] = useState<SellerProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [detail, setDetail] = useState<SellerProduct | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (product: SellerProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      category_id: product.category_id ?? "",
      price: String(product.price),
      mrp: String(product.mrp),
      unit: product.unit,
      emoji: product.emoji ?? "🌿",
      stock_qty: String(product.stock_qty),
      low_stock_threshold: String(product.low_stock_threshold),
      badges: (product.badges ?? []).join(", "),
      is_active: product.is_active,
      is_organic_certified: product.is_organic_certified,
    });
    setFormOpen(true);
  };

  const submit = async () => {
    const values = {
      seller_id: sellerId,
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || Number(form.price) || 0,
      unit: form.unit.trim() || "1 unit",
      emoji: form.emoji || "🌿",
      stock_qty: Number(form.stock_qty) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      badges: form.badges
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      is_active: form.is_active,
      is_organic_certified: form.is_organic_certified,
    };
    if (editing) await crud.update.mutateAsync({ id: editing.id, values });
    else await crud.create.mutateAsync(values);
    setFormOpen(false);
  };

  const columns: Column<SellerProduct>[] = [
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
            <p className="truncate text-xs text-muted-foreground">{p.unit}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      sortable: true,
      value: (p) => p.categories?.name ?? "—",
    },
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
      key: "status",
      header: "Status",
      sortable: true,
      value: (p) => (p.is_active ? "Live" : "Draft"),
      cell: (p) => (
        <Badge variant={p.is_active ? "default" : "secondary"} className="rounded-full">
          {p.is_active ? "Live" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Media and variants" onClick={() => setDetail(p)}>
            <Layers className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Edit product" onClick={() => openEdit(p)}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete product">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
            title={`Delete ${p.name}?`}
            description="The listing is removed from the storefront. Past orders keep their record."
            confirmLabel="Delete"
            destructive
            onConfirm={() => crud.update.mutateAsync({ id: p.id, values: { deleted_at: new Date().toISOString(), is_active: false } })}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        rows={products.data}
        columns={columns}
        getId={(p) => p.id}
        loading={products.isLoading}
        error={products.error}
        onRetry={products.refetch}
        searchPlaceholder="Search your catalogue…"
        emptyTitle="No listings yet"
        emptyDescription={
          kind === "farmer" ? "Add your first produce listing to start selling." : "Add your first product to go live."
        }
        exportName="bullkart-products"
        toolbar={
          <Button className="rounded-full" onClick={openCreate}>
            <Plus className="mr-2 size-4" /> New product
          </Button>
        }
        bulkActions={[
          {
            label: "Publish",
            onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_active: true } }),
          },
          {
            label: "Unpublish",
            onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_active: false } }),
          },
          {
            label: "Restock +10",
            onSelect: (rows) =>
              rows.forEach((r) => adjustStock.mutate({ productId: r.id, change: 10, note: "Bulk restock" })),
          },
        ]}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
            <DialogDescription>
              Pricing, stock and certification details shown to shoppers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: editing ? f.slug : slugify(e.target.value),
                  }))
                }
              />
            </Field>
            <Field label="URL slug">
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </Field>
            <Field label="Category">
              <Select
                value={form.category_id}
                onValueChange={(value) => setForm((f) => ({ ...f, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Price (₹)">
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </Field>
            <Field label="MRP (₹)">
              <Input
                type="number"
                min="0"
                value={form.mrp}
                onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
              />
            </Field>
            <Field label="Unit">
              <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </Field>
            <Field label="Emoji">
              <Input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
            </Field>
            <Field label="Stock">
              <Input
                type="number"
                min="0"
                value={form.stock_qty}
                onChange={(e) => setForm((f) => ({ ...f, stock_qty: e.target.value }))}
              />
            </Field>
            <Field label="Low-stock alert at">
              <Input
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
              />
            </Field>
            <Field label="Badges (comma separated)" className="sm:col-span-2">
              <Input
                value={form.badges}
                onChange={(e) => setForm((f) => ({ ...f, badges: e.target.value }))}
                placeholder="Freshly harvested, Pesticide free"
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
              />
              Listed on the storefront
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={form.is_organic_certified}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_organic_certified: checked }))}
              />
              Organic certified
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={!form.name.trim() || crud.create.isPending || crud.update.isPending}
              onClick={submit}
            >
              {editing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDetailDialog product={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Images, variants and stock movements for one product. */
function ProductDetailDialog({
  product,
  onClose,
}: {
  product: SellerProduct | null;
  onClose: () => void;
}) {
  const id = product?.id ?? null;
  const images = useProductImages(id);
  const imageCrud = useProductImageCrud(id);
  const variants = useProductVariants(id);
  const variantCrud = useVariantCrud(id);
  const adjust = useAdjustStock(product?.seller_id);

  const [imageUrl, setImageUrl] = useState("");
  const [variant, setVariant] = useState({ name: "", unit: "", price: "", mrp: "", stock_qty: "0" });
  const [delta, setDelta] = useState("10");

  useEffect(() => {
    if (!product) {
      setImageUrl("");
      setVariant({ name: "", unit: "", price: "", mrp: "", stock_qty: "0" });
    }
  }, [product]);

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
          <DialogDescription>Gallery, variants and inventory movements.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="images">
          <TabsList className="rounded-full">
            <TabsTrigger value="images" className="rounded-full">
              <Images className="mr-2 size-4" /> Images
            </TabsTrigger>
            <TabsTrigger value="variants" className="rounded-full">
              Variants
            </TabsTrigger>
            <TabsTrigger value="stock" className="rounded-full">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…/photo.jpg"
                aria-label="Image URL"
              />
              <Button
                className="rounded-full"
                disabled={!imageUrl.trim() || !id}
                onClick={async () => {
                  await imageCrud.create.mutateAsync({
                    product_id: id,
                    url: imageUrl.trim(),
                    alt: product?.name,
                    sort_order: (images.data?.length ?? 0) + 1,
                  });
                  setImageUrl("");
                }}
              >
                Add
              </Button>
            </div>
            <ul className="space-y-2">
              {(images.data ?? []).map((img) => (
                <li key={img.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                  <img src={img.url} alt={img.alt ?? product?.name ?? ""} className="size-12 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{img.url}</span>
                  <Button variant="ghost" size="icon" aria-label="Remove image" onClick={() => imageCrud.remove.mutate(img.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
              {!images.isLoading && (images.data ?? []).length === 0 && (
                <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No extra images yet.
                </li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="variants" className="space-y-3 pt-4">
            <div className="grid gap-2 sm:grid-cols-5">
              <Input placeholder="Name" value={variant.name} onChange={(e) => setVariant((v) => ({ ...v, name: e.target.value }))} />
              <Input placeholder="Unit" value={variant.unit} onChange={(e) => setVariant((v) => ({ ...v, unit: e.target.value }))} />
              <Input placeholder="Price" type="number" value={variant.price} onChange={(e) => setVariant((v) => ({ ...v, price: e.target.value }))} />
              <Input placeholder="MRP" type="number" value={variant.mrp} onChange={(e) => setVariant((v) => ({ ...v, mrp: e.target.value }))} />
              <Button
                className="rounded-full"
                disabled={!variant.name.trim() || !id}
                onClick={async () => {
                  await variantCrud.create.mutateAsync({
                    product_id: id,
                    name: variant.name.trim(),
                    unit: variant.unit.trim() || product?.unit,
                    price: Number(variant.price) || Number(product?.price ?? 0),
                    mrp: Number(variant.mrp) || Number(variant.price) || Number(product?.mrp ?? 0),
                    stock_qty: Number(variant.stock_qty) || 0,
                  });
                  setVariant({ name: "", unit: "", price: "", mrp: "", stock_qty: "0" });
                }}
              >
                Add
              </Button>
            </div>
            <ul className="space-y-2">
              {(variants.data ?? []).map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                  <span>
                    <span className="font-medium">{v.name}</span>{" "}
                    <span className="text-muted-foreground">
                      · {v.unit} · {formatPrice(v.price)} · {v.stock_qty} in stock
                    </span>
                  </span>
                  <Button variant="ghost" size="icon" aria-label="Remove variant" onClick={() => variantCrud.remove.mutate(v.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
              {!variants.isLoading && (variants.data ?? []).length === 0 && (
                <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No variants — the base listing is sold as-is.
                </li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="stock" className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              In hand: <span className="font-medium text-foreground">{product?.stock_qty}</span> · alert below{" "}
              {product?.low_stock_threshold}
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                aria-label="Stock change"
                className="max-w-32"
              />
              <Button
                className="rounded-full"
                disabled={!id}
                onClick={() => adjust.mutate({ productId: id!, change: Number(delta) || 0, note: "Manual adjustment" })}
              >
                Apply movement
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use a negative number to write off damaged or spoiled stock. Every movement is recorded in the
              inventory ledger.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

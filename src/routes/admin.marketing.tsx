import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FormField } from "@/components/dashboard/form-field";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useBannerCrud,
  useBanners,
  useBlogCrud,
  useBlogs,
  useBroadcast,
  useCouponCrud,
  useCoupons,
} from "@/features/admin/hooks";
import { formatDate, formatPrice } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/marketing")({
  component: AdminMarketing,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminMarketing() {
  return (
    <Tabs defaultValue="coupons">
      <TabsList className="rounded-full">
        <TabsTrigger value="coupons" className="rounded-full">
          Coupons
        </TabsTrigger>
        <TabsTrigger value="banners" className="rounded-full">
          Banners
        </TabsTrigger>
        <TabsTrigger value="blogs" className="rounded-full">
          Blog
        </TabsTrigger>
        <TabsTrigger value="announcements" className="rounded-full">
          Announcements
        </TabsTrigger>
      </TabsList>
      <TabsContent value="coupons" className="pt-6">
        <CouponsPanel />
      </TabsContent>
      <TabsContent value="banners" className="pt-6">
        <BannersPanel />
      </TabsContent>
      <TabsContent value="blogs" className="pt-6">
        <BlogsPanel />
      </TabsContent>
      <TabsContent value="announcements" className="pt-6">
        <AnnouncementsPanel />
      </TabsContent>
    </Tabs>
  );
}

type CouponForm = {
  code: string;
  description: string;
  discount_type: string;
  discount_value: string;
  min_order: string;
  max_discount: string;
  usage_limit: string;
  per_user_limit: string;
  valid_to: string;
  first_order_only: boolean;
  is_active: boolean;
};

const EMPTY_COUPON: CouponForm = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "10",
  min_order: "0",
  max_discount: "",
  usage_limit: "",
  per_user_limit: "1",
  valid_to: "",
  first_order_only: false,
  is_active: true,
};

function CouponsPanel() {
  const coupons = useCoupons();
  const crud = useCouponCrud();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"coupons"> | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_COUPON);

  const openForm = (row: Tables<"coupons"> | null) => {
    setEditing(row);
    setForm(
      row
        ? {
            code: row.code,
            description: row.description ?? "",
            discount_type: row.discount_type,
            discount_value: String(row.discount_value),
            min_order: String(row.min_order),
            max_discount: row.max_discount ? String(row.max_discount) : "",
            usage_limit: row.usage_limit ? String(row.usage_limit) : "",
            per_user_limit: String(row.per_user_limit),
            valid_to: row.valid_to ? row.valid_to.slice(0, 10) : "",
            first_order_only: row.first_order_only,
            is_active: row.is_active,
          }
        : EMPTY_COUPON,
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      min_order: Number(form.min_order) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_user_limit: Number(form.per_user_limit) || 1,
      valid_to: form.valid_to ? new Date(form.valid_to).toISOString() : null,
      first_order_only: form.first_order_only,
      is_active: form.is_active,
    };
    if (editing) await crud.update.mutateAsync({ id: editing.id, values });
    else await crud.create.mutateAsync(values);
    setOpen(false);
  };

  const columns: Column<Tables<"coupons">>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      value: (c) => c.code,
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-mono font-medium">{c.code}</p>
          <p className="truncate text-xs text-muted-foreground">{c.description ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      sortable: true,
      value: (c) => Number(c.discount_value),
      cell: (c) =>
        c.discount_type === "percent" ? `${c.discount_value}%` : formatPrice(c.discount_value),
    },
    { key: "min", header: "Min order", hideOnMobile: true, sortable: true, value: (c) => Number(c.min_order), cell: (c) => formatPrice(c.min_order) },
    {
      key: "used",
      header: "Redemptions",
      sortable: true,
      value: (c) => c.used_count,
      cell: (c) => `${c.used_count}${c.usage_limit ? ` / ${c.usage_limit}` : ""}`,
    },
    { key: "expiry", header: "Expires", hideOnMobile: true, sortable: true, value: (c) => c.valid_to ?? "", cell: (c) => (c.valid_to ? formatDate(c.valid_to) : "No expiry") },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (c) => (c.is_active ? "Active" : "Paused"),
      cell: (c) => (
        <Badge variant={c.is_active ? "default" : "secondary"} className="rounded-full">
          {c.is_active ? "Active" : "Paused"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit coupon" onClick={() => openForm(c)}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete coupon">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
            title={`Delete ${c.code}?`}
            confirmLabel="Delete"
            destructive
            onConfirm={() => crud.remove.mutateAsync(c.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <SectionCard title="Coupons" description="Discount codes applied at checkout.">
      <DataTable
        rows={coupons.data}
        columns={columns}
        getId={(c) => c.id}
        loading={coupons.isLoading}
        error={coupons.error}
        onRetry={coupons.refetch}
        searchPlaceholder="Search codes…"
        exportName="bullkart-coupons"
        emptyTitle="No coupons yet"
        toolbar={
          <Button className="rounded-full" onClick={() => openForm(null)}>
            <Plus className="mr-2 size-4" /> New coupon
          </Button>
        }
        bulkActions={[
          { label: "Activate", onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_active: true } }) },
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
            <DialogTitle>{editing ? `Edit ${editing.code}` : "New coupon"}</DialogTitle>
            <DialogDescription>Validation runs server-side when a shopper applies the code.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code">
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="FRESH20"
              />
            </FormField>
            <FormField label="Type">
              <Select value={form.discount_type} onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage off</SelectItem>
                  <SelectItem value="flat">Flat amount off</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={form.discount_type === "percent" ? "Percent off" : "Amount off (₹)"}>
              <Input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
              />
            </FormField>
            <FormField label="Minimum order (₹)">
              <Input type="number" value={form.min_order} onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))} />
            </FormField>
            <FormField label="Max discount (₹)">
              <Input
                type="number"
                value={form.max_discount}
                onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
                placeholder="Optional"
              />
            </FormField>
            <FormField label="Total usage limit">
              <Input
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                placeholder="Unlimited"
              />
            </FormField>
            <FormField label="Per-customer limit">
              <Input
                type="number"
                value={form.per_user_limit}
                onChange={(e) => setForm((f) => ({ ...f, per_user_limit: e.target.value }))}
              />
            </FormField>
            <FormField label="Expires on">
              <Input type="date" value={form.valid_to} onChange={(e) => setForm((f) => ({ ...f, valid_to: e.target.value }))} />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </FormField>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={form.first_order_only}
                onCheckedChange={(c) => setForm((f) => ({ ...f, first_order_only: c }))}
              />
              First order only
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={!form.code.trim()} onClick={submit}>
              {editing ? "Save changes" : "Create coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

type BannerForm = {
  title: string;
  subtitle: string;
  image_url: string;
  link: string;
  placement: string;
  sort_order: string;
  is_active: boolean;
};

const EMPTY_BANNER: BannerForm = {
  title: "",
  subtitle: "",
  image_url: "",
  link: "",
  placement: "home_hero",
  sort_order: "0",
  is_active: true,
};

function BannersPanel() {
  const banners = useBanners();
  const crud = useBannerCrud();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"banners"> | null>(null);
  const [form, setForm] = useState<BannerForm>(EMPTY_BANNER);

  const openForm = (row: Tables<"banners"> | null) => {
    setEditing(row);
    setForm(
      row
        ? {
            title: row.title,
            subtitle: row.subtitle ?? "",
            image_url: row.image_url ?? "",
            link: row.link ?? "",
            placement: row.placement,
            sort_order: String(row.sort_order),
            is_active: row.is_active,
          }
        : EMPTY_BANNER,
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url.trim() || null,
      link: form.link.trim() || null,
      placement: form.placement,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    if (editing) await crud.update.mutateAsync({ id: editing.id, values });
    else await crud.create.mutateAsync(values);
    setOpen(false);
  };

  const columns: Column<Tables<"banners">>[] = [
    {
      key: "title",
      header: "Banner",
      sortable: true,
      value: (b) => b.title,
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{b.title}</p>
          <p className="truncate text-xs text-muted-foreground">{b.subtitle ?? b.link ?? "—"}</p>
        </div>
      ),
    },
    { key: "placement", header: "Placement", sortable: true, value: (b) => b.placement },
    { key: "order", header: "Order", sortable: true, value: (b) => b.sort_order },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (b) => (b.is_active ? "Live" : "Off"),
      cell: (b) => (
        <Badge variant={b.is_active ? "default" : "secondary"} className="rounded-full">
          {b.is_active ? "Live" : "Off"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit banner" onClick={() => openForm(b)}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete banner">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
            title={`Delete ${b.title}?`}
            confirmLabel="Delete"
            destructive
            onConfirm={() => crud.remove.mutateAsync(b.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <SectionCard title="Banners" description="Promotional slots on the home page and category pages.">
      <DataTable
        rows={banners.data}
        columns={columns}
        getId={(b) => b.id}
        loading={banners.isLoading}
        error={banners.error}
        onRetry={banners.refetch}
        searchPlaceholder="Search banners…"
        exportName="bullkart-banners"
        emptyTitle="No banners yet"
        toolbar={
          <Button className="rounded-full" onClick={() => openForm(null)}>
            <Plus className="mr-2 size-4" /> New banner
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.title}` : "New banner"}</DialogTitle>
            <DialogDescription>Keep copy short — banners are read at a glance.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" className="sm:col-span-2">
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </FormField>
            <FormField label="Subtitle" className="sm:col-span-2">
              <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
            </FormField>
            <FormField label="Image URL">
              <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
            </FormField>
            <FormField label="Link">
              <Input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="/category/fruits" />
            </FormField>
            <FormField label="Placement">
              <Select value={form.placement} onValueChange={(v) => setForm((f) => ({ ...f, placement: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_hero">Home hero</SelectItem>
                  <SelectItem value="home_strip">Home strip</SelectItem>
                  <SelectItem value="category">Category page</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Sort order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </FormField>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
              Live
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={!form.title.trim()} onClick={submit}>
              {editing ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

type BlogForm = { title: string; slug: string; excerpt: string; body: string; cover_url: string; tags: string; is_published: boolean };

const EMPTY_BLOG: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_url: "",
  tags: "",
  is_published: false,
};

function BlogsPanel() {
  const blogs = useBlogs();
  const crud = useBlogCrud();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"blogs"> | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY_BLOG);

  const openForm = (row: Tables<"blogs"> | null) => {
    setEditing(row);
    setForm(
      row
        ? {
            title: row.title,
            slug: row.slug,
            excerpt: row.excerpt ?? "",
            body: row.body ?? "",
            cover_url: row.cover_url ?? "",
            tags: (row.tags ?? []).join(", "),
            is_published: row.is_published,
          }
        : EMPTY_BLOG,
    );
    setOpen(true);
  };

  const submit = async () => {
    const values = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim() || null,
      body: form.body.trim() || null,
      cover_url: form.cover_url.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
    };
    if (editing) await crud.update.mutateAsync({ id: editing.id, values });
    else await crud.create.mutateAsync(values);
    setOpen(false);
  };

  const columns: Column<Tables<"blogs">>[] = [
    {
      key: "title",
      header: "Post",
      sortable: true,
      value: (b) => b.title,
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{b.title}</p>
          <p className="truncate text-xs text-muted-foreground">{b.excerpt ?? b.slug}</p>
        </div>
      ),
    },
    { key: "tags", header: "Tags", hideOnMobile: true, value: (b) => (b.tags ?? []).join(", ") },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (b) => (b.is_published ? "Published" : "Draft"),
      cell: (b) => (
        <Badge variant={b.is_published ? "default" : "secondary"} className="rounded-full">
          {b.is_published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    { key: "created", header: "Created", hideOnMobile: true, sortable: true, value: (b) => b.created_at, cell: (b) => formatDate(b.created_at) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit post" onClick={() => openForm(b)}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete post">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
            title={`Delete ${b.title}?`}
            confirmLabel="Delete"
            destructive
            onConfirm={() => crud.update.mutateAsync({ id: b.id, values: { deleted_at: new Date().toISOString(), is_published: false } })}
          />
        </div>
      ),
    },
  ];

  return (
    <SectionCard title="Blog" description="Recipes, farm stories and seasonal guides.">
      <DataTable
        rows={blogs.data}
        columns={columns}
        getId={(b) => b.id}
        loading={blogs.isLoading}
        error={blogs.error}
        onRetry={blogs.refetch}
        searchPlaceholder="Search posts…"
        exportName="bullkart-blog"
        emptyTitle="No posts yet"
        toolbar={
          <Button className="rounded-full" onClick={() => openForm(null)}>
            <Plus className="mr-2 size-4" /> New post
          </Button>
        }
        bulkActions={[
          {
            label: "Publish",
            onSelect: (rows) =>
              crud.patchMany.mutate({
                ids: rows.map((r) => r.id),
                values: { is_published: true, published_at: new Date().toISOString() },
              }),
          },
          {
            label: "Unpublish",
            destructive: true,
            onSelect: (rows) => crud.patchMany.mutate({ ids: rows.map((r) => r.id), values: { is_published: false } }),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.title}` : "New post"}</DialogTitle>
            <DialogDescription>Markdown-friendly body, published to the BullKart journal.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))
                }
              />
            </FormField>
            <FormField label="Slug">
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </FormField>
            <FormField label="Cover image URL">
              <Input value={form.cover_url} onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))} />
            </FormField>
            <FormField label="Tags (comma separated)" className="sm:col-span-2">
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </FormField>
            <FormField label="Excerpt" className="sm:col-span-2">
              <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
            </FormField>
            <FormField label="Body" className="sm:col-span-2">
              <Textarea rows={8} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </FormField>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <Switch checked={form.is_published} onCheckedChange={(c) => setForm((f) => ({ ...f, is_published: c }))} />
              Published
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={!form.title.trim()} onClick={submit}>
              {editing ? "Save changes" : "Create post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

function AnnouncementsPanel() {
  const broadcast = useBroadcast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState("all");

  return (
    <SectionCard title="Announcements" description="Send an in-app notification to a group of members.">
      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <FormField label="Title" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fresh mangoes are here 🥭" />
          </FormField>
          <FormField label="Message" className="sm:col-span-2">
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </FormField>
          <FormField label="Link">
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/category/fruits" />
          </FormField>
          <FormField label="Audience">
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="vendor">Vendors</SelectItem>
                <SelectItem value="farmer">Farmers</SelectItem>
                <SelectItem value="delivery">Delivery partners</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="sm:col-span-2">
            <Button
              className="rounded-full"
              disabled={!title.trim() || broadcast.isPending}
              onClick={() =>
                broadcast.mutate(
                  { _title: title.trim(), _body: body.trim(), _link: link.trim(), _audience: audience },
                  {
                    onSuccess: () => {
                      setTitle("");
                      setBody("");
                      setLink("");
                    },
                  },
                )
              }
            >
              <Megaphone className="mr-2 size-4" />
              {broadcast.isPending ? "Sending…" : "Send announcement"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </SectionCard>
  );
}

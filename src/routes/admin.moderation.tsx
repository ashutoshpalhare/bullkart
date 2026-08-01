import { createFileRoute } from "@tanstack/react-router";
import { Star, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminReviews, useReviewCrud, type AdminReview } from "@/features/admin/hooks";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/moderation")({
  component: AdminModeration,
});

function AdminModeration() {
  const reviews = useAdminReviews();
  const crud = useReviewCrud();

  const columns: Column<AdminReview>[] = [
    {
      key: "product",
      header: "Product",
      sortable: true,
      value: (r) => r.products?.name ?? "",
      cell: (r) => <span className="font-medium">{r.products?.name ?? "Deleted product"}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      value: (r) => r.rating,
      cell: (r) => (
        <span className="flex items-center gap-1">
          <Star className="size-4 fill-accent text-accent" aria-hidden />
          {r.rating}
        </span>
      ),
    },
    {
      key: "review",
      header: "Review",
      value: (r) => `${r.title ?? ""} ${r.body ?? ""}`,
      cell: (r) => (
        <div className="max-w-md">
          {r.title && <p className="truncate font-medium">{r.title}</p>}
          <p className="line-clamp-2 text-sm text-muted-foreground">{r.body ?? "No comment"}</p>
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      hideOnMobile: true,
      value: (r) => r.author_name ?? "Anonymous",
      cell: (r) => (
        <div>
          <p className="text-sm">{r.author_name ?? "Anonymous"}</p>
          {r.is_verified && (
            <Badge variant="secondary" className="mt-1 rounded-full">
              Verified buyer
            </Badge>
          )}
        </div>
      ),
    },
    { key: "created", header: "Posted", hideOnMobile: true, sortable: true, value: (r) => r.created_at, cell: (r) => formatDate(r.created_at) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label="Remove review">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          }
          title="Remove this review?"
          description="The review is deleted and the product rating recalculated."
          confirmLabel="Remove"
          destructive
          onConfirm={() => crud.remove.mutateAsync(r.id)}
        />
      ),
    },
  ];

  return (
    <SectionCard title="Reviews" description="Moderate customer feedback across the catalogue.">
      <DataTable
        rows={reviews.data}
        columns={columns}
        getId={(r) => r.id}
        loading={reviews.isLoading}
        error={reviews.error}
        onRetry={reviews.refetch}
        searchPlaceholder="Search reviews, products or authors…"
        exportName="bullkart-reviews"
        emptyTitle="No reviews yet"
        emptyDescription="Customer feedback will show up here once orders are delivered."
        pageSize={12}
        bulkActions={[
          {
            label: "Remove",
            destructive: true,
            onSelect: (rows) => crud.remove.mutate(rows.map((r) => r.id)),
          },
        ]}
      />
    </SectionCard>
  );
}

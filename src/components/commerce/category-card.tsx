import { Link } from "@tanstack/react-router";
import type { Category } from "@/types/catalog";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-leaf text-2xl transition-transform duration-300 group-hover:scale-110">
        <span aria-hidden>{category.emoji}</span>
      </span>
      <span className="text-sm font-semibold leading-tight text-foreground">{category.name}</span>
      <span className="text-xs text-muted-foreground">{category.productCount} products</span>
    </Link>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type {} from "@tanstack/react-start";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/categories", changefreq: "weekly", priority: "0.9" },
  { path: "/search", changefreq: "weekly", priority: "0.6" },
  { path: "/farmers", changefreq: "weekly", priority: "0.8" },
  { path: "/auth", changefreq: "yearly", priority: "0.3" },
];

function originFrom(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

async function dynamicEntries(): Promise<SitemapEntry[]> {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [categories, products] = await Promise.all([
      supabase.from("categories").select("slug").is("deleted_at", null).eq("is_active", true),
      supabase
        .from("products")
        .select("slug")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(5000),
    ]);

    return [
      ...(categories.data ?? []).map((c) => ({
        path: `/category/${c.slug}`,
        changefreq: "weekly" as const,
        priority: "0.8",
      })),
      ...(products.data ?? []).map((p) => ({
        path: `/product/${p.slug}`,
        changefreq: "weekly" as const,
        priority: "0.7",
      })),
    ];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const base = originFrom(request);
        const entries = [...STATIC_ENTRIES, ...(await dynamicEntries())];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            [
              `  <url>`,
              `    <loc>${base}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

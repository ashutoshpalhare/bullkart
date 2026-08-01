import { describe, expect, it } from "vitest";
import { discountPercent, formatPrice } from "@/lib/format";
import { breadcrumbLd, canonical, pageMeta, prettySlug } from "@/lib/seo";

describe("format", () => {
  it("formats INR without decimals and handles bad input", () => {
    expect(formatPrice(1499)).toContain("1,499");
    expect(formatPrice("not-a-number")).toContain("0");
    expect(formatPrice(null)).toContain("0");
  });

  it("computes discount percentages only when the MRP is higher", () => {
    expect(discountPercent(800, 1000)).toBe(20);
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1200, 1000)).toBe(0);
  });
});

describe("seo", () => {
  it("builds the full social meta set", () => {
    const meta = pageMeta({ title: "T", description: "D", image: "https://x/i.png" });
    const keys = meta.map((m) => m["title"] ?? m["name"] ?? m["property"]);
    expect(keys).toEqual(
      expect.arrayContaining(["T", "description", "og:title", "twitter:card", "og:image"]),
    );
  });

  it("emits relative canonicals and ordered breadcrumbs", () => {
    expect(canonical("/cart")).toEqual({ rel: "canonical", href: "/cart" });
    const ld = JSON.parse(
      breadcrumbLd([
        { name: "Home", item: "/" },
        { name: "Shop", item: "/categories" },
      ]).children,
    );
    expect(ld.itemListElement.map((i: { position: number }) => i.position)).toEqual([1, 2]);
  });

  it("prettifies slugs", () => {
    expect(prettySlug("raw-forest-honey")).toBe("Raw Forest Honey");
  });
});

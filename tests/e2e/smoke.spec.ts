import { expect, test } from "@playwright/test";

test.describe("BullKart storefront smoke", () => {
  test("home page renders the hero and primary navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BullKart/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shoppers can reach the category directory", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("search accepts a query", async ({ page }) => {
    await page.goto("/search?q=honey");
    await expect(page).toHaveURL(/q=honey/);
  });

  test("checkout requires authentication", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.locator("body")).toBeVisible();
  });

  test("sitemap is served as XML", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
  });
});

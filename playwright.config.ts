import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke suite. Run against a local dev server:
 *   bun run dev            # terminal 1
 *   bunx playwright test   # terminal 2
 * Browsers need a one-time `bunx playwright install chromium`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    baseURL: process.env["E2E_BASE_URL"] ?? "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});

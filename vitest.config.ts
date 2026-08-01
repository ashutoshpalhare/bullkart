import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

/**
 * Test-only Vite config. It deliberately does NOT reuse vite.config.ts — the app
 * config boots TanStack Start, Nitro and the PWA plugin, none of which belong in
 * a unit/component test run.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/features/**", "src/components/**"],
    },
  },
});

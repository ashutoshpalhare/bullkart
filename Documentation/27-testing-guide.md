# 27 — Testing Guide

## Purpose

Explain the testing stack, what belongs at each level, and how to write tests that catch
real bugs.

## Stack

| Level | Tool | Location |
| --- | --- | --- |
| Unit (pure logic) | Vitest | `tests/*.test.ts` |
| Component | Vitest + Testing Library + jsdom | `tests/*.test.tsx` |
| End-to-end | Playwright | `tests/e2e/*.spec.ts` |
| Types | `tsgo --noEmit` | whole repo |

Config: `vitest.config.ts`, `playwright.config.ts`, shared setup in `tests/setup.ts`
(mocks `matchMedia`, `ResizeObserver` and other jsdom gaps).

## Commands

```bash
bun run test            # all unit + component tests
bun run test:watch      # watch mode while developing
bun run test:coverage   # V8 coverage report
bunx playwright test    # e2e
bunx playwright test --ui   # interactive debugging
```

## Existing suites

| File | Covers |
| --- | --- |
| `tests/cart.test.ts` | Cart maths: line totals, quantity clamping, subtotal |
| `tests/seo.test.ts` | `src/lib/seo.ts` — title/description limits, canonical, JSON-LD shape |
| `tests/states.test.tsx` | Loading / empty / error state components render correctly |
| `tests/e2e/smoke.spec.ts` | Home → category → product → cart happy path |

## What to test where

### Unit — always
Pure functions in `src/lib/`: `format.ts` (INR, dates), `csv.ts`, `errors.ts`, `seo.ts`,
`cart.ts`. Cheap, fast, high value.

```ts
import { describe, it, expect } from "vitest";
import { formatINR } from "@/lib/format";

describe("formatINR", () => {
  it("formats with Indian digit grouping", () => {
    expect(formatINR(125000)).toBe("₹1,25,000");
  });
  it("handles zero", () => expect(formatINR(0)).toBe("₹0"));
});
```

### Component — for behaviour, not markup

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("calls onAdd when the add button is pressed", async () => {
  const onAdd = vi.fn();
  render(<ProductCard product={fixture} onAdd={onAdd} />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  expect(onAdd).toHaveBeenCalledWith(fixture.id);
});
```

Query by role and accessible name. If you cannot, the component probably has an
accessibility problem — fix that instead of reaching for `data-testid`.

### E2E — for money paths only

Slow tests must earn their place. Keep e2e to:

1. Browse → product → add to cart → COD checkout → order appears in `/orders`.
2. Seller creates a product and it appears on the storefront.
3. Admin assigns a delivery, partner verifies the OTP, order becomes delivered.

```ts
test("guest can browse to a product", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /shop all/i }).click();
  await page.getByRole("link", { name: /organic/i }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

## Mocking Supabase

Don't hit the network in unit or component tests. Mock the client module:

```ts
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ data: [fixture], error: null }) }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: { id: "o1" }, error: null }),
  },
}));
```

For hooks, wrap in a `QueryClientProvider` with `retry: false` so failures surface
immediately.

## Database-level checks

RLS deserves explicit verification. For each new policy, confirm manually (or in an e2e
run with two accounts):

- Owner reads their rows ✅
- Non-owner reads nothing ✅
- Anonymous reads only public data ✅
- Non-owner write is rejected ✅

## Coverage expectations

Not a percentage target, a risk target:

| Area | Expectation |
| --- | --- |
| `src/lib/*` pure helpers | ~100% |
| Cart / checkout / coupon logic | Every branch |
| Shared components' states | Loading, empty, error, populated |
| Dashboards | Smoke-level |

## Writing good tests

- ✅ Test behaviour a user can observe.
- ✅ One assertion theme per test; descriptive names.
- ✅ Use fixtures, not shared mutable state.
- ⚠️ Don't assert on class names or DOM structure.
- ⚠️ Don't add `waitForTimeout`; wait for a condition.
- ⚠️ Don't test the framework (that Router routes, that Query caches).

## CI gate

Before merge: `bun run typecheck && bun run lint && bun run test && bun run build`, plus
Playwright on any PR touching checkout, auth or fulfilment.

## Common mistakes

- ⚠️ jsdom missing a browser API — add the mock to `tests/setup.ts`, not to each test.
- ⚠️ Tests that pass in isolation and fail together because Query cache leaks between
  cases. Create a fresh `QueryClient` per test.
- ⚠️ E2E suites that depend on seeded data nobody maintains. Create what you need in the
  test.

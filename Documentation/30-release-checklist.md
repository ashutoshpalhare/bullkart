# 30 — Release Checklist

## Purpose

The pre-flight run before every production release. Work top to bottom; do not skip
sections because "nothing in that area changed".

## 1. Code quality

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bunx playwright test
```

```text
[ ] All five pass on a clean checkout of the release commit
[ ] No console errors or warnings on the main routes
[ ] No leftover TODO/FIXME on the critical path
[ ] No stray console.log of user or payment data
```

## 2. Database

```text
[ ] Migrations applied and reviewed
[ ] Every new public table has GRANTs, RLS and policies
[ ] Security linter run; migration-related warnings resolved
[ ] Fresh backup taken before applying (see 23)
[ ] Changes are additive — nothing the live frontend depends on was dropped
```

## 3. Security

```text
[ ] Dependency scan clean of criticals
[ ] Secrets are server-only; nothing sensitive behind VITE_
[ ] New /api/public routes verify their caller
[ ] Role checks present on every new admin/seller action
[ ] Storage buckets still private; policies still folder-scoped
[ ] Leaked-password protection enabled
```

## 4. Functional smoke (production build)

```text
Shopper
[ ] Home, category, product, search render with real data
[ ] Sign up, sign in (email + Google), sign out
[ ] Add to cart, update quantity, remove
[ ] Wishlist toggle persists across reload
[ ] Coupon applies and rejects correctly
[ ] Wallet credit applies
[ ] COD checkout completes; order appears in /orders
[ ] Cancel order restocks and refunds wallet
[ ] Review submission marks verified for a delivered item

Seller
[ ] Onboarding gate for a user with no store
[ ] Create/edit product, upload image, adjust stock
[ ] Order list shows only own items; status transitions work
[ ] Payouts render; finance fields save

Delivery
[ ] Assignment appears; status transitions work
[ ] OTP handover completes and settles COD

Admin
[ ] Metrics load; charts render
[ ] Verify a seller; suspend a user
[ ] Assign a delivery partner
[ ] Create a coupon; broadcast a notification
[ ] Settings save and take effect in checkout maths
```

## 5. Performance

```text
[ ] Lighthouse mobile: performance ≥ 90 on / and /product/$slug
[ ] LCP < 2.5s, CLS < 0.1, INP < 200ms
[ ] No unexpected bundle growth
[ ] New list queries paginated and indexed
```

## 6. Accessibility

```text
[ ] Lighthouse accessibility 100 on key routes
[ ] Full keyboard pass through checkout
[ ] Visible focus everywhere
[ ] Contrast ≥ 4.5:1 for body text
[ ] Screen-reader pass on the cart and checkout flow
```

## 7. SEO

```text
[ ] Unique title + description on every public route
[ ] Exactly one <h1> per page
[ ] Canonical URLs correct for the target domain
[ ] JSON-LD validates (Rich Results Test)
[ ] /sitemap.xml lists all public routes and no private ones
[ ] robots.txt correct; dashboards disallowed
[ ] No "Lovable App" / "Lovable Generated Project" strings remain
```

## 8. PWA

```text
[ ] Manifest valid; icons present at all sizes
[ ] Service worker registers and updates cleanly
[ ] Offline banner appears when the network drops
[ ] Install prompt works on Android Chrome
```

## 9. Configuration

```text
[ ] Auth redirect allow-list includes the production origin
[ ] Google OAuth origins updated
[ ] Sitemap BASE_URL set to the live domain
[ ] Razorpay keys + webhook configured (or the option is hidden)
[ ] Monitoring DSN/keys set; a test event received
[ ] commerce settings row has the intended fees and thresholds
```

## 10. Ship

```text
[ ] Release notes written
[ ] Backup confirmed
[ ] Deploy during low traffic
[ ] Publish (frontend) and confirm backend changes are live
[ ] Post-deploy smoke test on the production domain
[ ] Monitor errors and Core Web Vitals for 30 minutes
[ ] Rollback plan understood and available
```

## Rollback triggers

Roll back immediately if: checkout fails for any shopper, authentication is broken, an RLS
regression exposes data, or the error rate exceeds ~1% of sessions.

# Deployment

BullKart ships as a TanStack Start app (SSR + client bundle + service worker) with Lovable
Cloud (Postgres/Auth/Storage) as the backend.

## 1. Publish from Lovable (recommended)

Publishing builds the app, deploys the SSR worker and serves it from
`https://<slug>.lovable.app`. Backend changes (migrations, secrets, storage) go live
immediately; frontend changes go live when you click **Update** in the publish dialog.

Custom domains: Project Settings → Domains (requires one publish first).

## 2. Deploying the frontend elsewhere (Vercel)

```bash
bun install
bun run build     # emits dist/client (static + sw.js) and the SSR server bundle
```

Vercel project settings:

- **Install command** `bun install`
- **Build command** `bun run build`
- **Output** framework preset "Other"; serve the generated SSR entry (Nitro output) —
  do not configure a SPA rewrite, routing is handled by the server bundle.
- **Environment variables** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `VITE_SUPABASE_PROJECT_ID`, plus server-only `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `RAZORPAY_WEBHOOK_SECRET`.

Only `VITE_*` values reach the browser — keep every other secret server-side.

## 3. Backend

The database, auth, storage and RPCs are managed by Lovable Cloud. Migrations are applied
through the migration workflow (never ad-hoc SQL against production). Before launch:

- [ ] Auth redirect URLs include the production origin and any custom domain.
- [ ] Google sign-in provider configured.
- [ ] Leaked-password (HIBP) protection enabled.
- [ ] Storage buckets stay private; images are served through signed URLs.
- [ ] Seed data: categories, sellers, banners and coupons reviewed for launch.

## 4. Payments

Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`, then point the
Razorpay dashboard webhook at `https://<your-domain>/api/public/razorpay-webhook`
(`payment.captured`, `payment.failed`, `refund.processed`). Signature verification is
mandatory and already implemented; the endpoint answers 503 while the secret is missing.

## 5. Email and notifications

- **In-app** notifications are written by database triggers/RPCs into `notifications` and
  surfaced in the app's bell menu; admins can broadcast via `broadcast_notification`.
- **Transactional email** (welcome, order confirmation, shipping updates, password reset,
  promotions) uses Lovable's managed email with your own sender domain. Set the domain up in
  Cloud → Emails first; auth emails fall back to a default Lovable sender until then.
- **Web push** requires a messaging service worker plus a push provider; the app-shell
  service worker is intentionally separate and must not be reused for it.

## 6. Post-deploy checks

```bash
bun run typecheck && bun run test
bunx playwright test          # against E2E_BASE_URL=<deployed url>
```

Then verify: `/sitemap.xml` returns XML, `/robots.txt` allows crawling, the manifest and
service worker load over HTTPS, Lighthouse (mobile) is green, and a full COD order can be
placed, tracked and delivered with OTP.

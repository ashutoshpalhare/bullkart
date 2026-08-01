# 21 — Deployment

## Purpose

Ship BullKart to production, either through Lovable publish (the supported default) or a
self-managed Vercel deployment.

## Option A — Lovable publish (recommended)

1. Run the [Release Checklist](./30-release-checklist.md).
2. Click **Publish** (top-right in the editor; bottom-right on mobile preview).
3. The app goes live at `<project>.lovable.app`.
4. Optionally attach a custom domain: Project Settings → Domains, or the publish dialog.
   A project must be published once before a domain can be connected.

Important distinction:

| Change type | When it goes live |
| --- | --- |
| Frontend (UI, styles, client code) | On **Update** in the publish dialog |
| Backend (migrations, server functions, storage rules) | **Immediately**, on apply |

That asymmetry means a migration that removes a column will hit the currently published
frontend right away. Always ship schema changes additively — see
[Migrations](./22-database-migration-guide.md).

Stable URLs for external services (immutable, survive renames):

- Production: `https://project--{project-id}.lovable.app`
- Preview: `https://project--{project-id}-dev.lovable.app`

Preview links require a Lovable login. Use **Share → Share preview** for a 7-day public
link.

## Option B — Vercel

The app is a TanStack Start (Vite + Nitro) project, so it deploys as a standard build.

### 1. Import the repository

Vercel → Add New → Project → import the Git repo.

### 2. Build settings

| Setting | Value |
| --- | --- |
| Framework preset | Other / Vite |
| Install command | `bun install` (or `npm ci`) |
| Build command | `bun run build` |
| Output directory | `dist` (as produced by the build) |
| Node version | 20.x |

### 3. Environment variables

Add in Project Settings → Environment Variables, for **Production** and **Preview**:

| Variable | Notes |
| --- | --- |
| `VITE_SUPABASE_URL` | Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public |
| `VITE_SUPABASE_PROJECT_ID` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server only |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | When payments are enabled |
| `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_GA_MEASUREMENT_ID` | Optional |

### 4. Post-deploy configuration

1. Add the deployment origin to the backend Auth redirect allow-list
   (`https://yourdomain.com/auth/callback`).
2. Update the Google OAuth authorized origins/redirects.
3. Point the Razorpay webhook at `https://yourdomain.com/api/public/razorpay-webhook`.
4. Set `BASE_URL` in `src/routes/sitemap[.]xml.ts` to the live origin and redeploy.
5. Submit `/sitemap.xml` in Google Search Console.

### Routing note

TanStack Start handles deep links and refreshes natively. Do **not** add
`public/_redirects`, `netlify.toml`, `vercel.json` rewrites, `BrowserRouter` or
`HashRouter`. A 404 on refresh means the route file or `createFileRoute` path is wrong, not
that a rewrite is missing.

## Custom domain checklist

- DNS: `A`/`CNAME` per the provider's instructions; allow up to 48h propagation.
- HTTPS certificate issued and forced.
- `www` → apex (or vice versa) redirect chosen and consistent.
- Canonical URLs and the sitemap use the final domain.
- Auth redirect list updated **before** announcing the domain.

## Rollback

| Platform | How |
| --- | --- |
| Lovable | Revert to a previous version from history and re-publish |
| Vercel | Deployments → previous deployment → Promote to Production |
| Database | Migrations are forward-only; ship a compensating migration (see [23](./23-backup-and-restore.md)) |

## Smoke test after every deploy

1. `/` loads, images render, no console errors.
2. Sign in with email and with Google.
3. Add to cart → checkout with COD → order appears in `/orders`.
4. `/admin` metrics load for an admin; `/vendor` gate works for a seller.
5. `/sitemap.xml` and `/robots.txt` return 200.
6. Lighthouse on mobile ≥ 90 performance, 100 accessibility target.

## Common mistakes

- ⚠️ Publishing the frontend without applying the migration it depends on (or vice versa).
- ⚠️ Forgetting the auth redirect allow-list → Google sign-in fails only in production.
- ⚠️ Leaving the sitemap `BASE_URL` empty after going live.

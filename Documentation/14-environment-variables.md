# 14 — Environment Variables

## Purpose

Enumerate every variable, who reads it, and how to set it safely.

## Two very different kinds

| Kind | Prefix | Visibility | Set where |
| --- | --- | --- | --- |
| **Client config** | `VITE_` | **Shipped in the browser bundle — public** | `.env` (managed) |
| **Server secrets** | no prefix | Server/Worker only | Backend secret store |

⚠️ Never put a private key behind `VITE_`. It will be in the JavaScript any visitor can
read.

## Client variables (`import.meta.env`)

| Variable | Purpose | Managed |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Backend API URL | Auto-generated — do not edit |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key; safe in the client, RLS still applies | Auto-generated |
| `VITE_SUPABASE_PROJECT_ID` | Project reference | Auto-generated |

Read them like this:

```ts
const url = import.meta.env.VITE_SUPABASE_URL;
```

In practice you shouldn't: import the generated client instead.

```ts
import { supabase } from "@/integrations/supabase/client";
```

Optional client toggles you may add for monitoring
(`src/lib/monitoring.ts` reads them defensively, all no-ops when unset):

| Variable | Purpose |
| --- | --- |
| `VITE_SENTRY_DSN` | Error reporting endpoint |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | Product analytics |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 |

## Server secrets (`process.env`, inside handlers only)

| Secret | Used by | Status |
| --- | --- | --- |
| `SUPABASE_URL` | Server clients | Set |
| `SUPABASE_ANON_KEY` | Public server reads | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged admin client — bypasses RLS | Set, never exposed |
| `SUPABASE_DB_URL` | Tooling | Set |
| `LOVABLE_API_KEY` | AI gateway | Set (managed) |
| `RAZORPAY_KEY_ID` | Payment order creation | **Not yet configured** |
| `RAZORPAY_KEY_SECRET` | Signature verification | **Not yet configured** |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC validation | **Not yet configured** |

Correct usage:

```ts
export const createOrder = createServerFn({ method: "POST" }).handler(async () => {
  const keyId = process.env["RAZORPAY_KEY_ID"];   // ✅ inside the handler
  if (!keyId) throw new Error("Payments are not configured yet.");
});
```

```ts
const keyId = process.env["RAZORPAY_KEY_ID"];      // ⚠️ module scope → undefined
export const createOrder = createServerFn(/* … */);
```

## Adding a secret

1. Decide the type: random internal value, shared value the provider also holds, or a
   third-party credential.
2. Add it through the platform's secret form (never paste it into a file or chat).
3. Reference it as `process.env["NAME"]` inside a handler.
4. Document it in the table above **in the same PR**.

There is no committed `.env` holding secrets, so there is nothing secret to `.gitignore`.
The `.env` present in the repo holds only auto-generated public `VITE_SUPABASE_*` values.

## Local development

No manual setup is required: the generated `.env` already points at the development
backend. If you clone into a fresh environment and the client throws
`supabaseUrl is required`, the `.env` is missing — re-sync the project rather than
hand-writing values.

## Common mistakes

- ⚠️ Editing `.env` `VITE_SUPABASE_*` values by hand.
- ⚠️ Committing a `.env.production` with real keys.
- ⚠️ Assuming a runtime secret is available during `bun install` — build secrets are a
  separate, workspace-level mechanism used only for private npm registries.
- ⚠️ Logging `process.env` to debug. Log the *presence* of a key, never the value.

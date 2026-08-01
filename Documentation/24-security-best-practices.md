# 24 — Security Best Practices

## Purpose

State the threat model, the controls in place, and the rules every contributor must
follow.

## Threat model

| Threat | Control |
| --- | --- |
| Customer reads another customer's orders/addresses | RLS scoped to `auth.uid()` |
| Seller edits another seller's catalogue | `owns_seller()` in policies and RPCs |
| Privilege escalation to admin | Roles in `user_roles`, never on a self-updatable row |
| Client tampering with prices or totals | Totals computed inside `place_order` from live product rows |
| Overselling / negative stock | Row locks (`FOR UPDATE`) inside the checkout transaction |
| Coupon abuse | `validate_coupon` enforces global, per-user and first-order limits |
| Wallet double-spend | Wallet lock + ledger row inside the same transaction |
| Fake delivery completion | 6-digit OTP verified by `verify_delivery_otp` |
| Leaked media URLs | Private buckets + short-lived signed URLs |
| Exposure of seller GST / payout account | Moved out of public `sellers` into `seller_finance` |
| Webhook spoofing | HMAC signature verification with a timing-safe compare |
| Secret leakage | Secrets are server-only, read inside handlers, never `VITE_`-prefixed |

## Non-negotiable rules

1. **Every new `public` table gets grants, RLS and policies in its creating migration.**
2. **Authorize in the database, not just in React.** UI gates are UX.
3. **Never store roles on `profiles`** or any row the user can update.
4. **Never use the service-role client** for ordinary reads, or to decide whether the
   caller is an admin. Verify with the user-scoped client first, then escalate.
5. **Read secrets inside handlers**, never at module scope, never in client code.
6. **Validate all external input with zod** — server function inputs, webhook payloads,
   form data.
7. **Verify webhook signatures against the raw body** before parsing.
8. **Money logic lives in `SECURITY DEFINER` SQL**, transactional, with explicit
   authorization at the top.

## Data protection

- Personal data (names, phones, addresses) is readable only by the owner and admins.
- `orders.shipping_address` is a JSON snapshot — it must not be exposed on any public
  join. Check `select()` column lists when adding seller-facing order views; sellers see
  fulfilment fields, not full customer profiles.
- Reviews show `author_name`, not email.
- Delivery partners see only orders assigned to them.

## Application-layer hygiene

| Area | Practice |
| --- | --- |
| XSS | Never `dangerouslySetInnerHTML` with user content; blog bodies must be sanitised |
| Injection | No string-built SQL; use parameters and RPC arguments |
| Open redirect | OAuth `redirectTo` must be same-origin, built from `window.location.origin` |
| Rate limiting | Auth endpoints are provider-limited; add throttling to any new public route |
| Dependencies | Run the dependency scan before releases; patch criticals immediately |
| Errors | Show human messages; never leak stack traces, SQL or internal ids to users |
| Logging | Log presence, not values, of tokens and keys |

## Storage security

- All four buckets are private.
- Write policies match the first path segment to the owner id.
- Signed URLs are short-lived (≈1h) and generated on demand.
- Never flip a bucket public to debug.

## Reviewing a PR for security

```text
[ ] New tables: grants + RLS + policies present?
[ ] New policies: do they use is_admin()/owns_seller() rather than self-referencing SQL?
[ ] New RPCs: SECURITY DEFINER with search_path set and an explicit auth check?
[ ] Any new select() that widens exposed columns on a shared table?
[ ] Secrets read inside handlers only?
[ ] New public route under /api/public/ — is the caller verified?
[ ] User input validated with zod?
[ ] Does the client trust any value it should recompute server-side?
```

## Incident response

1. Contain — disable the affected route or revoke the credential.
2. Assess — query logs, determine which rows and users are affected.
3. Fix — migration and/or code change, deployed immediately.
4. Verify — reproduce the original exploit and confirm it fails.
5. Record — note the decision and the rule change so scanners and reviewers learn from it.

## Common mistakes

- ⚠️ "It's fine, the UI hides it." A `curl` with any valid JWT does not run your UI.
- ⚠️ Granting `anon` broadly because a query returned nothing during development.
- ⚠️ Adding a convenience admin endpoint without a role check.
- ⚠️ Copy-pasting a policy from an owner-scoped table onto a seller-scoped one.

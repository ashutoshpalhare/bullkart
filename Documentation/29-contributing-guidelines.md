# 29 — Contributing Guidelines

## Purpose

Make contributions predictable: how to branch, commit, review and merge.

## Before you start

1. Read [Project Overview](./01-project-overview.md),
   [System Architecture](./06-system-architecture.md) and
   [Folder Structure](./04-folder-structure.md).
2. Get the app running locally ([15](./15-local-development-setup.md)).
3. Confirm a clean baseline: `bun run typecheck && bun run lint && bun run test`.

## Branching

```
main              always deployable
feat/<scope>      new capability      feat/subscription-boxes
fix/<scope>       bug fix             fix/coupon-min-order
chore/<scope>     tooling, deps
docs/<scope>      documentation
refactor/<scope>  no behaviour change
```

Branch from `main`, keep branches short-lived, rebase rather than merge `main` in.

## Commits

Conventional Commits:

```
feat(checkout): apply wallet balance before coupon discount
fix(cart): clamp quantity to available stock
docs(api): document verify_delivery_otp errors
```

Rules: imperative mood, one logical change per commit, explain *why* in the body when the
change isn't obvious. Never commit secrets, `.env` edits or generated files you didn't
mean to touch.

## Making a change

1. **Schema first.** If the database changes, write and apply the migration before the
   code that uses it, so types regenerate ([22](./22-database-migration-guide.md)).
2. **Data layer.** Add hooks/`queryOptions` in `src/features/<domain>/`.
3. **UI.** Compose from `src/components/*`; new shared blocks go in the right tier.
4. **Route.** Add the file in `src/routes/`, including `head()` metadata.
5. **Tests.** Unit for logic, component for behaviour, e2e if it touches money.
6. **Docs.** Update the affected file in `Documentation/`.

## Definition of done

```text
[ ] bun run typecheck   passes
[ ] bun run lint        passes
[ ] bun run test        passes
[ ] bun run build       passes
[ ] Loading, empty and error states implemented
[ ] Mobile (320px) and desktop verified
[ ] Keyboard navigable; icon buttons labelled
[ ] Semantic colour tokens only
[ ] RLS/grants added for any new table
[ ] head() metadata unique for any new route; sitemap updated
[ ] Documentation updated in the same PR
```

## Code style

- TypeScript strict; no `any` without a comment explaining why.
- Components stay presentational; data access lives in `src/features/*`.
- Files under ~200 lines; extract when they grow.
- Naming: `kebab-case.tsx` files, `PascalCase` components, `useThing` hooks.
- Prettier decides formatting — don't argue with it, run `bun run format`.
- Never edit generated files ([04](./04-folder-structure.md) lists them).

## Pull requests

Include:

- **What** changed and **why**.
- Screenshots or a short clip for UI work (mobile + desktop).
- The migration SQL, if any, and its rollback plan.
- Test evidence.
- Anything reviewers should look at closely.

Keep PRs under ~400 changed lines where possible. Large refactors get their own PR,
separate from behaviour changes.

## Review checklist (for reviewers)

```text
[ ] Does it do what the description says, and only that?
[ ] Security: grants, RLS, role checks, secret handling ([24](./24-security-best-practices.md))
[ ] Correctness of money/stock logic — is it server-side and atomic?
[ ] Performance: pagination, indexes, bundle impact
[ ] Accessibility: roles, labels, focus, contrast
[ ] Tests meaningful, not tautological
[ ] Docs updated
```

Review the code, not the person. Prefix optional suggestions with "nit:".

## Reporting bugs

Include: URL/route, role of the signed-in user, steps to reproduce, expected vs actual,
console and network output, screenshots, and whether it reproduces in a production build.

## Proposing features

Open a short proposal covering the user problem, the affected roles, schema implications,
and how success will be measured. Link it to the
[Roadmap](./31-future-roadmap.md) if it belongs there.

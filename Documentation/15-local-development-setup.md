# 15 — Local Development Setup

## Purpose

Take a developer from an empty machine to a running BullKart in about ten minutes.

## Prerequisites

| Tool | Version | Check |
| --- | --- | --- |
| Node.js | ≥ 20 LTS | `node -v` |
| Bun | ≥ 1.1 (preferred package manager/runner) | `bun -v` |
| Git | any recent | `git --version` |
| A modern browser | Chrome/Edge/Firefox | — |

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

Recommended VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense.

## Step-by-step

### 1. Clone

```bash
git clone <repository-url> bullkart
cd bullkart
```

### 2. Install dependencies

```bash
bun install
```

See [Installing Dependencies](./16-installing-dependencies.md) for rules and gotchas.

### 3. Verify environment

The repo ships a generated `.env` with the public backend config:

```bash
grep -c VITE_SUPABASE .env   # expect 3
```

If missing, see [Environment Variables](./14-environment-variables.md). Do not invent
values — the client fails fast with `supabaseUrl is required`.

### 4. Start the dev server

```bash
bun run dev
```

Open http://localhost:8080. Hot module replacement is on; route files are picked up
automatically and `src/routeTree.gen.ts` regenerates itself.

### 5. Create a local account

1. Go to `/auth` and sign up with email + password.
2. The `handle_new_user()` trigger creates your profile, `customer` role and wallet.
3. To reach a workspace, grant yourself a role from an admin account, or via a migration:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict (user_id, role) do nothing;
```

### 6. Sanity checks

```bash
bun run typecheck   # tsgo --noEmit
bun run lint
bun run test        # vitest run
```

All three should pass on a clean checkout. If they don't, fix that before writing code.

## Development loop

| Task | Command |
| --- | --- |
| Dev server | `bun run dev` |
| Type check | `bun run typecheck` |
| Lint / autofix | `bun run lint` / `bun run format` |
| Unit tests (watch) | `bun run test:watch` |
| E2E smoke | `bunx playwright test` |
| Production build | `bun run build` |
| Preview the build | `bun run preview` |

## Working with the backend locally

There is no local Postgres. The dev server talks to the managed development backend, so:

- Schema changes go through migrations (see
  [Database Migration Guide](./22-database-migration-guide.md)).
- Two developers share the dev database — coordinate destructive changes.
- After a migration, the generated `src/integrations/supabase/types.ts` refreshes; restart
  the TypeScript server if your editor caches old types.

## Editor configuration

- Prettier is the formatter of record (`bun run format`).
- Path alias `@/` → `src/`, configured in `tsconfig.json` and `vite-tsconfig-paths`.
- Enable "TypeScript: Use workspace version" so you match CI.

## Common mistakes

- ⚠️ Using `npm install` after everyone else used Bun → conflicting lockfiles.
- ⚠️ Running on a port other than 8080 and then wondering why OAuth redirects fail.
- ⚠️ Editing `src/routeTree.gen.ts` when a route "doesn't appear". Instead check that the
  file name matches the intended URL and `createFileRoute` path string.
- ⚠️ Node < 20 — Vite 8 and the Worker tooling will error obscurely.

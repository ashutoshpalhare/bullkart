# 16 — Installing Dependencies

## Purpose

Rules for adding, upgrading and removing packages without breaking the Worker build.

## Package manager

**Bun** is the standard. `bun.lock` is committed and authoritative.

```bash
bun install            # install everything
bun add <pkg>          # runtime dependency
bun add -d <pkg>       # dev dependency
bun remove <pkg>       # remove
bunx <cli>             # run a CLI without installing
```

⚠️ Do not mix package managers. A stray `package-lock.json` or `yarn.lock` causes
divergent trees between machines and CI.

## Before you add anything

Ask, in order:

1. **Is it already here?** Radix, lucide, date-fns, recharts, zod, react-hook-form, cmdk,
   embla, vaul and sonner cover most needs.
2. **Can shadcn generate it?** UI primitives belong in `src/components/ui`, generated
   rather than installed as a wrapper library.
3. **Does it run on Cloudflare `workerd`?** If it will be imported by SSR or a server
   function, this is a hard requirement.

## Worker compatibility checklist

A package is **unsafe** for server-side use if it:

- ships `.node` binaries or a `binding.gyp`
- requires `node-gyp` / `prebuild-install`
- spawns child processes (`child_process`)
- needs a real filesystem beyond the virtual one, or `fs.watch`
- calls `os.cpus()` / `os.networkInterfaces()`

Known-bad here: `sharp`, `canvas`, `puppeteer`.

Safe Node built-ins with `nodejs_compat`: `fs`, `path`, `crypto`, `Buffer`, `stream`,
`url`, `events`, `timers`, `net`, `http`, `https`, `zlib`.

Symptoms of an incompatible package:

| Error | Meaning |
| --- | --- |
| `[unenv] X is not implemented yet!` | Stubbed API — replace the package |
| `__dirname is not defined` | CommonJS globals after ESM bundling |
| Works in dev, fails in production | Dev runs on Node; always test `bun run build` |

Client-only libraries with the same problems are fine **if** they are dynamically imported
behind `<ClientOnly>` so SSR never evaluates them.

## After adding a package

```bash
bun add some-lib
bun run typecheck
bun run build        # proves the Worker bundle still builds
git add package.json bun.lock
```

Never add `ssr.external` or `resolve.external` to `vite.config.ts` — there is no runtime
module resolution in the Worker, and it will hard-fail the build.

## Upgrading

```bash
bun update <pkg>            # single package, preferred
bun outdated                # survey
```

- Leaf libraries: bump freely within minor versions.
- Framework pins (React, TanStack Start/Router, Vite, Tailwind): upgrade deliberately, one
  at a time, with a full `typecheck + test + build + playwright` pass.

## Private registries

Only needed for private npm packages. Add the token as a **workspace build secret** (not a
runtime secret) and reference it in `.npmrc`:

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

Runtime secrets are not available during `bun install`; a runtime secret with the same
name will not work.

## Removing

```bash
bun remove <pkg>
rg "<pkg>" src tests     # confirm no imports remain
bun run typecheck && bun run build
```

## Common mistakes

- ⚠️ Installing a router, state library or CSS-in-JS runtime that duplicates existing
  infrastructure.
- ⚠️ Adding a Node-only SDK for a third-party API instead of calling its REST endpoint
  with `fetch`.
- ⚠️ Forgetting to commit `bun.lock`.

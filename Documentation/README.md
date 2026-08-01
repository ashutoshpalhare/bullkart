# BullKart Documentation

Welcome. This folder is the single source of truth for the BullKart codebase — a
multi-vendor organic marketplace built on TanStack Start, React 19 and Lovable Cloud
(Postgres + Auth + Storage + RLS).

**Purpose:** give a developer who has never seen this repository everything needed to
clone it, run it, understand it, extend it and ship it — with no external guidance.

## How to read this

If you are brand new, read in this order:

1. [Project Overview](./01-project-overview.md)
2. [Business Vision](./02-business-vision.md)
3. [Features](./03-features.md)
4. [Tech Stack](./05-tech-stack.md)
5. [Local Development Setup](./15-local-development-setup.md)
6. [Running the Project](./17-running-the-project.md)
7. [System Architecture](./06-system-architecture.md)
8. [Database Schema](./07-database-schema.md)

Then dip into the reference docs as needed.

## Index

| # | Document | What it covers |
| --- | --- | --- |
| 01 | [Project Overview](./01-project-overview.md) | What BullKart is, surfaces, glossary |
| 02 | [Business Vision](./02-business-vision.md) | Market, personas, economics, principles |
| 03 | [Features](./03-features.md) | Full feature inventory per role |
| 04 | [Folder Structure](./04-folder-structure.md) | Every directory explained |
| 05 | [Tech Stack](./05-tech-stack.md) | Libraries and why each was chosen |
| 06 | [System Architecture](./06-system-architecture.md) | Request lifecycle, boundaries, data flow |
| 07 | [Database Schema](./07-database-schema.md) | ERD, tables, enums, RPCs |
| 08 | [Authentication Flow](./08-authentication-flow.md) | Sign-up, session, SSR, guards |
| 09 | [User Roles & Permissions](./09-roles-and-permissions.md) | Role matrix and RLS rules |
| 10 | [API Documentation](./10-api-documentation.md) | RPCs, server functions, server routes |
| 11 | [Component Library](./11-component-library.md) | Shared components and props |
| 12 | [UI Design System](./12-ui-design-system.md) | Tokens, type, spacing, motion |
| 13 | [State Management](./13-state-management.md) | Query keys, cache, local state |
| 14 | [Environment Variables](./14-environment-variables.md) | Every variable, where it lives |
| 15 | [Local Development Setup](./15-local-development-setup.md) | Clone to first run |
| 16 | [Installing Dependencies](./16-installing-dependencies.md) | Package manager rules |
| 17 | [Running the Project](./17-running-the-project.md) | Scripts and workflows |
| 18 | [Supabase Configuration](./18-supabase-configuration.md) | Auth, providers, settings |
| 19 | [Storage Configuration](./19-storage-configuration.md) | Buckets, paths, signed URLs |
| 20 | [Payment Integration](./20-payment-integration-razorpay.md) | Razorpay + COD + wallet |
| 21 | [Deployment](./21-deployment.md) | Lovable publish and Vercel |
| 22 | [Database Migration Guide](./22-database-migration-guide.md) | Writing safe migrations |
| 23 | [Backup & Restore](./23-backup-and-restore.md) | Snapshots, exports, recovery |
| 24 | [Security Best Practices](./24-security-best-practices.md) | Threat model and rules |
| 25 | [Performance Optimizations](./25-performance-optimizations.md) | Frontend + database |
| 26 | [SEO Strategy](./26-seo-strategy.md) | Meta, JSON-LD, sitemap |
| 27 | [Testing Guide](./27-testing-guide.md) | Vitest, Testing Library, Playwright |
| 28 | [Troubleshooting](./28-troubleshooting.md) | Common errors and fixes |
| 29 | [Contributing Guidelines](./29-contributing-guidelines.md) | Branches, commits, reviews |
| 30 | [Release Checklist](./30-release-checklist.md) | Pre-flight before every ship |
| 31 | [Future Roadmap](./31-future-roadmap.md) | What comes next |

## Conventions used in these docs

- Paths are always repo-relative: `src/routes/checkout.tsx`.
- SQL identifiers are schema-qualified: `public.orders`.
- "Cloud", "backend" and "the database" all refer to the managed Postgres/Auth/Storage
  stack provisioned by Lovable Cloud.
- ⚠️ marks a common mistake, ✅ marks the recommended practice.

## Keeping docs true

Documentation rots faster than code. The rule in this repo: **a pull request that changes
a route, table, RPC, env var or bucket must update the matching document in the same PR.**
See [Contributing Guidelines](./29-contributing-guidelines.md).

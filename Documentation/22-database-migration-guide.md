# 22 — Database Migration Guide

## Purpose

How to change the schema safely. Every structural change — tables, columns, policies,
functions, triggers, indexes, enums — goes through a migration. There is no other route.

## Golden rules

1. **Additive first.** Backend changes deploy immediately while the published frontend may
   still be the old build. Add before you remove.
2. **Every `CREATE TABLE` in `public` needs `GRANT`s in the same migration.**
3. **Enable RLS and write policies in the same migration.** A table without policies is
   inaccessible; a table without RLS is a leak.
4. **One logical change per migration**, with a description a non-engineer can read.
5. **Never** issue `ALTER DATABASE`, and never modify the `auth`, `storage`, `realtime`,
   `supabase_functions` or `vault` schemas.

## The canonical four-step table

```sql
-- 1. create
create table public.wishlist_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  product_id uuid not null references public.products(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. grant   (RLS alone is NOT enough — PostgREST needs privileges)
grant select, insert, update, delete on public.wishlist_notes to authenticated;
grant all on public.wishlist_notes to service_role;
-- grant select on public.wishlist_notes to anon;  -- only with an anon-readable policy

-- 3. enable RLS
alter table public.wishlist_notes enable row level security;

-- 4. policies
create policy "owners manage their notes" on public.wishlist_notes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- housekeeping
create trigger set_wishlist_notes_updated_at
  before update on public.wishlist_notes
  for each row execute function public.set_updated_at();

create index wishlist_notes_user_idx on public.wishlist_notes (user_id);
```

## Safe change patterns

| Change | Safe approach |
| --- | --- |
| Add a column | `add column … null` or with a default; backfill; only then enforce `not null` |
| Rename a column | Add new → dual-write in app → backfill → drop old in a later migration |
| Drop a column/table | Ship after the frontend that stopped using it is live |
| Change a type | New column + backfill + swap; never an in-place lossy cast |
| Add an enum value | Its own migration (`alter type … add value`), used only in later ones |
| Add an index | `create index concurrently` where supported, for large tables |
| Change a function | `create or replace function` — keep the signature stable |

## Validation rules, not CHECK constraints

`CHECK` must be immutable, so time-dependent rules break restores:

```sql
-- ⚠️ wrong
alter table public.coupons add constraint valid_window check (valid_to > now());

-- ✅ right
create or replace function public.coupons_validate() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.valid_to is not null and new.valid_to <= now() then
    raise exception 'Coupon end date must be in the future.';
  end if;
  return new;
end $$;

create trigger coupons_validate_trg before insert or update on public.coupons
for each row execute function public.coupons_validate();
```

## Writing a security-definer function

```sql
create or replace function public.do_thing(_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in.'; end if;
  if not public.is_admin(uid) then raise exception 'Admins only.'; end if;
  -- … work …
  return jsonb_build_object('ok', true);
end $$;
```

Always: derive `auth.uid()` inside, authorize explicitly, `set search_path = public`,
raise human-readable errors.

## Process

1. Write the SQL.
2. Submit it via the migration tool; it is reviewed and approved before running.
3. On success, `src/integrations/supabase/types.ts` regenerates.
4. **Only then** write the application code that depends on the new schema.
5. Run the security linter; fix anything the migration introduced.
6. Update [Database Schema](./07-database-schema.md) and
   [API Documentation](./10-api-documentation.md) in the same PR.

## Testing a migration

- Read path: does a normal user see exactly what they should, and nothing more?
- Write path: does a non-owner get refused?
- Anonymous path: does a logged-out request see only public data?
- Regression: run `bun run test` and the checkout e2e flow.

## Rolling back

Migrations are forward-only. To undo, write a compensating migration that reverses the
change, and be careful with data loss — restoring dropped columns requires a backup (see
[23](./23-backup-and-restore.md)).

## Common mistakes

- ⚠️ Missing grants → `permission denied for table` with a correct policy.
- ⚠️ Recursive policies. Use `is_admin()` / `owns_seller()` security-definer helpers.
- ⚠️ `not null` without a default on a populated table.
- ⚠️ Writing app code in the same step as the migration, before types regenerate.
- ⚠️ Seeding demo data from the app at page load instead of `INSERT` statements in the
  migration.

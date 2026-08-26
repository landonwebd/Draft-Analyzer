-- Creates user-owned draft pools with RLS-protected CRUD access.

create table public.draft_pools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) > 0),
  slug text not null check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and slug not in ('all', 'unassigned')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint draft_pools_user_id_slug_key unique (user_id, slug)
);

alter table public.draft_pools enable row level security;

revoke all on table public.draft_pools from anon;

grant select, insert, update, delete
on table public.draft_pools
to authenticated;

create policy "Users can view their own draft pools"
on public.draft_pools
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own draft pools"
on public.draft_pools
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own draft pools"
on public.draft_pools
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own draft pools"
on public.draft_pools
for delete
to authenticated
using ((select auth.uid()) = user_id);

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all
on function private.set_updated_at()
from public, anon, authenticated;

create trigger set_draft_pools_updated_at
before update on public.draft_pools
for each row
execute function private.set_updated_at();
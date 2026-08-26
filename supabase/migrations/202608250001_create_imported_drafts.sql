-- Creates user-owned imported drafts and their individual draft picks.

create table public.imported_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pool_id uuid references public.draft_pools(id) on delete set null,
  name text not null check (char_length(btrim(name)) > 0),
  source_file_name text not null check (char_length(btrim(source_file_name)) > 0),
  imported_at timestamptz not null default now(),
  my_fantasy_team text not null check (char_length(btrim(my_fantasy_team)) > 0),
  updated_at timestamptz not null default now(),
  constraint imported_drafts_user_id_source_file_name_key unique (user_id, source_file_name)
);

alter table public.imported_drafts enable row level security;

create trigger set_imported_drafts_updated_at
before update on public.imported_drafts
for each row
execute function private.set_updated_at();

revoke all on table public.imported_drafts from anon;

grant select, insert, delete
on table public.imported_drafts
to authenticated;

grant update (name, pool_id, my_fantasy_team)
on table public.imported_drafts
to authenticated;

create policy "Users can view their own imported drafts"
on public.imported_drafts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their own imported drafts"
on public.imported_drafts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    pool_id is null
    or exists (
      select 1
      from public.draft_pools as draft_pool
      where draft_pool.id = imported_drafts.pool_id
        and draft_pool.user_id = (select auth.uid())
    )
  )
);

create policy "Users can update their own imported drafts"
on public.imported_drafts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    pool_id is null
    or exists (
      select 1
      from public.draft_pools as draft_pool
      where draft_pool.id = imported_drafts.pool_id
        and draft_pool.user_id = (select auth.uid())
    )
  )
);

create policy "Users can delete their own imported drafts"
on public.imported_drafts
for delete
to authenticated
using ((select auth.uid()) = user_id);

create table public.draft_picks (
  draft_id uuid not null references public.imported_drafts(id) on delete cascade,
  overall integer not null check (overall > 0),
  pick text not null check (char_length(btrim(pick)) > 0),
  player_name text not null check (char_length(btrim(player_name)) > 0),
  position text not null check (position in ('QB', 'RB', 'WR', 'TE', 'K', 'DST')),
  nfl_team text not null,
  fantasy_team text not null check (char_length(btrim(fantasy_team)) > 0),
  primary key (draft_id, overall)
);

alter table public.draft_picks enable row level security;

revoke all on table public.draft_picks from anon;

grant select, insert
on table public.draft_picks
to authenticated;

create policy "Users can view picks from their own drafts"
on public.draft_picks
for select
to authenticated
using (
  exists (
    select 1
    from public.imported_drafts
    where imported_drafts.id = draft_picks.draft_id
      and imported_drafts.user_id = (select auth.uid())
  )
);

create policy "Users can add picks to their own drafts"
on public.draft_picks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.imported_drafts
    where imported_drafts.id = draft_picks.draft_id
      and imported_drafts.user_id = (select auth.uid())
  )
);
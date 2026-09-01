create table public.player_ranking_overrides (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,

  player_key text not null
    check (char_length(btrim(player_key)) > 0),

  manual_adp_adjustment integer not null default 0
    check (manual_adp_adjustment between -100 and 100),

  is_excluded boolean not null default false,

  updated_at timestamptz not null default now(),

  primary key (user_id, player_key),

  constraint player_ranking_overrides_has_change_check
    check (manual_adp_adjustment <> 0 or is_excluded)
);

alter table public.player_ranking_overrides enable row level security;

revoke all
on table public.player_ranking_overrides
from anon;

grant select, insert, update, delete
on table public.player_ranking_overrides
to authenticated;

create policy "Users can view their own player ranking overrides"
on public.player_ranking_overrides
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own player ranking overrides"
on public.player_ranking_overrides
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own player ranking overrides"
on public.player_ranking_overrides
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own player ranking overrides"
on public.player_ranking_overrides
for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger set_player_ranking_overrides_updated_at
before update on public.player_ranking_overrides
for each row
execute function private.set_updated_at();
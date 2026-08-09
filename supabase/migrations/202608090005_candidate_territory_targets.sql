alter table public.campaign_settings
  add column if not exists total_dpt integer not null default 0 check (total_dpt >= 0);

update public.campaign_settings
set total_dpt = case when total_dpt = 0 then 78500 else total_dpt end,
    total_target = case when total_target = 0 then 45000 else total_target end
where id = true;

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  ballot_number smallint check (ballot_number is null or ballot_number > 0),
  candidate_name text not null check (char_length(candidate_name) between 2 and 120),
  deputy_name text check (deputy_name is null or char_length(deputy_name) between 2 and 120),
  coalition text check (coalition is null or char_length(coalition) <= 240),
  color text not null default '#f59e0b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_our_candidate boolean not null default false,
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (ballot_number)
);

create unique index candidates_one_ours_idx on public.candidates (is_our_candidate) where is_our_candidate;
create index candidates_active_ballot_idx on public.candidates (is_active, ballot_number);
create index candidates_created_by_idx on public.candidates (created_by);
create index candidates_updated_by_idx on public.candidates (updated_by) where updated_by is not null;

create table public.territory_targets (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  scope_type text not null check (scope_type in ('area','rw','rt','tps')),
  area_name text not null check (char_length(area_name) between 2 and 120),
  rw_number text check (rw_number is null or char_length(rw_number) between 1 and 10),
  rt_number text check (rt_number is null or char_length(rt_number) between 1 and 10),
  tps_number text check (tps_number is null or char_length(tps_number) between 1 and 20),
  dpt_total integer not null check (dpt_total > 0),
  vote_target integer not null check (vote_target >= 0 and vote_target <= dpt_total),
  achieved_votes integer not null default 0 check (achieved_votes >= 0 and achieved_votes <= dpt_total),
  team_id uuid references public.teams(id) on delete set null,
  notes text check (notes is null or char_length(notes) <= 500),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (candidate_id, scope_type, area_name, rw_number, rt_number, tps_number),
  check (
    (scope_type = 'area' and rw_number is null and rt_number is null and tps_number is null)
    or (scope_type = 'rw' and rw_number is not null and rt_number is null and tps_number is null)
    or (scope_type = 'rt' and rw_number is not null and rt_number is not null and tps_number is null)
    or (scope_type = 'tps' and tps_number is not null)
  )
);

create index territory_targets_scope_area_idx on public.territory_targets (scope_type, area_name, rw_number, rt_number, tps_number);
create index territory_targets_team_scope_idx on public.territory_targets (team_id, scope_type) where team_id is not null;
create index territory_targets_candidate_idx on public.territory_targets (candidate_id);
create index territory_targets_created_by_idx on public.territory_targets (created_by);
create index territory_targets_updated_by_idx on public.territory_targets (updated_by) where updated_by is not null;

create trigger candidates_updated before update on public.candidates
for each row execute function private.set_updated_at();
create trigger territory_targets_updated before update on public.territory_targets
for each row execute function private.set_updated_at();
create trigger audit_candidates after insert or update or delete on public.candidates
for each row execute function private.audit_change();
create trigger audit_territory_targets after insert or update or delete on public.territory_targets
for each row execute function private.audit_change();

alter table public.candidates enable row level security;
alter table public.territory_targets enable row level security;

create policy candidates_active_read on public.candidates for select to authenticated
using (private.is_active());
create policy candidates_admin_insert on public.candidates for insert to authenticated
with check (private.has_role(array['admin']::public.app_role[]) and created_by = (select auth.uid()));
create policy candidates_admin_update on public.candidates for update to authenticated
using (private.has_role(array['admin']::public.app_role[]))
with check (private.has_role(array['admin']::public.app_role[]) and updated_by = (select auth.uid()));
create policy candidates_admin_delete on public.candidates for delete to authenticated
using (private.has_role(array['admin']::public.app_role[]));

create policy territory_targets_active_read on public.territory_targets for select to authenticated
using (private.is_active());
create policy territory_targets_admin_insert on public.territory_targets for insert to authenticated
with check (private.has_role(array['admin']::public.app_role[]) and created_by = (select auth.uid()));
create policy territory_targets_admin_update on public.territory_targets for update to authenticated
using (private.has_role(array['admin']::public.app_role[]))
with check (private.has_role(array['admin']::public.app_role[]) and updated_by = (select auth.uid()));
create policy territory_targets_admin_delete on public.territory_targets for delete to authenticated
using (private.has_role(array['admin']::public.app_role[]));

grant select on public.candidates, public.territory_targets to authenticated;
grant insert, update, delete on public.candidates, public.territory_targets to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'candidates') then
    alter publication supabase_realtime add table public.candidates;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'territory_targets') then
    alter publication supabase_realtime add table public.territory_targets;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campaign_settings') then
    alter publication supabase_realtime add table public.campaign_settings;
  end if;
end $$;

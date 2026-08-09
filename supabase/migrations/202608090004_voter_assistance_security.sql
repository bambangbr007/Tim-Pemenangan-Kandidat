create table public.voter_assistance (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 100),
  phone text check (phone is null or phone ~ '^[0-9+ -]{8,18}$'),
  village text not null check (char_length(village) between 2 and 100),
  address_hint text check (char_length(address_hint) <= 220),
  polling_station text not null check (char_length(polling_station) between 1 and 20),
  assistance_category text not null default 'general' check (assistance_category in ('general','elderly','disability','medical')),
  transport_needed boolean not null default false,
  safety_concern boolean not null default false,
  attendance_status text not null default 'waiting' check (attendance_status in ('waiting','pickup_requested','en_route','arrived','cancelled')),
  consent_confirmed boolean not null check (consent_confirmed),
  notes text check (char_length(notes) <= 500),
  team_id uuid references public.teams(id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.election_day_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_type text not null check (incident_type in ('obstruction','intimidation','suspected_violation','medical','other')),
  description text not null check (char_length(description) between 5 and 1500),
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  accuracy_m numeric(8,2) check (accuracy_m is null or accuracy_m >= 0),
  resolution_status text not null default 'submitted' check (resolution_status in ('submitted','reviewing','resolved')),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  team_id uuid references public.teams(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index voter_assistance_team_status_idx on public.voter_assistance (team_id, attendance_status, created_at desc);
create index voter_assistance_tps_idx on public.voter_assistance (village, polling_station, attendance_status);
create index voter_assistance_created_by_idx on public.voter_assistance (created_by);
create index voter_assistance_updated_by_idx on public.voter_assistance (updated_by) where updated_by is not null;
create index election_day_incidents_team_created_idx on public.election_day_incidents (team_id, created_at desc);
create index election_day_incidents_reporter_idx on public.election_day_incidents (reporter_id);

create trigger voter_assistance_updated before update on public.voter_assistance
for each row execute function private.set_updated_at();
create trigger election_day_incidents_updated before update on public.election_day_incidents
for each row execute function private.set_updated_at();

create trigger audit_voter_assistance after insert or update or delete on public.voter_assistance
for each row execute function private.audit_change();
create trigger audit_election_day_incidents after insert or update or delete on public.election_day_incidents
for each row execute function private.audit_change();

create or replace function private.notify_election_day_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(recipient_id, title, message, entity_type, entity_id)
  select id,
    case when tg_table_name = 'election_day_incidents' then 'Laporan keselamatan Hari-H' else 'Permintaan bantuan TPS' end,
    case when tg_table_name = 'election_day_incidents'
      then 'Insiden baru memerlukan peninjauan pusat komando.'
      else format('%s memerlukan bantuan ke TPS %s.', to_jsonb(new) ->> 'display_name', to_jsonb(new) ->> 'polling_station')
    end,
    tg_table_name,
    new.id
  from public.profiles
  where approval_status = 'active'
    and role in ('admin','owner')
    and id <> coalesce((to_jsonb(new) ->> 'reporter_id')::uuid, (to_jsonb(new) ->> 'created_by')::uuid);
  return new;
end $$;
revoke all on function private.notify_election_day_event() from public;

create trigger notify_voter_assistance after insert on public.voter_assistance
for each row when (new.transport_needed or new.safety_concern) execute function private.notify_election_day_event();
create trigger notify_election_day_incident after insert on public.election_day_incidents
for each row execute function private.notify_election_day_event();

alter table public.voter_assistance enable row level security;
alter table public.election_day_incidents enable row level security;

create policy voter_assistance_read on public.voter_assistance for select to authenticated
using (
  private.has_role(array['admin','owner']::public.app_role[])
  or (private.is_active() and (created_by = (select auth.uid()) or team_id = private.my_team_id()))
);
create policy voter_assistance_insert on public.voter_assistance for insert to authenticated
with check (
  private.is_active()
  and created_by = (select auth.uid())
  and consent_confirmed
  and (team_id = private.my_team_id() or team_id is null)
);
create policy voter_assistance_update on public.voter_assistance for update to authenticated
using (
  private.has_role(array['admin','owner']::public.app_role[])
  or (private.is_active() and (created_by = (select auth.uid()) or team_id = private.my_team_id()))
)
with check (
  private.has_role(array['admin','owner']::public.app_role[])
  or (private.is_active() and consent_confirmed and (created_by = (select auth.uid()) or team_id = private.my_team_id()))
);
create policy voter_assistance_admin_delete on public.voter_assistance for delete to authenticated
using (private.has_role(array['admin']::public.app_role[]));

create policy election_day_incidents_read on public.election_day_incidents for select to authenticated
using (
  private.has_role(array['admin','owner']::public.app_role[])
  or (private.is_active() and (reporter_id = (select auth.uid()) or team_id = private.my_team_id()))
);
create policy election_day_incidents_insert on public.election_day_incidents for insert to authenticated
with check (
  private.is_active()
  and reporter_id = (select auth.uid())
  and resolution_status = 'submitted'
  and (team_id = private.my_team_id() or team_id is null)
);
create policy election_day_incidents_owner_update on public.election_day_incidents for update to authenticated
using (private.has_role(array['admin','owner']::public.app_role[]))
with check (private.has_role(array['admin','owner']::public.app_role[]));

grant select, insert, update, delete on public.voter_assistance to authenticated;
grant select, insert, update on public.election_day_incidents to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voter_assistance') then
    alter publication supabase_realtime add table public.voter_assistance;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'election_day_incidents') then
    alter publication supabase_realtime add table public.election_day_incidents;
  end if;
end $$;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum ('admin', 'owner', 'team');
create type public.approval_status as enum ('pending', 'active', 'rejected');
create type public.voter_preference as enum ('support', 'swing', 'refuse', 'unknown');
create type public.work_status as enum ('planned', 'in_progress', 'done');
create type public.command_priority as enum ('normal', 'urgent');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  area text check (char_length(area) <= 160),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text check (phone is null or phone ~ '^[0-9+ -]{8,18}$'),
  role public.app_role not null default 'team',
  approval_status public.approval_status not null default 'pending',
  team_id uuid references public.teams(id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_settings (
  id boolean primary key default true check (id),
  candidate_name text not null default 'Kandidat Kita' check (char_length(candidate_name) <= 120),
  election_type text not null default 'Pemilihan' check (char_length(election_type) <= 100),
  election_date date,
  total_target integer not null default 0 check (total_target >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.campaign_settings (id) values (true);

create table public.voters (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text check (phone is null or char_length(phone) <= 18),
  village text not null check (char_length(village) between 2 and 100),
  address text check (char_length(address) <= 220),
  polling_station text check (char_length(polling_station) <= 20),
  preference public.voter_preference not null default 'unknown',
  notes text check (char_length(notes) <= 500),
  team_id uuid references public.teams(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (full_name, village, polling_station)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  description text check (char_length(description) <= 1000),
  status public.work_status not null default 'planned',
  progress smallint not null default 0 check (progress between 0 and 100),
  due_date date,
  team_id uuid references public.teams(id) on delete set null,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'done' and progress = 100) or status <> 'done')
);

create table public.field_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  summary text not null check (char_length(summary) between 2 and 1500),
  report_type text not null check (report_type in ('activity', 'incident', 'survey')),
  report_date date not null default current_date,
  media_path text check (char_length(media_path) <= 500),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commands (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  message text not null check (char_length(message) between 2 and 1500),
  priority public.command_priority not null default 'normal',
  whatsapp_message text check (char_length(whatsapp_message) <= 1000),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opponent_snapshots (
  id uuid primary key default gen_random_uuid(),
  opponent_name text not null check (char_length(opponent_name) between 2 and 120),
  estimated_support numeric(5,2) not null check (estimated_support between 0 and 100),
  notes text check (char_length(notes) <= 600),
  snapshot_date date not null default current_date,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) <= 160),
  message text not null check (char_length(message) <= 500),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  row_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  occurred_at timestamptz not null default now()
);

create table public.data_backups (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  row_counts jsonb not null,
  created_at timestamptz not null default now()
);

create index voters_team_preference_idx on public.voters (team_id, preference);
create index voters_village_tps_idx on public.voters (village, polling_station);
create index voters_created_at_idx on public.voters (created_at desc);
create index activities_team_status_idx on public.activities (team_id, status);
create index field_reports_team_date_idx on public.field_reports (team_id, report_date desc);
create index commands_created_at_idx on public.commands (created_at desc);
create index opponent_snapshot_idx on public.opponent_snapshots (opponent_name, snapshot_date desc);
create index notifications_recipient_unread_idx on public.notifications (recipient_id, created_at desc) where read_at is null;
create index audit_logs_actor_date_idx on public.audit_logs (actor_id, occurred_at desc);

create or replace function private.current_profile()
returns public.profiles language sql stable security definer set search_path = '' as $$
  select p from public.profiles p where p.id = (select auth.uid()) and p.approval_status = 'active'
$$;
revoke all on function private.current_profile() from public;

create or replace function private.is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and approval_status = 'active')
$$;
create or replace function private.has_role(allowed public.app_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and approval_status = 'active' and role = any(allowed))
$$;
create or replace function private.my_team_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select team_id from public.profiles where id = (select auth.uid()) and approval_status = 'active'
$$;
revoke all on function private.is_active() from public;
revoke all on function private.has_role(public.app_role[]) from public;
revoke all on function private.my_team_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_active() to authenticated;
grant execute on function private.has_role(public.app_role[]) to authenticated;
grant execute on function private.my_team_id() to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
revoke all on function private.set_updated_at() from public;
create trigger teams_updated before update on public.teams for each row execute function private.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function private.set_updated_at();
create trigger campaign_updated before update on public.campaign_settings for each row execute function private.set_updated_at();
create trigger voters_updated before update on public.voters for each row execute function private.set_updated_at();
create trigger activities_updated before update on public.activities for each row execute function private.set_updated_at();
create trigger reports_updated before update on public.field_reports for each row execute function private.set_updated_at();
create trigger commands_updated before update on public.commands for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare first_account boolean;
begin
  perform pg_advisory_xact_lock(820260809);
  select not exists(select 1 from public.profiles) into first_account;
  insert into public.profiles(id, full_name, phone, role, approval_status, approved_at)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case when first_account then 'admin'::public.app_role else 'team'::public.app_role end,
    case when first_account then 'active'::public.approval_status else 'pending'::public.approval_status end,
    case when first_account then now() else null end
  );
  return new;
end $$;
revoke all on function private.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.audit_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare item_id uuid;
begin
  item_id := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.audit_logs(actor_id, table_name, row_id, action) values ((select auth.uid()), tg_table_name, item_id, tg_op);
  return case when tg_op = 'DELETE' then old else new end;
end $$;
revoke all on function private.audit_change() from public;
create trigger audit_voters after insert or update or delete on public.voters for each row execute function private.audit_change();
create trigger audit_activities after insert or update or delete on public.activities for each row execute function private.audit_change();
create trigger audit_reports after insert or update or delete on public.field_reports for each row execute function private.audit_change();
create trigger audit_commands after insert or update or delete on public.commands for each row execute function private.audit_change();

create or replace function private.notify_active_users()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(recipient_id, title, message, entity_type, entity_id)
  select id,
    case when tg_table_name = 'commands' then 'Komando baru' else 'Laporan lapangan baru' end,
    case when tg_table_name = 'commands' then new.title else new.title end,
    tg_table_name,
    new.id
  from public.profiles where approval_status = 'active' and id <> (select auth.uid());
  return new;
end $$;
revoke all on function private.notify_active_users() from public;
create trigger notify_command after insert on public.commands for each row execute function private.notify_active_users();
create trigger notify_report after insert on public.field_reports for each row execute function private.notify_active_users();

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.campaign_settings enable row level security;
alter table public.voters enable row level security;
alter table public.activities enable row level security;
alter table public.field_reports enable row level security;
alter table public.commands enable row level security;
alter table public.opponent_snapshots enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.data_backups enable row level security;

create policy teams_read on public.teams for select to authenticated using (private.is_active());
create policy teams_admin_insert on public.teams for insert to authenticated with check (private.has_role(array['admin']::public.app_role[]));
create policy teams_admin_update on public.teams for update to authenticated using (private.has_role(array['admin']::public.app_role[])) with check (private.has_role(array['admin']::public.app_role[]));
create policy teams_admin_delete on public.teams for delete to authenticated using (private.has_role(array['admin']::public.app_role[]));

create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()) or private.has_role(array['admin','owner']::public.app_role[]));
create policy profiles_admin_update on public.profiles for update to authenticated using (private.has_role(array['admin']::public.app_role[])) with check (private.has_role(array['admin']::public.app_role[]));

create policy settings_read on public.campaign_settings for select to authenticated using (private.is_active());
create policy settings_admin_update on public.campaign_settings for update to authenticated using (private.has_role(array['admin']::public.app_role[])) with check (private.has_role(array['admin']::public.app_role[]));

create policy voters_read on public.voters for select to authenticated using (private.has_role(array['admin','owner']::public.app_role[]) or (private.is_active() and (team_id = private.my_team_id() or created_by = (select auth.uid()))));
create policy voters_insert on public.voters for insert to authenticated with check (private.is_active() and (private.has_role(array['admin']::public.app_role[]) or team_id = private.my_team_id() or team_id is null) and created_by = (select auth.uid()));
create policy voters_update on public.voters for update to authenticated using (private.has_role(array['admin']::public.app_role[]) or (private.is_active() and (created_by = (select auth.uid()) or team_id = private.my_team_id()))) with check (private.has_role(array['admin']::public.app_role[]) or (created_by = (select auth.uid()) and (team_id = private.my_team_id() or team_id is null)));
create policy voters_delete on public.voters for delete to authenticated using (private.has_role(array['admin']::public.app_role[]));

create policy activities_read on public.activities for select to authenticated using (private.is_active());
create policy activities_insert on public.activities for insert to authenticated with check (private.is_active() and created_by = (select auth.uid()) and (private.has_role(array['admin']::public.app_role[]) or team_id = private.my_team_id() or team_id is null));
create policy activities_update on public.activities for update to authenticated using (private.has_role(array['admin']::public.app_role[]) or assignee_id = (select auth.uid()) or team_id = private.my_team_id()) with check (private.has_role(array['admin']::public.app_role[]) or assignee_id = (select auth.uid()) or team_id = private.my_team_id());
create policy activities_delete on public.activities for delete to authenticated using (private.has_role(array['admin']::public.app_role[]));

create policy reports_read on public.field_reports for select to authenticated using (private.is_active());
create policy reports_insert on public.field_reports for insert to authenticated with check (private.is_active() and reporter_id = (select auth.uid()) and (team_id = private.my_team_id() or team_id is null));
create policy reports_update on public.field_reports for update to authenticated using (private.has_role(array['admin']::public.app_role[]) or reporter_id = (select auth.uid())) with check (private.has_role(array['admin']::public.app_role[]) or reporter_id = (select auth.uid()));
create policy reports_delete on public.field_reports for delete to authenticated using (private.has_role(array['admin']::public.app_role[]) or reporter_id = (select auth.uid()));

create policy commands_read on public.commands for select to authenticated using (private.is_active());
create policy commands_insert on public.commands for insert to authenticated with check (private.has_role(array['admin','owner']::public.app_role[]) and created_by = (select auth.uid()));
create policy commands_update on public.commands for update to authenticated using (private.has_role(array['admin','owner']::public.app_role[])) with check (private.has_role(array['admin','owner']::public.app_role[]));
create policy commands_delete on public.commands for delete to authenticated using (private.has_role(array['admin']::public.app_role[]));

create policy opponents_read on public.opponent_snapshots for select to authenticated using (private.is_active());
create policy opponents_insert on public.opponent_snapshots for insert to authenticated with check (private.has_role(array['admin','owner']::public.app_role[]) and created_by = (select auth.uid()));
create policy opponents_update on public.opponent_snapshots for update to authenticated using (private.has_role(array['admin','owner']::public.app_role[])) with check (private.has_role(array['admin','owner']::public.app_role[]));
create policy opponents_delete on public.opponent_snapshots for delete to authenticated using (private.has_role(array['admin']::public.app_role[]));

create policy notifications_own_read on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
create policy notifications_own_update on public.notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy audit_admin_read on public.audit_logs for select to authenticated using (private.has_role(array['admin']::public.app_role[]));
create policy backups_admin_read on public.data_backups for select to authenticated using (private.has_role(array['admin']::public.app_role[]));
create policy backups_admin_insert on public.data_backups for insert to authenticated with check (private.has_role(array['admin']::public.app_role[]) and created_by = (select auth.uid()));

grant usage on schema public to authenticated;
grant select on public.teams, public.profiles, public.campaign_settings, public.voters, public.activities, public.field_reports, public.commands, public.opponent_snapshots, public.notifications, public.audit_logs, public.data_backups to authenticated;
grant insert, update, delete on public.teams, public.voters, public.activities, public.field_reports, public.commands, public.opponent_snapshots to authenticated;
grant update on public.profiles, public.campaign_settings, public.notifications to authenticated;
grant insert on public.data_backups to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;
revoke all on all tables in schema public from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('field-evidence', 'field-evidence', false, 20971520, array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy evidence_read on storage.objects for select to authenticated using (bucket_id = 'field-evidence' and private.is_active());
create policy evidence_insert on storage.objects for insert to authenticated with check (bucket_id = 'field-evidence' and private.is_active() and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy evidence_update on storage.objects for update to authenticated using (bucket_id = 'field-evidence' and (owner_id = (select auth.uid()::text) or private.has_role(array['admin']::public.app_role[]))) with check (bucket_id = 'field-evidence' and (owner_id = (select auth.uid()::text) or private.has_role(array['admin']::public.app_role[])));
create policy evidence_delete on storage.objects for delete to authenticated using (bucket_id = 'field-evidence' and (owner_id = (select auth.uid()::text) or private.has_role(array['admin']::public.app_role[])));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voters') then alter publication supabase_realtime add table public.voters; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activities') then alter publication supabase_realtime add table public.activities; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'field_reports') then alter publication supabase_realtime add table public.field_reports; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'commands') then alter publication supabase_realtime add table public.commands; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then alter publication supabase_realtime add table public.notifications; end if;
end $$;

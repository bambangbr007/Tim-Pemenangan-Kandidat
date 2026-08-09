create table public.tps_results (
  id uuid primary key default gen_random_uuid(),
  district text not null check (char_length(district) between 2 and 100),
  village text not null check (char_length(village) between 2 and 100),
  tps_number text not null check (char_length(tps_number) between 1 and 20),
  our_votes integer not null default 0 check (our_votes >= 0),
  opponent1_votes integer not null default 0 check (opponent1_votes >= 0),
  opponent2_votes integer not null default 0 check (opponent2_votes >= 0),
  invalid_votes integer not null default 0 check (invalid_votes >= 0),
  dpt_total integer not null check (dpt_total > 0),
  voters_present integer not null check (voters_present >= 0 and voters_present <= dpt_total),
  media_path text not null check (char_length(media_path) <= 500),
  is_key_tps boolean not null default false,
  verification_status text not null default 'submitted' check (verification_status in ('submitted', 'verified', 'disputed')),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  team_id uuid references public.teams(id) on delete set null,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tps_results_votes_within_attendance check (our_votes + opponent1_votes + opponent2_votes + invalid_votes <= voters_present),
  unique (district, village, tps_number)
);

create index tps_results_village_tps_idx on public.tps_results (village, tps_number);
create index tps_results_status_created_idx on public.tps_results (verification_status, created_at desc);
create index tps_results_reporter_idx on public.tps_results (reporter_id, created_at desc);
create index tps_results_team_idx on public.tps_results (team_id, created_at desc);

create trigger tps_results_updated before update on public.tps_results
for each row execute function private.set_updated_at();

create trigger audit_tps_results after insert or update or delete on public.tps_results
for each row execute function private.audit_change();

create or replace function private.notify_tps_result()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(recipient_id, title, message, entity_type, entity_id)
  select id,
    case when new.invalid_votes * 100 > greatest(new.voters_present, 1) * 10 then 'Anomali suara TPS' else 'Data TPS baru masuk' end,
    format('%s TPS %s: %s suara kandidat, %s tidak sah.', new.village, new.tps_number, new.our_votes, new.invalid_votes),
    'tps_results',
    new.id
  from public.profiles
  where approval_status = 'active'
    and role in ('admin', 'owner')
    and id <> new.reporter_id;
  return new;
end $$;
revoke all on function private.notify_tps_result() from public;

create trigger notify_tps_result after insert on public.tps_results
for each row execute function private.notify_tps_result();

alter table public.tps_results enable row level security;

create policy tps_results_read on public.tps_results for select to authenticated
using (
  private.has_role(array['admin','owner']::public.app_role[])
  or (private.is_active() and (reporter_id = (select auth.uid()) or team_id = private.my_team_id()))
);

create policy tps_results_insert on public.tps_results for insert to authenticated
with check (
  private.is_active()
  and reporter_id = (select auth.uid())
  and (team_id = private.my_team_id() or team_id is null)
  and verification_status = 'submitted'
  and verified_by is null
  and verified_at is null
);

create policy tps_results_owner_update on public.tps_results for update to authenticated
using (private.has_role(array['admin','owner']::public.app_role[]))
with check (private.has_role(array['admin','owner']::public.app_role[]));

create policy tps_results_admin_delete on public.tps_results for delete to authenticated
using (private.has_role(array['admin']::public.app_role[]));

grant select, insert, update, delete on public.tps_results to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('c1-evidence', 'c1-evidence', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy c1_evidence_read on storage.objects for select to authenticated
using (
  bucket_id = 'c1-evidence'
  and (owner_id = (select auth.uid())::text or private.has_role(array['admin','owner']::public.app_role[]))
);

create policy c1_evidence_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'c1-evidence'
  and private.is_active()
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy c1_evidence_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'c1-evidence'
  and (owner_id = (select auth.uid())::text or private.has_role(array['admin']::public.app_role[]))
);

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tps_results'
  ) then
    alter publication supabase_realtime add table public.tps_results;
  end if;
end $$;

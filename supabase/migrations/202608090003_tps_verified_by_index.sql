create index tps_results_verified_by_idx on public.tps_results (verified_by)
where verified_by is not null;

create index if not exists fantasypros_import_requests_time_idx
on private.fantasypros_import_requests (
  requested_at desc
);

create or replace function public.check_fantasypros_import_rate_limit(
  p_mock_draft_key text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_request_time timestamptz := now();
  requested_source_file_name text;
begin
  if current_user_id is null then
    return 'unauthorized';
  end if;

  if (
    p_mock_draft_key is null
    or p_mock_draft_key !~ '^nfl~[a-zA-Z0-9-]+$'
  ) then
    return 'invalid_mock_draft_key';
  end if;

  requested_source_file_name :=
    'fantasypros-' || substr(p_mock_draft_key, 5) || '.json';

  perform pg_advisory_xact_lock(
    hashtextextended('fantasypros_global_rate_limit', 0)
  );

  perform pg_advisory_xact_lock(
    hashtextextended(current_user_id::text, 0)
  );

  delete from private.fantasypros_import_requests as import_request
  where import_request.requested_at <
    current_request_time - interval '24 hours';

  if exists (
    select 1
    from public.imported_drafts as imported_draft
    where imported_draft.user_id = current_user_id
      and imported_draft.source_file_name =
        requested_source_file_name
  ) then
    return 'already_imported';
  end if;

  if exists (
    select 1
    from private.fantasypros_import_requests as import_request
    where import_request.user_id = current_user_id
      and import_request.mock_draft_key = p_mock_draft_key
      and import_request.requested_at >=
        current_request_time - interval '1 minute'
  ) then
    return 'duplicate_request';
  end if;

  if (
    select count(*)
    from private.fantasypros_import_requests as import_request
    where import_request.requested_at >=
      current_request_time - interval '24 hours'
  ) >= 400 then
    return 'global_daily_limit';
  end if;

  if (
    select count(*)
    from private.fantasypros_import_requests as import_request
    where import_request.user_id = current_user_id
      and import_request.requested_at >=
        current_request_time - interval '24 hours'
  ) >= 25 then
    return 'daily_limit';
  end if;

  if (
    select count(*)
    from private.fantasypros_import_requests as import_request
    where import_request.user_id = current_user_id
      and import_request.requested_at >=
        current_request_time - interval '10 minutes'
  ) >= 5 then
    return 'burst_limit';
  end if;

  insert into private.fantasypros_import_requests (
    user_id,
    mock_draft_key,
    requested_at
  )
  values (
    current_user_id,
    p_mock_draft_key,
    current_request_time
  );

  return 'allowed';
end;
$$;

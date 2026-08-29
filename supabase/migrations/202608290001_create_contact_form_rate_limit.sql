-- Tracks anonymous contact-form requests without storing raw IP addresses.
create table private.contact_form_requests (
  id bigint generated always as identity primary key,
  request_hash text not null check (
    request_hash ~ '^[a-f0-9]{64}$'
  ),
  requested_at timestamptz not null default now()
);

alter table private.contact_form_requests
enable row level security;

revoke all
on table private.contact_form_requests
from public, anon, authenticated;

create index contact_form_requests_hash_time_idx
on private.contact_form_requests (
  request_hash,
  requested_at desc
);

create or replace function public.check_contact_form_rate_limit(
  p_request_hash text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_request_time timestamptz := now();
begin
  if (
    p_request_hash is null
    or p_request_hash !~ '^[a-f0-9]{64}$'
  ) then
    return 'invalid_request_hash';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_request_hash, 0)
  );

  delete from private.contact_form_requests as contact_request
  where contact_request.request_hash = p_request_hash
    and contact_request.requested_at <
      current_request_time - interval '24 hours';

  if (
    select count(*)
    from private.contact_form_requests as contact_request
    where contact_request.request_hash = p_request_hash
      and contact_request.requested_at >=
        current_request_time - interval '24 hours'
  ) >= 10 then
    return 'daily_limit';
  end if;

  if (
    select count(*)
    from private.contact_form_requests as contact_request
    where contact_request.request_hash = p_request_hash
      and contact_request.requested_at >=
        current_request_time - interval '10 minutes'
  ) >= 3 then
    return 'burst_limit';
  end if;

  insert into private.contact_form_requests (
    request_hash,
    requested_at
  )
  values (
    p_request_hash,
    current_request_time
  );

  return 'allowed';
end;
$$;

revoke all
on function public.check_contact_form_rate_limit(text)
from public, anon, authenticated;

grant execute
on function public.check_contact_form_rate_limit(text)
to service_role;
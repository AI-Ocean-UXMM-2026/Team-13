\set ON_ERROR_STOP on
-- Local harness only. Simulate Supabase without retaining schema or test data.
begin;
create schema if not exists extensions;
alter extension pgcrypto set schema extensions;
grant usage on schema extensions to service_role;
set local role service_role;
do $$
declare
  sid uuid := gen_random_uuid();
  request_key uuid := gen_random_uuid();
  first_response jsonb;
  retry_response jsonb;
begin
  insert into public.anonymous_sessions(id) values(sid);
  first_response := public.frontend_write(sid,request_key,'start','{"entryReason":"not_sure_yet"}');
  retry_response := public.frontend_write(sid,request_key,'start','{"entryReason":"not_sure_yet"}');
  if first_response->>'attemptId' is null or first_response <> retry_response then
    raise exception 'hosted start retry did not return the original attempt';
  end if;
  if (select count(*) from public.quiz_attempts where session_id=sid) <> 1
    or (select count(*) from public.analytics_events where session_id=sid) <> 1
    or (select count(*) from public.write_receipts where session_id=sid) <> 1 then
    raise exception 'hosted retry duplicated a write';
  end if;
  begin
    perform public.frontend_write(sid,request_key,'start','{"entryReason":"too_many_interests"}');
    raise exception 'changed hosted retry was accepted';
  exception when sqlstate 'P0409' then null;
  end;
end $$;
reset role;
rollback;

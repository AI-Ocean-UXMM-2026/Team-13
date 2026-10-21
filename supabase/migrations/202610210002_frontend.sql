begin;
-- Safe to apply again: local startup also upgrades existing demo volumes.
create table if not exists app_migrations (version text primary key);
alter table quiz_attempts add column if not exists entry_reason text check(entry_reason in ('too_many_interests','not_sure_yet'));
alter table course_interests add column if not exists attempt_id uuid references quiz_attempts(id) on delete set null;
alter table advisor_leads add column if not exists attempt_id uuid references quiz_attempts(id) on delete set null;
alter table career_roles add column if not exists suggested_next_step text;
alter table advisors add column if not exists summary text not null default '';
alter table ads add column if not exists summary text not null default '';
alter table ads add column if not exists provider_name text not null default '';
create table if not exists write_receipts (
 session_id uuid not null references anonymous_sessions(id) on delete cascade,
 operation text not null, request_key uuid not null, request_hash text not null,
 response jsonb not null, created_at timestamptz not null default now(),
 primary key(session_id,operation,request_key)
);
alter table write_receipts enable row level security;
alter table app_migrations enable row level security;
revoke all on write_receipts,app_migrations from public,anon,authenticated;
grant all on write_receipts,app_migrations to service_role;
-- One transaction and lock for each logical write: no success record/event can split.
create or replace function frontend_write(p_session uuid,p_key uuid,p_operation text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare previous write_receipts; response jsonb; result_id uuid; aid uuid;
 c courses; fingerprint text := encode(digest(p_payload::text,'sha256'),'hex');
begin
 if not exists(select 1 from anonymous_sessions where id=p_session and expires_at>now()) then
  raise exception 'expired session' using errcode='P0410'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_session::text||p_operation||p_key::text,0));
 select * into previous from write_receipts where session_id=p_session and operation=p_operation and request_key=p_key;
 if found then
  if previous.request_hash<>fingerprint then raise exception 'idempotency conflict' using errcode='P0409'; end if;
  return previous.response;
 end if;
 aid := (p_payload->>'attemptId')::uuid;
 if aid is not null and not exists(select 1 from quiz_attempts where id=aid and session_id=p_session) then
  raise exception 'attempt unavailable' using errcode='P0404'; end if;
 if p_operation='start' then
  insert into quiz_attempts(session_id,entry_reason) values(p_session,p_payload->>'entryReason') returning id into result_id;
  insert into analytics_events(session_id,attempt_id,event_name) values(p_session,result_id,'quiz_started');
  response := jsonb_build_object('attemptId',result_id);
 elsif p_operation like 'interest:%' then
  select * into c from courses where id=(p_payload->>'courseId')::uuid and is_active;
  if not found then raise exception 'course unavailable' using errcode='P0404'; end if;
  if c.url is null or c.url !~ '^https?://' then raise exception 'no provider URL' using errcode='P0409'; end if;
  insert into course_interests(session_id,course_id,attempt_id) values(p_session,c.id,aid) on conflict(session_id,course_id) do nothing returning id into result_id;
  if result_id is not null then
   insert into analytics_events(session_id,attempt_id,entity_id,event_name) values(p_session,aid,c.id,'buy_interest');
  end if;
  response := jsonb_build_object('recorded',true,'url',c.url,'isDemo',c.is_demo);
 elsif p_operation like 'lead:%' then
  if not exists(select 1 from advisors where id=(p_payload->>'advisorId')::uuid and is_active) then raise exception 'advisor unavailable' using errcode='P0404'; end if;
  insert into advisor_leads(session_id,advisor_id,attempt_id,student_name,contact_method,contact_value,consent_at)
   values(p_session,(p_payload->>'advisorId')::uuid,aid,p_payload->>'studentName',p_payload->>'contactMethod',p_payload->>'contactValue',now()) returning id into result_id;
  insert into analytics_events(session_id,attempt_id,entity_id,event_name) values(p_session,aid,(p_payload->>'advisorId')::uuid,'advisor_lead_submitted');
  response := jsonb_build_object('leadId',result_id,'recorded',true,'message','Request recorded. This demo does not send messages or book appointments.');
 else raise exception 'unsupported operation'; end if;
 insert into write_receipts(session_id,operation,request_key,request_hash,response) values(p_session,p_operation,p_key,fingerprint,response);
 return response;
end $$;
revoke all on function frontend_write(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function frontend_write(uuid,uuid,text,jsonb) to service_role;
insert into app_migrations(version) values('202610210002') on conflict do nothing;
notify pgrst,'reload schema';
commit;

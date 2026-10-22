begin;
-- Additive: no existing result snapshot or answer set is changed.
alter table career_roles add column if not exists display_order integer not null default 100;
alter table career_roles add column if not exists activity jsonb check (activity is null or jsonb_typeof(activity)='object');
-- Preserve locking, receipts, ownership, and atomic success events. Demo interest
-- is a stored action, not a fake external provider navigation.
create or replace function frontend_write(p_session uuid,p_key uuid,p_operation text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare previous write_receipts; response jsonb; result_id uuid; aid uuid;
 c courses; fingerprint text := encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
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
  if not c.is_demo and (c.url is null or c.url !~ '^https?://') then raise exception 'no provider URL' using errcode='P0409'; end if;
  insert into course_interests(session_id,course_id,attempt_id) values(p_session,c.id,aid) on conflict(session_id,course_id) do nothing returning id into result_id;
  if result_id is not null then
   insert into analytics_events(session_id,attempt_id,entity_id,event_name) values(p_session,aid,c.id,'buy_interest');
  end if;
  response := jsonb_build_object('recorded',true,'url',case when c.is_demo then null else c.url end,'isDemo',c.is_demo);
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
insert into app_migrations(version) values('202610230001') on conflict do nothing;
notify pgrst,'reload schema';
commit;

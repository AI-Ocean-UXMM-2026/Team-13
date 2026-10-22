\set ON_ERROR_STOP on
begin;
do $$ begin
 if (select count(*) from quiz_questions where is_active)<>20 then raise exception 'expected 20 questions'; end if;
 if (select count(*) from quiz_options where is_active)<>85 then raise exception 'expected 85 options'; end if;
 if (select count(*) from option_category_scores)<>48 then raise exception 'expected 48 mappings'; end if;
 if exists(select 1 from quiz_questions q join quiz_options o on o.question_id=q.id join option_category_scores s on s.option_id=o.id where q.position>12) then raise exception 'context must not score'; end if;
 if exists (
  select 1 from (values
   ('career_categories'),('quiz_questions'),('quiz_options'),('option_category_scores'),
   ('career_roles'),('courses'),('advisors'),('ads'),('anonymous_sessions'),
   ('quiz_attempts'),('course_interests'),('advisor_leads'),('analytics_events'),
   ('write_receipts'),('app_migrations')
  ) required(name)
  left join pg_tables t on t.schemaname='public' and t.tablename=required.name
  where not coalesce(t.rowsecurity,false)
 ) then raise exception 'expected RLS on all 15 application tables'; end if;
 if exists(select 1 from quiz_options o left join option_category_scores s on s.option_id=o.id join quiz_questions q on q.id=o.question_id where q.position<=12 and s.option_id is null) then raise exception 'missing score'; end if;
end $$;
-- Prove RLS and table privileges block browser roles.
set local role anon;
do $$ begin
 begin perform * from quiz_attempts; raise exception 'anonymous access was allowed'; exception when insufficient_privilege then null; end;
 begin perform * from write_receipts; raise exception 'anonymous receipt access was allowed'; exception when insufficient_privilege then null; end;
 begin perform * from app_migrations; raise exception 'anonymous migration access was allowed'; exception when insufficient_privilege then null; end;
 begin perform start_quiz(gen_random_uuid()); raise exception 'anonymous RPC was allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Exercise retention with expired fixture, including cascading related data.
insert into anonymous_sessions(id,expires_at) values('00000000-0000-4000-8000-000000000001',now()-interval '1 day');
select start_quiz('00000000-0000-4000-8000-000000000001');
insert into write_receipts(session_id,operation,request_key,request_hash,response) values('00000000-0000-4000-8000-000000000001','start',gen_random_uuid(),'fixture','{}');
select cleanup_expired_data();
do $$ begin
 if exists(select 1 from anonymous_sessions where id='00000000-0000-4000-8000-000000000001') or exists(select 1 from quiz_attempts where session_id='00000000-0000-4000-8000-000000000001') or exists(select 1 from analytics_events where session_id='00000000-0000-4000-8000-000000000001') or exists(select 1 from write_receipts where session_id='00000000-0000-4000-8000-000000000001') then raise exception 'retention failed'; end if;
end $$;
-- Hosted Supabase may install pgcrypto outside public. Writes must not depend on it.
create schema if not exists migration_hash_test;
alter extension pgcrypto set schema migration_hash_test;
do $$ declare sid uuid:=gen_random_uuid(); request_key uuid:=gen_random_uuid(); first_result jsonb; replay jsonb;
begin
 if encode(sha256(convert_to('{"entryReason":"not_sure_yet"}','UTF8')),'hex') <> encode(migration_hash_test.digest('{"entryReason":"not_sure_yet"}','sha256'),'hex') then raise exception 'request hash compatibility failed'; end if;
 insert into anonymous_sessions(id) values(sid);
 first_result:=frontend_write(sid,request_key,'start','{"entryReason":"not_sure_yet"}');
 replay:=frontend_write(sid,request_key,'start','{"entryReason":"not_sure_yet"}');
 if first_result<>replay or not(first_result ? 'attemptId') then raise exception 'idempotent start failed with relocated extension'; end if;
 if (select count(*) from quiz_attempts where session_id=sid)<>1 then raise exception 'duplicate attempt'; end if;
end $$;
rollback;

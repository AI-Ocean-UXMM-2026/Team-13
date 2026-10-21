begin;
create extension if not exists pgcrypto;
create table career_categories (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code in ('R','I','A','S','E','C')),
 name text not null, description text not null, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table quiz_questions (
 id uuid primary key default gen_random_uuid(), position integer not null unique check(position between 1 and 20),
 text text not null, max_selections integer not null default 1 check(max_selections between 1 and 2),
 is_active boolean not null default true, created_at timestamptz not null default now()
);
create table quiz_options (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references quiz_questions(id),
 position integer not null check(position > 0), text text not null, value text not null,
 is_active boolean not null default true, created_at timestamptz not null default now(),
 unique(question_id,position), unique(question_id,value)
);
create table option_category_scores (
 option_id uuid not null references quiz_options(id), category_id uuid not null references career_categories(id),
 score integer not null check(score between 0 and 3), created_at timestamptz not null default now(), primary key(option_id,category_id)
);
create table career_roles (
 id uuid primary key default gen_random_uuid(), category_id uuid not null references career_categories(id),
 title text not null, description text not null, is_demo boolean not null default true,
 is_active boolean not null default true, created_at timestamptz not null default now(), unique(category_id,title)
);
create table courses (
 id uuid primary key default gen_random_uuid(), category_id uuid not null references career_categories(id),
 title text not null, summary text not null, provider text not null, price_label text not null, url text check(url ~ '^https?://[^/[:space:]]+'),
 study_option text not null check(study_option in ('university_degree','lower_cost_course','vocational_training','online_short_courses')),
 affordable boolean not null default false, flexible boolean not null default false,
 is_demo boolean not null default true, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table advisors (
 id uuid primary key default gen_random_uuid(), category_id uuid not null references career_categories(id),
 name text not null, specialty text not null, contact text, support_types text[] not null default '{}',
 is_demo boolean not null default true, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table ads (
 id uuid primary key default gen_random_uuid(), category_ids uuid[] not null check(cardinality(category_ids)>0),
 title text not null, url text check(url ~ '^https?://[^/[:space:]]+'), placement_key text not null,
 is_sponsored boolean not null default true check(is_sponsored), is_demo boolean not null default true,
 starts_at timestamptz, ends_at timestamptz, is_active boolean not null default true,
 created_at timestamptz not null default now(), check(ends_at is null or starts_at is null or ends_at > starts_at)
);
-- PostgreSQL arrays do not support ordinary foreign keys. Keep category IDs
-- valid on writes and restrict deleting a referenced category.
create function validate_ad_categories() returns trigger language plpgsql set search_path=public as $$
begin
 if exists(select 1 from unnest(new.category_ids) as c(id) where id is null or not exists(select 1 from career_categories where career_categories.id=c.id)) then
 raise exception 'unknown ad category' using errcode='23503'; end if;
 return new;
end $$;
create trigger ad_categories_valid before insert or update of category_ids on ads for each row execute function validate_ad_categories();
create function protect_ad_category() returns trigger language plpgsql set search_path=public as $$
begin
 if exists(select 1 from ads where old.id=any(category_ids)) then raise exception 'category is referenced by ad' using errcode='23503'; end if;
 if tg_op='UPDATE' then return new; end if;
 return old;
end $$;
create trigger category_ad_reference before delete or update of id on career_categories for each row execute function protect_ad_category();
create table anonymous_sessions (
 id uuid primary key, created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '90 days'
);
create table quiz_attempts (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references anonymous_sessions(id) on delete cascade,
 status text not null default 'started' check(status in ('started','completed')),
 started_at timestamptz not null default now(), completed_at timestamptz,
 answers_json jsonb, result_json jsonb, check((status='started' and completed_at is null and result_json is null) or (status='completed' and completed_at is not null and result_json is not null and answers_json is not null))
);
create index quiz_attempts_session_idx on quiz_attempts(session_id);
create table course_interests (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references anonymous_sessions(id) on delete cascade,
 course_id uuid not null references courses(id), created_at timestamptz not null default now(), unique(session_id,course_id)
);
create table advisor_leads (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references anonymous_sessions(id) on delete cascade,
 advisor_id uuid not null references advisors(id), student_name text not null check(length(student_name) between 1 and 100),
 contact_method text not null check(contact_method in ('email','phone')), contact_value text not null check(length(contact_value) between 3 and 254),
 consent_at timestamptz not null, created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '90 days'
);
create index advisor_leads_session_idx on advisor_leads(session_id);
create table analytics_events (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references anonymous_sessions(id) on delete cascade,
 attempt_id uuid references quiz_attempts(id) on delete cascade,
 event_name text not null check(event_name in ('quiz_started','quiz_completed','results_viewed','course_clicked','buy_interest','advisor_clicked','advisor_lead_submitted','explore_clicked')),
 entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '90 days',
 check(jsonb_typeof(metadata)='object' and octet_length(metadata::text)<=1024)
);
create index analytics_events_session_idx on analytics_events(session_id);
create index anonymous_sessions_expiry_idx on anonymous_sessions(expires_at);
create index analytics_events_expiry_idx on analytics_events(expires_at);
create index advisor_leads_expiry_idx on advisor_leads(expires_at);
-- No public policies: anonymous browser clients cannot read or write tables directly.
-- All access is server-side via the service role with API ownership checks.
do $$ declare t text; begin
 foreach t in array array['career_categories','quiz_questions','quiz_options','option_category_scores','career_roles','courses','advisors','ads','anonymous_sessions','quiz_attempts','course_interests','advisor_leads','analytics_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
-- Atomic writes keep successful actions and their server-owned events together.
create function start_quiz(p_session uuid) returns uuid language plpgsql security invoker set search_path=public as $$
declare a uuid; begin
 insert into quiz_attempts(session_id) values(p_session) returning id into a;
 insert into analytics_events(session_id,attempt_id,event_name) values(p_session,a,'quiz_started'); return a;
end $$;
create function complete_quiz(p_session uuid,p_attempt uuid,p_answers jsonb,p_result jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare a quiz_attempts; begin
 select * into a from quiz_attempts where id=p_attempt and session_id=p_session for update;
 if not found then return null; end if;
 if a.status='completed' then
 if a.answers_json <> p_answers then raise exception 'attempt already completed' using errcode='23505'; end if;
 return a.result_json; end if;
 update quiz_attempts set status='completed',completed_at=now(),answers_json=p_answers,result_json=p_result where id=p_attempt;
 insert into analytics_events(session_id,attempt_id,event_name) values(p_session,p_attempt,'quiz_completed'); return p_result;
end $$;
create function record_course_interest(p_session uuid,p_course uuid) returns void language plpgsql security invoker set search_path=public as $$
begin
 insert into course_interests(session_id,course_id) values(p_session,p_course) on conflict do nothing;
 if found then insert into analytics_events(session_id,entity_id,event_name) values(p_session,p_course,'buy_interest'); end if;
end $$;
create function record_advisor_lead(p_session uuid,p_advisor uuid,p_name text,p_method text,p_contact text) returns uuid language plpgsql security invoker set search_path=public as $$
declare l uuid; begin
 insert into advisor_leads(session_id,advisor_id,student_name,contact_method,contact_value,consent_at)
 values(p_session,p_advisor,p_name,p_method,p_contact,now()) returning id into l;
 insert into analytics_events(session_id,entity_id,event_name) values(p_session,p_advisor,'advisor_lead_submitted'); return l;
end $$;
create function cleanup_expired_data() returns void language sql security invoker set search_path=public as $$
 delete from analytics_events where expires_at<=now();
 delete from advisor_leads where expires_at<=now();
 delete from anonymous_sessions where expires_at<=now();
$$;
revoke all on function start_quiz(uuid),complete_quiz(uuid,uuid,jsonb,jsonb),record_course_interest(uuid,uuid),record_advisor_lead(uuid,uuid,text,text,text),cleanup_expired_data() from public,anon,authenticated;
grant execute on function start_quiz(uuid),complete_quiz(uuid,uuid,jsonb,jsonb),record_course_interest(uuid,uuid),record_advisor_lead(uuid,uuid,text,text,text),cleanup_expired_data() to service_role;
commit;

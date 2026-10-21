-- Local integration harness only. Hosted Supabase supplies these roles.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon,authenticated,service_role;

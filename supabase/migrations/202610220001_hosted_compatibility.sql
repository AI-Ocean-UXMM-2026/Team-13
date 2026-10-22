begin;
-- Supabase installs pgcrypto in extensions; the local harness uses public.
-- Preserve existing request fingerprints and receipts in either environment.
alter function public.frontend_write(uuid,uuid,text,jsonb)
  set search_path = public, extensions;
insert into public.app_migrations(version) values('202610220001') on conflict do nothing;
notify pgrst,'reload schema';
commit;

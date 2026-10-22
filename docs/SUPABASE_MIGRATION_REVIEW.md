# Supabase migration safety review — 22 October 2026

## Decision

**NO-GO for applying `202610220001_hosted_compatibility.sql` to the working hosted database based on the previous test run. NO-GO for promoting the current feature checkout as-is. Leave the running deployment unchanged.**

The earlier blanket recommendation to apply the compatibility migration was too broad. It extrapolated from an older function in a simulated local schema layout without checking the current `work` branch. There is no evidence from this audit of a current production failure requiring that migration.

No hosted Supabase connection or SQL execution was made during this audit. No application deployment was changed, and nothing was pushed or merged. All executed SQL targeted a newly created local PostgreSQL container with networking disabled, no published ports, and no shared data volume. That container and its temporary data were removed after testing. Existing local containers were left alone.

## Evidence and root cause

- Local branch: `feature/frontend_alexander`, HEAD `c0a51508c94a0164521244a8e85bc6757b05b0dd`, plus the pre-existing uncommitted changes. Repository path: `/Users/boy/Desktop/career-app`.
- Current remote `work`, verified through the remote and pinned GitHub files: `e733a13ed7f56e36e2d1c42dd5da7ad514570d10`. Local cached `work` references were older and were not used as evidence for current production source.
- GitHub records a successful Vercel status for that remote commit ([deployment status](https://vercel.com/boy-c267/career-app/7KuibGLTPKHydzNkcp1A5geKDmey)). This does not prove which deployment currently serves the production domain, what SQL is installed, or that every user journey works.
- The local frontend migration defines `frontend_write(uuid,uuid,text,jsonb)` with `SET search_path=public` and initializes its receipt fingerprint with `encode(digest(p_payload::text,'sha256'),'hex')`.
- When `pgcrypto` is installed in `extensions`, this unqualified `digest()` cannot be resolved through that function's search path. The failure occurs during local variable initialization, before session checks, locks, or receipt lookup. This breaks starts, interests, leads, and even receipt retries when that exact function/layout combination is installed.
- The proposed compatibility migration changes the function search path to `public, extensions`, adds a migration marker, and notifies PostgREST. It does not create missing tables, columns, or the function itself.
- The [pinned current work migration](https://github.com/AlexanderAung/career-app/blob/e733a13ed7f56e36e2d1c42dd5da7ad514570d10/supabase/migrations/202610210002_frontend.sql#L25) already uses `encode(sha256(convert_to(p_payload::text,'UTF8')),'hex')`. Apart from that fingerprint expression, its frontend migration matches the feature version. This uses PostgreSQL's native binary [SHA-256 function](https://www.postgresql.org/docs/17/functions-binarystring.html), rather than [pgcrypto digest](https://www.postgresql.org/docs/17/pgcrypto.html).
- The prior `scripts/verify-hosted.sql` is a local simulation: it moves the extension and writes test records inside a rolled-back transaction. Its name does not mean it inspected hosted Supabase. It must never be run against production for this review.

**Classification:** a real, conditional defect in the older SQL definition, exposed by a local-versus-hosted-style extension-layout difference. The overreach was treating that reproduction as proof of a current production defect. Branch drift matters: current `work` already contains the native-hash correction. This audit did not inspect hosted configuration or installed DDL and cannot claim an environment-variable mismatch or current production outage.

There is also a separate historical issue: the [work README](https://github.com/AlexanderAung/career-app/blob/e733a13ed7f56e36e2d1c42dd5da7ad514570d10/README.md) reports that an earlier hosted investigation found frontend tables/columns and `frontend_write` missing. That would require the reviewed frontend schema migration, not the proposed search-path-only migration. The README is historical evidence, not a fresh observation of the database.

## Can application code alone fix it?

If the installed function is already the native-hash version, no database change is needed for this digest issue.

If the installed function actually calls an inaccessible `digest()`, JavaScript cannot repair its database-side function lookup. The RPC accepts no precomputed fingerprint, and its own `SET search_path` overrides a caller's setting. Replacing the RPC with separate REST inserts would weaken transactional receipts, duplicate prevention, locking, ownership enforcement, and event atomicity. Returning success or swallowing the error would hide failed writes. No such workaround was implemented.

If the frontend tables/function are genuinely absent, the application cannot supply the missing persistence contract by changing error handling. A separately reviewed database change would be necessary. Neither case has been established on the currently running database, so no hosted migration is recommended or performed.

The feature checkout also lacks current `work`'s `requireFrontendSchema()` checks and differentiated infrastructure errors in `src/lib/db.ts`, `src/lib/service.ts`, and `src/lib/validation.ts`. Replacing `work` with this checkout would remove those protections. Reconcile those changes before a promotion review.

The inspected Vercel build command is only `next build --webpack`; it does not apply SQL. Merely deploying application code does not replace an installed SQL function. Reapplying the older frontend migration separately could, however, restore the digest dependency.

## Tests actually executed in this audit

Database engine: PostgreSQL 17.11, UTF8. Each scenario used a fresh database in the disposable container and the repository's initial migration, demo seed, and enrichment. The extensions-layout fixtures explicitly granted schema usage to the local service role.

| Function version | pgcrypto schema | Compatibility migration | Result |
| --- | --- | --- | --- |
| Feature's older digest version | public | No | Passed |
| Feature's older digest version | extensions | No | Expected SQLSTATE 42883 reproduced; no action/event/receipt records created |
| Feature's older digest version | extensions | Yes, local container only | Passed |
| Current work native-hash version | public | No | Passed |
| Current work native-hash version | extensions | No | Passed |

**97 assertions passed**, including the expected-failure checks. Coverage included start/interest/lead receipt replay, changed-payload conflict rejection, eight simultaneous retries producing one attempt/event/receipt, expired/missing sessions, cross-session attempt rejection, action linkage, consent timestamps, absence of contact data in analytics, transaction rollback on constraint failure, RLS on all 15 application tables, denied anon/authenticated RPC and lead-table access, and security-invoker preservation.

Each successful variant also compared 512 ASCII/Unicode/JSON payload fingerprints. Hashes matched in UTF8. A receipt created using the old digest version was replayed after installing the pinned work definition and moving the extension; the response, duplicate prevention, and changed-payload conflict behavior were preserved.

The following checks ran on a fresh temporary copy of the current feature working tree, excluding environment files and stripping database variables from the subprocess environment:

| Command | Actual result |
| --- | --- |
| `npm test` | 22 passed, 0 failed |
| `npm run lint` | Exit 0 |
| `npm run typecheck -- --incremental false` | Exit 0 |
| `npm run build` | Exit 0; optimized production build completed |

Dependencies were copied from the previous isolated lockfile installation. **A fresh npm install/audit, browser E2E, HTTP integration suite, live Vercel health check, and hosted database inspection were not run in this audit.** Previous browser/API results are historical and are not counted as current verification. The full current `work` application was not built; its pinned SQL was tested.

Local audit artifacts: `/private/tmp/wayfinder-schema-review-rwug7pam/`, including `schema_review.py`, `schema-results.json`, `schema-run.log`, `expected-error.txt`, `static-results.json`, `unit.log`, `lint.log`, `typecheck.log`, `build.log`, `source-hashes.json`, and the pinned work SQL snapshot.

## Safe read-only verification steps for the owner

These steps are instructions only; none were executed against hosted Supabase in this audit.

1. Open Vercel's current Production deployment details. Record the Git commit, branch, and assigned production domain. Compare the commit with `e733a13ed7f56e36e2d1c42dd5da7ad514570d10`. Do not redeploy or change settings.
2. Inspect the Production `SUPABASE_URL` project identity and compare it with the Supabase project being inspected. Check that Preview is not inadvertently using Production. Do not reveal or copy service-role secrets into logs or chat.
3. In Supabase's database-function viewer, inspect the definition and configuration of `public.frontend_write(uuid,uuid,text,jsonb)` without executing it. Look for the native `sha256(convert_to(...,'UTF8'))` expression versus `digest(...,'sha256')`. If catalog queries are preferred, the following contains only metadata reads inside an explicitly read-only transaction:

```sql
begin read only;

select current_database(),
       current_setting('server_version') as server_version,
       current_setting('server_encoding') as server_encoding;

select e.extname, n.nspname as extension_schema
from pg_catalog.pg_extension e
join pg_catalog.pg_namespace n on n.oid = e.extnamespace
where e.extname = 'pgcrypto';

select pg_catalog.to_regprocedure(
         'public.frontend_write(uuid,uuid,text,jsonb)'
       ) as frontend_write,
       pg_catalog.to_regprocedure('pg_catalog.sha256(bytea)') as native_sha256,
       pg_catalog.to_regclass('public.app_migrations') as app_migrations,
       pg_catalog.to_regclass('public.write_receipts') as write_receipts;

select p.oid::regprocedure as function_signature,
       p.proconfig as function_settings,
       p.prosecdef as security_definer,
       pg_catalog.pg_get_functiondef(p.oid) as function_definition,
       pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       pg_catalog.has_function_privilege('service_role', p.oid, 'EXECUTE') as service_execute
from pg_catalog.pg_proc p
where p.oid = pg_catalog.to_regprocedure(
  'public.frontend_write(uuid,uuid,text,jsonb)'
);

select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (
    ('quiz_attempts','entry_reason'),
    ('course_interests','attempt_id'),
    ('advisor_leads','attempt_id'),
    ('write_receipts','request_hash'),
    ('app_migrations','version')
  )
order by table_name, column_name;

rollback;
```

4. Interpret the metadata: native hash plus the required schema means the proposed search-path patch is unnecessary for this issue. Digest plus `search_path=public` plus pgcrypto in `extensions` confirms the conditional defect in the installed function. Missing function/tables is a different incomplete-schema issue. Migration marker `202610210002` alone cannot distinguish the two function bodies because both versions use that marker.
5. Review existing Vercel/Supabase logs for SQLSTATE `42883` with the digest message, or missing-function/table/column errors. Do not generate test starts, interests, leads, or cleanup calls in production. A read-only health response or successful build alone does not establish write correctness.
6. Retain the working deployment while reconciling source differences. Any later migration or write-journey validation belongs in a separately authorized change with an isolated staging database and a newly reviewed deployment revision.

## Changes and remaining risks

This audit changed documentation only: `README.md`, `docs/VERCEL_DEPLOYMENT.md`, and this report. It corrected the blanket hosted migration recommendation and separated historical tests from the present findings. No application source, SQL migration, permissions, or local-launcher behavior was changed in this audit. Existing uncommitted changes from earlier work, including the proposed migration and its local-harness wiring, remain pending and are **not approved for promotion**.

Installed hosted SQL, schema privileges, production environment identity, and the exact serving deployment remain unverified. The local hash-equivalence checks assume UTF8. The compatibility patch was tested with local schema grants; that does not validate hosted grants or every object in a hosted search path.

Existing limits also remain: per-process rate limiting is not shared across Vercel instances; session UUIDs are bearer identifiers; advisor requests only store data; and expiry requires an operational cleanup schedule. No new runtime behavior or security exposure was introduced by the documentation-only changes.

**Release gate:** retain current production. Reconcile the feature branch with current work's schema/error-handling fixes, confirm installed metadata through read-only inspection, and validate the reconciled revision against an isolated staging database before reconsidering promotion. There is no basis to apply the proposed third migration to the working deployment now.


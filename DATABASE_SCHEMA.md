# Database schema

Migrations: `supabase/migrations/202610210001_initial.sql`, then `supabase/migrations/202610210002_frontend.sql`. Seed: `supabase/seed.sql`, followed by `supabase/demo_enrichment.sql`. Existing local volumes upgrade without deleting records.

All entity tables use UUID primary keys and creation timestamps (attempts use `started_at`); the score mapping has a composite key and timestamp. Content tables have `is_active`; demo listings have `is_demo`.

| Table | Important fields and relationships |
| --- | --- |
| career_categories | Unique code R/I/A/S/E/C, name, description |
| quiz_questions | Unique position 1–20, exact English text, max_selections 1–2 |
| quiz_options | FK question_id; text, normalized value; unique question/position and question/value |
| option_category_scores | Composite PK option_id/category_id, both FKs; score 0–3 |
| career_roles | FK category_id, title, description, suggested_next_step; unique category/title |
| courses | FK category_id; title, summary, provider, price_label, URL, study_option, affordable, flexible |
| advisors | FK category_id; demo name, specialty, summary, contact (not returned by public listing/detail), support_types |
| ads | category_ids UUID array, title, summary, provider_name, URL, placement_key, is_sponsored always true, optional starts_at/ends_at |
| anonymous_sessions | Browser-generated UUID, created_at, expires_at (90 days) |
| quiz_attempts | FK session_id; optional entry_reason (two approved values), status started/completed, started_at/completed_at, answers_json/result_json |
| course_interests | FKs session_id/course_id, optional originating attempt_id, unique session/course (first association retained) |
| advisor_leads | FKs session_id/advisor_id, optional originating attempt_id; student_name, email/phone contact_method, contact_value, consent_at, expires_at |
| analytics_events | FK session_id, optional FK attempt_id, approved event_name, optional entity_id, small metadata object, expires_at |

Two additional private tables support the frontend:

- `write_receipts`: composite primary key `(session_id, operation, request_key)`, normalized request hash, non-contact success response, created_at. Session deletion cascades receipts. Operations include the target entity. No duplicate lead contact payload is stored here.
- `app_migrations`: version markers for additive migrations; no browser access.

Action attempt foreign keys use `ON DELETE SET NULL`; API/RPC checks enforce the supplied session owns the attempt before any new write. The idempotent SQL function validates ownership in the transaction.

Ads can reference multiple categories without an extra join table; triggers validate array references on writes and restrict deletion of an ad-referenced category. Content foreign keys otherwise restrict deletion. API validation checks polymorphic analytics entity references against active courses/advisors. Database checks constrain status/completion consistency, quiz positions and cardinality limits, scores, study types, lead field sizes, event names, metadata object type/size, URL scheme prefixes, and ad date order. API URL validation additionally rejects malformed URLs and URL credentials.

Primary/unique keys provide lookup indexes. Additional indexes cover attempts/leads/events by session and session/lead/event expiry. Interest uniqueness begins with session_id. The demo dataset is deliberately small; review additional category FK indexes as inventory grows.

## Access and atomicity

RLS is enabled on all 15 tables. No public access policies exist; table privileges are revoked from `anon` and `authenticated`. Browsers use the Next.js API exclusively. The server-only Supabase service role has table privileges and bypasses RLS; the API validates session ownership before accessing an attempt. Never expose that key or use it in the frontend.

RPCs `start_quiz`, `complete_quiz`, `record_course_interest`, and `record_advisor_lead` atomically write the action and its server-owned event. Only service_role receives execute permission. Completion locks the attempt row; identical retries return the stored result; differing retries conflict. Course interest is unique by session/course, with `buy_interest` recorded once. The API uses `frontend_write` for start/interest/leads: an advisory transaction lock and private receipt enforce identical-key replay and changed-body conflicts atomically. New advisor keys create individual requests; replayed keys return the original lead. Legacy RPCs remain restricted to service_role for compatibility. No email or booking occurs.

## Retention

All session-linked foreign keys cascade on session deletion. Expiry is anchored to session creation, not extended on visits. Access to an expired session returns 410 and the frontend should generate a new UUID. Leads and events also have individual 90-day expiry. Run daily as a privileged database operator:

```sql
select public.cleanup_expired_data();
```

This removes expired events/leads and sessions, cascading attempts/interests/leads/events/write receipts. Scheduling is not installed automatically; use a Supabase scheduled job or run manually for the demo. Records may remain physically stored after expiry until cleanup runs. Sessions are pseudonymous bearer identifiers, not authentication; anyone with a session UUID can access its records through the API.

## Seed and verification

Deterministic UUIDs make seeding repeatable. Seed includes 6 categories, exactly 20 questions, 85 options, 48 scoring mappings, 6 roles, 12 courses, 6 advisors, 6 sponsored ads. All courses/advisors/ads are explicitly demo content. `example.com` URLs are reserved mock destinations, not real provider or purchase links; demo advisor addresses do not contact anyone. Replace before public launch.

`scripts/verify.sql` checks counts, scoring separation, RLS/privilege restrictions, and retention cascade in a rolled-back transaction. Run only on an isolated development database. `compose.yaml` supplies local PostgreSQL/PostgREST roles for development; do not apply `scripts/local-roles.sql` to hosted Supabase, which manages its own roles.

## Interest-area extension

Optional local demo enhancement `202610230001_interest_areas.sql` adds `career_roles.display_order` and nullable JSON `activity` (title, minutes, steps), and updates the write RPC to accept demo courses with no URL. Its marker is not required by application readiness. `supabase/career_examples.sql` supplies 18 local example careers, preserving original IDs and real records, and clears fictional course URLs. Saved quiz snapshots are not rewritten. The app also supports the existing frontend schema without these fields or this content; neither file is required or authorized for the hosted quiz fix.

# Wayfinder — Career Guidance MVP

A responsive student-facing career exploration demo in one Next.js App Router + TypeScript project. The complete flow is landing → 20-question quiz → server recommendations → courses/advisors/local exploration → confirmed next action. Work remains on `feature/frontend_alexander`; backend files stay in their existing locations.

The English quiz follows the finalized 20-question source. Q15/Q17 allow one or two answers; the other questions require one. Results are exploratory suggestions, not a validated career assessment. Courses, advisors, ads, and exploration activities are explicitly fictional demo content. Advisor requests are stored without sending a message or booking an appointment. Public deployment is deferred.

## Run locally

Requirements: Node.js 22+ (developed with 24.3), npm, and Docker Desktop running.

```sh
npm ci
npm run dev:local
```

Open [Wayfinder](http://localhost:3000). [Health](http://localhost:3000/api/health) and [quiz JSON](http://localhost:3000/api/quiz) are available for diagnostics.

`dev:local` starts the isolated PostgreSQL/PostgREST containers, initializes new volumes with migrations and demo seed, upgrades existing volumes with `202610210002_frontend.sql`, applies demo enrichment, starts the REST gateway, and serves the app on port 3000. It uses public local-demo credentials in process memory and always targets the local database, regardless of hosted shell variables or `.env.local`. No Supabase account or environment file is required for this mode.

Ports 3000, 54321, and 54322 must be free. Start only one dev launcher. Ctrl+C stops the app and gateway; `npm run db:stop` stops Docker containers while retaining data. Restart with `npm run dev:local`. Never delete the volume just to apply a migration.

The Docker setup is a local PostgreSQL/PostgREST harness, not a full Supabase installation; it provides no dashboard, Auth, or Storage. Do not expose it publicly.

## Environment and database

The standard `npm run dev` and `npm start` commands use server environment variables:

- `SUPABASE_URL`: Supabase project URL, or `http://127.0.0.1:54321` with the local gateway running.
- `SUPABASE_SERVICE_ROLE_KEY`: backend-only service-role credential. Never expose it using `NEXT_PUBLIC_*`, browser code, version control, or chat.
- `FRONTEND_ORIGIN`: optional exact origin for a separate cross-origin API client. The included same-origin frontend does not need it.

Next.js loads `.env.local`, which is Git-ignored. For a manual environment, copy `.env.example` and configure it privately. An existing local `.env.local` may contain the public demo credential; it is not a hosted credential. This project needs no browser Supabase key.

For an existing local volume, `dev:local` applies the additive upgrade without removing records. For manual upgrades:

```sh
docker compose exec -T postgres psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/202610210002_frontend.sql
docker compose exec -T postgres psql -U postgres -v ON_ERROR_STOP=1 < supabase/demo_enrichment.sql
```

For a future fresh hosted Supabase project, apply these SQL files in order using the SQL Editor or a trusted database connection:

1. `supabase/migrations/202610210001_initial.sql`
2. `supabase/migrations/202610210002_frontend.sql`
3. `supabase/seed.sql`
4. `supabase/demo_enrichment.sql`

The initial migration runs once; the additive migration and enrichment can be reapplied. Review demo seed updates before rerunning them against edited content. Do not apply `scripts/local-roles.sql` to hosted Supabase, which supplies its own roles. RLS is enabled on every application table; browser roles have no table access. All persistence goes through server-side API handlers.

## Checks

With the local app running, use another terminal:

```sh
npm test                         # backend and frontend utility tests
npm run lint                     # TypeScript source lint
npm run typecheck                # strict TypeScript
npm run test:integration:local    # original 43-assertion API journey
npm run test:frontend:integration # concurrency, attempt linkage, details, privacy
npx playwright install chromium  # once per machine
npm run test:e2e                  # mobile and desktop browser journeys
```

Browser tests cover quiz refresh/back navigation, multi-select, successful actions, empty/failed resources, nonblocking analytics, form failure/consent, session ownership, storage denial, keyboard controls, and horizontal overflow. They use fictional data and remove their test sessions afterward. Screenshots and failure traces go to ignored `test-results/`; traces may contain fictional test contact values. Tests are for this isolated local demo only.

Database verification runs inside a rolled-back transaction:

```sh
docker compose exec -T postgres psql -U postgres -v ON_ERROR_STOP=1 < scripts/verify.sql
```

Stop the dev server before a production build, so the commands do not share `.next` output:

```sh
npm run build
npm start
```

With local environment settings, keep the REST gateway and Docker database running for `npm start`.

## Frontend structure and design

- `src/app`: routes, root layout, metadata, shared styles, and existing API handlers.
- `src/components`: focused interactive screens and shared loading/error primitives.
- `src/lib/frontend`: runtime wire schemas, typed adapters, API client, anonymous session/storage, quiz drafts, analytics, and local demo activities.
- `src/lib/service.ts`, `db.ts`, `scoring.ts`, `validation.ts`: server services, persistence, authoritative scoring, and input validation.
- `supabase`: incremental schema migrations, deterministic seed, and demo content enrichment.

The CSS tokens in `src/app/globals.css` use paper `#faf9f5`, ink `#203d35`, muted text `#68756c`, green `#245b4a`, mint `#e7eee4`, and coral `#efae97`. Components share an 18px radius token, restrained shadows, a spacing scale based on roughly 4px increments, sans-serif text, and Georgia italic accents. Layouts use one column on mobile and focused grids on larger screens. Reduced motion, visible keyboard focus, semantic radio/checkbox controls, and a skip link are included. No external font or illustration network dependency is required.

## Persistence, retries, and analytics

Anonymous session UUIDs and quiz drafts are kept in browser storage, with an in-memory fallback and warning if storage is blocked. Unfinished drafts expire seven days after their last update; incompatible questions/options require a restart. Contact form values stay in page memory and are cleared on confirmed success. Exploration completion is saved only in this browser, not in backend results.

The UI sends persistent `Idempotency-Key` values for starts and action writes. Repeated identical keys reuse the original result and do not duplicate success events; changed payloads conflict. New advisor requests get new keys. Course interest remains unique per session/course: the first write retains its originating attempt and emits `buy_interest` once, even if the student revisits through another attempt. Each accepted request key has a receipt. Quiz completion retains its existing snapshot-based retry behavior.

Results views count once per attempt per browser tab, including reloads and revisits. New tabs can count another view. The view marker is set before sending; analytics failures are not retried and may undercount. Event requests use keepalive for navigation/reload resilience. Course/advisor/explore clicks represent actual interactions; opening a course card and then initiating interest are separate clicks. Client analytics are limited to the existing safe event/metadata allowlist and never include raw answers or contact form values. Successful action events remain server-owned.

## Demo limits and future release

The browser UUID is a pseudonymous bearer identifier, not authentication. Anyone who obtains it can access that session's results. Scoring follows the existing documented rules and is not career science. An in-memory limiter permits 120 requests/minute per apparent IP per process; a trusted proxy and shared limiter are needed before public multi-instance hosting. There is no email delivery, booking, payment, login, admin interface, or public deployment in this scope.

Sessions expire 90 days after creation. Deleting them cascades attempts, action records, events, and write receipts. Individual leads/events also have 90-day expiry. Browser draft cleanup does not replace backend retention. Schedule or manually run the existing privileged cleanup function:

```sql
select public.cleanup_expired_data();
```

No cleanup schedule is installed automatically. Public hosting, real advisor/provider records, actual contact routing, public-launch consent review, and reviewed Burmese translations remain future work.

See [API_CONTRACT.md](API_CONTRACT.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [SCORING_LOGIC.md](SCORING_LOGIC.md), [frontend PRD](docs/source/frontend_prd.md), and [implementation notes](docs/FRONTEND_READINESS.md).

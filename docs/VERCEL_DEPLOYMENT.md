# Vercel deployment readiness

**Deployment hold — see the [Supabase migration safety review](SUPABASE_MIGRATION_REVIEW.md).** The earlier blanket instruction to apply `202610220001_hosted_compatibility.sql` to the working hosted database is withdrawn. Current remote `work` already uses native SHA-256. No hosted SQL was inspected or executed in the safety review, so no hosted migration is approved.

The historical checks below used `feature/frontend_alexander`, based on commit `c0a5150`, with uncommitted working-tree changes. They are not verification of the current production deployment or approval to replace `work`. The new review records the checks actually rerun and the branch differences that must be reconciled.

## Pending working-tree changes

- The proposed compatibility migration addresses only the older digest-based function when pgcrypto is outside its search path. Current remote `work` already avoids that dependency. Leave this proposal pending while verifying installed metadata; do not apply it to the working hosted database based on the earlier test.
- Node.js is pinned to `24.x`, matching the earlier tested major version.
- Advisor consent describes storage in this app's database rather than promising a local database.
- SQL verification checks each required application table for RLS without assuming no other application tables exist in the database.

## Vercel project settings

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the framework default |
| Node.js version | `24.x` (also pinned in `package.json`) |
| Production branch | Select the intended branch after publishing it; the planned name is `main` |

Next.js API handlers need the Node.js runtime and a reachable hosted database. The local Docker/PostgREST stack is only a test harness and is not deployed by Vercel. No static export or custom `vercel.json` is needed for this app. See [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) and [Vercel request headers](https://vercel.com/docs/headers/request-headers).

Set these server variables separately for Preview and Production in [Vercel's environment settings](https://vercel.com/docs/environment-variables):

- `SUPABASE_URL`: the HTTPS project URL for the database intended for that environment.
- `SUPABASE_SERVICE_ROLE_KEY`: the matching server-only service-role key. Do not add a `NEXT_PUBLIC_` prefix or commit the value.
- `FRONTEND_ORIGIN`: leave unset for the included same-origin frontend. Set an exact origin only when a separate API client needs access.

Use a separate test database for Preview if preview users should not write into production data. Local demo credentials and `127.0.0.1` URLs will not work on Vercel. Redeploy after changing environment variables.

## Database assessment

Follow the [review's read-only verification steps](SUPABASE_MIGRATION_REVIEW.md#safe-read-only-verification-steps-for-the-owner) to identify the serving revision, intended Supabase project, installed function body, and frontend schema. Do not reapply SQL or seed data to the working hosted database during this review.

The older frontend migration calls `digest()` with `search_path=public`. The proposed third migration extends that path. Current remote `work` instead uses native SHA-256 and passes local tests with pgcrypto in either `public` or `extensions` without the third migration. A missing frontend schema is a separate issue that the search-path patch cannot repair.

The local launcher and Compose still contain the earlier proposed migration wiring. Those changes remain pending; this review did not alter SQL or local startup behavior. Vercel's configured `npm run build` does not apply SQL migrations.

## Historical verification results

These are results recorded by the earlier local validation run. Only the checks explicitly listed in the new safety review were rerun for this audit.

| Check | Result |
| --- | --- |
| Clean lockfile install (`npm ci`) | Passed in an isolated temporary copy |
| Unit/regression tests | 22 passed |
| ESLint and strict TypeScript | Passed |
| Optimized production build | Passed without database credentials at build time |
| Original API journey | 43 HTTP assertions and stored-record checks passed |
| Frontend API integration | Concurrent retries, conflicts, attempt linkage, ownership, contact validation, and event privacy passed |
| Chromium browser journeys | 24 passed across mobile and desktop projects |
| Database verification | Fresh hosted-layout install, RLS/privileges, retention cascades, and hosted idempotent writes passed |
| Production HTTP checks | HTTPS forwarding, origin rejection, no-store, preflight, malformed/oversized bodies, method rejection, 404, and rate limiting passed |
| Missing environment settings | Pages start; API returns sanitized `503 NOT_CONFIGURED` |
| npm audit | No known vulnerabilities reported in production or development dependencies |
| Browser bundle inspection | No service-role environment name or local signing string found in static bundles |

Production validation used a separate build/server to avoid sharing `.next` with development. Browser tests cover the complete quiz/results/action flow, refresh/back navigation, multi-select constraints, storage denial, API failures, consent, keyboard interaction, and responsive overflow. The suite runs Chromium with mobile and desktop viewport settings; it does not establish coverage for Safari/WebKit or Firefox.

To repeat standard checks, run `npm test`, `npm run lint`, and `npm run typecheck`. With the local harness running, run `npm run test:integration:local`, `npm run test:frontend:integration`, and `npm run test:e2e`. Stop development before running `npm run build` in the same checkout. Run both SQL checks against the local harness:

```sh
docker compose exec -T postgres psql -U postgres -v ON_ERROR_STOP=1 < scripts/verify.sql
docker compose exec -T postgres psql -U postgres -v ON_ERROR_STOP=1 < scripts/verify-hosted.sql
```

`verify-hosted.sql` temporarily moves the extension and rolls back all changes. It is intended for the local harness, not the live hosted database.

## Promotion gate

Promotion remains **NO-GO for the current feature checkout as-is**. Current `work` includes schema-readiness checks and infrastructure-error handling absent from this checkout, as well as the native-hash SQL definition. Reconcile these differences and verify installed metadata before considering a release.

Any future write-journey checks must use a separately authorized, isolated staging database. No production test writes, database migration, merge, push, or deployment were performed during the safety review. A healthy GET endpoint and a successful build do not prove the installed write function is compatible.

## Remaining public-use limits

The limiter is in process memory. Its 120-request limit works within one process, but Vercel instances do not share it. A shared limiter or suitable edge protection is still needed for reliable public abuse control. The local tests are not a load test or a guarantee of multi-instance behavior.

Sessions use browser UUIDs as bearer identifiers, without login. Anyone who obtains an identifier can access that session's results. Advisors/courses are fictional, provider links are examples, and requests are stored without delivery or booking. Hosting does not change those behaviors; use fictional contact values while evaluating the demo.

Expiry fields do not delete data automatically. An operational cleanup schedule remains a separate release requirement; do not invoke cleanup or change production scheduling during this read-only review. Real-student use still requires appropriate access controls, operational monitoring, and reviewed contact/privacy handling for that use.

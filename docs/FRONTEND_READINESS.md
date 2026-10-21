# Frontend readiness and approved scope

The frontend and approved backend extensions are implemented for the local demo. The user approved the decisions below on 21 October 2026. Verification includes 15 unit tests, 10 Chromium mobile/desktop browser tests, the original 43-assertion API suite, concurrent-write/ownership integration checks, and SQL privacy/retention checks.

## Project structure

Work only on `feature/frontend_alexander`. Reuse this Next.js App Router + TypeScript project and same-origin `/api` routes. Keep `src/app/api`, `src/lib`, and `supabase` where they are; do not move the current project into a `backend/` folder. Add frontend pages, layout, styles, components, public wire types, and typed adapters alongside the existing backend.

Run the existing backend with `npm run dev:local`. It uses a local PostgreSQL/PostgREST Docker harness, not full Supabase. Hosted deployment is outside this scope.

## Approved decisions

| Decision | Selected behavior | Implementation status |
| --- | --- | --- |
| Quiz | Existing English 20-question quiz; Q15/Q17 accept one or two answers | Implemented |
| Duration copy | “20 questions, at your own pace” | Implemented |
| API formats | Preserve `optionIds` arrays, nested `result`, RIASEC code filters, `is_demo`, snake_case catalog fields, and ads grouped by placement key; use typed adapters | Implemented; wire schemas validated with Zod |
| Start | Persist entry reason and support durable idempotency keys for safe retries | Implemented with transactional receipts |
| Action writes | Link course interest/leads to an owned attempt when supplied; persistent retry protection prevents duplicate writes/events | Implemented in the incremental migration and service |
| Contact methods | Phone and email only | Implemented; Telegram remains excluded |
| Missing content | Add labelled demo advisor summaries, ad descriptions/provider names, and per-role next-step suggestions | Implemented with demo enrichment |
| Detail routes | Add dedicated public course/advisor GET endpoints | Implemented |
| Exploration | Frontend demo activities keyed by seeded role IDs; completion stored only in this browser with memory fallback | Implemented; no activity API added |
| Analytics | Existing four frontend events and metadata allowlist; one results view per attempt per browser tab | Implemented; keepalive event delivery and per-tab deduplication |
| Visual design | Approachable mobile-first UI, clear typography, rounded cards, restrained color | Implemented |
| Quiz drafts | Seven-day expiry after last update; never persist contact form values | Implemented with storage-denial fallback |
| Release | Local demo, fictional sample content, explicit storage-only advisor confirmation | Implemented locally; no public deployment |

See [frontend PRD v1.1](source/frontend_prd.md) for the revised requirements and planned endpoint additions. [API_CONTRACT.md](../API_CONTRACT.md) remains the description of the currently implemented API including the implemented additions.

## Implementation structure

1. Add incremental migrations and server changes for entry reasons, safe retries, attempt-linked action records, demo content fields, and detail GET endpoints. Preserve existing scoring, completion retry behavior, and session ownership.
2. Update runtime schemas, public TypeScript wire types, contract docs, and integration tests together. Apply migrations to the existing local volume without deleting its data.
3. Add frontend layout/styles, API adapters, anonymous session handling, seven-day drafts, and per-tab view deduplication.
4. Build landing → quiz → results, then options, course interest, consented advisor leads, and local exploration completion.
5. Add frontend lint/component/E2E tooling and verify mobile layout, keyboard access, storage failures, uncertain writes, and the complete local flow. Existing backend tests do not constitute frontend coverage.

Public hosting, real providers/advisors, actual contact delivery, reviewed Burmese translations, and final public-launch consent are deferred. The local consent text must describe demo storage without implying advisor delivery.

## Verification and deliberate demo limits

The complete flow and failure states are tested in `tests/e2e/journey.spec.ts` on Chromium with mobile and desktop viewports. Utility checks live in `tests/frontend.test.ts`. API concurrency/ownership checks are in `scripts/frontend-integration.ts`. Screenshots and failure traces are ignored local artifacts.

Analytics use a per-tab marker before sending and keepalive; failures never block the main flow and are not retried, so counts may be lower during network failures. Course interest remains unique per session/course, retaining its first originating attempt. New advisor submissions use new keys; identical retry keys reuse the original stored lead. Exploration completion is browser-only. No real advisor is contacted and no public deployment has occurred.

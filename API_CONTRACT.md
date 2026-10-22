# API contract v1.1

JSON API, no login. The frontend lives in this same Next.js project and uses same-origin routes. Generate `crypto.randomUUID()` once, persist it in localStorage, and send `X-Session-ID` for every session-associated request. Treat the UUID as private pseudonymous identification; it is not authentication. Missing/invalid session IDs return 400; expired sessions return 410. Do not use shared/predictable IDs.

All POST requests require `Content-Type: application/json`. Unknown body keys are rejected. Requests are limited to 16 KB; metadata uses an explicit allowlist. Cross-origin clients must match `FRONTEND_ORIGIN` exactly (scheme, hostname, port). OPTIONS preflight is supported on every route. All responses use `Cache-Control: no-store`.

| Endpoint | Request | Success |
| --- | --- | --- |
| GET /api/quiz | No session required | 200 `{questions: Question[]}` |
| POST /api/quiz/start | Session header, optional `{entryReason}`; idempotency header | 201 `{attemptId: UUID}`; creates session if needed and records quiz_started |
| POST /api/quiz/complete | Session header, `{attemptId, answers: Answer[]}` | 200 `{attemptId, result: Result}`; atomic completion and quiz_completed |
| GET /api/results/:attemptId | Session header | 200 `{attemptId, result: Result}` for owned completed attempt |
| GET /api/courses | Optional `?category=I,C` | 200 `{courses: Course[]}` |
| POST /api/courses/:courseId/interest | Session header, optional `{attemptId}`; idempotency header | 200 `{recorded:true,url,isDemo}` after persistence and buy_interest |
| GET /api/courses/:courseId | No session required | 200 `{course: Course}`; active public record only |
| GET /api/advisors | Optional `?category=I,C` | 200 `{advisors: Advisor[]}` |
| GET /api/advisors/:advisorId | No session required | 200 `{advisor: Advisor}`; active public fields only |
| POST /api/advisors/:advisorId/leads | Session header, lead body below; idempotency header | 201 `{leadId,recorded:true,message}` after lead and advisor_lead_submitted |
| GET /api/ads | Required `?category=I,C` | 200 `{placements: {[placementKey]: SponsoredAd[]}}` |
| POST /api/events | Session header, event body below | 201 `{recorded:true}` |
| GET /api/health | No session required | 200 `{status:'ok',database:'reachable'}`; 503 if missing config, database unreachable, frontend migration absent, or categories unseeded |

Categories are the six **codes** `R,I,A,S,E,C` (comma-separated, max six). The PRD's `technology` query was illustrative; it is not a RIASEC code. No pre-existing frontend API existed to preserve. Courses/advisors without a filter return all active records. Use result.topCategories for related listings. Ads require a category filter, respect active status and dates (inclusive start/exclusive end), and are always separate sponsored placements.

## Quiz and result types

Public types use camelCase for the quiz envelope; database listing fields use snake_case. Full domain types: `src/lib/types.ts`; runtime input schemas: `src/lib/validation.ts`.

```ts
type Question = {
  id: string; position: number; text: string; maxSelections: 1 | 2;
  options: {id:string; text:string; value:string; position:number}[];
};
type Answer = {questionId:string; optionIds:string[]};
```

Submit exactly one Answer per each of the 20 active questions. Q15/Q17 accept one or two options; all others exactly one. Question and option IDs must be UUIDs from GET /api/quiz; no duplicates, unknown IDs, or options from another question. Submit option IDs, never scores or recommendations. The public quiz includes normalized values for frontend display/state but no scoring weights.

```json
{
  "attemptId": "<UUID returned by start>",
  "answers": [
    {"questionId": "<Q1 UUID>", "optionIds": ["<Q1 option UUID>"]}
  ]
}
```

The abbreviated example must be expanded to all 20 questions. Result contains:

- `profileLabel`: RIASEC-inspired career interest profile.
- `riasec`, `maxima`, `percentages`: maps with all six category codes.
- `rankedCategories`: all six `{id,code,name,description,score,maxScore,percentage}` in normalized score order for v2; legacy snapshots retain their original order.
- `topCategories`: codes of qualifying interest areas (top three plus cutoff ties; empty in neutral browsing).
- `recommendations`: `{id,category_id,title,description,is_demo,category,reason,suggested_next_step?}`.
- `profile`: normalized careerClarity, explorationPreference, coursePriorities[], learningActivity, studyOptions[], readiness, desiredSupport, nextAction.
- `courses` and `advisors`: personalized active listings.
- `explanation`, `nextAction:{code,text,guidance:string[]}`, `scoringVersion`.

Results are immutable snapshots. Identical completion retries (even reordered) return the original snapshot and do not double-count completion. Different answers for a completed attempt return 409; start a new attempt to retake. Uncompleted, missing, and wrong-session results all return 404.

## Listing fields

Course includes `id,category_id,title,summary,provider,price_label,url,study_option,affordable,flexible,is_demo`. Public advisor listing/detail includes `id,category_id,name,specialty,summary,support_types,is_demo`; private `contact` is omitted. Live listing endpoints also return content status/timestamps from the database; frontend clients should ignore additional fields. SponsoredAd includes `id,category_ids,title,summary,provider_name,url,placement_key,is_sponsored,is_demo,starts_at,ends_at,label:'Sponsored'`. URL fields are HTTP(S) or null; non-demo interest returns 409 if no provider URL exists.

Fictional courses have no provider URL. Demo interest records a local request and never redirects. Real provider URLs may open only after a successful non-demo interest response; no payment or checkout occurs. Demo advisor contacts are fictitious. A lead response confirms storage only, never an email, booking, or actual advisor contact.

## Write retries and attempt linkage

Start accepts `entryReason` as `too_many_interests` or `not_sure_yet` and persists it on the attempt. An empty body remains accepted for compatibility. The browser always supplies an entry reason.

Start, course-interest, and advisor-lead requests accept `Idempotency-Key: <UUID>`. The frontend always uses a stable key per logical write and reuses it on uncertain retries. Missing keys remain accepted for old clients, but each request gets a new server key and is not retry-safe (course uniqueness still applies). Receipt lookup, changed-body detection, action persistence, and server success events run in one SQL transaction with a per-session/operation/key advisory lock. Same-key identical normalized bodies return the original response/status; changed bodies return 409. Keys are scoped to the session and operation (including the target entity). Receipts hold only a body hash and non-contact success response, not a duplicate lead payload.

Interest and lead bodies may include `attemptId`. The server validates ownership when supplied and stores the association. Omit it for actions reached without a quiz. A missing/unowned attempt returns 404. Course interest remains unique per session/course: its first originating attempt is retained, later visits do not replace it or emit another `buy_interest`. A new advisor request uses a new key and creates a separate lead; retries of the same request do not.

## Lead body

```json
{"attemptId":"<optional owned attempt UUID>","studentName":"Demo Student","contactMethod":"email","contactValue":"student@example.com","consent":true}
```

Trimmed name: 1–100 characters. One method: `email` with a valid email, or `phone` with 7–25 characters and at least seven digits, using digits, spaces, parentheses, hyphens, optional leading +. Contact value max 254 characters. Consent must be boolean true. Missing/invalid fields return 400. Final consent copy and real advisor operations require product review before public launch.

## Analytics body

```json
{"eventName":"results_viewed","attemptId":"<owned attempt UUID>","metadata":{"screen":"results"}}
```

The database stores exactly the eight PRD event types. The frontend endpoint accepts only `results_viewed`, `course_clicked`, `advisor_clicked`, `explore_clicked`. Server-owned `quiz_started`, `quiz_completed`, `buy_interest`, and `advisor_lead_submitted` are recorded by their successful action endpoints and rejected here to prevent forged success/double counting.

`attemptId` is required for results_viewed, optional otherwise, and must belong to the session. `entityId` is required for course_clicked/advisor_clicked and must reference an active matching entity. No entityId for other event types. Metadata optional keys: `screen` (landing/quiz/results/options/next_action), `placementKey` (max 64 characters), `action` (explore/compare/learn/contact). Unknown keys are rejected. No names, emails, arbitrary text, or contact information in metadata. The API accepts independent client events. The frontend deduplicates results_viewed once per attempt per tab using sessionStorage with memory fallback, marks before sending, and uses keepalive. It does not retry failed analytics, so failures may undercount. Actual clicks count independently.

## Errors

All failures return `{error:{code:string,message:string}}` without SQL details, stack traces, or secrets.

| HTTP | Meaning |
| --- | --- |
| 400 | Malformed JSON, invalid/missing input, answer mismatch, unknown event/category/entity |
| 403 | Cross-origin request from an unconfigured origin |
| 404 | Missing/inactive entity or missing/unowned/incomplete result |
| 409 | Attempt already completed differently, changed request for an existing idempotency key, or course has no URL |
| 410 | Session expired; create a new session UUID |
| 413 | Body exceeds 16 KB |
| 429 | Demo rate limit; Retry-After: 60 |
| 500 | Generic database/server error or invalid content/scoring configuration |
| 503 | Missing configuration, network/access failure, missing frontend schema (`SCHEMA_NOT_READY`), or unseeded health dependency |

Every endpoint is limited to 120 requests/minute per apparent IP per process. The limiter is a demo safeguard; trusted proxy configuration and shared durable limiting are required before a public multi-instance deployment.

## Normalized interest-area contract (v2)

See `docs/INTEREST_AREAS.md` for the current result contract and migration order. New results add `areas` (all six categories with examples and ordered resources), `recommendationMode`, and scoring version `riasec-demo-v2-normalized`. Selected areas meet 50%, with all ties at the third-place cutoff included. `recommendations` is now zero to thirty examples, not exactly three careers. Advisor contact fields are excluded from all result projections, including legacy snapshots. Demo interest returns `url: null` and never navigates to a provider.

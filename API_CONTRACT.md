# API contract v1

JSON API, no login. Frontend is a separate project. Generate `crypto.randomUUID()` once, persist it in localStorage, and send `X-Session-ID` for every session-associated request. Treat the UUID as private pseudonymous identification; it is not authentication. Missing/invalid session IDs return 400; expired sessions return 410. Do not use shared/predictable IDs.

All POST requests require `Content-Type: application/json`. Unknown body keys are rejected. Requests are limited to 16 KB; metadata uses an explicit allowlist. Cross-origin clients must match `FRONTEND_ORIGIN` exactly (scheme, hostname, port). OPTIONS preflight is supported on every route. All responses use `Cache-Control: no-store`.

| Endpoint | Request | Success |
| --- | --- | --- |
| GET /api/quiz | No session required | 200 `{questions: Question[]}` |
| POST /api/quiz/start | Session header, `{}` | 201 `{attemptId: UUID}`; creates session if needed and records quiz_started |
| POST /api/quiz/complete | Session header, `{attemptId, answers: Answer[]}` | 200 `{attemptId, result: Result}`; atomic completion and quiz_completed |
| GET /api/results/:attemptId | Session header | 200 `{attemptId, result: Result}` for owned completed attempt |
| GET /api/courses | Optional `?category=I,C` | 200 `{courses: Course[]}` |
| POST /api/courses/:courseId/interest | Session header, `{}` | 200 `{recorded:true,url,isDemo}` after persistence and buy_interest |
| GET /api/advisors | Optional `?category=I,C` | 200 `{advisors: Advisor[]}` |
| POST /api/advisors/:advisorId/leads | Session header, lead body below | 201 `{leadId,recorded:true,message}` after lead and advisor_lead_submitted |
| GET /api/ads | Required `?category=I,C` | 200 `{placements: {[placementKey]: SponsoredAd[]}}` |
| POST /api/events | Session header, event body below | 201 `{recorded:true}` |
| GET /api/health | No session required | 200 `{status:'ok',database:'reachable'}`; 503 if missing config, database unreachable, or categories unseeded |

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
- `rankedCategories`: all six `{id,code,name,description,score,maxScore,percentage}` in raw score order.
- `topCategories`: codes of the up to three recommended roles.
- `recommendations`: `{id,category_id,title,description,is_demo,category,reason}`.
- `profile`: normalized careerClarity, explorationPreference, coursePriorities[], learningActivity, studyOptions[], readiness, desiredSupport, nextAction.
- `courses` and `advisors`: personalized active listings.
- `explanation`, `nextAction:{code,text,guidance:string[]}`, `scoringVersion`.

Results are immutable snapshots. Identical completion retries (even reordered) return the original snapshot and do not double-count completion. Different answers for a completed attempt return 409; start a new attempt to retake. Uncompleted, missing, and wrong-session results all return 404.

## Listing fields

Course includes `id,category_id,title,summary,provider,price_label,url,study_option,affordable,flexible,is_demo`. Advisor includes `id,category_id,name,specialty,contact,support_types,is_demo`. Live listing endpoints also return content status/timestamps from the database; frontend clients should ignore additional fields. SponsoredAd includes `id,category_ids,title,url,placement_key,is_sponsored,is_demo,starts_at,ends_at,label:'Sponsored'`. URL fields are HTTP(S) or null; interest returns 409 if no provider URL exists.

Seeded `example.com` links are clearly labelled mock destinations, not real courses. Open a provider URL only after a successful interest response; no payment or checkout occurs. Demo advisor contacts are fictitious. A lead response confirms storage only, never an email, booking, or actual advisor contact.

## Lead body

```json
{"studentName":"Demo Student","contactMethod":"email","contactValue":"student@example.com","consent":true}
```

Trimmed name: 1–100 characters. One method: `email` with a valid email, or `phone` with 7–25 characters and at least seven digits, using digits, spaces, parentheses, hyphens, optional leading +. Contact value max 254 characters. Consent must be boolean true. Missing/invalid fields return 400. Final consent copy and real advisor operations require product review before public launch.

## Analytics body

```json
{"eventName":"results_viewed","attemptId":"<owned attempt UUID>","metadata":{"screen":"results"}}
```

The database stores exactly the eight PRD event types. The frontend endpoint accepts only `results_viewed`, `course_clicked`, `advisor_clicked`, `explore_clicked`. Server-owned `quiz_started`, `quiz_completed`, `buy_interest`, and `advisor_lead_submitted` are recorded by their successful action endpoints and rejected here to prevent forged success/double counting.

`attemptId` is required for results_viewed, optional otherwise, and must belong to the session. `entityId` is required for course_clicked/advisor_clicked and must reference an active matching entity. No entityId for other event types. Metadata optional keys: `screen` (landing/quiz/results/options/next_action), `placementKey` (max 64 characters), `action` (explore/compare/learn/contact). Unknown keys are rejected. No names, emails, arbitrary text, or contact information in metadata. Repeated client view/click events are independent events; the frontend must avoid accidental duplicate reporting.

## Errors

All failures return `{error:{code:string,message:string}}` without SQL details, stack traces, or secrets.

| HTTP | Meaning |
| --- | --- |
| 400 | Malformed JSON, invalid/missing input, answer mismatch, unknown event/category/entity |
| 403 | Cross-origin request from an unconfigured origin |
| 404 | Missing/inactive entity or missing/unowned/incomplete result |
| 409 | Attempt already completed differently, or course has no URL |
| 410 | Session expired; create a new session UUID |
| 413 | Body exceeds 16 KB |
| 429 | Demo rate limit; Retry-After: 60 |
| 500 | Generic database/server error or invalid content/scoring configuration |
| 503 | Missing database configuration or unavailable/unseeded health dependency |

Every endpoint is limited to 120 requests/minute per apparent IP per process. The limiter is a demo safeguard; trusted proxy configuration and shared durable limiting are required before a public multi-instance deployment.

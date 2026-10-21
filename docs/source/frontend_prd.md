**Version:** 1.1  
**Date:** 21 October 2026  
**Status:** Implemented for the local demo; see ../FRONTEND_READINESS.md for verification and limits  
**Audience:** Codex, frontend developers, backend developers, QA  
**Product stack:** Existing Next.js App Router + TypeScript project; local Docker PostgreSQL/PostgREST demo


## Approved decisions — 21 October 2026

The user approved the following scope before implementation. These decisions supersede the original attachment's conflicting examples; implementation status and verification are tracked separately in the readiness notes.

- Keep the current project structure and work only on `feature/frontend_alexander`.
- Keep the English 20-question quiz, including Q15/Q17 multi-select. Use “20 questions, at your own pace”; do not promise an unverified duration.
- Keep existing wire formats, RIASEC code filters, snake_case catalog fields, nested results, and ads grouped by placement key. Add typed frontend adapters.
- Add persisted entry reasons and safe start retries; add attempt ownership/linkage and persistent retry protection for course-interest and advisor-lead writes.
- Keep phone/email only. Add clearly labelled demo advisor summaries, ad descriptions/provider names, and per-role next-step suggestions through new migrations, seed content, and APIs.
- Add dedicated course/advisor detail GET endpoints. Keep exploration activities in clearly labelled frontend demo configuration; completion is local to this browser.
- Keep existing analytics rules and metadata allowlist; count results views once per attempt per tab.
- Use an approachable mobile-first visual style with readable typography, rounded cards, and restrained color. Unfinished drafts expire seven days after their last update.
- Deliver a local demo with fictional courses/advisors/ads and explicit storage-only advisor confirmation. Public deployment, real contact routing, and public-launch consent review are deferred.

## 1. Objective

Build a responsive, mobile-first career exploration experience for students who have completed matriculation or are preparing to apply to university. The product helps students who have too many interests or no clear interest explore possible career directions and choose a practical next step.

The product must present results as **exploratory suggestions, not a definitive assessment of ability, personality, or future career fit**.

The frontend must implement the complete demo flow:

**Landing → Quiz → Results → Courses/advisors/exploration → Next action**

The backend owns scoring, persisted records, recommendation logic, content retrieval, lead storage, course-interest tracking, and server-recorded success events. The frontend owns presentation, navigation, local draft restoration, form interaction, and client-side analytics events.

## 2. Product principles

1. **One clear next step:** Each screen has one visually dominant primary action.
2. **No false certainty:** Use language such as “possible direction,” “why explore this,” and “try next.” Never use “your perfect career,” “you are suited for,” or similar definitive claims.
3. **Backend is authoritative:** Never duplicate scoring rules or infer missing recommendations in the browser.
4. **Anonymous by default:** No account creation. Do not request personal data until the student explicitly chooses to contact an advisor.
5. **Progress is recoverable:** Preserve quiz answers across Back/Next navigation and refreshes in the same browser.
6. **Sponsored content is distinct:** Ads must be labelled “Sponsored” and rendered separately from organic recommendations.
7. **No simulated success:** Show confirmation only after the relevant operation succeeds.
8. **Demo content is transparent:** Clearly label placeholder course, advisor, and ad records as demo/example content. Never invent real advisor credentials or contact details.



## 3. Scope

### 3.1 In scope

- Landing page and entry-reason selection.
- Anonymous session creation and reuse.
- Quiz question retrieval and question-by-question interaction.
- Local quiz draft persistence and refresh recovery.
- Quiz submission and results display.
- Up to three career/role recommendations with explanations.
- Category-filtered course and advisor options.
- Sponsored ad placements.
- Course-interest recording before navigation to a provider.
- Advisor details and lead form with required consent.
- Exploration activities/resources.
- Approved analytics events.
- Loading, empty, error, retry, and confirmation states.
- Responsive design, accessibility basics, automated tests, and setup documentation.

### 3.2 Out of scope

- Login, account profiles, or password recovery.
- Internal checkout, payment, course registration, advisor booking, or chat.
- Admin dashboard or content management interface.
- External ad network integration.
- LLM-based recommendations or frontend-side scoring.
- Production-grade analytics platform.
- Multi-device quiz synchronization.
- A separate flashcard experience. Topic flashcards may be added later, but are not required for the core quiz and must not affect scoring unless separately specified.

## 4. Assumptions and decisions

- Add the frontend to this existing project on `feature/frontend_alexander`. Keep `src/app/api`, `src/lib`, and `supabase` in place; do not move the project into a `backend/` folder. Preserve current API formats using typed frontend adapters.
- Use the Next.js App Router, TypeScript, and server-side Route Handlers for the API.
- Run the local Docker database using `npm run dev:local`. Public deployment, real provider/advisor operations, and hosted infrastructure are deferred.
- No user authentication is required.
- The browser creates a random UUID for the anonymous session and stores it in `localStorage`.
- Quiz answers and non-sensitive quiz draft metadata may be stored locally to recover from refreshes. **Never store advisor contact form values or other personal contact details in localStorage.**
- Backend question content, active status, option IDs, recommendation results, courses, advisors, and ads are authoritative.
- The backend returns a maximum of three distinct role recommendations.
- Demo content and rule-based scoring are configurable sample data, not validated career science.
- The initial experience is mobile-first and must also work on tablet and desktop.
- External provider links open in the same tab after the interest write succeeds. This avoids unreliable popup behavior and ensures the backend confirms the write before navigation.
- Contact-method options are **phone and email only**, matching current backend validation. Do not add Telegram.
- Consent copy in this document is a demo default and must be reviewed before a real public launch.

## 5. Information architecture and routes

Use these routes unless implementation discovery reveals a compelling reason to consolidate them:

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/quiz` | Active quiz |
| `/results/[attemptId]` | Results for a completed attempt |
| `/options/[attemptId]` | Courses, advisors, and exploration options for recommended categories |
| `/course/[courseId]?attemptId=...` | Course details and course-interest action |
| `/advisor/[advisorId]?attemptId=...` | Advisor details and contact-request form |
| `/explore/[roleId]?attemptId=...` | A concrete exploration activity for a career direction |

### Route rules

- Use route parameters for stable entity IDs and the attempt ID; do not put full answer sets or contact details in URLs.
- Preserve the attempt ID through results, options, and action routes.
- The session UUID is sent in the `X-Session-ID` header, not as a query parameter.
- Refreshing a completed results route must re-fetch the result from the backend.
- If a result route cannot be loaded because the attempt is missing, expired, invalid, or belongs to another session, show a recovery screen with a link to start a new quiz. Do not fabricate results.
- If a student enters `/quiz` with a recoverable local draft, offer to resume it. If no draft exists, start a new attempt.
- Avoid silently creating a second attempt when a start request is retried after a network error.





## 6. Shared layout and visual direction

### 6.1 Visual direction

Use a clean, modern, approachable student-facing interface. The design should feel clear and trustworthy rather than like a formal psychometric test or an advertisement landing page.

- Mobile-first layout with a readable content column.
- Simple typography hierarchy and generous spacing.
- Rounded cards and clear selection states; avoid excessive gradients, animations, or decorative elements.
- Use a consistent spacing, typography, color, radius, and shadow token system.
- Make primary actions visually prominent and secondary actions quieter.
- Use motion only for small transitions and respect `prefers-reduced-motion`.
- Use the project’s existing design tokens if created during implementation; document them in the README.

### 6.2 Responsive behavior

- Mobile: one-column layouts; full-width primary CTA where useful; touch targets at least 44 × 44 CSS pixels.
- Tablet: maintain a readable single-column quiz; use two-column resource cards only when there is sufficient width.
- Desktop: centered content with a sensible maximum width; recommendation and resource cards may use grids.
- No horizontal page scrolling at common viewport widths.
- Sticky controls may be used for quiz navigation on mobile only if they do not obscure content or focus.

### 6.3 Shared components

Implement reusable components for:

- `AppShell` / page container.
- `PrimaryButton`, `SecondaryButton`, and `TextLink`.
- `ProgressIndicator`.
- `QuestionCard` and `AnswerOption`.
- `CareerRecommendationCard`.
- `CourseCard`.
- `AdvisorCard`.
- `SponsoredLabel` and `SponsoredPlacement`.
- `LoadingState`, `ErrorState`, `EmptyState`, and `InlineError`.
- `ConfirmationPanel`.
- `AdvisorLeadForm`.
- Accessible modal/dialog or external-navigation notice only if needed.

Do not build a generalized component framework beyond what the MVP needs.

## 7. Screen specifications

## 7.1 Screen 1 — Landing (`/`)

### Purpose

Help a student recognize their situation and begin a short exploration session.

### Required content

- Headline: **“Not sure what to study after matriculation?”**
- Supporting text: “Explore possible career directions and find one practical next step, at your own pace.”
- Two mutually exclusive entry choices:
  - “I have too many interests”
  - “I’m not sure what interests me yet”
- Quiz label: “20 questions, at your own pace”
- Primary CTA: “Start exploring”
- Brief reassurance: “Your results are suggestions to help you explore—not a final career judgment.”
- Optional small privacy note: “No account needed.”

### Interaction

1. Student selects one entry choice.
2. Selected choice is visually and accessibly indicated.
3. Primary CTA remains disabled until an entry choice is selected.
4. On CTA click:
   - Prevent duplicate clicks.
   - Get or create the anonymous session UUID.
   - Call `POST /api/quiz/start` with the entry reason.
   - On success, persist the returned `attemptId` and draft metadata locally.
   - Navigate to `/quiz`.
5. If the start request fails, remain on the page and show a retryable error. Do not show that the quiz has started.

### State requirements

- Default: neither choice selected.
- Selected: one entry choice selected.
- Loading: start CTA disabled with progress indication.
- Error: concise message and Retry action; keep the selected choice.

## 7.2 Screen 2 — Quiz (`/quiz`)

### Purpose

Collect lightweight interest and preference signals without overwhelming the student.

### Data source

Fetch active questions from `GET /api/quiz`. The backend returns exactly 20 questions, ordered for display, with their allowed options. Q15 and Q17 allow one or two selections; all other questions require exactly one. The frontend must not hardcode the production question bank.

### Layout

- Back link or navigation to landing, with a confirmation prompt if leaving would discard unsaved progress. Because answers are persisted locally, leaving should not discard the draft.
- Progress label, e.g. “Question 2 of 20”.
- Visual progress indicator.
- One question at a time.
- Answer options presented as accessible selectable cards or radio controls.
- Back and Next buttons.
- On the final question, primary CTA changes to “See my results”.
- Short reassurance that there are no right or wrong answers, where appropriate.

### Answer behavior

- Use radio controls when `maxSelections` is 1 and checkbox controls when it is 2. Q15 and Q17 allow one or two options. Explain the selection limit and require at least one option.
- Use the public `maxSelections` field, not an invented `inputType`. If the API returns an unsupported selection limit or invalid question schema, show a recoverable error; do not silently mis-render it.
- Next is disabled until the current required question has a valid answer.
- Selecting an option updates the local draft immediately.
- Back preserves the answer for each previously answered question.
- Moving forward and backward does not submit the quiz or create additional attempts.
- On question navigation, scroll focus to the question heading or question card as appropriate for accessibility.
- Do not reveal scoring weights or correct/incorrect feedback.

### Local draft persistence

Store a versioned, non-sensitive quiz draft in `localStorage`, keyed by the session UUID. Include:

- `schemaVersion`
- `sessionId`
- `attemptId`
- `entryReason`
- `questionIds`
- `answers` as question ID → option ID array
- `currentQuestionIndex`
- `updatedAt`

Do not store full question content if it can be re-fetched. Do not store name, email, phone number, Telegram handle, or advisor lead payloads.

On refresh:

1. Load the session UUID.
2. Fetch active questions from the backend.
3. Check for a compatible local draft with the same session ID and attempt ID.
4. Restore answers and current question index only when question IDs and option IDs remain compatible with the current question set.
5. If the draft is incompatible, explain that the quiz has changed and offer to restart.
6. If a completed result is already known locally, navigate to the saved results route and re-fetch it from the backend rather than re-submitting answers.

### Completion behavior

1. Validate all 20 required questions: exactly one valid option for each single-select question, and one or two valid options for Q15/Q17.
2. Disable the submit button and show a loading state.
3. Send `POST /api/quiz/complete` with `{attemptId, answers: [{questionId, optionIds: [...]}]}` for all 20 questions.
4. On success:
   - Store only the completed attempt ID and result route metadata locally.
   - Remove the active answer draft or mark it completed.
   - Navigate to `/results/[attemptId]`.
5. On validation error, show the relevant recoverable message and retain answers.
6. On network/server error, retain the draft and allow retry. Prevent accidental duplicate completion requests.

### Empty/error states

- Quiz questions fail to load: show retry and a link back to landing.
- No active questions: show a friendly unavailable message; do not start an uncompletable quiz.
- Missing/invalid option: ask the student to select an answer again.
- Draft is stale or incompatible: offer “Restart quiz”; explain that the question set changed.
- Session ID is invalid: create a new anonymous session only after a clear recovery path; do not reuse an invalid ID indefinitely.

## 7.3 Screen 3 — Results (`/results/[attemptId]`)

### Purpose

Present the results as understandable possibilities and help the student decide what to explore next.

### Data source

Fetch `GET /api/results/:attemptId` using the `X-Session-ID` header.

### Required content

- Heading: “Here are a few directions to explore”
- Up to three distinct recommendation cards.
- Each card includes:
  - Career/role title.
  - Category or area label.
  - Plain-language summary.
  - “Why this may fit” explanation based on the backend response.
  - One practical suggested next step.
  - CTA such as “Explore this direction”.
- Reassurance: “These are starting points for exploration, not a final career judgment.”
- Primary CTA to continue to course/advisor/exploration options.
- Secondary action to restart the quiz, with confirmation before abandoning access to the current results.

### Interaction

- Selecting a recommendation opens `/options/[attemptId]` with that recommendation selected, or passes a selected category through a validated query parameter.
- “Continue” opens the options page with the first recommended direction selected by default.
- The frontend must not re-rank recommendations or calculate explanations.
- Fire `results_viewed` only after results load successfully, once per attempt per browser tab. Use `sessionStorage` with an in-memory fallback for deduplication. Reloading or revisiting in the same tab does not add another view; a new tab may count a new view.
- If no recommendations are returned, show an explicit fallback state and a retry/restart option. Do not invent role suggestions.

### State requirements

- Loading skeleton.
- Loaded results.
- Recoverable load error with Retry.
- Invalid, expired, or session-mismatched attempt with a safe recovery action.
- Empty recommendation state with clear explanation.

## 7.4 Screen 4 — Options (`/options/[attemptId]`)

### Purpose

Connect a selected career direction to practical resources.

### Data sources

- `GET /api/courses?category={code}`
- `GET /api/advisors?category={code}`
- `GET /api/ads?category={code}`

Use the selected recommendation’s RIASEC code (`R`, `I`, `A`, `S`, `E`, or `C`). The existing API also accepts comma-separated codes, but the options screen requests one selected code at a time.

### Layout

- Heading: “Choose a next step”
- Tabs or selectable chips for the recommended directions, labelled with the returned role/category names.
- Three action areas:
  1. Courses
  2. Advisors
  3. Explore on your own
- Course cards show title, provider, price label, short summary, and “View course”.
- Advisor cards show name, specialty, short summary, and “View advisor / Contact advisor”.
- Sponsored content appears only in its designated placement and always has a visible “Sponsored” label.
- Organic recommendations must not visually imply sponsorship.
- If available, show a brief next-step suggestion associated with the selected direction.

### Interaction

- Changing the selected direction fetches its course/advisor/ad data and displays loading feedback without freezing the entire page.
- Cache successful responses in memory for the current page session to avoid unnecessary repeat requests; do not cache contact submissions.
- Each resource card opens its dedicated detail/action route.
- Each Explore action opens `/explore/[roleId]?attemptId=...`.
- Client-side click analytics:
  - `course_clicked` when a course card/CTA is selected.
  - `advisor_clicked` when an advisor card/CTA is selected.
  - `explore_clicked` when an exploration action is selected.
- Include the attempt ID and relevant entity reference when known.
- Do not fire click events merely because a card is rendered.

### Empty/error states

- No courses: “No course options are available for this direction yet.” Keep advisor and explore actions available.
- No advisors: show a useful explanation and keep courses/explore available.
- No ads: omit the sponsored placement entirely; do not leave an empty ad container.
- One endpoint fails: show a section-level error and retry for that section; do not hide successfully loaded sections.
- All resource endpoints fail: show an overall retry action and preserve the selected direction.

## 7.5 Screen 5A — Course detail and interest (`/course/[courseId]`)

### Required content

- Course title, provider, price label, and summary.
- Clearly labelled demo/placeholder indicator if the record is sample content.
- Primary CTA: “View course”.
- A short notice that the user will leave the career-guidance experience to visit the provider.
- Back navigation to options.

### Action contract

When the student selects “View course”:

1. Disable the CTA and show a pending state.
2. Send `POST /api/courses/:courseId/interest` with the session header and attempt ID if available.
3. The backend validates the course and records interest before returning a validated `url`.
4. Only after success, show a confirmation/interstitial state such as “Your interest has been recorded” and a “Continue to provider” CTA.
5. “Continue to provider” navigates to the returned HTTPS/HTTP URL in the same tab. Do not trust a URL constructed by the client.
6. On failure, do not navigate. Show a retryable error.
7. The backend records `buy_interest` as part of the successful write; the frontend must not submit this event separately.

The `course_clicked` event is separate and is recorded by the frontend when the student initiates the course action. If the interest write fails, `buy_interest` must not be recorded.

## 7.6 Screen 5B — Advisor details and lead form (`/advisor/[advisorId]`)

### Required content

- Advisor name.
- Specialty/support area.
- Summary of the type of questions the advisor can help with.
- Contact method information returned by the API, if appropriate for the demo.
- Lead form:
  - Name.
  - Contact method: phone or email.
  - Contact value.
  - Required explicit consent checkbox.
- Primary CTA: “Request contact”.
- Privacy note explaining that this local demo stores the request and does not contact an advisor.

### Demo consent copy

“I agree to submit my contact details for storage in this local demo. No message will be sent to an advisor.”

This wording is a draft and must be reviewed before a real public launch.

### Validation

- Name is required and trimmed; enforce a reasonable maximum length.
- Contact method is required.
- Contact value is required and validated according to the selected method.
- Consent must be checked.
- Show field-level validation and a form-level error when the request fails.
- Do not clear form values on recoverable submission failure.
- Do not store form values in localStorage, analytics metadata, URLs, or console logs.

### Submission behavior

1. Student submits the valid form.
2. Disable submission while pending.
3. Send `POST /api/advisors/:advisorId/leads` with session ID, attempt ID if available, student name, contact method, contact value, and consent confirmation.
4. On success, clear the form from memory where practical and show a confirmation state: “Your demo request has been recorded.” Explicitly explain that this local demo stores the request without sending a message or booking an appointment.
5. The backend records `advisor_lead_submitted` only after the lead is stored successfully.
6. Do not send a second analytics event from the frontend for this server-owned success event.
7. On failure, retain the form values in the current page state and allow retry. Prevent duplicate submissions while pending.

## 7.7 Screen 5C — Exploration activity (`/explore/[roleId]`)

### Purpose

Give the student a concrete low-cost action that helps them test interest before making a major education decision.

### Required content

- Selected career/role direction.
- One specific activity or resource relevant to that direction.
- Simple instructions and an estimated time, where known.
- Reflection prompts such as:
  - “What did you enjoy?”
  - “What felt difficult?”
  - “Would you try a similar activity again?”
- CTA: “Mark this step complete”.
- Completion state with a suggested follow-up action.

### Demo behavior

Use a small clearly labelled frontend demo configuration keyed by known seeded role IDs, separate from scoring logic. No activity API is required. Persist completion only in this browser, with an in-memory fallback when storage is unavailable.

Do not claim that completion has been saved to the backend unless a persistence endpoint exists. For the MVP, completion is saved in localStorage, with an in-memory fallback, and clearly documented as local-only.

Record `explore_clicked` when the student initiates the exploration action. Do not invent an additional analytics event for completion.

## 8. API integration contract

### 8.1 General rules

- Base path: same-origin `/api/...`.
- JSON request/response bodies unless the endpoint redirects externally.
- Send `Content-Type: application/json` for JSON writes.
- Send `X-Session-ID: <uuid>` on every session-scoped request.
- The browser generates the anonymous session UUID using a cryptographically secure UUID generator where supported and stores it in `localStorage`.
- Do not send Supabase service-role credentials to the browser. The frontend talks only to Next.js Route Handlers.
- Use a shared typed API client; avoid ad hoc `fetch` calls with inconsistent headers and error handling.
- Set a reasonable request timeout or abort behavior where appropriate; do not automatically retry non-idempotent writes unless the API supports idempotency.
- All user-visible errors must be generic and actionable. Do not display database details, stack traces, secrets, or raw server errors.
- The backend validates all IDs and request bodies independently. Client-side validation improves UX but is not a security boundary.

### 8.2 Standard error response

Keep the existing `{error: {code, message}}` envelope and documented HTTP statuses. Client-side form validation supplies field-level guidance. Do not require nonexistent `fieldErrors` or `requestId` fields, expose database details, or assume every error response is JSON.

### 8.3 Existing wire formats and approved extensions

[API_CONTRACT.md](../../API_CONTRACT.md) describes the current running backend. Preserve its request/response formats except for the explicitly approved additions below. During implementation, update that contract, runtime schemas, TypeScript wire types, adapters, tests, and new migrations together. Internal database `Question` types are not interchangeable with the public quiz response.

| Endpoint | Retained interface / approved addition |
| --- | --- |
| `GET /api/quiz` | `{questions: [{id, position, text, maxSelections, options: [{id,text,value,position}]}]}`. Exactly 20 questions; no scoring weights. |
| `POST /api/quiz/start` | Retain `{attemptId}` response. Extend the current empty request body to accept `entryReason` (`too_many_interests` or `not_sure_yet`) and persist it. Add persistent idempotency for each logical start. |
| `POST /api/quiz/complete` | `{attemptId, answers: [{questionId, optionIds: string[]}]}` → `{attemptId,result}`. Exactly 20 valid answers; Q15/Q17 accept one or two selections. Identical retries return the saved result; changed answers return 409. |
| `GET /api/results/:attemptId` | Retain session-owned `{attemptId,result}`. Missing, incomplete, or unowned attempts return 404. |
| `GET /api/courses?category=I` | Retain `{courses: [...]}` with `price_label`, `is_demo`, and other existing fields. Filter by RIASEC code. |
| `GET /api/courses/:courseId` | New detail endpoint; return an active public course in `{course: ...}`. Missing/inactive/invalid IDs must be handled safely. |
| `POST /api/courses/:courseId/interest` | Retain `{recorded:true,url,isDemo}` response. Add optional `attemptId`, session ownership checks when supplied, and persistent retry protection. Only the successful response URL can be used for provider navigation. |
| `GET /api/advisors?category=I` | Retain `{advisors: [...]}` with `is_demo`. Add a demo `summary` field; expose only intentionally public advisor fields. |
| `GET /api/advisors/:advisorId` | New detail endpoint; return an active public advisor in `{advisor: ...}`. Do not expose student lead data or unapproved private contact information. |
| `POST /api/advisors/:advisorId/leads` | Retain `studentName`, `contactMethod`, `contactValue`, `consent:true` and `{leadId,recorded:true,message}` response. Add optional owned `attemptId` and persistent retry protection. Phone/email only. |
| `GET /api/ads?category=I` | Retain `{placements: {[placementKey]: SponsoredAd[]}}`, `url`, `is_demo`, and visible `label:'Sponsored'`. Seed uses `options_footer`. Add demo `summary` and `provider_name` fields. |
| `POST /api/events` | Retain the existing four client events and strict metadata allowlist described below. |
| `GET /api/health` | Retain `{status:'ok',database:'reachable'}`; development verification only. |

#### Results adapter and new content

Keep recommendations inside `result.recommendations` with existing `id`, `category_id`, `title`, `description`, `is_demo`, `category`, and `reason`. Resolve category names from `result.rankedCategories`; keep backend ordering. Add a demo `suggested_next_step` field through migration/seed/service types and include it in new recommendation snapshots. Preserve `result.nextAction` as the overall next action. Handle older immutable results without fabricating a missing per-role suggestion.

Map backend fields to view models in a typed adapter; do not change existing wire naming just to match component props. Clearly label demo content. Never add real-looking fictional credentials or private contact details.

#### Write idempotency and ownership

- Add an `Idempotency-Key` UUID header for start, course-interest, and lead writes. Persist a key before issuing the logical write and reuse it for retries after an uncertain response. Non-sensitive pending start state may be stored locally; contact form values must remain in page memory only.
- Store retry state on the server and enforce it atomically, including concurrent requests. Scope keys by session and operation; the same key with the same request returns the original successful result without another record or success event. Reusing a key with a changed request returns a safe 409 conflict. A deliberate new request uses a new key.
- Add `attemptId` linkage for actions reached through a quiz. Validate that any supplied attempt belongs to the supplied session before recording the action. Omit `attemptId` only for actions genuinely reached without a quiz attempt.
- Preserve course-interest duplicate protection and document its interaction with repeated actions and retakes when updating the contract. Never double-count retry success events.
- Retain existing deterministic completion retries. Do not automatically retry writes until the new idempotency behavior is implemented and verified.
- Add new incremental migrations/RPC changes for the initialized local database; do not rely on editing the initial migration or deleting its volume. Update CORS allowed headers if cross-origin support is retained.

#### Lead form and confirmation

Retain the backend's name/contact limits and email/phone validation. Require explicit consent. The confirmation must state that this demo records the request without sending messages or booking appointments. No advisor response is promised. Contact values never enter browser persistence, URLs, logs, or analytics.

#### Analytics

- The frontend sends only `results_viewed`, `course_clicked`, `advisor_clicked`, and `explore_clicked`.
- `results_viewed` requires an owned completed `attemptId`; count once per attempt per tab, including refresh/revisits in that tab. Use sessionStorage with a memory fallback.
- Course/advisor click events require their respective entity IDs. Exploration events may include an owned attempt ID but no role entity ID. Do not send `entityType`.
- Retain metadata keys `screen` (landing/quiz/results/options/next_action), `placementKey` (maximum 64 characters), and `action` (explore/compare/learn/contact). Do not send `sourceScreen` or arbitrary text.
- Server-owned events are `quiz_started`, `quiz_completed`, `buy_interest`, and `advisor_lead_submitted`; action handlers emit them only after successful persistence.
- Analytics failure never blocks a primary action. Do not invent an exploration-completed event.

### 8.4 Backend integration requirements

The selected start entry-reason/idempotency support, action attempt linkage/retry safety, catalog content additions, and two detail GET endpoints are implemented in this revision. Keep their runtime schemas, migrations, tests, and API documentation aligned. Existing session-owned results, completion retry behavior, phone/email validation, demo flags, and event ownership should be reused.

Exploration uses frontend demo configuration keyed by known seeded role IDs, with completion saved only in this browser. No activity API or server completion endpoint is required in this scope.

## 9. Frontend architecture

### 9.1 Recommended structure

Extend the existing `src/` structure without relocating backend files. The following shows frontend additions alongside existing API routes; preserve existing service modules:

```text
src/app/
  layout.tsx
  page.tsx
  quiz/page.tsx
  results/[attemptId]/page.tsx
  options/[attemptId]/page.tsx
  course/[courseId]/page.tsx
  advisor/[advisorId]/page.tsx
  explore/[roleId]/page.tsx
  api/
    quiz/route.ts
    quiz/start/route.ts
    quiz/complete/route.ts
    results/[attemptId]/route.ts
    courses/route.ts
    courses/[courseId]/route.ts
    courses/[courseId]/interest/route.ts
    advisors/route.ts
    advisors/[advisorId]/route.ts
    advisors/[advisorId]/leads/route.ts
    ads/route.ts
    events/route.ts
    health/route.ts
src/components/
  ui/
  quiz/
  recommendations/
  resources/
  forms/
src/lib/
  api/
  session/
  quiz/
  analytics/
  validation/
  supabase/
  types.ts  # existing domain types; add explicit public wire types
```

This is a suggested starting structure, not a requirement to create empty folders. Keep components and modules focused and avoid unnecessary abstractions.

### 9.2 Server and client boundaries

- Use Server Components by default for static page structure and safe initial data loading where it fits.
- Use Client Components for localStorage access, quiz interactions, form state, progress, and client-side analytics.
- Never access `localStorage` during server rendering. Initialize browser-only state after hydration or through a dedicated client-side session/draft utility.
- Keep Supabase service-role access and database operations server-side only.
- Do not query Supabase directly from browser components for protected or session-owned data. Use the same-origin Route Handlers.
- Route Handlers call service modules; business logic must not be embedded in UI components.
- Share request/response TypeScript types between the frontend API client and backend handlers to prevent drift.
- Do not create a separate backend service or external API deployment; use the agreed Next.js Route Handlers.

### 9.3 Suggested client modules

- `session`: get/create UUID, validate stored value, set request header.
- `apiClient`: typed JSON requests, standard error parsing, request cancellation.
- `quizDraft`: versioned draft serialization, compatibility checks, clear/complete operations.
- `quiz`: question navigation and answer state only; no scoring.
- `analytics`: approved event names, safe metadata, deduplication, non-blocking requests.
- `validation`: advisor lead field validation and API response parsing.

## 10. State management and persistence

Use local component state for individual screen interactions and a small session/draft utility for persistence. Do not introduce a global state library unless implementation demonstrates a real need.

### Persist locally

- Anonymous session UUID.
- Active attempt ID and entry reason.
- Question/option IDs for answers.
- Current question index.
- Draft schema version and update timestamp.
- Completed attempt ID for convenient routing, if useful.

### Do not persist locally

- Student name, phone, email, Telegram handle, or advisor lead payload.
- Service-role credentials or secrets.
- Internal scoring weights.
- Full analytics histories.
- Sensitive personal information.

### Storage failure

If localStorage is unavailable, continue the session in memory and warn that progress may not survive refresh. Do not block the student from completing the quiz.

### Expiry and cleanup

- The backend applies the 90-day retention policy.
- Client-side draft cleanup is a usability measure, not a replacement for server cleanup.
- A draft expires seven days after `updatedAt`. Remove expired answer drafts and offer to restart. Invalid attempts also require a restart; this local policy is separate from server retention.
- Do not promise cross-device recovery.

## 11. Analytics implementation

### Event ownership

| Event | Owner | Trigger |
|---|---|---|
| `quiz_started` | Backend | Attempt successfully created |
| `quiz_completed` | Backend | Attempt completion successfully persisted |
| `results_viewed` | Frontend | Results successfully loaded and shown |
| `course_clicked` | Frontend | Student initiates a course action |
| `buy_interest` | Backend | Course-interest record successfully persisted |
| `advisor_clicked` | Frontend | Student opens advisor details/contact flow |
| `advisor_lead_submitted` | Backend | Lead successfully persisted |
| `explore_clicked` | Frontend | Student initiates an exploration action |

### Frontend event rules

- Send the session ID through the standard header.
- Include attempt/entity IDs when applicable.
- Use only the existing allowlisted metadata: `screen`, `placementKey`, and `action`. Do not send `sourceScreen` or `entityType`. Exploration events include an attempt ID when available but no role entity ID.
- Never include personal contact values or raw answers.
- Analytics requests are fire-and-forget from the user experience perspective; failure must not block the main action.
- Do not duplicate server-owned success events from the browser.
- Do not fire events during render or merely because a component mounts more than once.
- Add tests for event name allowlisting and safe metadata.

## 12. Error handling and recovery

All screens must distinguish:

- Loading.
- Successful content.
- Empty content.
- Recoverable request error.
- Invalid or expired resource.
- Form validation error.
- Submission pending.
- Confirmed success.

### Network behavior

- Provide a Retry action for safe GET requests.
- Do not retry non-idempotent POST requests automatically unless the endpoint supports idempotency.
- Disable the initiating button while a write is pending.
- Preserve quiz answers after a failed completion request.
- Preserve advisor form values after a failed lead submission in current page memory.
- Use generic user-facing errors and keep detailed diagnostics server-side without personal data.
- If analytics fails, proceed normally.
- If a course-interest write fails, do not open the provider URL.
- If advisor lead submission fails, do not show success.

## 13. Accessibility and usability

- Use semantic headings and form labels.
- Make all actions keyboard-accessible with visible focus.
- Use radio semantics for single-select questions and checkbox semantics for the two multi-select questions; communicate their one-or-two selection rule.
- Communicate selected state beyond color alone.
- Associate validation messages with the relevant inputs.
- Announce meaningful loading, error, and completion states to assistive technology.
- Maintain adequate text contrast.
- Respect reduced-motion preferences.
- Keep touch targets comfortably sized on mobile.
- Move focus appropriately after question navigation and route-level error recovery.
- Avoid time limits and auto-advancing questions.
- Use plain language appropriate for students; explain unfamiliar terms.

## 14. Security and privacy

- The anonymous UUID is a pseudonymous identifier, not authentication.
- Treat all client-supplied session IDs and entity IDs as untrusted; validate them server-side.
- Enforce session ownership for attempts and associated records.
- Never expose the Supabase service-role key through `NEXT_PUBLIC_*` variables or client bundles.
- Use server-side Supabase access in Route Handlers.
- Validate outbound URLs server-side and allow only HTTP/HTTPS.
- Avoid storing advisor contact values in localStorage, query parameters, analytics, or logs.
- Require explicit consent for advisor lead submission.
- Keep contact data out of browser error telemetry.
- Show only the minimum student information needed for the chosen action.
- Use RLS and backend authorization/ownership checks; RLS alone is not a substitute for validating API access.
- Apply backend rate limits to write endpoints and document limitations of any in-memory demo limiter.

## 15. Testing requirements

### Unit tests

- Session UUID validation and creation.
- Quiz draft serialization, restoration, version mismatch, and cleanup.
- Quiz answer selection, navigation, progress, and required-answer validation.
- API error parsing.
- Advisor lead form validation.
- Analytics event allowlisting and metadata sanitization.
- URL navigation only after successful course-interest response.

### Integration/component tests

- Landing selection is required before start.
- Start failure shows retry and does not navigate.
- Quiz fetch and navigation work.
- Back/Next preserves answers.
- Refresh restores a compatible draft.
- Completion failure retains answers.
- Results render backend-provided recommendations only.
- Each options section handles empty and failed responses independently.
- Sponsored content is visibly labelled and separated.
- Course-interest failure does not navigate externally.
- Advisor submission requires consent and shows success only after server confirmation.
- Analytics failure does not interrupt primary actions.

### End-to-end acceptance flow

1. Open landing page on mobile viewport.
2. Select an entry reason and start the quiz.
3. Answer every question, navigating Back at least once.
4. Refresh mid-quiz and confirm answers restore.
5. Complete the quiz and view results.
6. Open a recommended direction and load courses/advisors/ads.
7. Open a course, record interest, and continue to its validated provider URL.
8. Repeat with an advisor and submit a consented lead.
9. Complete an exploration action.
10. Verify expected events and confirm no personal contact values appear in analytics.
11. Verify empty/error states and keyboard navigation.
12. Verify session ownership prevents accessing another session's results.

## 16. Definition of Done

The frontend is ready for the working demo when:

- All routes and core transitions are implemented.
- The experience works without login.
- A new anonymous session is created and reused on return.
- The quiz is driven by backend questions and preserves answers across navigation and refresh.
- The frontend submits complete answers to the backend and renders the returned recommendations.
- The frontend never calculates scores or invents recommendations.
- Courses, advisors, and ads are loaded from the agreed APIs.
- Sponsored listings are clearly labelled and kept separate.
- Course interest is recorded before external navigation.
- Advisor leads require name, one contact method/value, and explicit consent.
- Confirmation states only appear after successful writes.
- Client and server analytics events follow the agreed ownership rules.
- Loading, empty, error, and retry states are implemented.
- No secret keys or student contact details are exposed in client code or analytics.
- Responsive layout and accessibility basics are verified.
- Tests, lint, and type checking pass where configured.
- README includes local startup, environment setup, migration/seed updates, and checks. Public deployment is explicitly deferred.
- Any incomplete requirements or mocked behaviors are documented honestly.

## 17. Implementation sequence

Implement in vertical slices so each increment is testable:

1. **Foundation:** reuse this Next.js project, implement the approved backend extensions with new migrations, and configure frontend linting, styling tokens, public wire types, and typed adapters.
2. **Session and API client:** anonymous UUID, `X-Session-ID`, standard error handling, and API tests.
3. **Landing and quiz:** start endpoint, question retrieval, linear navigation, local draft persistence, and completion.
4. **Results:** result retrieval, recommendation cards, results analytics.
5. **Options:** category selection, course/advisor lists, sponsored placements, empty/error states.
6. **Course action:** interest write, confirmation/interstitial, validated provider navigation.
7. **Advisor action:** details, consented lead form, success/error handling.
8. **Explore action:** practical activity, completion state, analytics.
9. **Hardening:** responsive QA, accessibility, security review, event deduplication, integration/E2E tests.
10. **Local demo delivery:** apply new migrations to the existing local database, document startup, and smoke-test the complete student journey. Do not deploy publicly in this scope.

At each slice, run the relevant tests and type checking before moving on.

## 18. Instructions to Codex

1. Work only on `feature/frontend_alexander`. Reuse the existing project and API routes; do not scaffold another app or move the current files into a `backend/` folder.
2. Treat this PRD as the agreed frontend/backend contract. If an implementation detail conflicts with it or with the backend PRD, report the mismatch and resolve it explicitly rather than silently inventing behavior.
3. Keep business logic in server-side service modules, not React components or Route Handlers.
4. Keep Supabase service-role access server-side only.
5. Do not implement recommendation scoring in the frontend.
6. Do not fabricate real advisors, courses, credentials, or contact information. Use clearly labelled deterministic demo seed data.
7. Do not add authentication, payment, booking, chat, or an admin dashboard.
8. Use typed schemas and validate both client requests and server inputs.
9. Do not expose internal score weights or contact details through analytics.
10. Make writes resilient to repeated clicks and uncertain network outcomes; implement documented idempotency where specified.
11. Build the smallest complete end-to-end flow first, then polish.
12. Run available tests, lint, and type checking. Report what passed, what failed, and what remains incomplete.
13. Update the README with setup, environment variables, incremental migration/seeding, local development, and verification. Hosted deployment remains deferred.
14. Keep the UI copy exploratory and non-diagnostic.
15. If the API response schema needs to change, update the shared types, backend handler, frontend client, tests, and documentation together.

## 19. Remaining implementation and release notes

Product decisions are recorded at the top of this revision. No further product approval is needed for those selected options.

- Maintain the implemented backend extensions and their tests. Keep the API contract honest about implemented behavior and demo limitations.
- Seven-day unfinished-draft expiry, per-tab results-view deduplication, and local exploration completion are explicit browser policies, separate from 90-day server retention.
- Use reviewed English content; Burmese translations are deferred.
- This scope is a local demo. Public hosting, real advisor/provider data, actual contact routing, and final public-launch consent wording remain future work.
- Choose routine implementation details within the approved scope, document them, and preserve safe handling of storage failures, uncertain network outcomes, and older result snapshots.

**Final principle:** Build a small, complete, testable student journey. The frontend should make the next action clear while the backend remains the source of truth for recommendations, persistence, and successful writes.

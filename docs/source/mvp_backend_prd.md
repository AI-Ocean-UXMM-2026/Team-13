# **Career Guidance MVP — Backend PRD**

**Version:** 1.0  
**Date:** 21 October 2026  
**Purpose:** Implementation brief for Codex

## **1\. Objective**

Build the backend for a student-facing career exploration MVP. Students who have finished matriculation or are preparing for university can complete a short quiz, explore three possible career directions, and take a practical next step through courses or advisors.

Recommendations must be presented as exploratory suggestions, not definitive career or aptitude assessments.

## **2\. Confirmed Requirements**

| Area | Requirement |
| ----- | ----- |
| Architecture | Next.js Route Handlers \+ Supabase Postgres \+ Vercel |
| Authentication | None; anonymous access |
| Quiz | 10–15 fixed questions stored in Supabase |
| Recommendations | Top 3 career/role suggestions with explanations |
| Scoring | Rule-based category scoring |
| Courses | Title, provider, price, URL |
| Course action | Record interest, then open provider URL |
| Advisors | Name, specialty, contact |
| Advisor action | Collect student contact details as a lead |
| Ads | Seeded ads matched to recommended categories |
| Analytics | Eight specified events |
| Session | Browser-persisted anonymous session ID |
| Retention | 90 days |
| Launch target | Working demo with seeded data and the complete core flow |
| Setup | New project; include migrations and setup instructions |
| Security | Basic demo security |

## **3\. Core User Flow**

1. Generate an anonymous session UUID and persist it in the browser.  
2. Retrieve active quiz questions from Supabase.  
3. Record `quiz_started`.  
4. Submit answers and calculate category scores.  
5. Store the quiz attempt and return up to three career/role recommendations with explanations.  
6. Record `quiz_completed` and `results_viewed`.  
7. Return relevant course and advisor recommendations, plus category-matched ads in separate sponsored placements.  
8. Record course interest before returning the external provider URL.  
9. Allow the student to submit contact details to request contact from an advisor.  
10. Record the agreed analytics events throughout the flow.

## **4\. Database Schema**

Use UUID primary keys, timestamps, foreign keys, suitable indexes, and database constraints.

| Table | Purpose |
| ----- | ----- |
| `career_categories` | Shared category taxonomy |
| `quiz_questions` | Fixed question bank |
| `quiz_options` | Allowed answers for each question |
| `option_category_scores` | Rule-based score contributions from answers to categories |
| `career_roles` | Career/role suggestions and their categories |
| `courses` | Course title, provider, price label, URL, category |
| `advisors` | Advisor name, specialty, contact, category |
| `ads` | Sponsored content, target URL, placement, category, active dates |
| `anonymous_sessions` | Anonymous browser session records and expiry |
| `quiz_attempts` | Answers, completion status, calculated results |
| `course_interests` | Recorded student interest in a course |
| `advisor_leads` | Minimum student contact details and consent |
| `analytics_events` | Append-only event records |

### **4.1 Important Schema Details**

* `option_category_scores`: `option_id`, `category_id`, `score`.  
* `quiz_attempts`: `session_id`, `started_at`, `completed_at`, `answers_json`, `result_json`.  
* `course_interests`: `session_id`, `course_id`, `created_at`.  
* `advisor_leads`: `session_id`, `advisor_id`, `student_name`, `contact_method`, `contact_value`, `consent_at`, `expires_at`.  
* `analytics_events`: `session_id`, optional `attempt_id`, `event_name`, optional entity reference, limited metadata, `created_at`, `expires_at`.

Additional requirements:

* Use `is_active` on content tables to control which records are returned.  
* Use `placement_key` on ads so sponsored content remains separate from organic recommendations.

**Assumption:** The exact category taxonomy and sample content have not been specified. Codex should provide a small, clearly labelled demo dataset with editable scoring weights, rather than treating example categories or scores as validated career science.

## **5\. Recommendation Logic**

Implement deterministic rule-based scoring in a separate service module.

1. Validate that the submission contains one valid answer for every required active question.  
2. Look up the configured category scores for each selected option.  
3. Sum scores by category.  
4. Sort categories by total score descending.  
5. Break ties deterministically, such as by category slug ascending.  
6. Select up to three distinct career roles from the highest-ranked categories.  
7. Return each role with a clear explanation grounded in its category and the configured score mappings.

Additional requirements:

* Do not use an LLM or external scoring service.  
* If valid recommendations cannot be calculated, return a clear error rather than inventing results.  
* Do not expose internal scoring weights in the public quiz response.

## **6\. API Contracts**

The following routes are proposed; adapt naming if the existing frontend already expects different endpoints.

| Endpoint | Responsibility |
| ----- | ----- |
| `GET /api/quiz` | Return active questions and answer options |
| `POST /api/quiz/start` | Create attempt and record `quiz_started` |
| `POST /api/quiz/complete` | Validate answers, score, persist results, record `quiz_completed` |
| `GET /api/results/:attemptId` | Return results for the matching anonymous session |
| `GET /api/courses` | Return course cards filtered by category |
| `POST /api/courses/:courseId/interest` | Record course interest and return provider URL |
| `GET /api/advisors` | Return advisors filtered by category |
| `POST /api/advisors/:advisorId/leads` | Validate and store advisor lead |
| `GET /api/ads` | Return active category-matched ads grouped by placement |
| `POST /api/events` | Record approved frontend analytics events |
| `GET /api/health` | Check required configuration without exposing secrets |

General requirements:

* Use typed request/response schemas.  
* Use consistent error responses.  
* Use server-side Supabase access.

### **6.1 Course-Interest Behavior**

The backend should persist the course-interest record and return the validated provider URL. The frontend opens the external URL only after the backend confirms success.

No internal checkout or payment processing is included.

### **6.2 Advisor Lead Behavior**

Collect only the minimum details needed to contact the student:

* Name  
* One contact method

Require consent before submission.

Do not build booking, messaging, or payment features.

**Assumption:** The exact contact fields and consent wording must be confirmed before a real public launch.

## **7\. Analytics**

The backend must support these eight event names:

* `quiz_started`  
* `quiz_completed`  
* `results_viewed`  
* `course_clicked`  
* `buy_interest`  
* `advisor_clicked`  
* `advisor_lead_submitted`  
* `explore_clicked`

Requirements:

1. Record events with the anonymous session ID and, where relevant, quiz attempt or entity references.  
2. Use the frontend to report view and click events such as `results_viewed`, `course_clicked`, `advisor_clicked`, and `explore_clicked`.  
3. Record `buy_interest` and `advisor_lead_submitted` on the server as part of the corresponding successful write operations, avoiding false success events and duplicate counting.  
4. Reject unknown event names.  
5. Limit event metadata to an explicit allowlist.

## **8\. Ads Behavior**

* Seed sample ads in Supabase.  
* Associate each ad with one or more career categories.  
* Return ads matching the categories recommended to the student.  
* Use dedicated placement identifiers.  
* Clearly label ads as sponsored.  
* Never mix sponsored content into organic career ranking or scoring.  
* Return only active ads within any configured start/end dates.

**Assumption:** Exact ad creative fields and visual placement dimensions will be determined by the existing frontend design.

## **9\. Anonymous Sessions and Data Retention**

1. Generate a random UUID in the browser and store it in `localStorage`.  
2. Reuse that ID on return and send it with API requests.  
3. Persist sessions in Supabase.  
4. Associate attempts, course interests, leads, and events with the session.  
5. Treat the UUID as a pseudonymous identifier, not authentication.  
6. Retain anonymous session and related records for 90 days.  
7. Provide a cleanup SQL function or command, or configure scheduled cleanup if supported by the deployment.  
8. Document if cleanup must initially be run manually.

**Assumption:** The 90-day retention period applies to quiz attempts, course interests, advisor leads, and analytics events as well as session records. Confirm this before handling real student data.

## **10\. Security Requirements**

Although the launch target is a demo, include these basic protections:

* Enable Row Level Security (RLS) on all tables.  
* Keep the Supabase service-role key on the server only. Never expose it through a `NEXT_PUBLIC_*` variable.  
* Validate session IDs, request bodies, UUIDs, question/option IDs, and referenced entities.  
* Ensure a session can only access its own quiz attempts and associated data.  
* Validate external URLs and allow only `http` or `https`.  
* Rate-limit quiz, event, course-interest, and lead endpoints.  
* Restrict events to the eight approved names and limit metadata size.  
* Avoid logging student contact details.  
* Return generic client-facing errors without leaking database or secret information.

A simple in-memory rate limiter may be acceptable for a local demo, but it is not reliable across Vercel serverless instances. Document that limitation.

## **11\. Project Setup and Migrations**

Codex should:

1. Inspect the repository and existing frontend contracts first.  
2. Reuse the existing framework, package manager, and conventions where possible.  
3. Create the required Supabase migrations, constraints, indexes, and RLS policies.  
4. Create deterministic seed data for questions, options, score mappings, roles, courses, advisors, and ads.  
5. Add `.env.example` with the required Supabase configuration.  
6. Add setup instructions for local development, database migration, seeding, Vercel configuration, and deployment.  
7. Add a health endpoint.  
8. Add tests and run linting and type-checking where available.

### **11.1 Suggested Environment Variables**

SUPABASE\_URL=  
SUPABASE\_ANON\_KEY=  
SUPABASE\_SERVICE\_ROLE\_KEY=

**Security requirement:** The service-role key must only be accessed by server-side code.

## **12\. Acceptance Criteria**

The demo is ready when:

* A new developer can set up the project using the README and a new Supabase project.  
* Migrations and seed data work without undocumented manual database edits.  
* The quiz returns 10–15 active questions with valid options.  
* A student can complete the quiz without logging in.  
* The anonymous session ID persists and is reused on return.  
* Valid answers produce up to three distinct, explained, deterministic recommendations.  
* Invalid or incomplete answers return clear errors.  
* Course cards contain title, provider, price, and URL.  
* Course interest is recorded before the student is directed to the provider.  
* Advisor cards contain name, specialty, and contact.  
* Advisor leads are validated, stored with consent, and associated with the session.  
* Ads match recommended categories, are clearly labelled, and occupy dedicated placements.  
* All eight approved analytics events can be recorded.  
* Basic validation and rate limiting are implemented.  
* The 90-day cleanup process is documented and usable.  
* Tests cover scoring, validation, session ownership, course interest, advisor leads, ad matching, and event allowlisting.  
* The deployed end-to-end flow works: quiz → recommendations → course/advisor actions → analytics.

## **13\. Explicitly Out of Scope**

Do not build:

* Login  
* Internal payments  
* Advisor booking or chat  
* An admin dashboard  
* External ad-network integration  
* Machine-learning recommendations  
* Production-grade analytics infrastructure

## **14\. Instructions to Codex**

Implement in vertical slices:

1. Database and seeds  
2. Anonymous sessions and quiz  
3. Scoring and results  
4. Course-interest capture  
5. Advisor leads  
6. Ads and analytics  
7. Tests and documentation

Additional instructions:

* Inspect the existing repository before changing files.  
* Keep business logic outside Route Handlers.  
* Use typed validation.  
* Preserve existing frontend compatibility.  
* Report any mismatches rather than silently breaking the interface.  
* Run available tests, lint, and type-check commands.  
* List any incomplete acceptance criteria honestly.

**Final principle:** Build the smallest complete working flow first. Treat seeded content and scoring as replaceable demo configuration, not validated career guidance.


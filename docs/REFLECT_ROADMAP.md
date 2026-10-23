# Reflect learning roadmaps

The career cards now offer a browsable path: the existing beginner activity (when configured), up to three related courses, and the existing exploration destination. Every stop is available immediately. The paths do not claim prerequisites, proficiency, or course completion.

Courses load through one `/api/courses?category=...` request after the results arrive. Each card matches courses by category ID. Online introductions come first, vocational workshops second, then other formats; title and ID break ties. The optional `study_option` field remains compatible with older responses. No result snapshots, scoring, database records, or API endpoints change.

Course loading, failure/retry, and empty states remain inside the paths. Career explanations and activity/exploration links remain available. Clicking a course opens its existing detail page and sends the existing `course_clicked` event with `screen: results`; rendering a node never records course interest. Activity clicks use the existing `explore_clicked` event. All destinations retain the attempt ID.

The three card accents are green, blue, and orange. Ordered lists, keyboard focus, touch targets, wrapping labels, and reduced-motion styles support phones and desktop screens. Fictional courses are explicitly labeled.

## Verification

Implemented on `codex/reflect-learning-roadmap`, based on freshly fetched `origin/work` at `d7fac1b`. The existing production fixes are preserved.

- `npm test`: 30 passed.
- `npm run lint` and `npm run typecheck -- --incremental false`: passed.
- `npm run build`: passed.
- `npm run test:integration:local`: 43 HTTP assertions and database checks passed.
- `npm run test:frontend:integration`: concurrency, receipts, ownership, linkage, and event privacy checks passed.
- `npm run test:e2e`: 30 passed across mobile and desktop Chromium, against the optimized local build.
- The three roadmap browser scenarios also passed against the normal Turbopack development server after a fresh restart.
- Screenshots at 320px, 390px, 768px, and 1280px were checked for layout and overflow. The roadmap tests cover course matching/order, activity fallback, navigation, analytics, retry/empty states, keyboard access, and reduced motion.

All database-backed verification used the local Docker harness, with the local configuration explicitly overriding hosted credentials. No hosted database or production deployment was changed.

## Preview release

Hosted preview publication is pending Vercel access and verification that its Preview environment points to a separate test database. Do not promote this branch to production or apply SQL as part of this feature. Review the complete quiz → Reflect → activity/course flow on the isolated preview before promotion, and retain the previous production deployment for rollback.

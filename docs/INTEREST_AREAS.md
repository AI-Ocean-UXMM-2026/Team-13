# Interest-area MVP

Audience: English-speaking Myanmar students aged 18–25 completing matriculation and exploring further study.

Results rank six fixed RIASEC-inspired interest areas by their proportion of available points. At least 50% qualifies; show the top three plus every tie at the third-place cutoff. Fewer qualifiers means fewer suggestions. No qualifiers means neutral browsing of all six. Every area immediately shows three initial example careers and offers practical activities, fictional courses, and fictional advisor profiles. These are exploration suggestions, not aptitude, admission, or job guarantees.

Q13–20 guidance is visible on results. Resource ordering retains study-format, affordability, flexibility, and support preferences. When no example course matches the selected format, the UI explicitly labels the alternatives. Demo course interest is recorded without outbound navigation. Advisor requests start with fictional details and require consent; saving does not send messages or book meetings.

## Local setup and hosted release boundary

`npm run dev:local` applies the new migration and additive example content to Docker automatically. Existing local records and result snapshots remain intact.

For a separately approved hosted release, apply `supabase/migrations/202610230001_interest_areas.sql` after existing migrations, then `supabase/career_examples.sql`, before deploying the matching app. This work does not apply either file to hosted Supabase or deploy Vercel. The app checks schema readiness for writes. Content updates affect only demo records; six existing role IDs are retained. Existing completed result snapshots remain unchanged, with advisor contact removed from their public projection.

New snapshots use `riasec-demo-v2-normalized` and contain all six `areas`, each with score/maxScore/percentage, recommended flag, career examples and ordered resources. `recommendationMode` is `recommended` or `browse`. `recommendations` remains a flat list of the selected areas' examples (possibly empty), rather than exactly three roles. Demo course-interest responses may return `url: null`. Consumers must use the new area contract; old snapshots without it still render through the legacy view.

Editing an already-completed attempt returns a conflict with an explicit new-attempt action. The draft survives and is copied into the new attempt instead of silently showing old results. The landing page offers the latest completed result for the same browser session.

Not supplied by this MVP: verified course inventory, real advisors, admission eligibility, delivery of messages, payments, or a validated psychometric assessment. Fictional catalogs remain clearly labeled.

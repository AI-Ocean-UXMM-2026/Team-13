# Interest-area MVP

Audience: English-speaking Myanmar students aged 18–25 completing matriculation and exploring further study.

Results rank six fixed RIASEC-inspired interest areas by their proportion of available points. At least 50% qualifies; show the top three plus every tie at the third-place cutoff. Fewer qualifiers means fewer suggestions. No qualifiers means neutral browsing of all six. Every area immediately shows three initial example careers and offers practical activities, fictional courses, and fictional advisor profiles. These are exploration suggestions, not aptitude, admission, or job guarantees.

Q13–20 guidance is visible on results. Resource ordering retains study-format, affordability, flexibility, and support preferences. When no example course matches the selected format, the UI explicitly labels the alternatives. Demo course interest is recorded without outbound navigation. Advisor requests start with fictional details and require consent; saving does not send messages or book meetings.

## Local setup and hosted release boundary

`npm run dev:local` applies the new migration and additive example content to Docker automatically. Existing local records and result snapshots remain intact.

Hosted deployment requires no new migration or seed update for quiz start, completion, interest-area results, roadmaps, or mascots. The app checks only the existing frontend persistence marker (`202610210002`) for writes. Career `activity` and `display_order` fields are optional: existing careers use deterministic title/ID ordering and configured browser activities where available. Missing activities are omitted. Existing completed result snapshots remain unchanged, with advisor contact removed from their public projection.

`supabase/migrations/202610230001_interest_areas.sql` and `supabase/career_examples.sql` are optional local demo enhancements, not hosted release prerequisites. They add catalog fields/examples and support recording interest in fictional courses without a URL. The existing write RPC remains in use; without that optional RPC enhancement, URL-less demo interest is unavailable. No fallback bypasses its transaction, ownership, or receipt checks. Do not apply either SQL file to the hosted database for this fix.

New snapshots use `riasec-demo-v2-normalized` and contain all six `areas`, each with score/maxScore/percentage, recommended flag, career examples and ordered resources. `recommendationMode` is `recommended` or `browse`. `recommendations` remains a flat list of the selected areas' examples (possibly empty), rather than exactly three roles. Demo course-interest responses may return `url: null`. Consumers must use the new area contract; old snapshots without it still render through the legacy view.

Editing an already-completed attempt returns a conflict with an explicit new-attempt action. The draft survives and is copied into the new attempt instead of silently showing old results. The landing page offers the latest completed result for the same browser session.

Not supplied by this MVP: verified course inventory, real advisors, admission eligibility, delivery of messages, payments, or a validated psychometric assessment. Fictional catalogs remain clearly labeled.

# RIASEC-inspired career interest profile

This demo is exploratory guidance, not an official or scientifically validated RIASEC assessment, aptitude test, diagnosis, or guaranteed career fit. Questions and option weights live in Postgres, never in route handlers. The source PDF is retained in `docs/source/Quizzes.pdf`.

| Category | Meaning | Questions | Maximum |
| --- | --- | --- | --- |
| R — Realistic | Practical work with tools and materials | 1, 11 | 6 |
| I — Investigative | Research, evidence, technology, analysis | 2, 7, 12 | 9 |
| A — Artistic | Creative expression and original content | 3, 8 | 6 |
| S — Social | Teaching, helping, supporting others | 4, 9 | 6 |
| E — Enterprising | Leadership, persuasion, business | 5, 10 | 6 |
| C — Conventional | Organization and accurate records | 6 | 3 |

Q1–Q12 options contribute 0 (Not interested), 1 (A little interested), 2 (Interested), or 3 (Very interested). `option_category_scores` configures each option/category contribution. The service sums selected option weights for core questions only. Maxima are derived from the maximum configured contribution for each question/category. Percentages = raw / maximum × 100, rounded to two decimals.

Ranking uses **raw score / available maximum descending**. Exact fractions determine ordering and ties; rounded percentages are presentation only. Category code supplies stable display order within a tie, without excluding equally ranked areas.

Areas qualify at **50% or above**. Select the top three qualifying areas and include all ties at the third-place cutoff. One or two qualifying areas are shown without fillers. If none qualify, browse all six neutrally with no recommendations. Category selection is independent of career inventory. Each area includes up to five examples ordered by display order, title, then ID. The initial catalog contains three examples per area (18 total), each with a self-guided activity. Missing examples show an empty state; missing scoring configuration remains an error.

Examples:

- All maximum: all six areas score 100% and qualify equally.
- All zero, or every area below 50%: neutral browsing of all six.
- Only Q6=3: Conventional alone qualifies at 100%.
- Conventional 2/3 ranks above Investigative 5/9 despite the smaller raw total.

The threshold is a product exploration rule, not a validated psychological cutoff. Careers illustrate broad interests; they are not individual career matches. Advertising has no scoring input.

Q13–Q20 remain normalized structured values. They never add to core scores or change career ranking:

| Question | Profile key | Use |
| --- | --- | --- |
| 13 | careerClarity | Tailor exploration/decision guidance |
| 14 | explorationPreference | Rank online/practical courses and advisor support |
| 15 | coursePriorities | Affordability/flexibility ranking; family/location/job research guidance |
| 16 | learningActivity | Suggest the preferred type of beginner activity |
| 17 | studyOptions | Prioritize courses matching realistic study choices |
| 18 | readiness | Exploration versus concrete action guidance |
| 19 | desiredSupport | Comparison, action-plan, new-field, or advisor guidance |
| 20 | nextAction | Concrete suggested activity this week |

All questions require an answer. Q15 and Q17 permit one or two distinct options; other questions permit exactly one. Course ranking: matching study type +4, affordability +2, flexibility +2, matching online/practical exploration preference +1; then career category rank, then UUID. Advisor support matches rank first, then category rank and UUID. The profile stores all selected context, including choices for which the demo has no matching course inventory. Courses are suggestions, not verified eligibility or job-market data.

Results include `scoringVersion: riasec-demo-v2-normalized` and are stored as snapshots. Identical answer sets produce identical result objects for the same active database configuration. Reordered answers/options are canonicalized. A completed attempt returns its saved result for an identical retry; different answers receive 409. Ads are requested separately and never influence the result.

## Exploration companions

The optional frontend mascot feature compares `score / maxScore` across interest themes (or the saved percentages when maxima are unavailable). This compensates for unequal question counts so equal interest does not automatically favor Investigative/Naga. Equal positive ratios let the student choose among the tied companions; zero or incomparable results offer all six. New career-area rankings use the same normalization. Neutral browsing allows all six companion choices. Legacy saved results retain their original scoring and are labeled as earlier versions; they are never rescored on read.

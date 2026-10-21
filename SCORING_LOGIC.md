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

Ranking uses **raw scores descending**, then **category code ascending** (`A,C,E,I,R,S`). This follows the PRD; unequal question counts favor categories with more questions. Percentages are informational and do not change ranking. Any future normalization change must version the scoring contract.

Walk ranked categories in order; select the first active role ordered by title, then UUID, from each category, stopping at three distinct roles. Categories with no active roles are skipped. Missing score configuration or no active roles produces an error rather than fabricated guidance. `topCategories` contains the categories of those selected roles; `rankedCategories` always reports all six categories. All-zero answers produce deterministic neutral exploration examples with an explicit no-interest explanation. There is no randomness, AI, or advertising input.

Examples:

- All maximum: R=6, I=9, A=6, S=6, E=6, C=3; top categories I, A, E with the seed roles.
- All zero: all scores zero; top A, C, E, labelled neutral exploration examples.
- Only Q6=3: C=3, all others zero; top C, A, E.
- Equal raw scores break by category code, regardless of submission order.

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

Results include `scoringVersion: riasec-demo-v1-raw` and are stored as snapshots. Identical answer sets produce identical result objects for the same active database configuration. Reordered answers/options are canonicalized. A completed attempt returns its saved result for an identical retry; different answers receive 409. Ads are requested separately and never influence the result.

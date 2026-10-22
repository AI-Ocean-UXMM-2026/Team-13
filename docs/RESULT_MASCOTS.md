# Myanmar-inspired result companions

Reflect now includes an exploration companion beneath its existing heading and explanation. The hero preserves the findings cards, career ordering, and learning roadmaps. It compares each stored interest score against that theme's maximum without changing backend scoring or quiz completion.

## Matching and choices

| Interest | Character | Personality | Positive line |
| --- | --- | --- | --- |
| Realistic | Chinthe — ခြင်္သေ့ | The Hands-on Builder | Bring ideas to life |
| Investigative | Naga — နဂါး | The Curious Investigator | Follow your curiosity |
| Artistic | Karaweik — ကရဝိတ် | The Creative Storyteller | Make your ideas visible |
| Social | Hintha — ဟင်္သာ | The Caring Connector | Grow by helping others |
| Enterprising | Galon — ဂဠုန် | The Bold Initiator | Turn possibility into action |
| Conventional | Pyinsayupa — ပဉ္စရူပ | The Thoughtful Organizer | Make room for a clear next step |

A unique positive highest relative interest selects its character automatically. Ratios use `score / maxScore`, with the existing percentage field supported for older snapshots without maxima. Ties offer only the co-leading characters and require a choice. All-zero, empty, or unusable scores and raw-only snapshots offer all six, with explicit copy that this is a choice for exploration. The six personality associations are original Wayfinder interpretations, rather than claims about traditional symbolism or a validated personality assessment.

This avoids the original raw-score bias: Investigative has three questions (maximum 9), most themes have two (maximum 6), and Conventional has one (maximum 3). Equal answers across all interest questions now produce an equal-interest choice instead of automatically selecting Naga. Q13–Q20 tailor guidance and resources; they do not determine the companion. Existing career rankings continue using their documented raw-score contract.

Karaweik replaces the human-bird Kinnari artwork with a fully avian character. A saved eligible Kinnari choice maps to Karaweik, preserving the student's Artistic companion selection. The old artwork is no longer served.

Choices are stored with the existing browser storage helpers under `career.mascot.v1.<session>.<attempt>`. Only an eligible saved character is restored. Storage denial uses the existing memory fallback and storage notice. Nothing new is written to the database.

## Assets and reproducible cards

- `public/mascots/results/*.webp`: six original transparent illustrations, optimized to 768×768; approximately 100–135 KB each.
- `public/mascots/results/cards/*.png`: six 1080×1080 share cards. Their content is fixed character information and Wayfinder branding, with no personal or quiz data.
- `public/fonts/NotoSansMyanmar.ttf` and `NotoSansMyanmar-OFL.txt`: locally hosted font and license from the [official Google Fonts source](https://github.com/google/fonts/tree/main/ofl/notosansmyanmar).
- [Generation prompts](mascot-generation-prompts.json): exact per-character prompts and source filenames. Illustrations used the built-in image-generation tool with transparent backgrounds. The original generated PNGs remain in the generator's output directory; project references use only the bundled WebP copies.

Run `npm run mascots:render` from the repository root to regenerate all six cards with the current typed mascot catalog and bundled font. The script uses the project's Playwright Chromium, waits for font and image decoding, and renders locally; it needs no running app, hosted database, image API, or external font request. Install the project's Playwright Chromium if it is not already available.

## Sharing and resilience

Download PNG is available after the selected static card has loaded. Native Share image appears when the browser supports sharing that prepared PNG file. The share call runs directly from the user's click, with no preceding network wait. Cancellation is quiet; other failures retain download. Sharing hands the image to the device's share menu and does not automatically post to any social account.

No names, raw answers, scores, careers, session IDs, attempt IDs, or private result links are exported. No public result route, API endpoint, analytics event, runtime AI call, or migration was added. An illustration failure has its own text fallback and retry, independently of share-card loading. These failures never block the result or its roadmaps.

## Cultural references

References informed recognizable creature features; the assets are original illustrations, not copies of museum imagery.

- Chinthe: [Philadelphia Museum of Art, Temple Lion](https://www.philamuseum.org/objects/277507).
- Naga: [Asian Art Museum, mythical snake in human form](https://searchcollection.asianart.org/objects/18616/a-mythical-snake-in-human-form-naga-in-a-position-of-resp).
- Karaweik: [Karaweik Palace's description of the gold Karaweik birds](https://karaweikpalace.com/cultural-show/kinnari-and-kinnara-dance). The same reference explains the human-bird form of the superseded Kinnari character.
- Hintha: [Metropolitan Museum of Art, Henzas at Shwe Dagon](https://www.metmuseum.org/art/collection/search/302660).
- Galon: [British Museum, Burmese betel box and Galon description](https://www.britishmuseum.org/collection/object/A_1998-0723-119).
- Pyinsayupa: [Antonio Pasqualino International Puppet Museum, collections](https://www.museodellemarionette.it/en/il-museo-2/the-collections).

## Verification

- Unit tests: 38 passed, including six-way normalized matching, equal-interest regression cases, tied and neutral results, invalid choices, storage isolation/fallback, and dimensions of every PNG.
- Lint, strict TypeScript, and optimized production build: passed.
- Complete Chromium suite: 44 passed across mobile and desktop against the optimized local build. Coverage includes choice persistence, keyboard selection, 320/390/768/1280px layouts, reduced motion, image retries, exact PNG downloads, and native sharing capability/cancel/error behavior through browser stubs. A real local-database regression test completes seven different quiz patterns, verifies all six characters plus an equal-interest choice, and checks that career ordering stays unchanged. No social posts were sent.
- Both existing API integration suites passed against the isolated local Docker database, including 43 HTTP assertions plus concurrency, idempotency, ownership, action linkage, and event privacy checks.
- All six final share cards were visually inspected, including Burmese shaping and the complete character silhouettes.

## Release

Work remains on `codex/reflect-learning-roadmap`. Production is unchanged. Hosted preview publication still requires Vercel access and a separate test database; do not use production data for preview verification.

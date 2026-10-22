import { test, expect, type Page } from "@playwright/test";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const attemptId = uuid(1);
const categories = [
  { code: "A", name: "Artistic", score: 6 },
  { code: "I", name: "Investigative", score: 6 },
  { code: "S", name: "Social", score: 6 },
  { code: "C", name: "Conventional", score: 0 },
  { code: "E", name: "Enterprising", score: 0 },
  { code: "R", name: "Realistic", score: 0 },
].map((category, i) => ({ id: uuid(10 + i), ...category }));
const titles = [
  "Accessibility Specialist for Digital Products and Inclusive Experiences",
  "Cybersecurity Analyst",
  "Community educator",
];
const recommendations = categories.slice(0, 3).map((category, i) => ({
  id: uuid(20 + i),
  category_id: category.id,
  category: category.code,
  title: titles[i],
  description:
    "Explore the everyday work in this career and consider whether you would enjoy learning more about it.",
  reason:
    "Your answers suggest this is a possible direction to investigate, not a guaranteed fit.",
  suggested_next_step:
    "Try a beginner activity and reflect on what you enjoyed.",
  is_demo: true,
}));
const explanation =
  "Your highest-ranked interests include Artistic, Investigative, Social. Explore these directions through small activities and conversations.";
function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    recommendations,
    rankedCategories: categories,
    explanation,
    profile: {
      explorationPreference: "professional_conversation",
      coursePriorities: ["affordability", "study_length_flexibility"],
    },
    nextAction: { text: "Choose a next step.", guidance: [] },
    ...overrides,
  };
}
async function serve(page: Page, current: () => unknown) {
  const events: { eventName: string }[] = [];
  await page.route("**/api/results/*", (route) =>
    route.fulfill({ json: { attemptId, result: current() } }),
  );
  await page.route("**/api/events", (route) => {
    events.push(route.request().postDataJSON());
    return route.fulfill({ json: { recorded: true } });
  });
  return events;
}
async function capture(page: Page, label: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/reflect-${label}.png`,
    fullPage: true,
    scale: "css",
  });
}

test("Reflect summarizes existing answers, preserves tied ordering and links, and fits phone, tablet, and desktop layouts", async ({
  page,
}, info) => {
  const events = await serve(page, () => snapshot());
  await page.goto(`/results/${attemptId}`);
  const summary = page.getByRole("region", { name: "What we found about you" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What we found about you",
  );
  await expect(summary.getByText(explanation, { exact: true })).toHaveCount(1);
  await expect(page.getByText(explanation, { exact: true })).toHaveCount(1);
  await expect(summary.locator(".interest-themes li")).toHaveText([
    "Artistic",
    "Investigative",
    "Social",
  ]);
  await expect(
    summary.getByText("Talking with a student or working professional", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(summary.locator(".course-priorities li")).toHaveText([
    "Tuition fees and affordability",
    "Length and flexibility of study",
  ]);
  await expect(page.locator(".recommendation-card h3")).toHaveText(titles);
  const directions = page.getByRole("region", {
    name: "A few directions to explore.",
  });
  await expect(directions.getByRole("article")).toHaveCount(3);
  await expect(
    directions.getByRole("link", { name: "Explore this direction" }),
  ).toHaveCount(3);
  await expect(page.locator(".top-direction")).toHaveCount(0);
  await expect(
    page.getByText("Your first direction", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page
      .locator("#reflect-title, #directions-title")
      .evaluateAll((nodes) => nodes.map((node) => node.id)),
  ).toEqual(["reflect-title", "directions-title"]);
  await expect
    .poll(
      () =>
        events.filter((event) => event.eventName === "results_viewed").length,
    )
    .toBe(1);
  await page.reload();
  await expect(summary).toBeVisible();
  expect(
    events.filter((event) => event.eventName === "results_viewed"),
  ).toHaveLength(1);
  if (info.project.name === "desktop") {
    for (const [width, columns, label] of [
      [1280, 3, "desktop"],
      [768, 2, "tablet"],
      [320, 1, "narrow"],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page
          .locator(".findings-grid")
          .evaluate(
            (node) =>
              getComputedStyle(node).gridTemplateColumns.split(" ").length,
          ),
      ).toBe(columns);
      expect(
        await page
          .locator(".recommendation-grid")
          .evaluate(
            (node) =>
              getComputedStyle(node).gridTemplateColumns.split(" ").length,
          ),
      ).toBe(width === 1280 ? 3 : width === 768 ? 2 : 1);
      await capture(page, label);
    }
  } else await capture(page, "mobile");
  for (const [path, json] of [
    ["courses", { courses: [] }],
    ["advisors", { advisors: [] }],
    ["ads", { placements: {} }],
  ] as const) {
    await page.route(`**/api/${path}?*`, (route) => route.fulfill({ json }));
  }
  await page
    .getByRole("link", { name: "Explore this direction" })
    .first()
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/options/${attemptId}\\?category=A$`),
  );
  await expect(
    page
      .getByRole("group", { name: "Choose a recommended direction" })
      .getByRole("button")
      .first(),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Reflect keeps older, malformed, and unknown preference metadata readable without exposing codes", async ({
  page,
}) => {
  let current = snapshot();
  await serve(page, () => current);
  const legacyCategories = categories.map(
    ({ score: _score, ...category }) => category,
  );
  for (const profile of [
    undefined,
    "broken",
    { explorationPreference: 123, coursePriorities: null },
  ]) {
    current = snapshot({ profile, rankedCategories: legacyCategories });
    await page.goto(`/results/${attemptId}`);
    const summary = page.getByRole("region", {
      name: "What we found about you",
    });
    await expect(
      summary.getByText("Not recorded in this result.", { exact: true }),
    ).toHaveCount(2);
    await expect(summary.locator(".interest-themes li")).toHaveText([
      "Artistic",
      "Investigative",
      "Social",
    ]);
    await expect(page.locator(".recommendation-card")).toHaveCount(3);
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  }
  current = snapshot({
    rankedCategories: categories.map((category) => ({
      ...category,
      score: "broken",
    })),
    profile: {
      explorationPreference: "unrecognized_private_code",
      coursePriorities: ["another_private_code", "affordability"],
    },
  });
  await page.reload();
  const summary = page.getByRole("region", { name: "What we found about you" });
  await expect(
    summary.getByText("Not recorded in this result.", { exact: true }),
  ).toHaveCount(1);
  await expect(summary.locator(".course-priorities li")).toHaveText([
    "Tuition fees and affordability",
  ]);
  await expect(page.locator("main")).not.toContainText("private_code");
  await expect(page.locator(".recommendation-card h3")).toHaveText(titles);
});

test("Reflect keeps all-zero interests neutral and empty recommendation results usable", async ({
  page,
}, info) => {
  const neutralExplanation =
    "You reported no interest in the core activities. These are neutral exploration examples ordered by the documented tie-breaker, not evidence of a preferred career.";
  let current = snapshot({
    rankedCategories: categories.map((category) => ({ ...category, score: 0 })),
    explanation: neutralExplanation,
  });
  await serve(page, () => current);
  await page.goto(`/results/${attemptId}`);
  const summary = page.getByRole("region", { name: "What we found about you" });
  const interests = page.getByRole("region", { name: "Interest themes" });
  await expect(
    summary.getByText(neutralExplanation, { exact: true }),
  ).toHaveCount(1);
  await expect(
    interests.getByText("No clear interest pattern yet.", { exact: true }),
  ).toBeVisible();
  await expect(interests.getByRole("listitem")).toHaveCount(0);
  await expect(summary).not.toContainText(/highest|strongest|match score/i);
  await expect(page.locator(".recommendation-card h3")).toHaveText(titles);
  await capture(page, `neutral-${info.project.name}`);
  current = snapshot({
    recommendations: [],
    rankedCategories: [],
    profile: undefined,
  });
  await page.reload();
  await expect(summary).toBeVisible();
  await expect(
    page.getByText("No directions are available for this attempt.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator(".top-direction")).toHaveCount(0);
  await expect(page.locator(".recommendation-card")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Choose a next step" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "retry loading" }),
  ).toBeVisible();
});

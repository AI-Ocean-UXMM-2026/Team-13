import { test, expect, type Page } from "@playwright/test";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const attemptId = uuid(1);
const roles = [
  "8a44d176-5457-5aaa-b350-86422de76d06",
  uuid(22),
  "ab5a9130-1876-5cc0-b33f-5d9e51af8284",
];
const categories = ["A", "I", "S"].map((code, i) => ({
  id: uuid(10 + i),
  code,
  name: code,
}));
const result = {
  recommendations: categories.map((c, i) => ({
    id: roles[i],
    category_id: c.id,
    category: c.code,
    title:
      i === 0
        ? "Accessibility Specialist for Digital Products and Inclusive Experiences"
        : `Career ${i + 1}`,
    description: "Explore the everyday work in this career.",
    reason: "A possible direction to investigate, not a guaranteed fit.",
    is_demo: true,
  })),
  rankedCategories: categories,
  explanation:
    "Explore these directions through small activities and conversations.",
  nextAction: { text: "Choose a next step.", guidance: [] },
};
const courses = [
  {
    n: 31,
    category: 0,
    title: "Practical workshop",
    study_option: "vocational_training",
  },
  {
    n: 32,
    category: 1,
    title: "Research introduction",
    study_option: "online_short_courses",
  },
  {
    n: 33,
    category: 0,
    title:
      "Introduction to Accessible Visual Communication and Inclusive Digital Design",
    study_option: "online_short_courses",
  },
].map(({ n, category, ...c }) => ({
  ...c,
  id: uuid(n),
  category_id: categories[category].id,
  summary: "Fictional introductory course.",
  provider: "Example learning provider",
  price_label: "Cost to be confirmed",
  url: "https://example.com/course",
  is_demo: true,
}));

async function serve(page: Page) {
  const events: {
    eventName: string;
    attemptId?: string;
    entityId?: string;
    metadata: { screen: string };
  }[] = [];
  const interestWrites: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && /\/interest(?:\?|$)/.test(request.url()))
      interestWrites.push(request.url());
  });
  await page.route("**/api/results/*", (route) =>
    route.fulfill({ json: { attemptId, result } }),
  );
  await page.route("**/api/events", (route) => {
    events.push(route.request().postDataJSON());
    return route.fulfill({ json: { recorded: true } });
  });
  await page.route("**/api/courses/*", (route) =>
    route.fulfill({ json: { course: courses[2] } }),
  );
  return { events, interestWrites };
}

test("paths match careers, load courses once, and preserve course/activity navigation and analytics", async ({
  page,
}) => {
  const { events, interestWrites } = await serve(page);
  const queries: string[] = [];
  await page.route("**/api/courses?*", (route) => {
    queries.push(new URL(route.request().url()).searchParams.get("category")!);
    return route.fulfill({ json: { courses } });
  });
  await page.goto(`/results/${attemptId}`);
  const cards = page.locator(".recommendation-card");
  await expect(cards.first().locator(".roadmap-course-title")).toHaveText([
    courses[2].title,
    courses[0].title,
  ]);
  await expect(cards.nth(1).locator(".roadmap-course-title")).toHaveText([
    courses[1].title,
  ]);
  await expect(cards.nth(2).locator(".roadmap-course")).toHaveCount(0);
  await expect(cards.nth(1).getByText("Try it out")).toHaveCount(0);
  expect(queries).toEqual(["A,I,S"]);
  expect(events.filter((e) => e.eventName === "course_clicked")).toHaveLength(
    0,
  );
  expect(interestWrites).toEqual([]);
  const activity = cards
    .first()
    .getByRole("link", { name: /Make an idea visible/ });
  await expect(activity).toHaveAttribute(
    "href",
    `/explore/${roles[0]}?attemptId=${attemptId}`,
  );
  await expect(activity).toContainText("About 25 min");
  await expect(
    cards
      .first()
      .getByRole("link", { name: "Explore this direction", exact: true }),
  ).toHaveAttribute("href", `/options/${attemptId}?category=A`);
  await activity.click();
  await expect(page).toHaveURL(
    new RegExp(`/explore/${roles[0]}\\?attemptId=${attemptId}$`),
  );
  await expect
    .poll(() => events.filter((e) => e.eventName === "explore_clicked").length)
    .toBe(1);
  await page.goBack();
  const courseLink = cards.first().locator(".roadmap-course").first();
  await expect(courseLink).toContainText("Example learning provider");
  await expect(courseLink).toContainText("Cost to be confirmed");
  await expect(courseLink).toContainText("Fictional example course");
  await activity.focus();
  await page.keyboard.press("Tab");
  await expect(courseLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(
    new RegExp(`/course/${courses[2].id}\\?attemptId=${attemptId}$`),
  );
  await expect
    .poll(() => events.filter((e) => e.eventName === "course_clicked").length)
    .toBe(1);
  expect(events.find((e) => e.eventName === "course_clicked")).toMatchObject({
    attemptId,
    entityId: courses[2].id,
    metadata: { screen: "results" },
  });
  await expect(
    page.getByRole("button", { name: "Record demo interest", exact: true }),
  ).toBeVisible();
  expect(interestWrites).toEqual([]);
});

test("loading, failed, retried and empty courses keep the rest of each path usable", async ({
  page,
}) => {
  await serve(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route("**/api/courses?*", async (route) => {
    calls += 1;
    if (calls === 1) {
      await gate;
      await route.fulfill({ status: 503, json: { error: "Unavailable" } });
    } else await route.fulfill({ json: { courses: [] } });
  });
  await page.goto(`/results/${attemptId}`);
  await expect(page.getByText("Finding course stops…")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "What we found about you" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Make an idea visible/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore this direction", exact: true }),
  ).toHaveCount(3);
  release();
  await expect(page.getByRole("button", { name: "Retry courses" })).toHaveCount(
    3,
  );
  await page.getByRole("button", { name: "Retry courses" }).first().click();
  await expect(
    page.getByText("No course options are available for this direction yet."),
  ).toHaveCount(3);
  expect(calls).toBe(2);
  await expect(
    page.getByRole("link", { name: /Make an idea visible/ }),
  ).toBeVisible();
});

test("long labels fit narrow phones, tablets and desktops with accessible targets and reduced motion", async ({
  page,
}, info) => {
  await serve(page);
  await page.route("**/api/courses?*", (route) =>
    route.fulfill({ json: { courses } }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/results/${attemptId}`);
  await expect(page.locator(".roadmap-course")).toHaveCount(3);
  for (const width of info.project.name === "desktop"
    ? [320, 768, 1280]
    : [390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const targets = await page.locator(".roadmap-link").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          overflow: node.scrollWidth > node.clientWidth,
        };
      }),
    );
    expect(
      targets.every((r) => r.width >= 44 && r.height >= 44 && !r.overflow),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/roadmap-${width}.png`,
      fullPage: true,
    });
  }
  const first = page.locator(".roadmap-link").first();
  await first.focus();
  expect(
    await first
      .locator(".roadmap-node")
      .evaluate((node) => ({
        transition: getComputedStyle(node).transitionDuration,
        transform: getComputedStyle(node).transform,
      })),
  ).toEqual({ transition: "0s", transform: "none" });
  expect(
    await first.evaluate((node) => getComputedStyle(node).outlineStyle),
  ).toBe("solid");
});

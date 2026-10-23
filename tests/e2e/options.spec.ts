import { test, expect, type Page } from "@playwright/test";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const attemptId = uuid(1);
const directions = [
  { title: "Content designer", category: "A", categoryName: "Artistic" },
  { title: "Research assistant", category: "I", categoryName: "Investigative" },
  { title: "Project coordinator", category: "E", categoryName: "Enterprising" },
];
const recommendations = directions.map((direction, i) => ({
  id: uuid(10 + i),
  category_id: uuid(20 + i),
  title: direction.title,
  category: direction.category,
  description: "A demo direction to explore.",
  is_demo: true,
  reason: "An example based on your responses.",
  suggested_next_step: `Explore ${direction.title.toLowerCase()} resources.`,
}));
const courses = [4, 1, 5, 2, 3].map((n) => ({
  id: uuid(100 + n),
  category_id: uuid(20),
  title: `Demo course ${n}: an introduction to visual communication`,
  summary:
    "Explore how to communicate ideas through clear layouts and thoughtful typography. Try practical exercises and reflect on the work you enjoy before choosing your next step.",
  provider: `Example provider ${n}`,
  price_label: "Demo: cost to be confirmed",
  url: "https://example.com/course",
  is_demo: true,
}));
const advisors = [3, 1, 4, 2].map((n) => ({
  id: uuid(200 + n),
  category_id: uuid(20),
  name: `Demo advisor ${n}`,
  specialty: "Creative practice and study pathways",
  summary:
    "An example advisor profile for discussing study choices, comparing learning pathways, and preparing questions. Demo requests are stored locally; no messages are sent.",
  is_demo: true,
}));
const placements = {
  options_footer: [
    {
      id: uuid(300),
      title: "Demo learning opportunity",
      summary:
        "Fictional sponsored listing, separate from your career suggestions.",
      provider_name: "Example sponsor",
      label: "Sponsored",
      is_demo: true,
      url: "https://example.com/offer",
    },
  ],
  options_footer_secondary: [
    {
      id: uuid(301),
      title: "Demo event",
      summary: "An additional example sponsored listing.",
      label: "Sponsored",
      is_demo: true,
      url: null,
    },
  ],
};

async function mockResults(page: Page) {
  await page.route("**/api/results/*", (route) =>
    route.fulfill({
      json: {
        attemptId,
        result: {
          recommendations,
          rankedCategories: directions.map((d, i) => ({
            id: uuid(20 + i),
            code: d.category,
            name: d.categoryName,
          })),
          explanation: "Demo directions for interface verification.",
          nextAction: { text: "Choose a resource.", guidance: [] },
        },
      },
    }),
  );
}

async function screenshot(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${name}.png`,
    fullPage: true,
    scale: "css",
  });
}

test("Explore displays resources, keeps API order, caches directions, and follows the wireframe at every width", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockResults(page);
  const requests: Record<string, number> = {};
  for (const resource of ["courses", "advisors", "ads"]) {
    await page.route(`**/api/${resource}?*`, (route) => {
      const category = new URL(route.request().url()).searchParams.get(
        "category",
      )!;
      const key = `${resource}:${category}`;
      requests[key] = (requests[key] ?? 0) + 1;
      const count = category === "A" ? 5 : category === "I" ? 2 : 0;
      return route.fulfill({
        json:
          resource === "ads"
            ? { placements: category === "A" ? placements : {} }
            : {
                [resource]: (resource === "courses" ? courses : advisors).slice(
                  0,
                  count,
                ),
              },
      });
    });
  }
  await page.goto(`/options/${attemptId}?category=A`);
  const courseSection = page.getByRole("region", {
    name: "Learn something new",
  });
  const advisorSection = page.getByRole("region", {
    name: "Talk with an advisor",
  });
  const community = page.getByRole("region", { name: "Join a community" });
  await expect(courseSection.getByRole("heading", { level: 3 })).toHaveText(
    [4, 1, 5, 2, 3].map(
      (n) => `Course ${n}: an introduction to visual communication`,
    ),
  );
  await expect(advisorSection.getByRole("heading", { level: 3 })).toHaveText([
    "Advisor 3",
    "Advisor 1",
    "Advisor 4",
    "Advisor 2",
  ]);
  await expect(
    courseSection.getByRole("link", { name: "View course" }).first(),
  ).toHaveAttribute("href", `/course/${courses[0].id}?attemptId=${attemptId}`);
  await expect(
    advisorSection.getByRole("link", { name: "View advisor" }).first(),
  ).toHaveAttribute(
    "href",
    `/advisor/${advisors[0].id}?attemptId=${attemptId}`,
  );
  await expect(page.getByText("Give curiosity", { exact: false })).toHaveCount(
    0,
  );
  await expect(page.locator('a[href^="/explore/"]')).toHaveCount(0);
  await expect(
    community.getByText("Coming soon", { exact: true }),
  ).toBeVisible();
  await expect(
    community.locator("a, button, input, select, textarea, [tabindex]"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "View example offer" }),
  ).toHaveCount(1);
  await expect(
    page.locator(
      '[data-placement="options_footer_secondary"] .sponsored-label',
    ),
  ).toHaveText("Sponsored");
  await expect(
    page.getByRole("region", { name: "Sponsored content", exact: true }),
  ).toHaveCount(2);
  await expect(courseSection.locator(".price-label")).toHaveText([
    "Cost to be confirmed",
    "Cost to be confirmed",
    "Cost to be confirmed",
    "Cost to be confirmed",
    "Cost to be confirmed",
  ]);
  await expect(
    page.getByRole("link", { name: "View example offer" }),
  ).toHaveAttribute("href", "https://example.com/offer");
  const order = await page
    .locator(
      "#courses-title, #advisors-title, #community-title, #sponsored-title",
    )
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(order).toEqual([
    "courses-title",
    "advisors-title",
    "community-title",
    "sponsored-title",
  ]);

  const buttons = page
    .getByRole("group", { name: "Choose an interest area" })
    .getByRole("button");
  await page.evaluate(() => window.scrollTo({ top: 80, behavior: "instant" }));
  const scroll = await page.evaluate(() => scrollY);
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(courseSection.getByRole("article")).toHaveCount(2);
  await expect(advisorSection.getByRole("article")).toHaveCount(2);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await expect(
    page.getByRole("heading", { name: "Sponsored offers" }),
  ).toHaveCount(0);
  await buttons.first().click();
  await expect(courseSection.getByRole("article")).toHaveCount(5);
  await expect(advisorSection.getByRole("article")).toHaveCount(4);
  await expect(page.getByText("Sponsored", { exact: true })).toHaveCount(2);
  for (const resource of ["courses", "advisors", "ads"]) {
    expect(requests[`${resource}:A`]).toBe(1);
    expect(requests[`${resource}:I`]).toBe(1);
  }
  if (info.project.name === "desktop") {
    for (const [width, columns, label] of [
      [1280, 3, "desktop"],
      [768, 2, "tablet"],
      [320, 1, "narrow"],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      for (const grid of [".course-grid", ".advisor-grid", ".sponsored-grid"]) {
        expect(
          await page
            .locator(grid)
            .evaluate(
              (node) =>
                getComputedStyle(node).gridTemplateColumns.split(" ").length,
            ),
        ).toBe(columns);
      }
      const offers = await page
        .locator(".sponsored-placement article")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const { x, y } = node.getBoundingClientRect();
            return { x, y };
          }),
        );
      if (width > 639) {
        expect(offers[0].y).toBe(offers[1].y);
        expect(offers[1].x).toBeGreaterThan(offers[0].x);
      } else expect(offers[1].y).toBeGreaterThan(offers[0].y);
      await screenshot(page, `explore-resources-${label}`);
    }
  } else await screenshot(page, "explore-resources-mobile");
  await buttons.nth(2).click();
  await expect(courseSection.getByRole("article")).toHaveCount(0);
  await expect(advisorSection.getByRole("article")).toHaveCount(0);
  await expect(
    courseSection.getByText(
      "No course options are available for this direction yet.",
    ),
  ).toBeVisible();
  await expect(
    advisorSection.getByText(
      /You can still explore courses or choose another direction/,
    ),
  ).toBeVisible();
  await expect(community).toBeVisible();

  await page.route(`**/api/courses/${courses[0].id}`, (route) =>
    route.fulfill({ json: { course: courses[0] } }),
  );
  await page.goto(`/course/${courses[0].id}?attemptId=${attemptId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Course 4: an introduction to visual communication",
  );
  await expect(
    page.getByText("Cost to be confirmed", { exact: true }),
  ).toBeVisible();
  await page.route(`**/api/advisors/${advisors[0].id}`, (route) =>
    route.fulfill({ json: { advisor: advisors[0] } }),
  );
  await page.goto(`/advisor/${advisors[0].id}?attemptId=${attemptId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Advisor 3");
  await expect(
    page.getByRole("button", { name: "Submit request" }),
  ).toBeVisible();
});

test("Explore preserves successful sections while course and sponsored requests retry independently", async ({
  page,
}, info) => {
  await mockResults(page);
  let failCourse = true,
    failAds = true;
  await page.route("**/api/courses?*", (route) =>
    route.fulfill(
      failCourse
        ? { status: 503, json: { error: { code: "UNAVAILABLE" } } }
        : { json: { courses: courses.slice(0, 1) } },
    ),
  );
  await page.route("**/api/advisors?*", (route) =>
    route.fulfill({ json: { advisors: advisors.slice(0, 1) } }),
  );
  await page.route("**/api/ads?*", (route) =>
    route.fulfill(
      failAds
        ? { status: 503, json: { error: { code: "UNAVAILABLE" } } }
        : { json: { placements: {} } },
    ),
  );
  await page.goto(`/options/${attemptId}`);
  const courseSection = page.getByRole("region", {
    name: "Learn something new",
  });
  const advisorSection = page.getByRole("region", {
    name: "Talk with an advisor",
  });
  const sponsorSection = page.getByRole("region", { name: "Sponsored offers" });
  await expect(
    advisorSection.getByRole("link", { name: "View advisor" }),
  ).toBeVisible();
  await expect(courseSection.getByRole("alert")).toBeVisible();
  await expect(sponsorSection.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Join a community" }),
  ).toBeVisible();
  await screenshot(page, `explore-errors-${info.project.name}`);
  failCourse = false;
  await courseSection
    .getByRole("button", { name: "Retry", exact: true })
    .click();
  await expect(
    courseSection.getByRole("link", { name: "View course" }),
  ).toHaveCount(1);
  await expect(sponsorSection.getByRole("alert")).toBeVisible();
  failAds = false;
  await sponsorSection
    .getByRole("button", { name: "Retry", exact: true })
    .click();
  await expect(sponsorSection).toHaveCount(0);
  await expect(advisorSection.getByRole("article")).toHaveCount(1);
});

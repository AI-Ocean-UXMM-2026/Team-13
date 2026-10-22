import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { resultSchema } from "../../src/lib/frontend/contracts";
import { activities } from "../../src/lib/frontend/activities";
import { localConfig } from "../../scripts/local-config.mjs";
const db = createClient(
  process.env.E2E_SUPABASE_URL ?? localConfig.SUPABASE_URL,
  localConfig.SUPABASE_SERVICE_ROLE_KEY,
);
let sessions: string[] = [];
async function capture(page: Page, name: string, project: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${name}-${project}.png`,
    fullPage: true,
    scale: "css",
  });
  if (name === "landing-initial" && project === "desktop") {
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: 768, height: viewport.height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: "test-results/landing-tablet.png",
      fullPage: true,
      scale: "css",
    });
    await page.setViewportSize(viewport);
  }
  if (project === "mobile") {
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: 320, height: viewport.height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/${name}-narrow.png`,
      fullPage: true,
      scale: "css",
    });
    await page.setViewportSize(viewport);
  }
}
test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": crypto.randomUUID() });
});
test.afterEach(async () => {
  if (sessions.length) {
    const cleanup = await db
      .from("anonymous_sessions")
      .delete()
      .in("id", sessions);
    expect(cleanup.error).toBeNull();
    sessions = [];
  }
});
async function completed(page: Page, context: BrowserContext) {
  const sid = crypto.randomUUID();
  sessions.push(sid);
  await context.addInitScript(
    (value) => localStorage.setItem("career.session", value),
    sid,
  );
  const headers = {
    "X-Session-ID": sid,
    "Idempotency-Key": crypto.randomUUID(),
  };
  const quiz = await (await context.request.get("/api/quiz")).json();
  const start = await (
    await context.request.post("/api/quiz/start", {
      headers,
      data: { entryReason: "not_sure_yet" },
    })
  ).json();
  const response = await context.request.post("/api/quiz/complete", {
    headers,
    data: {
      attemptId: start.attemptId,
      answers: quiz.questions.map(
        (q: { id: string; options: { id: string }[] }) => ({
          questionId: q.id,
          optionIds: [q.options[0].id],
        }),
      ),
    },
  });
  expect(response.ok()).toBeTruthy();
  return {
    sid,
    attemptId: start.attemptId,
    result: (await response.json()).result,
  };
}
test("mobile-first journey restores answers, supports two choices, and confirms successful actions", async ({
  page,
  context,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const startRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/quiz/start"))
      startRequests.push(request.url());
  });
  await page.goto("/");
  await capture(page, "landing-initial", info.project.name);
  await expect(
    page.getByRole("link", { name: "How it works", exact: true }),
  ).toHaveCount(0);
  const steps = page.getByRole("region", { name: "Three steps to clarity" });
  await expect(steps.getByRole("article")).toHaveCount(3);
  await expect(steps.getByRole("heading", { level: 3 })).toHaveText([
    "Discover",
    "Reflect",
    "Explore",
  ]);
  const cta = page.getByRole("link", { name: "Explore my career" });
  const ctaBounds = (await cta.boundingBox())!;
  const stepBounds = (await steps.boundingBox())!;
  const metaBounds = (await page.locator(".hero-meta").boundingBox())!;
  const startBounds = (await page.locator("#start").boundingBox())!;
  expect(ctaBounds.y + ctaBounds.height).toBeLessThan(stepBounds.y);
  expect(stepBounds.y + stepBounds.height).toBeLessThan(metaBounds.y);
  expect(metaBounds.y + metaBounds.height).toBeLessThan(startBounds.y);
  await cta.click();
  await expect(page).toHaveURL(/#start$/);
  await expect(page.locator("#start")).toBeInViewport();
  expect(startRequests).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Start exploring" }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: /too many interests/ }).check();
  await page.getByRole("button", { name: "Start exploring" }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  sessions.push(
    await page.evaluate(() => localStorage.getItem("career.session")!),
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('.journey [aria-current="step"]')).toHaveText(
    /Discover/,
  );
  await capture(page, "quiz", info.project.name);
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Back", exact: false }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume my quiz" }),
  ).toBeVisible();
  await capture(page, "quiz-resume", info.project.name);
  await page.getByRole("button", { name: "Resume my quiz" }).click();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  for (let n = 2; n <= 20; n++) {
    const checkboxes = page.getByRole("checkbox");
    if (n === 15 || n === 17) {
      await checkboxes.first().check();
      await checkboxes.nth(1).check();
      await expect(checkboxes.nth(2)).toBeDisabled();
      if (n === 15) await capture(page, "quiz-multiple", info.project.name);
    } else await page.getByRole("radio").first().check();
    await page
      .getByRole("button", {
        name: n === 20 ? "See my results" : "Next question",
      })
      .click();
  }
  await expect(page).toHaveURL(/\/results\//);
  await expect(
    page.getByRole("heading", { level: 1, name: "What we found about you" }),
  ).toBeVisible();
  await expect(
    page.getByText("Trying a small real-world activity", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".course-priorities li")).toHaveText([
    "My interests and strengths",
    "Job opportunities after graduation",
  ]);
  await expect(
    page.getByRole("heading", {
      name: /Your interest areas to explore|Explore all six interest areas/,
    }),
  ).toBeVisible();
  const attemptId = page.url().split("/").at(-1)!;
  await expect
    .poll(async () => {
      const response = await db
        .from("analytics_events")
        .select("id")
        .eq("session_id", sessions[0])
        .eq("event_name", "results_viewed");
      return response.data?.length ?? 0;
    })
    .toBe(1);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: /Your interest areas to explore|Explore all six interest areas/,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Choose a next step" }).click();
  await expect(
    page.getByText("Sponsored", { exact: true }).first(),
  ).toBeVisible();
  const directionButtons = page
    .getByRole("group", { name: "Choose an interest area" })
    .getByRole("button");
  const resultResponse = await context.request.get(
    `/api/results/${attemptId}`,
    {
      headers: { "X-Session-ID": sessions[0] },
    },
  );
  const { result } = resultSchema.parse(await resultResponse.json());
  await expect(page.getByRole("link", { name: "Try an activity" })).toHaveCount(
    3,
  );
  await directionButtons.nth(1).click();
  await expect(directionButtons.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText(`Courses for ${result.areas![1].name.toLowerCase()}.`, {
      exact: true,
    }),
  ).toBeVisible();
  await directionButtons.first().click();
  await expect(directionButtons.first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByText(`Courses for ${result.areas![0].name.toLowerCase()}.`, {
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, "options", info.project.name);
  const optionsUrl = page.url();
  await page.getByRole("link", { name: "View course" }).first().click();
  await expect(
    page.getByRole("button", { name: "Record demo interest" }),
  ).toBeVisible();
  await capture(page, "course", info.project.name);
  await page.getByRole("button", { name: "Record demo interest" }).click();
  await expect(
    page.getByRole("heading", { name: "Your interest has been recorded." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Continue to provider/ }),
  ).toHaveCount(0);
  await page.goto(optionsUrl);
  await page.getByRole("link", { name: "View advisor" }).first().click();
  await expect(page.getByLabel("Your name")).toBeVisible();
  await capture(page, "advisor", info.project.name);
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(
    page.getByText(
      "Please agree to store your contact details before submitting.",
    ),
  ).toBeVisible();
  await page.getByLabel("Your name").fill("Fictional Student");
  await page.getByLabel("Email address").fill("fictional@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(
    page.getByRole("heading", { name: "Your request has been recorded." }),
  ).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(stored).not.toContain("fictional@example.com");
  expect(stored).not.toContain("Fictional Student");
  await page.goto(optionsUrl);
  const activityRole = result
    .areas!.flatMap((area) => area.careers)
    .find((role) => activities[role.id]);
  expect(activityRole).toBeTruthy();
  await page.goto(`/explore/${activityRole!.id}?attemptId=${attemptId}`);
  await expect(
    page.getByRole("button", { name: "Mark this step complete" }),
  ).toBeVisible();
  await capture(page, "explore", info.project.name);
  await page.getByRole("button", { name: "Mark this step complete" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "One small step, taken." }),
  ).toBeVisible();
  const events = await db
    .from("analytics_events")
    .select("event_name,attempt_id,metadata")
    .eq("session_id", sessions[0]);
  expect(events.error).toBeNull();
  expect(
    events.data!.filter((e) => e.event_name === "results_viewed"),
  ).toHaveLength(1);
  for (const name of ["course_clicked", "advisor_clicked"]) {
    expect(
      events.data!.some(
        (event) => event.event_name === name && event.attempt_id === attemptId,
      ),
    ).toBeTruthy();
  }
  expect(JSON.stringify(events.data)).not.toContain("fictional@example.com");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.goto(`/results/${attemptId}`);
  await expect(
    page.getByRole("heading", {
      name: /Your interest areas to explore|Explore all six interest areas/,
    }),
  ).toBeVisible();
  await expect(page.locator('.journey [aria-current="step"]')).toHaveText(
    /Reflect/,
  );
  await capture(page, "results", info.project.name);
});
test("failed start retains selection, and failed completion retains the draft", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("radio", { name: /not sure what interests/ }).check();
  await page.route("**/api/quiz/start", (route) =>
    route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE" } } }),
  );
  await page.getByRole("button", { name: "Start exploring" }).click();
  await expect(page.locator(".error-panel")).toBeVisible();
  await capture(page, "start-error", info.project.name);
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("radio", { name: /not sure what interests/ }),
  ).toBeChecked();
  await page.unroute("**/api/quiz/start");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  sessions.push(
    await page.evaluate(() => localStorage.getItem("career.session")!),
  );
  for (let n = 1; n <= 20; n++) {
    if (n === 15 || n === 17) await page.getByRole("checkbox").first().check();
    else await page.getByRole("radio").first().check();
    if (n < 20)
      await page.getByRole("button", { name: "Next question" }).click();
  }
  await page.route("**/api/quiz/complete", (route) =>
    route.fulfill({ status: 500, json: { error: { code: "FAILED" } } }),
  );
  await page.getByRole("button", { name: "See my results" }).click();
  await expect(page.locator(".error-panel")).toBeVisible();
  await expect(page).toHaveURL(/\/quiz$/);
  expect(
    await page.evaluate(
      () =>
        Object.keys(
          JSON.parse(
            localStorage.getItem(
              `career.draft.${localStorage.getItem("career.session")}`,
            )!,
          ).answers,
        ).length,
    ),
  ).toBe(20);
  await page.unroute("**/api/quiz/complete");
  // A completed-attempt conflict keeps the draft for explicit recovery.
  await page.route("**/api/quiz/complete", async (route) => {
    await route.fetch();
    await route.fulfill({ status: 409, json: { error: { code: "CONFLICT" } } });
  });
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Use these answers in a new attempt" }),
  ).toBeVisible();
  await page.unroute("**/api/quiz/complete");
  await page
    .getByRole("button", { name: "Use these answers in a new attempt" })
    .click();
  await page.getByRole("button", { name: "See my results" }).click();
  await expect(page).toHaveURL(/\/results\//);
});
test("resource failures are isolated; course and lead failures never show success", async ({
  page,
  context,
}) => {
  const { attemptId } = await completed(page, context);
  await page.route("**/api/courses?*", (route) =>
    route.fulfill({ status: 500, json: { error: { code: "FAILED" } } }),
  );
  await page.route("**/api/events", (route) => route.abort());
  await page.goto(`/options/${attemptId}`);
  await expect(
    page.getByRole("link", { name: "View advisor" }).first(),
  ).toBeVisible();
  await expect(page.locator(".error-panel")).toBeVisible();
  await page.unroute("**/api/courses?*");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("link", { name: "View course" }).first().click();
  await page.route("**/api/courses/*/interest", (route) =>
    route.fulfill({ status: 500, json: { error: { code: "FAILED" } } }),
  );
  await page.getByRole("button", { name: "Record demo interest" }).click();
  await expect(page.locator(".error-panel")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Continue to provider/ }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/course\//);
  await page.goto(`/options/${attemptId}`);
  await page.getByRole("link", { name: "View advisor" }).first().click();
  await page.getByLabel("Your name").fill("Fictional Failure");
  await page.getByLabel("Email address").fill("failure@example.com");
  await page.getByRole("checkbox").check();
  await page.route("**/api/advisors/*/leads", (route) =>
    route.fulfill({ status: 500, json: { error: { code: "FAILED" } } }),
  );
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.locator(".error-panel")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveValue("Fictional Failure");
  await expect(
    page.getByRole("heading", { name: "Your request has been recorded." }),
  ).toHaveCount(0);
});
test("unowned results recover safely and blocked browser storage permits in-memory quiz progress", async ({
  page,
  context,
}) => {
  const { attemptId } = await completed(page, context);
  await context.addInitScript(() => {
    localStorage.setItem("career.session", crypto.randomUUID());
  });
  await page.goto(`/results/${attemptId}`);
  await expect(page.locator(".error-panel")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Your interest areas to explore|Explore all six interest areas/,
    }),
  ).toHaveCount(0);
  const blocked = await context.browser()!.newContext({
    extraHTTPHeaders: { "x-forwarded-for": crypto.randomUUID() },
  });
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  const tab = await blocked.newPage();
  tab.on("request", (request) => {
    if (request.url().endsWith("/api/quiz/start")) {
      const sid = request.headers()["x-session-id"];
      if (sid) sessions.push(sid);
    }
  });
  await tab.goto(new URL("/", page.url()).href);
  await tab.getByRole("radio").first().check();
  await tab.getByRole("button", { name: "Start exploring" }).click();
  await expect(tab).toHaveURL(/\/quiz$/);
  await expect(tab.getByText(/Browser storage is unavailable/)).toBeVisible();
  await tab.getByRole("radio").first().check();
  await tab.getByRole("button", { name: "Next question" }).click();
  await expect(tab.getByText("Question 2")).toBeVisible();
  await blocked.close();
});
test("empty options remain usable; keyboard navigation and page widths work", async ({
  page,
  context,
}, info) => {
  const { attemptId } = await completed(page, context);
  await page.route("**/api/courses?*", (route) =>
    route.fulfill({ json: { courses: [] } }),
  );
  await page.route("**/api/advisors?*", (route) =>
    route.fulfill({ json: { advisors: [] } }),
  );
  await page.route("**/api/ads?*", (route) =>
    route.fulfill({ json: { placements: {} } }),
  );
  await page.goto(`/options/${attemptId}`);
  await expect(
    page.getByText("No course options are available for this direction yet."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Try an activity" })).toHaveCount(
    3,
  );
  await expect(
    page.getByRole("heading", { name: "Join a community" }),
  ).toBeVisible();
  await expect(page.getByText("Sponsored", { exact: true })).toHaveCount(0);
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio").first()).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/landing-${info.project.name}.png`,
    fullPage: true,
    scale: "css",
  });
});

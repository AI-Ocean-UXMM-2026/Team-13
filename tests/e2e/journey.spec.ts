import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localConfig } from "../../scripts/local-config.mjs";
const db = createClient(
  localConfig.SUPABASE_URL,
  localConfig.SUPABASE_SERVICE_ROLE_KEY,
);
let sessions: string[] = [];
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
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start exploring" }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: /too many interests/ }).check();
  await page.getByRole("button", { name: "Start exploring" }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  sessions.push(
    await page.evaluate(() => localStorage.getItem("career.session")!),
  );
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Back", exact: false }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await page.reload();
  await page.getByRole("button", { name: "Resume my quiz" }).click();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  for (let n = 2; n <= 20; n++) {
    const checkboxes = page.getByRole("checkbox");
    if (n === 15 || n === 17) {
      await checkboxes.first().check();
      await checkboxes.nth(1).check();
      await expect(checkboxes.nth(2)).toBeDisabled();
    } else await page.getByRole("radio").first().check();
    await page
      .getByRole("button", {
        name: n === 20 ? "See my results" : "Next question",
      })
      .click();
  }
  await expect(page).toHaveURL(/\/results\//);
  await expect(
    page.getByRole("heading", { name: "A few directions to explore." }),
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
    page.getByRole("heading", { name: "A few directions to explore." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Choose a next step" }).click();
  await expect(page.getByText("Sponsored", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/options-${info.project.name}.png`,
    fullPage: true,
  });
  const optionsUrl = page.url();
  await page.getByRole("link", { name: "View course" }).first().click();
  await page.getByRole("button", { name: "View course" }).click();
  await expect(
    page.getByRole("heading", { name: "Your interest has been recorded." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Continue to provider/ }),
  ).toHaveAttribute("href", /^https:\/\/example.com\//);
  await page.route("https://example.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Example provider</h1>",
    }),
  );
  await page.getByRole("link", { name: /Continue to provider/ }).click();
  await expect(
    page.getByRole("heading", { name: "Example provider" }),
  ).toBeVisible();
  await page.goto(optionsUrl);
  await page.getByRole("link", { name: "View advisor" }).first().click();
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(
    page.getByText("Please agree to demo storage before submitting."),
  ).toBeVisible();
  await page.getByLabel("Your name").fill("Fictional Student");
  await page.getByLabel("Email address").fill("fictional@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(
    page.getByRole("heading", { name: "Your demo request has been recorded." }),
  ).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(stored).not.toContain("fictional@example.com");
  expect(stored).not.toContain("Fictional Student");
  await page.goto(optionsUrl);
  await page.getByRole("link", { name: "Try an activity" }).click();
  await page.getByRole("button", { name: "Mark this step complete" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "One small step, taken." }),
  ).toBeVisible();
  const events = await db
    .from("analytics_events")
    .select("event_name,metadata")
    .eq("session_id", sessions[0]);
  expect(events.error).toBeNull();
  expect(
    events.data!.filter((e) => e.event_name === "results_viewed"),
  ).toHaveLength(1);
  expect(JSON.stringify(events.data)).not.toContain("fictional@example.com");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.goto(`/results/${attemptId}`);
  await page.screenshot({
    path: `test-results/results-${info.project.name}.png`,
    fullPage: true,
  });
});
test("failed start retains selection, and failed completion retains the draft", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: /not sure what interests/ }).check();
  await page.route("**/api/quiz/start", (route) =>
    route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE" } } }),
  );
  await page.getByRole("button", { name: "Start exploring" }).click();
  await expect(page.locator(".error-panel")).toBeVisible();
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
  // The write succeeds but the client sees a conflict: recover the original snapshot with GET.
  await page.route("**/api/quiz/complete", async (route) => {
    await route.fetch();
    await route.fulfill({ status: 409, json: { error: { code: "CONFLICT" } } });
  });
  await page.getByRole("button", { name: "Retry", exact: true }).click();
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
  await expect(page.getByRole("link", { name: "View advisor" })).toBeVisible();
  await expect(page.locator(".error-panel")).toBeVisible();
  await page.unroute("**/api/courses?*");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("link", { name: "View course" }).first().click();
  await page.route("**/api/courses/*/interest", (route) =>
    route.fulfill({ status: 500, json: { error: { code: "FAILED" } } }),
  );
  await page.getByRole("button", { name: "View course" }).click();
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
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(page.locator(".error-panel")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveValue("Fictional Failure");
  await expect(
    page.getByRole("heading", { name: "Your demo request has been recorded." }),
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
    page.getByRole("heading", { name: "A few directions to explore." }),
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
  await tab.goto("http://127.0.0.1:3000/");
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
  await expect(
    page.getByRole("link", { name: "Try an activity" }),
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
  });
});

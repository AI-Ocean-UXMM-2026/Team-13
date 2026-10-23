import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localConfig } from "../../scripts/local-config.mjs";
const db = createClient(
  localConfig.SUPABASE_URL,
  localConfig.SUPABASE_SERVICE_ROLE_KEY,
);
for (const score of [0, 3]) {
  test(`interest areas, examples, activities and demo requests at score ${score}`, async ({
    page,
    context,
  }) => {
    const sid = crypto.randomUUID();
    await context.setExtraHTTPHeaders({
      "X-Session-ID": sid,
      "x-forwarded-for": sid,
    });
    await context.addInitScript(
      (value) => localStorage.setItem("career.session", value),
      sid,
    );
    try {
      const { questions } = await (
        await context.request.get("/api/quiz")
      ).json();
      const { attemptId } = await (
        await context.request.post("/api/quiz/start", { data: {} })
      ).json();
      const completed = await context.request.post("/api/quiz/complete", {
        data: {
          attemptId,
          answers: questions.map((q: any) => ({
            questionId: q.id,
            optionIds: [q.options[q.position <= 12 ? score : 0].id],
          })),
        },
      });
      expect(completed.status()).toBe(200);
      const { result } = await completed.json();
      expect(result.recommendationMode).toBe(score ? "recommended" : "browse");
      await page.goto(`/results/${attemptId}`);
      await expect(page.locator(".interest-area")).toHaveCount(6);
      await expect(page.locator(".career-example")).toHaveCount(18);
      await expect(
        page.getByRole("heading", {
          name: score
            ? "Your interest areas to explore"
            : "Explore all six interest areas",
        }),
      ).toBeVisible();
      for (const width of [320, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      await page.screenshot({
        path: `test-results/interest-areas-${score}.png`,
        fullPage: true,
      });
      await page.getByRole("link", { name: "Try an activity" }).first().click();
      await page
        .getByRole("button", { name: "Mark this step complete" })
        .click();
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "One small step, taken." }),
      ).toBeVisible();
      await page.goto(`/options/${attemptId}`);
      await expect(
        page
          .getByRole("group", { name: "Choose an interest area" })
          .getByRole("button"),
      ).toHaveCount(6);
      await page.getByRole("link", { name: "View course" }).first().click();
      await page.getByRole("button", { name: "Record demo interest" }).click();
      await expect(
        page.getByRole("heading", { name: "Your interest has been recorded." }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Continue to provider/ }),
      ).toHaveCount(0);
      await page.goto(`/options/${attemptId}`);
      await page.getByRole("link", { name: "View advisor" }).first().click();
      await expect(page.getByLabel("Email address")).toHaveValue(
        "student@example.com",
      );
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Submit request" }).click();
      await expect(
        page.getByRole("heading", { name: "Your request has been recorded." }),
      ).toBeVisible();
      const leads = await db
        .from("advisor_leads")
        .select("contact_value")
        .eq("session_id", sid);
      expect(leads.error).toBeNull();
      expect(leads.data).toEqual([{ contact_value: "student@example.com" }]);
    } finally {
      const cleanup = await db
        .from("anonymous_sessions")
        .delete()
        .eq("id", sid);
      expect(cleanup.error).toBeNull();
    }
  });
}

test("completed attempt conflict keeps edited answers and creates a fresh attempt", async ({
  page,
  context,
}) => {
  const sid = crypto.randomUUID();
  await context.setExtraHTTPHeaders({
    "X-Session-ID": sid,
    "x-forwarded-for": sid,
  });
  try {
    const { questions } = await (await context.request.get("/api/quiz")).json();
    const { attemptId } = await (
      await context.request.post("/api/quiz/start", { data: {} })
    ).json();
    const answers = questions.map((q: any) => ({
      questionId: q.id,
      optionIds: [q.options[0].id],
    }));
    expect(
      (
        await context.request.post("/api/quiz/complete", {
          data: { attemptId, answers },
        })
      ).status(),
    ).toBe(200);
    const changed = Object.fromEntries(
      answers.map((a: any) => [a.questionId, a.optionIds]),
    );
    changed[questions[5].id] = [questions[5].options[3].id];
    await page.goto("/");
    await page.evaluate(
      ({ sid, attemptId, questions, changed }) => {
        localStorage.setItem("career.session", sid);
        localStorage.setItem(
          `career.draft.${sid}`,
          JSON.stringify({
            schemaVersion: 1,
            sessionId: sid,
            attemptId,
            entryReason: "not_sure_yet",
            questionIds: questions.map((q: any) => q.id),
            answers: changed,
            currentQuestionIndex: 19,
            updatedAt: Date.now(),
          }),
        );
      },
      { sid, attemptId, questions, changed },
    );
    await page.goto("/quiz");
    await page.getByRole("button", { name: /Resume my quiz/ }).click();
    await page.getByRole("button", { name: /See.*results/ }).click();
    await page
      .getByRole("button", { name: "Use these answers in a new attempt" })
      .click();
    await page.getByRole("button", { name: /See.*results/ }).click();
    await expect(page).toHaveURL(/\/results\//);
    expect(page.url()).not.toContain(attemptId);
    await expect(page.locator(".interest-area")).toHaveCount(1);
    await expect(page.locator(".area-score")).toContainText("100%");
    const original = await (
      await context.request.get(`/api/results/${attemptId}`)
    ).json();
    expect(original.result.recommendationMode).toBe("browse");
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /latest result/i }),
    ).toBeVisible();
  } finally {
    expect(
      (await db.from("anonymous_sessions").delete().eq("id", sid)).error,
    ).toBeNull();
  }
});

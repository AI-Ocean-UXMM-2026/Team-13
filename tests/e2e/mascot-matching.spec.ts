import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localConfig } from "../../scripts/local-config.mjs";
import { quizSchema, resultSchema } from "../../src/lib/frontend/contracts";
import { mascotCatalog } from "../../src/lib/frontend/result-mascots";

// Exercise the real local quiz weights, completion snapshots and frontend parser.
// A raw-score-only fixture would miss the unequal-question-count regression.
test("real quiz answers reach every mascot and equal interest no longer forces Naga", async ({
  page,
  context,
  baseURL,
}) => {
  expect(["127.0.0.1", "localhost"]).toContain(new URL(baseURL!).hostname);
  await context.setExtraHTTPHeaders({ "x-forwarded-for": crypto.randomUUID() });
  const db = createClient(
    localConfig.SUPABASE_URL,
    localConfig.SUPABASE_SERVICE_ROLE_KEY,
  );
  const sessions: string[] = [];
  try {
    const quiz = quizSchema.parse(
      await (await context.request.get("/api/quiz")).json(),
    );
    const { data: categories, error: categoryError } = await db
      .from("career_categories")
      .select("id,code")
      .eq("is_active", true);
    const { data: weights, error: weightError } = await db
      .from("option_category_scores")
      .select("option_id,category_id,score");
    expect(categoryError).toBeNull();
    expect(weightError).toBeNull();
    await page.goto("/");
    for (const mascot of [...mascotCatalog, null]) {
      const session = crypto.randomUUID();
      sessions.push(session);
      const category = categories!.find((c) => c.code === mascot?.code);
      const answers = quiz.questions.map((q) => {
        let option = q.options[0];
        if (q.position <= 12) {
          const contributes = weights!.some(
            (w) =>
              w.category_id === category?.id &&
              w.score > 0 &&
              q.options.some((o) => o.id === w.option_id),
          );
          option = q.options.find(
            (o) =>
              o.value === (mascot === null ? "2" : contributes ? "3" : "0"),
          )!;
        }
        return { questionId: q.id, optionIds: [option.id] };
      });
      const headers = {
        "X-Session-ID": session,
        "Idempotency-Key": crypto.randomUUID(),
      };
      const started = await context.request.post("/api/quiz/start", {
        headers,
        data: { entryReason: "not_sure_yet" },
      });
      expect(started.ok()).toBeTruthy();
      const { attemptId } = await started.json();
      const completed = await context.request.post("/api/quiz/complete", {
        headers,
        data: { attemptId, answers },
      });
      expect(completed.ok()).toBeTruthy();
      const snapshot = resultSchema.parse(await completed.json()).result;
      await page.evaluate(
        (id) => localStorage.setItem("career.session", id),
        session,
      );
      await page.goto(`/results/${attemptId}`);
      const hero = page.locator(".result-companion");
      if (mascot) {
        await expect(hero.locator(".companion-showcase")).toHaveAttribute(
          "data-mascot",
          mascot.id,
        );
        await expect(hero.getByRole("radio")).toHaveCount(0);
      } else {
        expect(
          snapshot.rankedCategories.find((c) => c.code === "I")!.score,
        ).toBeGreaterThan(
          snapshot.rankedCategories.find((c) => c.code === "C")!.score!,
        );
        await expect(hero.getByRole("radio")).toHaveCount(6);
        await expect(hero.locator(".companion-showcase")).toHaveCount(0);
        await hero.getByRole("radio", { name: /Karaweik/ }).check();
        await expect(hero.locator(".companion-showcase")).toHaveAttribute(
          "data-mascot",
          "karaweik",
        );
      }
      // Companion normalization must not reorder or rewrite career snapshots.
      await expect(page.locator(".career-example h4")).toHaveText(
        snapshot.recommendations.map((r) => r.title),
      );
    }
  } finally {
    if (sessions.length) {
      const cleanup = await db
        .from("anonymous_sessions")
        .delete()
        .in("id", sessions);
      expect(cleanup.error).toBeNull();
    }
  }
});

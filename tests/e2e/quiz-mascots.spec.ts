import { expect, test, type Page } from "@playwright/test";
import { quizSchema } from "../../src/lib/frontend/contracts";
import type { Draft } from "../../src/lib/frontend/storage";

async function prepareQuiz(page: Page) {
  const response = await page.request.get("/api/quiz");
  expect(response.ok()).toBeTruthy();
  const { questions } = quizSchema.parse(await response.json());
  // Reverse one question to ensure images follow answers rather than indexes.
  questions[1].options.reverse();
  await page.route("**/api/quiz", (route) =>
    route.fulfill({ json: { questions } }),
  );
  const draft: Draft = {
    schemaVersion: 1,
    sessionId: crypto.randomUUID(),
    attemptId: crypto.randomUUID(),
    entryReason: "not_sure_yet",
    questionIds: questions.map((question) => question.id),
    answers: {},
    currentQuestionIndex: 0,
    updatedAt: Date.now(),
  };
  await page.addInitScript((initial) => {
    const key = `career.draft.${initial.sessionId}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem("career.session", initial.sessionId);
      localStorage.setItem(key, JSON.stringify(initial));
    }
  }, draft);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/quiz");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    questions[0].text,
  );
  return { questions, draft };
}

test("mascot selection maps all answers, preserves progress, and fits desktop, tablet, and narrow screens", async ({
  page,
}, info) => {
  const { questions, draft } = await prepareQuiz(page);
  const preview = page.locator(".mascot-preview");
  const cards = page.locator(".mascot-answers .answer-option");
  await expect(preview.getByRole("status")).toHaveText(
    "Choose an answer below.",
  );
  await expect(
    page.getByRole("button", { name: "Next question" }),
  ).toBeDisabled();
  const initialTop = await cards
    .first()
    .evaluate((card) => card.getBoundingClientRect().top + window.scrollY);
  const answers = [
    ["Not interested", "not-interested.svg"],
    ["A little interested", "a-little-interested.svg"],
    ["Interested", "neutral.svg"],
    ["Very interested", "very-interested.svg"],
  ];
  for (const [name, file] of answers) {
    const radio = page.getByRole("radio", { name, exact: true });
    await radio.locator("..").click();
    await expect(radio).toBeChecked();
    await expect(preview.getByRole("status")).toHaveText(`Selected: ${name}`);
    await expect(preview.locator("img")).toHaveJSProperty(
      "src",
      new URL(`/mascots/quiz/${file}`, page.url()).href,
    );
    await expect
      .poll(() =>
        preview
          .locator("img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      questions[0].text,
    );
  }
  const selectedTop = await cards
    .first()
    .evaluate((card) => card.getBoundingClientRect().top + window.scrollY);
  expect(Math.abs(selectedTop - initialTop)).toBeLessThan(1);
  await expect(page.locator(".mascot-answers .selected")).toHaveCount(1);
  const stored = await page.evaluate(
    (sid) => JSON.parse(localStorage.getItem(`career.draft.${sid}`)!),
    draft.sessionId,
  );
  expect(stored.answers[questions[0].id]).toEqual([
    questions[0].options.find((option) => option.value === "3")!.id,
  ]);

  const radio = page.getByRole("radio", {
    name: "Very interested",
    exact: true,
  });
  await radio.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("radio", { name: "Interested", exact: true }),
  ).toBeChecked();
  await expect(preview.getByRole("status")).toHaveText("Selected: Interested");
  await expect(page.locator(".answer-option.selected")).toHaveCSS(
    "outline-width",
    "3px",
  );
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(preview.getByRole("status")).toHaveText(
    "Choose an answer below.",
  );
  await page
    .getByRole("radio", { name: "Not interested", exact: true })
    .check();
  await expect(preview.locator("img")).toHaveJSProperty(
    "src",
    new URL("/mascots/quiz/not-interested.svg", page.url()).href,
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(preview.getByRole("status")).toHaveText("Selected: Interested");
  await page.reload();
  await page.getByRole("button", { name: "Resume my quiz" }).click();
  await expect(preview.getByRole("status")).toHaveText("Selected: Interested");

  const widths =
    info.project.name === "desktop" ? [1280, 768, 640] : [390, 320];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await cards.evaluateAll((elements) => {
      const boxes = elements.map((element) => element.getBoundingClientRect());
      return {
        columns: boxes.filter((box) => box.y === boxes[0].y).length,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(layout).toEqual({ columns: width >= 640 ? 4 : 2, overflow: false });
    expect(
      await cards
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/quiz-mascots-${width}.png`,
      fullPage: true,
      scale: "css",
    });
  }
});

test("missing mascot images leave answers usable and other question types keep their controls", async ({
  page,
}) => {
  await page.route("**/mascots/quiz/**", (route) => route.abort());
  const { questions } = await prepareQuiz(page);
  const answer = page.getByRole("radio", {
    name: "Not interested",
    exact: true,
  });
  await answer.check();
  await expect(answer).toBeChecked();
  await expect(page.locator(".mascot-preview").getByRole("status")).toHaveText(
    "Selected: Not interested",
  );
  await expect(
    page.getByRole("button", { name: "Next question" }),
  ).toBeEnabled();
  for (let index = 0; index < 14; index++) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Next question" }).click();
    if (index === 11) {
      await expect(page.locator(".mascot-preview")).toHaveCount(0);
      await expect(page.locator(".option-letter")).toHaveCount(
        questions[12].options.length,
      );
    }
  }
  await expect(page.locator(".mascot-preview")).toHaveCount(0);
  await page.getByRole("checkbox").first().check();
  await page.getByRole("checkbox").nth(1).check();
  await expect(page.getByRole("checkbox").nth(2)).toBeDisabled();
});

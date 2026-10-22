import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  mascotCatalog,
  mascotChoiceKey,
} from "../../src/lib/frontend/result-mascots";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const attempt = uuid(1),
  session = uuid(2);
declare global {
  interface Window {
    mascotShareMode: "success" | "cancel" | "fail";
    mascotShares: {
      names: string[];
      types: string[];
      active: boolean;
      hasUrl: boolean;
      title?: string;
      text?: string;
    }[];
  }
}
async function serve(
  page: Page,
  scores: (number | undefined)[] = [0, 9, 0, 0, 0, 0],
  initial?: string,
) {
  await page.addInitScript(
    ({ session, attempt, initial, key }) => {
      localStorage.setItem("career.session", session);
      if (initial) localStorage.setItem(key, initial);
    },
    { session, attempt, initial, key: mascotChoiceKey(session, attempt) },
  );
  await page.route("**/api/results/*", (route) =>
    route.fulfill({
      json: {
        attemptId: attempt,
        result: {
          rankedCategories: mascotCatalog.map((m, i) => ({
            id: uuid(10 + i),
            code: m.code,
            name: m.interest,
            score: scores[i],
            maxScore: [6, 9, 6, 6, 6, 3][i],
          })),
          recommendations: mascotCatalog.slice(0, 3).map((m, i) => ({
            id: uuid(20 + i),
            category_id: uuid(10 + i),
            category: m.code,
            title: `Career direction ${i + 1}`,
            description: "Explore this direction.",
            reason: "One possibility to investigate.",
            is_demo: true,
          })),
          explanation: "Your interests can open more than one door.",
          nextAction: { text: "Choose a next step.", guidance: [] },
        },
      },
    }),
  );
  await page.route("**/api/courses?*", (route) =>
    route.fulfill({ json: { courses: [] } }),
  );
  await page.route("**/api/events", (route) =>
    route.fulfill({ json: { recorded: true } }),
  );
}
const hero = (page: Page) => page.locator(".result-companion");

test("a unique leader is automatic and its PNG download contains the correct square card", async ({
  page,
}) => {
  await serve(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto(`/results/${attempt}`);
  await expect(hero(page).locator(".companion-showcase")).toHaveAttribute(
    "data-mascot",
    "naga",
  );
  await expect(hero(page).getByText("နဂါး", { exact: true })).toBeVisible();
  await expect(hero(page).getByRole("radio")).toHaveCount(0);
  await expect(
    hero(page).getByRole("button", { name: "Share image" }),
  ).toHaveCount(0);
  await expect(page.locator(".recommendation-card")).toHaveCount(3);
  const downloadReady = page.waitForEvent("download");
  await hero(page).getByRole("link", { name: "Download PNG" }).click();
  const download = await downloadReady;
  expect(download.suggestedFilename()).toBe("wayfinder-naga.png");
  const bytes = await readFile((await download.path())!);
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1080);
  expect(bytes).toEqual(
    await readFile("public/mascots/results/cards/naga.png"),
  );
});

test("ties require a choice, restore it after refresh, and reject stale saved choices", async ({
  page,
}) => {
  await serve(page, [6, 9, 0, 0, 0, 0]);
  await page.goto(`/results/${attempt}`);
  await expect(hero(page).getByRole("radio")).toHaveCount(2);
  await expect(
    hero(page).getByRole("button", { name: "Download PNG" }),
  ).toBeDisabled();
  await expect(hero(page).locator(".companion-showcase")).toHaveCount(0);
  await hero(page).getByRole("radio", { name: /Naga/ }).check();
  await expect(hero(page).locator(".companion-showcase")).toHaveAttribute(
    "data-mascot",
    "naga",
  );
  await page.reload();
  await expect(hero(page).getByRole("radio", { name: /Naga/ })).toBeChecked();
  await page.evaluate(
    (key) => localStorage.setItem(key, "kinnari"),
    mascotChoiceKey(session, attempt),
  );
  await page.reload();
  await expect(hero(page).locator(".companion-showcase")).toHaveCount(0);
  const first = hero(page).getByRole("radio", { name: /Chinthe/ });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(hero(page).getByRole("radio", { name: /Naga/ })).toBeChecked();
});

test("neutral and older results permit all six companions and the gallery fits every viewport", async ({
  page,
}, info) => {
  await serve(page, [0, 0, 0, 0, 0, 0]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/results/${attempt}`);
  await expect(hero(page).getByRole("radio")).toHaveCount(6);
  await expect(hero(page).getByText(/Pick a companion for fun/)).toBeVisible();
  for (const mascot of mascotCatalog) {
    await hero(page)
      .getByRole("radio", { name: new RegExp(mascot.name) })
      .check();
    await expect(hero(page).locator(".companion-showcase")).toHaveAttribute(
      "data-mascot",
      mascot.id,
    );
    await expect(
      hero(page).getByRole("link", { name: "Download PNG" }),
    ).toHaveAttribute("href", `/mascots/results/cards/${mascot.id}.png`);
  }
  for (const width of info.project.name === "desktop"
    ? [320, 768, 1280]
    : [390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        hero(page)
          .locator(".companion-art img")
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBe(768);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `test-results/companion-${width}.png`,
      fullPage: true,
    });
    const targets = await hero(page)
      .locator(".companion-option, .companion-actions .button")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(targets.every((height) => height >= 44)).toBeTruthy();
  }
  expect(
    await hero(page)
      .locator(".companion-option")
      .first()
      .evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
  await page.unroute("**/api/results/*");
  await serve(page, [
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  await page.reload();
  await expect(hero(page).getByRole("radio")).toHaveCount(6);
  await expect(hero(page).getByText(/It isn’t an assessment/)).toBeVisible();
});

test("native file sharing uses a prepared PNG, handles cancellation quietly, and keeps downloads after errors", async ({
  page,
}) => {
  await serve(page);
  await page.addInitScript(() => {
    window.mascotShareMode = "success";
    window.mascotShares = [];
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (data: ShareData) => data.files?.[0]?.type === "image/png",
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        window.mascotShares.push({
          names: data.files!.map((file) => file.name),
          types: data.files!.map((file) => file.type),
          active: navigator.userActivation.isActive,
          hasUrl: "url" in data,
          title: data.title,
          text: data.text,
        });
        if (window.mascotShareMode === "cancel")
          throw new DOMException("Cancelled", "AbortError");
        if (window.mascotShareMode === "fail")
          throw new DOMException("Blocked", "NotAllowedError");
      },
    });
  });
  await page.goto(`/results/${attempt}`);
  await hero(page).getByRole("button", { name: "Share image" }).click();
  expect(await page.evaluate(() => window.mascotShares)).toEqual([
    {
      names: ["wayfinder-naga.png"],
      types: ["image/png"],
      active: true,
      hasUrl: false,
      title: "Naga — Wayfinder",
      text: "Meet my Wayfinder exploration companion.",
    },
  ]);
  await page.evaluate(() => {
    window.mascotShareMode = "cancel";
  });
  await hero(page).getByRole("button", { name: "Share image" }).click();
  await expect(hero(page).getByRole("alert")).toHaveCount(0);
  await page.evaluate(() => {
    window.mascotShareMode = "fail";
  });
  await hero(page).getByRole("button", { name: "Share image" }).click();
  await expect(hero(page).getByRole("alert")).toContainText(
    "You can still download your PNG",
  );
  await expect(
    hero(page).getByRole("link", { name: "Download PNG" }),
  ).toBeVisible();
});

test("artwork and card failures retry independently while directions remain usable", async ({
  page,
}) => {
  await serve(page);
  let artCalls = 0,
    cardCalls = 0;
  await page.route("**/mascots/results/naga.webp*", async (route) => {
    artCalls += 1;
    if (artCalls === 1) await route.abort();
    else await route.continue();
  });
  await page.route("**/mascots/results/cards/naga.png", async (route) => {
    cardCalls += 1;
    if (cardCalls === 1)
      await route.fulfill({ status: 503, body: "Unavailable" });
    else await route.continue();
  });
  await page.goto(`/results/${attempt}`);
  await expect(page.locator(".recommendation-card")).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: "Explore this direction", exact: true }),
  ).toHaveCount(3);
  await hero(page).getByRole("button", { name: "Retry illustration" }).click();
  await expect(
    hero(page).getByRole("img", { name: /turquoise coiled Naga/ }),
  ).toBeVisible();
  await hero(page).getByRole("button", { name: "Retry share image" }).click();
  await expect(
    hero(page).getByRole("link", { name: "Download PNG" }),
  ).toBeVisible();
});

test("blocked browser storage still allows companion selection and sharing preparation", async ({
  page,
}) => {
  await serve(page, [0, 0, 0, 0, 0, 0]);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await page.goto(`/results/${attempt}`);
  await hero(page)
    .getByRole("radio", { name: /Hintha/ })
    .check();
  await expect(hero(page).locator(".companion-showcase")).toHaveAttribute(
    "data-mascot",
    "hintha",
  );
  await expect(
    hero(page).getByRole("link", { name: "Download PNG" }),
  ).toBeVisible();
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
});

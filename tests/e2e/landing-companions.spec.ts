import { test, expect } from "@playwright/test";
import { mascotCatalog } from "../../src/lib/frontend/result-mascots";

test("landing companions introduce all six characters before the quiz without starting it", async ({
  page,
}, info) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      apiRequests.push(request.url());
  });
  await page.goto("/");
  const gallery = page.getByRole("region", {
    name: "Meet your exploration companions",
  });
  const cards = gallery.getByRole("listitem");
  await expect(cards).toHaveCount(6);
  await expect(gallery.getByRole("button")).toHaveCount(0);
  await expect(gallery.getByRole("radio")).toHaveCount(0);
  await expect(gallery.getByRole("link")).toHaveCount(0);
  for (const [i, mascot] of mascotCatalog.entries()) {
    const card = cards.nth(i);
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole("heading", { level: 3 })).toContainText(
      mascot.name,
    );
    await expect(card.locator('[lang="my"]')).toHaveText(mascot.burmeseName);
    await expect(card.getByText(mascot.title, { exact: true })).toBeVisible();
    await expect(
      card.getByText(mascot.interest, { exact: true }),
    ).toBeVisible();
    await expect(card.getByText(mascot.tagline, { exact: true })).toBeVisible();
    const image = card.getByRole("img", { name: mascot.alt, exact: true });
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect
      .poll(() =>
        image.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await page.evaluate(() => document.fonts.ready);
  expect(
    await gallery
      .locator('[lang="my"]')
      .first()
      .evaluate((el) =>
        getComputedStyle(el).fontFamily.includes("Wayfinder Myanmar"),
      ),
  ).toBe(true);
  const metaBounds = (await page.locator(".hero-meta").boundingBox())!;
  const galleryBounds = (await gallery.boundingBox())!;
  const startBounds = (await page.locator("#start").boundingBox())!;
  expect(metaBounds.y + metaBounds.height).toBeLessThan(galleryBounds.y);
  expect(galleryBounds.y + galleryBounds.height).toBeLessThan(startBounds.y);

  const viewports =
    info.project.name === "desktop"
      ? [
          { width: 1280, height: 900 },
          { width: 1024, height: 768 },
          { width: 768, height: 1024 },
          { width: 320, height: 740 },
        ]
      : [page.viewportSize()!];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".hero-subtitle mark")).toHaveCSS(
      "white-space",
      "nowrap",
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    const columns = await gallery
      .locator("ul")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    expect(columns).toBe(
      viewport.width >= 1024 ? 6 : viewport.width >= 640 ? 3 : 2,
    );
    if (viewport.width >= 1024) {
      const positions = await cards.evaluateAll((items) =>
        items.map((item) => item.getBoundingClientRect().top),
      );
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.screenshot({
      path: `test-results/landing-companions-${info.project.name}-${viewport.width}.png`,
      fullPage: true,
    });
  }

  await expect(
    page.getByRole("link", { name: "Explore my career", exact: true }),
  ).toHaveCount(0);
  const entryChoice = page.getByRole("radio", {
    name: /not sure what interests/,
  });
  const startButton = page.getByRole("button", {
    name: "Start exploring",
    exact: true,
  });
  await expect(startButton).toBeDisabled();
  await page.getByRole("link", { name: "Wayfinder home", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(entryChoice).toBeFocused();
  await page.keyboard.press("Space");
  await expect(entryChoice).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(startButton).toBeFocused();
  await expect(startButton).toHaveCSS("outline-style", "solid");
  const bounds = (await startButton.boundingBox())!;
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator("#start")).toBeInViewport();
  await expect(startButton).toBeEnabled();
  await expect(page.locator(".start-panel > .fine-print")).toHaveText(
    "Complete the quiz to discover your companion. A starting point for exploration. Never a final career judgment.",
  );
  expect(apiRequests).toEqual([]);
});

test("companion text survives failed artwork and reduced motion removes card movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/mascots/results/*.webp", (route) => route.abort());
  await page.goto("/");
  const gallery = page.getByRole("region", {
    name: "Meet your exploration companions",
  });
  const cards = gallery.getByRole("listitem");
  for (const [i, mascot] of mascotCatalog.entries()) {
    const card = cards.nth(i);
    await card.scrollIntoViewIfNeeded();
    await expect(
      card.getByText("Illustration unavailable", { exact: true }),
    ).toBeVisible();
    await expect(card.getByRole("heading", { level: 3 })).toContainText(
      mascot.name,
    );
    await expect(card.getByText(mascot.tagline, { exact: true })).toBeVisible();
  }
  await cards.first().hover();
  await expect(cards.first()).toHaveCSS("transform", "none");
  await expect(cards.first()).toHaveCSS("transition-duration", "0s");
  await expect(gallery.getByRole("link")).toHaveCount(0);
  await page.getByRole("radio", { name: /not sure what interests/ }).check();
  await expect(
    page.getByRole("button", { name: "Start exploring", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("#start")).toBeInViewport();
});

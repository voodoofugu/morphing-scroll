import { test, expect, Page } from "@playwright/test";

const scrollTopOf = (page: Page) =>
  page.locator(".ms-element").evaluate((el) => (el as HTMLElement).scrollTop);

test.describe("MorphScroll scrollPosition (real browser)", () => {
  test("number: scrolls to the given offset on mount", async ({ page }) => {
    await page.goto("/?scenario=scrollPosNumber");
    await expect(page.locator(".ms-element")).toBeVisible();
    await expect.poll(() => scrollTopOf(page)).toBe(200);
  });

  test("end: scrolls to the bottom on mount", async ({ page }) => {
    await page.goto("/?scenario=scrollPosEnd");
    await expect(page.locator(".ms-element")).toBeVisible();
    // wrapper 700 - viewport 300 => max scroll 400
    await expect.poll(() => scrollTopOf(page)).toBe(400);
  });
});

test.describe("MorphScroll sliderMenu (real browser)", () => {
  test("renders one slider element per page and marks the first active", async ({
    page,
  }) => {
    await page.goto("/?scenario=sliderMenu");
    const dots = page.locator(".ms-slider-element");
    await expect(dots).toHaveCount(20);
    await expect(dots.first()).toHaveClass(/active/);
  });

  test("clicking a later slider element scrolls toward it", async ({ page }) => {
    await page.goto("/?scenario=sliderMenu");
    const dots = page.locator(".ms-slider-element");
    await dots.nth(3).click();
    // neededSize (300) * index (3) = 900
    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(500);
  });
});

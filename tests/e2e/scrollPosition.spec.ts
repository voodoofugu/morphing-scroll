import { test, expect, Page } from "@playwright/test";

const scrollTopOf = (page: Page) =>
  page.locator(".ms-viewport").evaluate((el) => (el as HTMLElement).scrollTop);

test.describe("MorphScroll scrollPosition (real browser)", () => {
  test("number: scrolls to the given offset on mount", async ({ page }) => {
    await page.goto("/?scenario=scrollPosNumber");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await expect.poll(() => scrollTopOf(page)).toBe(200);
  });

  test("end: scrolls to the bottom on mount", async ({ page }) => {
    await page.goto("/?scenario=scrollPosEnd");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    // wrapper 700 - viewport 300 => max scroll 400
    await expect.poll(() => scrollTopOf(page)).toBe(400);
  });
});

test.describe("MorphScroll sliderMenu (real browser)", () => {
  test("renders one slider element per page and marks the first active", async ({
    page,
  }) => {
    await page.goto("/?scenario=sliderMenu");
    const dots = page.locator(".ms-slider-item");
    await expect(dots).toHaveCount(20);
    await expect(dots.first()).toHaveClass(/\bms-active\b/);
  });

  test("clicking a later slider element scrolls toward it", async ({ page }) => {
    await page.goto("/?scenario=sliderMenu");
    const dots = page.locator(".ms-slider-item");
    await dots.nth(3).click();
    // neededSize (300) * index (3) = 900
    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(500);
  });

  /*
   * onNavigate различает, кто перелистнул страницу. Клик по точке и колесо
   * приводят к одному и тому же переходу, и отличаются они только причиной —
   * ради неё событие и существует.
   */
  const navigateLog = (page: Page) =>
    page.evaluate(
      () =>
        ((window as unknown as { __navigate?: unknown[] }).__navigate ??
          []) as { reason: string; axis: string; from: number; to: number }[],
    );

  test("onNavigate blames the bar for a click on a dot", async ({ page }) => {
    await page.goto("/?scenario=sliderMenu");
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);
    expect(await navigateLog(page)).toEqual([]); // первая раскладка — не переход

    await page.locator(".ms-slider-item").nth(3).click();

    await expect.poll(async () => (await navigateLog(page)).at(-1)).toMatchObject({
      reason: "bar",
      axis: "y",
      from: 0,
      to: 3,
    });

    /*
     * Один клик — одно событие. По дороге к четвёртой странице скролл проходит
     * через вторую и третью, и если отчитываться о каждой пройденной, на один
     * клик придётся три звука.
     */
    expect(await navigateLog(page)).toHaveLength(1);
  });

  test("onNavigate calls a wheel page turn a plain scroll", async ({ page }) => {
    await page.goto("/?scenario=sliderMenu");
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);

    await page.locator(".ms-viewport").hover();
    await page.mouse.wheel(0, 400);

    await expect.poll(async () => (await navigateLog(page)).at(-1)).toMatchObject({
      reason: "scroll",
      from: 0,
    });
  });
});

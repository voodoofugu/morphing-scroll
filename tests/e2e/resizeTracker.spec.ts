import { expect, test, type Page } from "@playwright/test";

const open = (page: Page, scenario: string) =>
  page.goto(`/?scenario=${scenario}`);

const roundedBox = async (page: Page, selector: string) => {
  const box = await page.locator(selector).first().boundingBox();

  return {
    width: Math.round(box?.width ?? 0),
    height: Math.round(box?.height ?? 0),
  };
};

test.describe("ResizeTracker (real browser)", () => {
  test("reports its new box after the viewport changes", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await open(page, "resizeTrackerResponsive");

    await expect
      .poll(() => page.evaluate(() => (window as any).__resize))
      .toEqual({ width: 400, height: 300 });

    await page.setViewportSize({ width: 600, height: 400 });

    await expect
      .poll(() => page.evaluate(() => (window as any).__resize))
      .toEqual({ width: 300, height: 200 });
  });

  test('updates MorphScroll geometry for size="auto"', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await open(page, "sizeAutoResponsive");

    await expect
      .poll(() => roundedBox(page, ".ms-viewport"))
      .toEqual({ width: 400, height: 300 });
    await expect
      .poll(() =>
        page.locator(".ms-viewport").evaluate(
          (element) => element.scrollHeight - element.clientHeight,
        ),
      )
      .toBe(200);

    await page.setViewportSize({ width: 500, height: 400 });

    await expect
      .poll(() => roundedBox(page, ".ms-viewport"))
      .toEqual({ width: 250, height: 200 });
    await expect
      .poll(() =>
        page.locator(".ms-viewport").evaluate(
          (element) => element.scrollHeight - element.clientHeight,
        ),
      )
      .toBe(800);

    await page
      .locator(".ms-viewport")
      .evaluate((element) => (element.scrollTop = 800));
    await page.setViewportSize({ width: 800, height: 600 });

    await expect
      .poll(() =>
        page.locator(".ms-viewport").evaluate((element) => ({
          top: element.scrollTop,
          max: element.scrollHeight - element.clientHeight,
        })),
      )
      .toEqual({ top: 200, max: 200 });
  });

  test('remeasures objects.size="firstChild"', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await open(page, "firstChildResponsive");

    await expect
      .poll(() => roundedBox(page, ".ms-object-box"))
      .toEqual({ width: 160, height: 150 });

    await page.setViewportSize({ width: 600, height: 400 });

    await expect
      .poll(() => roundedBox(page, ".ms-object-box"))
      .toEqual({ width: 120, height: 100 });
  });

  test("reflows automatically sized objects", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await open(page, "objectsAutoResponsive");

    await expect
      .poll(() => roundedBox(page, ".ms-object-box"))
      .toEqual({ width: 100, height: 60 });
    await expect
      .poll(() =>
        page.locator(".ms-viewport").evaluate(
          (element) => element.scrollHeight - element.clientHeight,
        ),
      )
      .toBe(100);

    await page.setViewportSize({ width: 600, height: 400 });

    await expect
      .poll(() => roundedBox(page, ".ms-object-box"))
      .toEqual({ width: 100, height: 40 });
    await expect
      .poll(() =>
        page.locator(".ms-viewport").evaluate(
          (element) => element.scrollHeight - element.clientHeight,
        ),
      )
      .toBe(0);
  });
});

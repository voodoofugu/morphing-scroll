import { test, expect } from "@playwright/test";

const open = (page: import("@playwright/test").Page, scenario: string) =>
  page.goto(`/?scenario=${scenario}`);

const offsets = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as any).__scroll ?? { left: 0, top: 0 });

test.describe("MorphScroll size: auto (real browser)", () => {
  test("takes its size from the surrounding box", async ({ page }) => {
    await open(page, "sizeAuto");
    const root = page.locator("[morph-scroll]");
    await expect(root).toBeVisible();

    const box = await root.boundingBox();
    expect(box?.width).toBeCloseTo(280, 0);
    expect(box?.height).toBeCloseTo(240, 0);

    // two columns fit across the measured width
    await expect(page.locator(".ms-object-box")).toHaveCount(20);
  });

  test("scrolls within the measured range", async ({ page }) => {
    await open(page, "sizeAuto");
    const element = page.locator(".ms-element");
    await element.hover();

    await page.mouse.wheel(0, 400);
    await expect.poll(async () => (await offsets(page)).top).toBeGreaterThan(0);

    /*
     * The measured width decides the layout too: 280 fits two 100px columns,
     * so 20 items form 10 rows of 1000px inside a 240px viewport.
     */
    await page.mouse.wheel(0, 100000);
    await expect
      .poll(async () => (await offsets(page)).top)
      .toBeCloseTo(10 * 100 - 240, 0);
  });
});

test.describe("MorphScroll type: slider drag (real browser)", () => {
  test("snaps to the next page when the drag passes the threshold", async ({
    page,
  }) => {
    await open(page, "sliderDrag");
    const element = page.locator(".ms-element");
    const box = (await element.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + box.height - 40);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + box.height - 80, { steps: 4 });
    await page.mouse.move(cx, box.y + box.height - 140, { steps: 4 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(300);
  });

  test("snaps back when the drag stays under the threshold", async ({
    page,
  }) => {
    await open(page, "sliderDrag");
    const element = page.locator(".ms-element");
    const box = (await element.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + box.height - 40);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + box.height - 50, { steps: 3 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(0);
  });
});

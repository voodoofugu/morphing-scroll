import { test, expect, Page } from "@playwright/test";

const scrollTopOf = (page: Page, selector = ".ms-viewport") =>
  page.locator(selector).evaluate((el) => (el as HTMLElement).scrollTop);

const scrollLeftOf = (page: Page, selector = ".ms-viewport") =>
  page.locator(selector).evaluate((el) => (el as HTMLElement).scrollLeft);

test.describe("MorphScroll physics (real browser)", () => {
  test("wheel scrolls the content vertically", async ({ page }) => {
    await page.goto("/?scenario=wheel");
    const el = page.locator(".ms-viewport");
    await expect(el).toBeVisible();

    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 400);

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);
  });

  test("wheel reports offsets through onScrollValue", async ({ page }) => {
    await page.goto("/?scenario=wheel");
    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 400);

    await expect
      .poll(() => page.evaluate(() => (window as any).__scroll?.top ?? 0))
      .toBeGreaterThan(50);
  });

  test("clicking the bottom arrow scrolls down", async ({ page }) => {
    await page.goto("/?scenario=arrows");
    const bottomArrow = page.locator(".ms-arrow-box.ms-bottom");
    await expect(bottomArrow).toBeVisible();
    await bottomArrow.click();

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);
  });

  test("dragging the thumb scrolls the content", async ({ page }) => {
    await page.goto("/?scenario=thumb");
    const thumb = page.locator(".ms-thumb");
    await expect(thumb).toBeVisible();

    const box = await thumb.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 120, { steps: 8 });
    await page.mouse.up();

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);
  });

  test("content drag (grab) scrolls the content", async ({ page }) => {
    await page.goto("/?scenario=contentDrag");
    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // drag content upward -> scroll down
    await page.mouse.move(cx, cy - 150, { steps: 10 });
    await page.mouse.up();

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(20);
  });
});

test.describe("MorphScroll virtualization (real browser)", () => {
  test("virtual unmounts items scrolled out of view", async ({ page }) => {
    await page.goto("/?scenario=virtual");
    await expect(page.getByTestId("item-0")).toBeVisible();

    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    // scroll far past the first rows
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 400);

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(200);
    // the top item is removed from the DOM under virtualization
    await expect(page.getByTestId("item-0")).toHaveCount(0);
  });

  test("lazy keeps already-loaded items mounted after scrolling away", async ({
    page,
  }) => {
    await page.goto("/?scenario=lazy");
    // lazy needs a tick to paint the first visible items
    await expect(page.getByTestId("item-0")).toBeVisible();

    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 400);

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(200);
    // item-0 was loaded once, so lazy keeps it mounted (unlike virtual)
    await expect(page.getByTestId("item-0")).toHaveCount(1);
  });
});

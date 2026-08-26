import { test, expect } from "@playwright/test";

test.describe("MorphScroll dragScroll (real browser)", () => {
  test("auto-scrolls when a draggable item is dragged to the bottom edge", async ({
    page,
  }) => {
    await page.goto("/?scenario=dragScroll");
    const el = page.locator(".ms-element");
    await expect(el).toBeVisible();
    const box = (await el.boundingBox())!;

    // grab an item near the top and drag toward the bottom edge
    const handle = page.getByTestId("item-0");
    const hb = (await handle.boundingBox())!;
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    // move in steps down to within the edge zone (bottom - ~20px)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 20, {
      steps: 12,
    });

    // the auto-scroll rAF loop keeps running while the pointer sits at the edge
    await expect
      .poll(() => el.evaluate((n) => (n as HTMLElement).scrollTop), {
        timeout: 3000,
      })
      .toBeGreaterThan(30);

    await page.mouse.up();
  });

  test("marks the container with the ms-under-drag attribute while dragging", async ({
    page,
  }) => {
    await page.goto("/?scenario=dragScroll");
    const root = page.locator("[morph-scroll]");
    const box = (await page.locator(".ms-element").boundingBox())!;

    const handle = page.getByTestId("item-0");
    const hb = (await handle.boundingBox())!;
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 20, {
      steps: 12,
    });

    await expect(root).toHaveAttribute("ms-under-drag", /.*/, { timeout: 3000 });
    await page.mouse.up();
  });
});

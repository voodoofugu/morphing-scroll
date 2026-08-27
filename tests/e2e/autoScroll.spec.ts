import { test, expect, Page, Locator } from "@playwright/test";

/**
 * autoScrollRegistry is the one module the jsdom tier cannot reach: it needs
 * elementFromPoint, real drag events and a layout engine. Everything it does
 * has to be exercised here.
 */
const scrollTop = (el: Locator) =>
  el.evaluate((n) => (n as HTMLElement).scrollTop);
const scrollLeft = (el: Locator) =>
  el.evaluate((n) => (n as HTMLElement).scrollLeft);

/** press on a handle and hold the pointer at a point inside the container */
const dragTo = async (page: Page, handle: Locator, x: number, y: number) => {
  const hb = (await handle.boundingBox())!;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 12 });
};

test.describe("dragScroll — edges (real browser)", () => {
  test("scrolls back up when the drag returns to the top edge", async ({
    page,
  }) => {
    await page.goto("/?scenario=dragScroll");
    const el = page.locator(".ms-viewport");
    const box = (await el.boundingBox())!;

    // start far enough down that the climb back takes a while
    await el.evaluate((n) => ((n as HTMLElement).scrollTop = 1500));
    const start = await scrollTop(el);

    await dragTo(page, page.getByTestId("item-15"), box.x + box.width / 2, box.y + 10);

    // the mark names the edge being approached, while the climb is still on
    await expect(page.locator("[morph-scroll]")).toHaveAttribute(
      "ms-under-drag",
      /top/,
      { timeout: 3000 },
    );
    await expect.poll(() => scrollTop(el), { timeout: 3000 }).toBeLessThan(start);

    await page.mouse.up();
  });

  test("scrolls sideways for a horizontal container", async ({ page }) => {
    await page.goto("/?scenario=dragScrollX");
    const el = page.locator(".ms-viewport");
    const box = (await el.boundingBox())!;

    await dragTo(
      page,
      page.getByTestId("item-0"),
      box.x + box.width - 10,
      box.y + box.height / 2,
    );

    await expect.poll(() => scrollLeft(el), { timeout: 3000 }).toBeGreaterThan(30);
    await expect(page.locator("[morph-scroll]")).toHaveAttribute(
      "ms-under-drag",
      /right/,
    );
    await page.mouse.up();
  });

  test("stops and clears the mark once the pointer leaves the container", async ({
    page,
  }) => {
    await page.goto("/?scenario=dragScroll");
    const el = page.locator(".ms-viewport");
    const root = page.locator("[morph-scroll]");
    const box = (await el.boundingBox())!;

    await dragTo(page, page.getByTestId("item-0"), box.x + box.width / 2, box.y + box.height - 10);
    await expect.poll(() => scrollTop(el), { timeout: 3000 }).toBeGreaterThan(30);

    // walk far away from the container
    await page.mouse.move(box.x + box.width + 400, box.y + box.height / 2, {
      steps: 10,
    });

    await expect(root).not.toHaveAttribute("ms-under-drag", /.*/, {
      timeout: 3000,
    });
    const frozen = await scrollTop(el);
    await page.waitForTimeout(300);
    expect(await scrollTop(el)).toBe(frozen);

    await page.mouse.up();
  });

  test("clears the mark when the drag ends", async ({ page }) => {
    await page.goto("/?scenario=dragScroll");
    const root = page.locator("[morph-scroll]");
    const box = (await page.locator(".ms-viewport").boundingBox())!;

    await dragTo(page, page.getByTestId("item-0"), box.x + box.width / 2, box.y + box.height - 10);
    await expect(root).toHaveAttribute("ms-under-drag", /.*/, { timeout: 3000 });

    await page.mouse.up();

    await expect(root).not.toHaveAttribute("ms-under-drag", /.*/, {
      timeout: 3000,
    });
  });
});

test.describe("dragScroll — more than one container (real browser)", () => {
  test("hands over to the container the pointer moved into", async ({ page }) => {
    await page.goto("/?scenario=dragScrollPair");
    const [left, right] = await page.locator(".ms-viewport").all();
    const rightBox = (await right.boundingBox())!;

    // grab in the left list, carry the drag into the right one
    await dragTo(
      page,
      page.getByTestId("left-0"),
      rightBox.x + rightBox.width / 2,
      rightBox.y + rightBox.height - 10,
    );

    await expect.poll(() => scrollTop(right), { timeout: 3000 }).toBeGreaterThan(30);
    expect(await scrollTop(left)).toBe(0);

    await page.mouse.up();
  });

  test("only the container under the pointer is marked", async ({ page }) => {
    await page.goto("/?scenario=dragScrollPair");
    const roots = page.locator("[morph-scroll]");
    const rightBox = (await page.locator(".ms-viewport").nth(1).boundingBox())!;

    await dragTo(
      page,
      page.getByTestId("left-0"),
      rightBox.x + rightBox.width / 2,
      rightBox.y + rightBox.height - 10,
    );

    await expect(roots.nth(1)).toHaveAttribute("ms-under-drag", /.*/, {
      timeout: 3000,
    });
    await expect(roots.nth(0)).not.toHaveAttribute("ms-under-drag", /.*/);

    await page.mouse.up();
  });
});

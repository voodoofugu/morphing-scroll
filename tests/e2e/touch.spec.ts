import { test, expect, Page, Locator } from "@playwright/test";

/**
 * Touch physics. The integrator behind inertia is unit-tested; what only a
 * real device can show is the handoff — a flick ends, the finger is gone, and
 * the content keeps moving on its own.
 *
 * Playwright's touchscreen only taps, so the gesture goes through CDP, which
 * produces genuine input events and therefore genuine pointer events.
 */
const scrollTop = (el: Locator) =>
  el.evaluate((n) => (n as HTMLElement).scrollTop);

type Point = { x: number; y: number };

const swipe = async (
  page: Page,
  from: Point,
  to: Point,
  { steps = 6, stepDelay = 8, holdBeforeRelease = 0 } = {},
) => {
  const client = await page.context().newCDPSession(page);
  const send = (type: string, points: Point[]) =>
    client.send("Input.dispatchTouchEvent", {
      type: type as "touchStart",
      touchPoints: points.map((p) => ({ x: p.x, y: p.y })),
    });

  await send("touchStart", [from]);
  for (let i = 1; i <= steps; i++) {
    await send("touchMove", [
      {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      },
    ]);
    await page.waitForTimeout(stepDelay);
  }
  if (holdBeforeRelease) await page.waitForTimeout(holdBeforeRelease);
  await send("touchEnd", []);
};

const openScroll = async (page: Page) => {
  await page.goto("/?scenario=wheel");
  const el = page.locator(".ms-viewport");
  await expect(el).toBeVisible();
  return { el, box: (await el.boundingBox())! };
};

test.describe("MorphScroll touch (real device emulation)", () => {
  test("drags the content with a finger", async ({ page }) => {
    const { el, box } = await openScroll(page);

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 40 },
      { stepDelay: 40 }, // slow enough that inertia does not kick in
    );

    expect(await scrollTop(el)).toBeGreaterThan(100);
  });

  test("keeps going after a flick, then settles", async ({ page }) => {
    const { el, box } = await openScroll(page);

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 20 },
    );

    const atRelease = await scrollTop(el);

    // the finger is gone; the content should still be travelling
    await expect
      .poll(() => scrollTop(el), { timeout: 2000 })
      .toBeGreaterThan(atRelease);

    // and it has to stop on its own
    await page.waitForTimeout(1200);
    const settled = await scrollTop(el);
    await page.waitForTimeout(300);
    expect(await scrollTop(el)).toBe(settled);
  });

  test("does not coast when the finger rests before lifting", async ({
    page,
  }) => {
    const { el, box } = await openScroll(page);

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 20 },
      { holdBeforeRelease: 400 }, // past INERTIA_RELEASE_TIMEOUT
    );

    const atRelease = await scrollTop(el);
    await page.waitForTimeout(400);

    expect(await scrollTop(el)).toBe(atRelease);
  });

  test("a tap still reaches the content underneath", async ({ page }) => {
    await page.goto("/?scenario=wheel");
    const first = page.getByTestId("item-0");
    await expect(first).toBeVisible();

    const box = (await first.boundingBox())!;
    // a press that moves under the 2px threshold stays a tap
    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      { x: box.x + box.width / 2, y: box.y + box.height / 2 - 1 },
      { steps: 1 },
    );

    expect(
      await page.locator(".ms-viewport").evaluate((n) => (n as HTMLElement).scrollTop),
    ).toBe(0);
  });
});

/*
 * Два места, где поведение поменялось и где палец — основной способ работы.
 */
test.describe("MorphScroll touch: nesting and taps", () => {
  test("палец двигает тот список, на котором лежит", async ({ page }) => {
    await page.goto("/?scenario=nestedTouch");

    const views = page.locator(".ms-viewport");
    const outer = views.nth(0);
    const inner = views.nth(1);
    await expect(inner).toBeVisible();

    const box = (await inner.boundingBox())!;

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 20 },
      { stepDelay: 40 },
    );
    await page.waitForTimeout(400);

    expect(await scrollTop(inner)).toBeGreaterThan(0);
    expect(await scrollTop(outer)).toBe(0);
  });

  test("точка слайдера отзывается на нажатие пальцем", async ({ page }) => {
    await page.goto("/?scenario=sliderTapTouch");

    const dots = page.locator(".ms-slider-item");
    await expect(dots.first()).toBeVisible();

    await dots.nth(2).tap();
    await page.waitForTimeout(400);

    expect(await scrollTop(page.locator(".ms-viewport"))).toBe(600);
  });
});

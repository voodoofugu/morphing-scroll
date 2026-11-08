import { expect, test } from "@playwright/test";

test.describe("input smoothness", () => {
  test("coalesces pointer scroll writes to one per display frame", async ({
    page,
  }) => {
    await page.goto("/?scenario=contentDrag");
    const viewport = page.locator(".ms-viewport");
    await expect(viewport).toBeVisible();

    const beforeFrame = await viewport.evaluate((element) => {
      const el = element as HTMLDivElement;
      let proto = Object.getPrototypeOf(el);
      let descriptor: PropertyDescriptor | undefined;

      while (proto && !descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(proto, "scrollTop");
        proto = Object.getPrototypeOf(proto);
      }

      if (!descriptor?.get || !descriptor.set)
        throw new Error("scrollTop descriptor was not found");

      const get = descriptor.get.bind(el);
      const set = descriptor.set.bind(el);
      let writes = 0;

      Object.defineProperty(el, "scrollTop", {
        configurable: true,
        get,
        set(value: number) {
          writes++;
          set(value);
        },
      });

      (window as any).__pointerWrites = () => writes;

      const pointer = (
        type: "pointerdown" | "pointermove" | "pointerup",
        y: number,
        target: EventTarget,
      ) =>
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: 50,
            clientY: y,
            pointerId: 1,
            pointerType: "mouse",
          }),
        );

      pointer("pointerdown", 250, el);
      pointer("pointermove", 240, document);
      pointer("pointermove", 200, document);
      pointer("pointermove", 150, document);
      pointer("pointermove", 100, document);
      pointer("pointermove", 50, document);
      pointer("pointermove", 0, document);

      return { top: el.scrollTop, writes };
    });

    expect(beforeFrame).toEqual({ top: 0, writes: 0 });

    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );

    const afterFrame = await viewport.evaluate((el) => ({
      top: (el as HTMLElement).scrollTop,
      writes: (window as any).__pointerWrites(),
    }));

    expect(afterFrame.writes).toBe(1);
    expect(afterFrame.top).toBe(240);

    await page.evaluate(() =>
      document.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          clientX: 50,
          clientY: 0,
          pointerId: 1,
          pointerType: "mouse",
        }),
      ),
    );
  });

  test("does not add an easing tail to a precise wheel burst", async ({
    page,
  }) => {
    await page.goto("/?scenario=wheel");
    const viewport = page.locator(".ms-viewport");
    await expect(viewport).toBeVisible();

    const result = await viewport.evaluate((el) => {
      const trail: number[] = [];
      for (let index = 0; index < 20; index++) {
        el.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            deltaY: 18,
            deltaMode: WheelEvent.DOM_DELTA_PIXEL,
          }),
        );
        trail.push((el as HTMLElement).scrollTop);
      }

      return { immediate: (el as HTMLElement).scrollTop, trail };
    });

    expect(result.immediate, JSON.stringify(result.trail)).toBe(360);
    await page.waitForTimeout(150);
    expect(await viewport.evaluate((el) => (el as HTMLElement).scrollTop)).toBe(
      360,
    );
  });

  test("keeps smoothing for a discrete mouse notch", async ({ page }) => {
    await page.goto("/?scenario=wheel");
    const viewport = page.locator(".ms-viewport");
    await expect(viewport).toBeVisible();

    const immediate = await viewport.evaluate((el) => {
      el.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          deltaY: 120,
          deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        }),
      );
      return (el as HTMLElement).scrollTop;
    });

    expect(immediate).toBe(0);
    await expect
      .poll(() => viewport.evaluate((el) => (el as HTMLElement).scrollTop))
      .toBe(120);
  });
});

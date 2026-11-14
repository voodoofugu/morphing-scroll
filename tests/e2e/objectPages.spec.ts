import { expect, test, type Page } from "@playwright/test";

const leftOf = (page: Page) =>
  page.locator(".ms-viewport").evaluate((el) => (el as HTMLElement).scrollLeft);

const openConfig = (
  page: Page,
  config: Record<string, unknown>,
  switchable = false,
) =>
  page.goto(
    `/?scenario=${switchable ? "crashSwitch" : "crash"}&props=${encodeURIComponent(
      JSON.stringify(config),
    )}`,
  );

test.describe("object based slider pages", () => {
  test("one-line objects define markers and centred reachable stops", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPages");

    const markers = page.locator(".ms-slider-item");
    await expect(markers).toHaveCount(5);
    await expect(markers.first()).toHaveClass(/ms-active/);

    const firstCentres = await page.evaluate(() => {
      const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
      const item = document.querySelector('[data-testid="object-page-0"]')!.getBoundingClientRect();
      return [viewport.left + viewport.width / 2, item.left + item.width / 2];
    });
    expect(firstCentres[1]).toBeCloseTo(firstCentres[0], 0);

    await markers.nth(2).click();
    await expect.poll(() => leftOf(page)).toBe(280);
    await expect(markers.nth(2)).toHaveClass(/ms-active/);

    await markers.last().click();
    await expect.poll(() => leftOf(page)).toBe(560);
    const lastCentres = await page.evaluate(() => {
      const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
      const item = document.querySelector('[data-testid="object-page-4"]')!.getBoundingClientRect();
      return [viewport.left + viewport.width / 2, item.left + item.width / 2];
    });
    expect(lastCentres[1]).toBeCloseTo(lastCentres[0], 0);
  });

  test("loop keeps one marker per original object and wraps by object", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPagesLoop");
    await expect(page.locator(".ms-slider-item")).toHaveCount(5);

    const left = page.locator(".ms-arrow-box.ms-left");
    await left.click();

    await expect(page.locator(".ms-slider-item").last()).toHaveClass(/ms-active/);
  });

  test("keyboard step keeps its direction through the loop seam", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPagesLoop");
    await page.locator(".ms-viewport").click({ position: { x: 150, y: 20 } });

    for (let index = 1; index <= 6; index++) {
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(".ms-slider-item").nth(index % 5)).toHaveClass(
        /ms-active/,
      );
    }
  });

  test("ref step accumulates pages while pixel commands stay free", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPageCommands");
    await expect(page.locator(".ms-slider-item")).toHaveCount(5);

    await page.evaluate(() => {
      const ref = (window as any).__morphRef;
      ref.step("right", { reason: "remote" });
      ref.step("right", { reason: "remote" });
      ref.step("right", { reason: "remote" });
    });
    await expect.poll(() => leftOf(page)).toBe(420);

    const events = await page.evaluate(() => (window as any).__navigate ?? []);
    expect(events.filter((event: any) => event.reason === "remote")).toHaveLength(3);

    await page.evaluate(() =>
      (window as any).__morphRef.scrollToObject(5, { duration: 0 }),
    );
    await expect.poll(() => leftOf(page)).toBe(560);
    await expect(page.locator(".ms-slider-item").last()).toHaveClass(/ms-active/);

    await page.evaluate(() => (window as any).__morphRef.scrollTo(75, { duration: 0 }));
    await expect.poll(() => leftOf(page)).toBe(75);

    await page.evaluate(() => {
      const ref = (window as any).__morphRef;
      ref.pan({ x: 20 }, { duration: 100 });
      ref.pan({ x: 20 }, { duration: 100 });
      ref.pan({ x: 20 }, { duration: 100 });
    });
    await expect.poll(() => leftOf(page)).toBe(135);
  });

  test("measured variable objects and virtual rendering keep object pages", async ({
    page,
  }) => {
    await page.goto("/?scenario=variableObjectPages");
    const markers = page.locator(".ms-slider-item");
    await expect(markers).toHaveCount(4);

    await markers.nth(2).click();
    await expect(markers.nth(2)).toHaveClass(/ms-active/);

    const centred = async () =>
      page.evaluate(() => {
        const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
        const item = document.querySelector('[data-testid="variable-object-page-2"]')!.getBoundingClientRect();
        return Math.abs(viewport.left + viewport.width / 2 - (item.left + item.width / 2));
      });
    await expect.poll(centred).toBeLessThanOrEqual(1);

    await page.evaluate(() => (window as any).__resizeObjectPages());
    await expect(markers).toHaveCount(4);
    await expect.poll(centred).toBeLessThanOrEqual(1);
  });

  test("multiple lines expose one marker per reachable object stop", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPageLines");

    const stops = await page.locator(".ms-object-box").evaluateAll((boxes) =>
      new Set(boxes.map((box) => Math.round(box.getBoundingClientRect().left))).size,
    );
    await expect(page.locator(".ms-slider-item")).toHaveCount(stops);
    expect(stops).toBeLessThan(6);
  });

  test("hybrid builds an independent object model for each axis", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPagesHybrid");

    const stops = await page.locator(".ms-object-box").evaluateAll((boxes) => ({
      x: new Set(boxes.map((box) => Math.round(box.getBoundingClientRect().left))).size,
      y: new Set(boxes.map((box) => Math.round(box.getBoundingClientRect().top))).size,
    }));

    await expect(page.locator(".ms-slider.ms-x .ms-slider-item")).toHaveCount(stops.x);
    await expect(page.locator(".ms-slider.ms-y .ms-slider-item")).toHaveCount(stops.y);
  });

  test("hybrid can mix viewport pages on x with object pages on y", async ({
    page,
  }) => {
    await openConfig(page, {
      count: 12,
      direction: "hybrid",
      mode: "sliderMenu",
      pages: { basis: ["viewport", "object"], align: ["start", "center"] },
      objects: { size: [100, 80], gap: 10, lines: 4 },
      size: [260, 190],
      duration: 0,
      controls: { bar: "@dot" },
    });

    await expect(page.locator(".ms-slider.ms-x .ms-slider-item")).toHaveCount(2);
    await expect(page.locator(".ms-slider.ms-y .ms-slider-item")).toHaveCount(3);
  });

  test("vertical object pages respond to wheel navigation", async ({ page }) => {
    await openConfig(page, {
      count: 5,
      direction: "y",
      mode: "sliderMenu",
      pages: { basis: "object", align: "center" },
      objects: { size: [100, 120], gap: [0, 20] },
      size: [120, 300],
      duration: 0,
      controls: { wheel: true, bar: "@dot" },
    });

    const viewport = page.locator(".ms-viewport");
    await viewport.hover();
    await page.mouse.wheel(0, 120);

    await expect(page.locator(".ms-slider-item").nth(1)).toHaveClass(/ms-active/);
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBe(140);
  });

  test("maxItems follows object page indexes", async ({ page }) => {
    await openConfig(page, {
      count: 10,
      direction: "x",
      mode: "sliderMenu",
      pages: { basis: "object", align: "center" },
      objects: { size: [120, 100], gap: [20, 0] },
      size: [300, 120],
      duration: 0,
      controls: { bar: { element: "@dot", maxItems: 5 } },
    });

    await page.locator('[ms-page="3"]').click();

    await expect
      .poll(() =>
        page
          .locator(".ms-slider-item")
          .evaluateAll((items) => items.map((item) => item.getAttribute("ms-page"))),
      )
      .toEqual(["1", "2", "3", "4", "5"]);
    await expect(page.locator('[ms-page="3"]')).toHaveClass(/ms-active/);
  });

  test("switching page basis live rebuilds markers and edge insets", async ({
    page,
  }) => {
    const config = {
      count: 6,
      direction: "x",
      mode: "sliderMenu",
      objects: { size: [120, 100], gap: [20, 0] },
      size: [300, 120],
      duration: 0,
      controls: { bar: "@dot" },
    };
    await openConfig(page, config, true);
    await expect(page.locator(".ms-slider-item")).toHaveCount(3);

    await page.evaluate(
      (next) => (window as any).__set(next),
      JSON.stringify({
        ...config,
        pages: { basis: "object", align: "center" },
      }),
    );
    await expect(page.locator(".ms-slider-item")).toHaveCount(6);
    await expect(page.locator(".ms-slider-item").first()).toHaveClass(/ms-active/);

    const centred = await page.evaluate(() => {
      const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
      const item = document.querySelector(".ms-object-box")!.getBoundingClientRect();
      return Math.abs(viewport.left + viewport.width / 2 - (item.left + item.width / 2));
    });
    expect(centred).toBeLessThanOrEqual(1);

    await page.evaluate(
      (next) => (window as any).__set(next),
      JSON.stringify(config),
    );
    await expect(page.locator(".ms-slider-item")).toHaveCount(3);
  });

  test("stickToEnd opens on the last aligned object page", async ({ page }) => {
    await openConfig(page, {
      count: 5,
      direction: "x",
      mode: "sliderMenu",
      pages: { basis: "object", align: "center" },
      objects: { size: [120, 100], gap: [20, 0] },
      size: [300, 120],
      stickToEnd: true,
      duration: 0,
      controls: { bar: "@dot" },
    });

    await expect(page.locator(".ms-slider-item").last()).toHaveClass(/ms-active/);
    const delta = await page.evaluate(() => {
      const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
      const item = document.querySelector('[data-testid="crash-4"]')!.getBoundingClientRect();
      return Math.abs(viewport.left + viewport.width / 2 - (item.left + item.width / 2));
    });
    expect(delta).toBeLessThanOrEqual(1);
  });

  for (const keys of ["Step", "Focus"] as const)
    test(`hybrid loop keeps ${keys.toLowerCase()} navigation on both object axes`, async ({
      page,
    }) => {
      await page.goto(`/?scenario=objectPagesHybridLoop${keys}`);
      await page.locator(".ms-viewport").click({ position: { x: 130, y: 95 } });

      // Focus takes the current object first; step moves immediately.
      if (keys === "Focus") await page.keyboard.press("ArrowRight");

      const activeAt = (axis: "x" | "y") =>
        page
          .locator(`.ms-slider.ms-${axis} .ms-slider-item`)
          .evaluateAll((items) =>
            items.findIndex((item) => item.classList.contains("ms-active")),
          );

      let activeX = await activeAt("x");
      for (let index = 0; index < 4; index++) {
        await page.keyboard.press("ArrowRight");
        await expect.poll(() => activeAt("x")).not.toBe(activeX);
        const next = await activeAt("x");
        activeX = next;
      }

      let activeY = await activeAt("y");
      for (let index = 0; index < 3; index++) {
        await page.keyboard.press("ArrowDown");
        await expect.poll(() => activeAt("y")).not.toBe(activeY);
        const next = await activeAt("y");
        activeY = next;
      }
    });

  test("fromRight keeps the first object centred and the first marker active", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPagesFromRight");
    const markers = page.locator(".ms-slider-item");
    await expect(markers).toHaveCount(5);
    await expect(markers.first()).toHaveClass(/ms-active/);

    const delta = await page.evaluate(() => {
      const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
      const item = document.querySelector('[data-testid="object-page-0"]')!.getBoundingClientRect();
      return Math.abs(viewport.left + viewport.width / 2 - (item.left + item.width / 2));
    });
    expect(delta).toBeLessThanOrEqual(1);

    await markers.nth(3).click();
    await expect(markers.nth(3)).toHaveClass(/ms-active/);
  });

  test("fromRight loop opens on the first object page", async ({ page }) => {
    await page.goto("/?scenario=objectPagesFromRightLoop");

    await expect(page.locator(".ms-slider-item").first()).toHaveClass(/ms-active/);
    const delta = await page.evaluate(() => {
      const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
      const objects = [
        ...document.querySelectorAll<HTMLElement>('[data-testid="object-page-0"]'),
      ];
      return Math.min(
        ...objects.map((item) => {
          const rect = item.getBoundingClientRect();
          return Math.abs(
            viewport.left + viewport.width / 2 - (rect.left + rect.width / 2),
          );
        }),
      );
    });
    expect(delta).toBeLessThanOrEqual(1);
  });

  test("focus navigation lands on the object's aligned page", async ({ page }) => {
    await page.goto("/?scenario=objectPagesFocus");
    await page.locator(".ms-viewport").click({ position: { x: 150, y: 20 } });

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect.poll(() => leftOf(page)).toBe(140);
    await expect(page.locator(".ms-slider-item").nth(1)).toHaveClass(/ms-active/);
  });

  test("focus navigation follows objects through the loop seam", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPagesFocusLoop");
    await page.locator(".ms-viewport").click({ position: { x: 150, y: 20 } });

    // The first press takes the object already under the viewport.
    await page.keyboard.press("ArrowRight");
    for (let index = 1; index <= 5; index++) {
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(".ms-slider-item").nth(index % 5)).toHaveClass(
        /ms-active/,
      );
      await expect
        .poll(() =>
          page.evaluate(() => {
            const box = document.activeElement?.closest(".ms-object-box");
            return Number(box?.getAttribute("ms-child")) - 1;
          }),
        )
        .toBe(index % 5);
    }
  });

  test("visibility follows the visual edge with centred object gutters", async ({
    page,
  }) => {
    await page.goto("/?scenario=objectPages");
    await page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>(".ms-viewport")!;
      viewport.scrollLeft = 50;
    });

    const first = page.locator('[data-testid="object-page-0"]').locator("..");
    const geometry = await first.evaluate((box) => {
      const viewport = document.querySelector(".ms-viewport")!.getBoundingClientRect();
      const rect = box.getBoundingClientRect();
      return {
        inside: rect.left >= viewport.left && rect.right <= viewport.right,
        visibility: getComputedStyle(box)
          .getPropertyValue("--ms-content-visibility")
          .trim(),
      };
    });

    expect(geometry.inside).toBe(true);
    expect(geometry.visibility).toBe("1");
  });
});

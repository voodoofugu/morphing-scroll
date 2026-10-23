import { expect, test, type Page } from "@playwright/test";

type Config = Record<string, unknown>;

const open = (page: Page, config: Config, switchable = false) =>
  page.goto(
    `/?scenario=${switchable ? "crashSwitch" : "crash"}&props=${encodeURIComponent(
      JSON.stringify(config),
    )}`,
  );

const pages = (page: Page, selector = ".ms-slider") =>
  page
    .locator(`${selector} .ms-slider-item`)
    .evaluateAll((items) => items.map((item) => item.getAttribute("ms-page")));

const menu = (direction: "x" | "y"): Config => ({
  count: 10,
  size: direction === "x" ? [300, 220] : 300,
  direction,
  mode: "sliderMenu",
  objects: { size: "full" },
  controls: { bar: { element: "@dot", maxItems: 4 } },
  duration: 0,
});

test.describe("controls.bar.maxItems", () => {
  for (const direction of ["y", "x"] as const)
    test(`${direction}: the window follows global page numbers`, async ({ page }) => {
      await open(page, menu(direction));
      const slider = `.ms-slider.ms-${direction}`;

      await expect(page.locator(`${slider} .ms-slider-item`)).toHaveCount(4);
      expect(await pages(page, slider)).toEqual(["0", "1", "2", "3"]);

      await page.locator(`${slider} [ms-page="3"]`).click();

      await expect(
        page.locator(`${slider} [ms-page="3"]`),
      ).toHaveClass(/\bms-active\b/);
      await expect.poll(() => pages(page, slider)).toEqual(["1", "2", "3", "4"]);

      await page.locator(`${slider} [ms-page="4"]`).click();
      await expect.poll(() => pages(page, slider)).toEqual(["2", "3", "4", "5"]);
    });

  test("hybrid limits both bars independently", async ({ page }) => {
    await open(page, {
      count: 256,
      size: [300, 220],
      direction: "hybrid",
      mode: "sliderMenu",
      objects: { size: [100, 70], lines: 16 },
      controls: { bar: { element: "@dot", maxItems: 4 } },
      duration: 0,
    });

    await expect(page.locator(".ms-slider.ms-x .ms-slider-item")).toHaveCount(4);
    await expect(page.locator(".ms-slider.ms-y .ms-slider-item")).toHaveCount(4);
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(2);
  });

  test("loop wraps the visible window", async ({ page }) => {
    await open(page, {
      ...menu("y"),
      loop: true,
      controls: {
        bar: { element: "@dot", maxItems: 4 },
        arrows: { element: "@arrow" },
      },
    });

    await page.locator(".ms-arrow-box.ms-top").click();

    await expect(page.locator('[ms-page="9"]')).toHaveClass(
      /\bms-active\b/,
    );
    await expect.poll(() => pages(page)).toEqual(["8", "9", "0", "1"]);
  });

  test("an element array keeps its global page indexes", async ({ page }) => {
    const labels = Array.from({ length: 10 }, (_, index) => `preview ${index}`);
    await open(page, {
      ...menu("y"),
      controls: { bar: { element: labels, maxItems: 4 } },
    });

    await page.locator('[ms-page="3"]').click();

    await expect
      .poll(() =>
        page
          .locator(".ms-slider-item")
          .evaluateAll((items) => items.map((item) => item.textContent)),
      )
      .toEqual(["preview 1", "preview 2", "preview 3", "preview 4"]);
  });

  test("a direct initial jump leaves one page ahead", async ({ page }) => {
    await open(page, { ...menu("y"), initialPosition: 2400 });

    await expect(page.locator('[ms-page="8"]')).toHaveClass(
      /\bms-active\b/,
    );
    await expect.poll(() => pages(page)).toEqual(["6", "7", "8", "9"]);
  });

  test("the limit reacts to live prop changes", async ({ page }) => {
    const config = menu("y");
    await open(page, config, true);
    await expect(page.locator(".ms-slider-item")).toHaveCount(4);

    await page.evaluate(
      (next) => (window as unknown as { __set: (value: string) => void }).__set(next),
      JSON.stringify({
        ...config,
        controls: { bar: { element: "@dot", maxItems: 6 } },
      }),
    );
    await expect(page.locator(".ms-slider-item")).toHaveCount(6);
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);

    await page.evaluate(
      (next) => (window as unknown as { __set: (value: string) => void }).__set(next),
      JSON.stringify({ ...config, controls: { bar: "@dot" } }),
    );
    await expect(page.locator(".ms-slider-item")).toHaveCount(10);
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);
  });

  for (const direction of ["y", "x"] as const)
    test(`${direction}: a limited slider remains draggable`, async ({ page }) => {
      await open(page, { ...menu(direction), mode: "slider" });
      const slider = page.locator(`.ms-slider.ms-${direction}`);
      const first = slider.locator(".ms-slider-item").first();
      const from = (await first.boundingBox())!;
      const step = direction === "x" ? from.width : from.height;
      const x = from.x + from.width / 2;
      const y = from.y + from.height / 2;

      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(
        direction === "x" ? x + step * 1.2 : x,
        direction === "y" ? y + step * 1.2 : y,
        { steps: 4 },
      );
      await page.mouse.up();

      await expect(slider.locator('[ms-page="1"]')).toHaveClass(
        /\bms-active\b/,
      );
      await expect(slider.locator(".ms-slider-item")).toHaveCount(4);
    });

  test("a long drag keeps moving the window and its cursor", async ({ page }) => {
    await open(page, { ...menu("y"), mode: "slider" });
    const slider = page.locator(".ms-slider.ms-y");
    const first = slider.locator(".ms-slider-item").first();
    const from = (await first.boundingBox())!;
    const x = from.x + from.width / 2;
    const y = from.y + from.height / 2;

    await expect(slider).toHaveCSS("cursor", "grab");
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(slider).toHaveClass(/\bms-grabbing\b/);
    await expect(slider).toHaveCSS("cursor", "grabbing");

    for (let pageIndex = 1; pageIndex <= 7; pageIndex++)
      await page.mouse.move(x, y + from.height * pageIndex * 1.05, {
        steps: 2,
      });

    await expect(slider.locator('[ms-page="7"]')).toHaveClass(
      /\bms-active\b/,
    );
    await expect.poll(() => pages(page)).toEqual(["5", "6", "7", "8"]);

    await page.mouse.up();
    await expect(slider).not.toHaveClass(/\bms-grabbing\b/);
    await expect(slider).toHaveCSS("cursor", "grab");
  });
});

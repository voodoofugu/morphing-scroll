import { test, expect, type Page } from "@playwright/test";

/*
 * Страница, которую читают справа налево.
 *
 * Отсчёт прокрутки здесь закреплён на левом крае: вся арифметика считает в
 * пикселях оттуда, а `direction: rtl`, унаследованный от страницы, увёл бы
 * `scrollLeft` в минус. Направление при этом возвращается содержимому, а
 * горизонталь отражается там, где по ней не едут.
 */

const boxes = (page: Page) =>
  page.evaluate(() => {
    const view = document.querySelector(".ms-viewport") as HTMLElement;
    const left = view.getBoundingClientRect().left;

    return Array.from(document.querySelectorAll("[ms-wrap-id]"))
      .map((node) => {
        const r = node.getBoundingClientRect();

        return {
          key: node.getAttribute("ms-wrap-id")!,
          x: Math.round(r.left - left),
          y: Math.round(r.top),
        };
      })
      .sort((a, b) => a.y - b.y || a.x - b.x);
  });

test.describe("right-to-left", () => {
  test("отсчёт прокрутки остаётся от левого края", async ({ page }) => {
    await page.goto("/?scenario=rtlGrid");
    await page.waitForTimeout(300);

    await page.locator(".ms-viewport").evaluate((el) => (el.scrollTop = 200));
    await page.waitForTimeout(200);

    const at = await page
      .locator(".ms-viewport")
      .evaluate((el) => ({ top: el.scrollTop, left: el.scrollLeft }));

    expect(at.top).toBe(200);
    expect(at.left).toBe(0); // не ушёл в минус
  });

  test("направление возвращается содержимому", async ({ page }) => {
    await page.goto("/?scenario=rtlGrid");
    await page.waitForTimeout(300);

    const dirs = await page.evaluate(() => ({
      view: getComputedStyle(document.querySelector(".ms-viewport")!).direction,
      wrap: getComputedStyle(
        document.querySelector(".ms-objects-wrapper")!,
      ).direction,
    }));

    expect(dirs.view).toBe("ltr");
    expect(dirs.wrap).toBe("rtl");
  });

  test("первый объект стоит справа, а ряд идёт справа налево", async ({
    page,
  }) => {
    await page.goto("/?scenario=rtlGrid");
    await page.waitForTimeout(300);

    const row = (await boxes(page)).slice(0, 3);

    // слева направо это 2, 1, 0 — значит справа налево это 0, 1, 2
    expect(row.map((b) => b.key)).toEqual(["r-2", "r-1", "r-0"]);
  });

  test("вертикальный бегунок стоит слева", async ({ page }) => {
    await page.goto("/?scenario=rtlGrid");
    await page.waitForTimeout(300);

    const side = await page.evaluate(() => {
      const bar = document.querySelector(".ms-bar") as HTMLElement;
      const view = document.querySelector(".ms-content") as HTMLElement;
      const b = bar.getBoundingClientRect();
      const v = view.getBoundingClientRect();

      return b.left - v.left < v.right - b.right ? "left" : "right";
    });

    expect(side).toBe("left");
  });

  test("на обычной странице всё как было", async ({ page }) => {
    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(
        JSON.stringify({
          count: 24,
          size: [300, 300],
          objects: { size: 90, gap: 10, lines: 3 },
          render: { mode: "virtual" },
          controls: { wheel: true },
        }),
      )}`,
    );
    await page.waitForTimeout(300);

    const row = (await boxes(page)).slice(0, 3);
    expect(row.map((b) => b.key)).toEqual(["crash-0", "crash-1", "crash-2"]);
  });
});

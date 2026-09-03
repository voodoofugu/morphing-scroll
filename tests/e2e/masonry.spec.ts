import { test, expect } from "@playwright/test";

type Box = { i: number; left: number; top: number; height: number };

/* разложено, когда обёртка получила высоту от кладки, а не от потока */
const packed = (page: import("@playwright/test").Page) =>
  page
    .locator(".ms-objects-wrapper")
    .evaluate((el) => (el as HTMLElement).offsetHeight);

const boxes = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return {
        i: Number(el.textContent),
        left: Math.round(m.m41),
        top: Math.round(m.m42),
        height: Math.round(el.getBoundingClientRect().height),
      } as Box;
    }),
  );

test.describe("objects.size: each (real browser)", () => {
  test("кладёт карточки в две колонки без зазоров по вертикали", async ({
    page,
  }) => {
    await page.goto("/?scenario=masonry");
    await expect(page.locator(".ms-object-box")).toHaveCount(20);

    // ждём, пока кладка разложит: до этого обёртка нулевой высоты
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = (await boxes(page)).sort((a, b) => a.i - b.i);

    // две колонки по 90 с зазором 10 в окне 200
    expect([...new Set(all.map((b) => b.left))].sort((a, b) => a - b)).toEqual([
      0, 100,
    ]);

    // в каждой колонке карточки идут вплотную, зазор ровно 10
    for (const left of [0, 100]) {
      const col = all
        .filter((b) => b.left === left)
        .sort((a, b) => a.top - b.top);

      for (let i = 1; i < col.length; i++)
        expect(col[i].top).toBe(col[i - 1].top + col[i - 1].height + 10);
    }
  });

  test("каждая следующая карточка уходит в колонку, которая короче", async ({
    page,
  }) => {
    await page.goto("/?scenario=masonry");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = (await boxes(page)).sort((a, b) => a.i - b.i);

    // повторяем ту же укладку и сверяем колонку у каждой
    const ends = [0, 0];
    for (const b of all) {
      const column = ends[0] <= ends[1] ? 0 : 1;
      expect(b.left).toBe(column * 100);
      expect(b.top).toBe(ends[column]);
      ends[column] = b.top + b.height + 10;
    }
  });

  test("прокрутка идёт до самой длинной колонки, не дальше", async ({
    page,
  }) => {
    await page.goto("/?scenario=masonry");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = await boxes(page);
    const bottom = Math.max(...all.map((b) => b.top + b.height));

    const view = page.locator(".ms-viewport");
    expect(await view.evaluate((el) => el.scrollHeight)).toBe(bottom);
  });

  test("виртуализация выбрасывает то, что уехало из окна", async ({ page }) => {
    await page.goto("/?scenario=masonryVirtual");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);
    await page.waitForTimeout(400);

    const atTop = (await boxes(page)).map((b) => b.i).sort((a, b) => a - b);
    expect(atTop.length).toBeLessThan(60);
    expect(atTop[0]).toBe(0);

    await page
      .locator(".ms-viewport")
      .evaluate((el) => ((el as HTMLElement).scrollTop = 1200));
    await page.waitForTimeout(400);

    const lower = (await boxes(page)).map((b) => b.i).sort((a, b) => a - b);
    expect(lower[0]).toBeGreaterThan(atTop[0]);
    expect(lower.length).toBeLessThan(60);
  });

  /*
   * Ради этого пачки и заведены: пятьсот карточек в первом кадре — это та
   * задержка, из-за которой кладку обычно и не делают.
   */
  test("пятьсот карточек не монтируются одним кадром", async ({ page }) => {
    await page.goto("/?scenario=masonryMany");

    const first = await page.locator(".ms-object-box").count();
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(30);

    // и доезжают до конца сами, пачка за пачкой
    await expect
      .poll(async () => page.locator(".ms-object-box").count(), {
        timeout: 15_000,
      })
      .toBe(500);
  });
});

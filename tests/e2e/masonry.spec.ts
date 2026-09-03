import { test, expect } from "@playwright/test";

type Box = { i: number; x: number; y: number; w: number; h: number };

/* разложено, когда обёртка получила размер от укладки, а не от потока */
const packed = (page: import("@playwright/test").Page) =>
  page
    .locator(".ms-objects-wrapper")
    .evaluate((el) => (el as HTMLElement).offsetHeight);

/*
 * Читаем координаты из инлайнового стиля, а не из вычисленного: на боксе
 * может лежать transition, и в вычисленном ловится середина переезда.
 */
const boxes = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map((el) => {
      const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
        el.style.transform,
      );
      const rect = el.getBoundingClientRect();

      return {
        i: Number(el.textContent),
        x: Math.round(Number(m?.[1] ?? 0)),
        y: Math.round(Number(m?.[2] ?? 0)),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
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
    expect([...new Set(all.map((b) => b.x))].sort((a, b) => a - b)).toEqual([
      0, 100,
    ]);

    // в каждой колонке карточки идут вплотную, зазор ровно 10
    for (const left of [0, 100]) {
      const col = all.filter((b) => b.x === left).sort((a, b) => a.y - b.y);

      for (let i = 1; i < col.length; i++)
        expect(col[i].y).toBe(col[i - 1].y + col[i - 1].h + 10);
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
      expect(b.x).toBe(column * 100);
      expect(b.y).toBe(ends[column]);
      ends[column] = b.y + b.h + 10;
    }
  });

  test("прокрутка идёт до самой длинной колонки, не дальше", async ({
    page,
  }) => {
    await page.goto("/?scenario=masonry");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = await boxes(page);
    const bottom = Math.max(...all.map((b) => b.y + b.h));

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
   * Поперёк прокрутки размер выбирает объект — колонок фиксированной ширины
   * из этого не сложить, зато складывается строка: набираем, пока лезет.
   */
  test("поток: строка набирается, пока следующий помещается", async ({
    page,
  }) => {
    await page.goto("/?scenario=flowRow");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = (await boxes(page)).sort((a, b) => a.i - b.i);

    // ширины 60, 110, 80, 40 по кругу; окно 200, зазор 10
    // 60 + 10 + 110 = 180 влезло, 180 + 10 + 80 = 270 — нет
    expect(all.slice(0, 4).map((b) => [b.x, b.y])).toEqual([
      [0, 0],
      [70, 0],
      [0, 50],
      [90, 50],
    ]);
  });

  test("поток: строка становится толщиной с самый толстый объект", async ({
    page,
  }) => {
    await page.goto("/?scenario=flowFree");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = (await boxes(page)).sort((a, b) => a.i - b.i);

    // 0 и 1 в первой строке: 30 и 70 высотой, значит строка 70
    expect(all[0].y).toBe(0);
    expect(all[1].y).toBe(0);
    expect(all[2].y).toBe(80);
  });

  test("поток по горизонтали: колонка набирается вниз", async ({ page }) => {
    await page.goto("/?scenario=flowColumn");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = (await boxes(page)).sort((a, b) => a.i - b.i);

    // высоты 40, 90, 60, 30; окно 200, зазор 10: 40+10+90 = 140, +10+60 = 210 — нет
    expect(all.slice(0, 3).map((b) => [b.x, b.y])).toEqual([
      [0, 0],
      [0, 50],
      [80, 0],
    ]);
  });

  /*
   * При hybrid линию обрывает `crossCount`, а не место — упереться там не во
   * что. Колонки при этом не выравниваются: рядом с узким объектом иначе
   * остаётся дыра, и отступы перестают быть одинаковыми.
   */
  test("hybrid: строку обрывает crossCount, отступы одинаковые", async ({
    page,
  }) => {
    await page.goto("/?scenario=gridHybrid");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const all = (await boxes(page)).sort((a, b) => a.i - b.i);

    // по три в строке
    expect(all.slice(0, 3).map((b) => b.y)).toEqual([0, 0, 0]);
    expect(all[3].y).toBeGreaterThan(0);

    // внутри строки каждый начинается ровно через зазор после предыдущего
    for (const row of [0, 1, 2]) {
      const line = all.slice(row * 3, row * 3 + 3);

      for (let i = 1; i < line.length; i++)
        expect(line[i].x - (line[i - 1].x + line[i - 1].w)).toBe(10);
    }
  });

  /*
   * Содержимое живое: картинка догрузилась, текст сменился. Раскладка,
   * посчитанная по старому размеру, разъехалась бы — значит следить надо,
   * пока объект в DOM, а не до первого замера.
   */
  test("объект, выросший после замера, двигает соседей", async ({ page }) => {
    await page.goto("/?scenario=eachGrows");
    await expect.poll(() => packed(page)).toBeGreaterThan(0);

    const before = (await boxes(page)).sort((a, b) => a.i - b.i);
    expect(before[0].h).toBe(40);
    const heightBefore = await packed(page);

    await page.getByTestId("grow").click();

    /*
     * Ждём саму раскладку, а не высоту: коробка меняется на перерисовке, а
     * переложить колонки успевают только следующим кадром.
     */
    await expect
      .poll(async () =>
        (await boxes(page))
          .filter((b) => b.x === 0 && b.i !== 0)
          .sort((a, b) => a.y - b.y)
          .at(0)?.y,
      )
      .toBe(170);

    expect((await boxes(page)).find((b) => b.i === 0)?.h).toBe(160);
    expect(await packed(page)).toBeGreaterThan(heightBefore);
  });

  /*
   * Ради этого пачки и заведены: пятьсот карточек в первом кадре — это та
   * задержка, из-за которой кладку обычно и не делают.
   */
  test("пятьсот карточек не монтируются одним кадром", async ({ page }) => {
    await page.goto("/?scenario=masonryMany");

    // счёт снимает сама страница на первом кадре — снаружи в него не попасть
    const first = await page.evaluate(
      () =>
        new Promise<number>((done) => {
          const read = () => {
            const n = (window as unknown as { __firstFrame?: number })
              .__firstFrame;

            if (n === undefined) requestAnimationFrame(read);
            else done(n);
          };

          read();
        }),
    );
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

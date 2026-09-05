import { test, expect, type Page } from "@playwright/test";

/*
 * Виртуализация спрашивает не весь список, а только тех, кто может быть в
 * окне. Это ускорение и ничего больше, поэтому проверять надо ровно одно: на
 * экране оказывается то же, что оказалось бы при полном обходе.
 *
 * Полный обход берём у `render: { trackVisibility: true }` — там смонтированы
 * все объекты, а координаты считаются те же самые. Что из них попадает в окно,
 * измеряем по настоящей раскладке браузера и сверяем с тем, что нарисовала
 * виртуализация. jsdom так не умеет: у него нет раскладки, и «auto» там ничего
 * не меряет.
 */

type Config = Record<string, unknown>;

const url = (config: Config) =>
  `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(config))}`;

const settle = (page: Page) => page.waitForTimeout(250);

/** ids of the objects whose box actually reaches into the window */
const inView = (page: Page) =>
  page.evaluate(() => {
    const view = document.querySelector(".ms-viewport") as HTMLElement;
    const box = view.getBoundingClientRect();

    return Array.from(document.querySelectorAll("[ms-wrap-id]"))
      .filter((node) => {
        const r = node.getBoundingClientRect();

        return (
          r.bottom > box.top &&
          r.top < box.bottom &&
          r.right > box.left &&
          r.left < box.right
        );
      })
      .map((node) => node.getAttribute("ms-wrap-id")!)
      .sort();
  });

const mounted = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll("[ms-wrap-id]"))
      .map((node) => node.getAttribute("ms-wrap-id")!)
      .sort(),
  );

const scrollTo = async (page: Page, left: number, top: number) => {
  await page.locator(".ms-viewport").evaluate(
    (el, at) => {
      el.scrollLeft = at.left;
      el.scrollTop = at.top;
    },
    { left, top },
  );
  await settle(page);
};

const COUNT = 120;

const cases: { name: string; objects: Config; extra?: Config }[] = [
  {
    name: "равномерная сетка",
    objects: { size: 60, gap: 10, lines: 3 },
  },
  {
    name: "сетка с переставленным порядком",
    objects: { size: 60, gap: 10, lines: 3, order: "column" },
  },
  {
    name: "кладка",
    objects: { layout: "masonry", size: 60, gap: 10, lines: 3 },
  },
  {
    name: "поток",
    objects: { layout: "flow", size: 60, gap: 10, lines: 3 },
  },
  {
    name: "заполнение",
    objects: { layout: "fill", gap: 10 },
  },
  {
    name: "круг",
    objects: { size: 60, gap: 10, lines: 3 },
    extra: { loop: true },
  },
];

const HYBRID: Config = {
  direction: "hybrid",
  objects: { size: 60, gap: 10, lines: 4 },
};

test.describe("окно виртуализации", () => {
  for (const { name, objects, extra } of cases) {
    test(`${name}: рисует то же, что и полный обход`, async ({ page }) => {
      const base: Config = {
        count: COUNT,
        vary: true,
        size: [300, 300],
        objects,
        controls: { wheel: true },
        ...extra,
      };

      for (const top of [0, 137, 480, 900]) {
        await page.goto(
          url({ ...base, render: { trackVisibility: true } }),
        );
        await settle(page);
        await scrollTo(page, 0, top);
        const expected = await inView(page);

        await page.goto(url({ ...base, render: { mode: "virtual" } }));
        await settle(page);
        await scrollTo(page, 0, top);
        const drawn = await mounted(page);

        expect(expected.length, `${name} @${top}: нечего сравнивать`)
          .toBeGreaterThan(0);

        for (const id of expected)
          expect(drawn, `${name} @${top}: пропал ${id}`).toContain(id);
      }
    });
  }

  test("hybrid: окно прямоугольное, и в нём всё на месте", async ({ page }) => {
    const base: Config = {
      count: COUNT,
      size: [300, 300],
      controls: { wheel: true },
      ...HYBRID,
    };

    for (const [left, top] of [
      [0, 0],
      [120, 240],
      [200, 700],
    ]) {
      await page.goto(url({ ...base, render: { trackVisibility: true } }));
      await settle(page);
      await scrollTo(page, left, top);
      const expected = await inView(page);

      await page.goto(url({ ...base, render: { mode: "virtual" } }));
      await settle(page);
      await scrollTo(page, left, top);
      const drawn = await mounted(page);

      expect(expected.length).toBeGreaterThan(0);
      for (const id of expected)
        expect(drawn, `hybrid @${left},${top}: пропал ${id}`).toContain(id);
    }
  });

  test("и монтирует горстку вместо всего списка", async ({ page }) => {
    await page.goto(
      url({
        count: 600,
        size: [300, 300],
        objects: { size: 60, gap: 10, lines: 3 },
        render: { mode: "virtual" },
        controls: { wheel: true },
      }),
    );
    await settle(page);
    await scrollTo(page, 0, 3000);

    const drawn = await mounted(page);
    expect(drawn.length).toBeLessThan(60);
  });
});

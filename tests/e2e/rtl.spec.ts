import { test, expect, type Page } from "@playwright/test";

/*
 * Список, который читают справа налево, на такой же странице.
 *
 * Отсчёт прокрутки закреплён на левом крае: вся арифметика считает в пикселях
 * оттуда, а `direction: rtl`, унаследованный от страницы, увёл бы `scrollLeft`
 * в минус. Разворачивается раскладка, а не отсчёт.
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

  /*
   * Разворот — дело раскладки, а не отсчёта: и окно, и коробка считают слева,
   * иначе арифметика от левого края ломается. Видно это по порядку объектов,
   * а не по `direction`.
   */
  test("отсчёт слева, а разворот виден по порядку", async ({ page }) => {
    await page.goto("/?scenario=rtlGrid");
    await page.waitForTimeout(300);

    const dirs = await page.evaluate(() => ({
      view: document.querySelector<HTMLElement>(".ms-viewport")!.style.direction,
      wrap: document.querySelector<HTMLElement>(".ms-objects-wrapper")!.style
        .direction,
    }));

    expect(dirs.view).toBe("ltr");
    expect(dirs.wrap).toBe("ltr");

    // первая тройка ложится справа налево
    const row = await boxes(page);

    expect(row.slice(0, 3).map((one) => one.key)).toEqual(["r-2", "r-1", "r-0"]);
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

/*
 * Список, идущий справа налево, идёт справа налево целиком: первый объект
 * стоит у правого края, следующие уходят влево, и прокрутка открывается там
 * же — а значит и бегунок начинает справа. Отсчёт при этом остаётся от левого
 * края разметки, на нём стоит вся арифметика.
 */
test.describe("список справа налево", () => {
  const open = (page: Page, props: Record<string, unknown>) =>
    page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(props))}`,
    );

  const laid = (page: Page) =>
    page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const box = view.getBoundingClientRect();

      return {
        order: [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
          .map((el) => ({
            n: el.textContent ?? "",
            x: el.getBoundingClientRect().left,
          }))
          .sort((one, two) => one.x - two.x)
          .map((one) => one.n),
        at: Math.round(view.scrollLeft),
        most: view.scrollWidth - view.clientWidth,
        thumb: (() => {
          const el = document.querySelector<HTMLElement>(".ms-thumb");

          return el ? Math.round(el.getBoundingClientRect().left - box.left) : null;
        })(),
        boxDir: document.querySelector<HTMLElement>(".ms-object-box")!.style
          .direction,
      };
    });

  const HORIZONTAL = {
    count: 9,
    size: [300, 120],
    direction: "x",
    objects: { size: 80, gap: 10 },
    controls: { wheel: true, bar: "@thumb" },
  };

  test("первый объект стоит справа, следующие уходят влево", async ({
    page,
  }) => {
    await open(page, { ...HORIZONTAL, reading: "rtl" });
    await page.waitForTimeout(350);

    const out = await laid(page);

    expect(out.order).toEqual(["8", "7", "6", "5", "4", "3", "2", "1", "0"]);
  });

  test("прокрутка открывается там же, справа", async ({ page }) => {
    await open(page, { ...HORIZONTAL, reading: "rtl" });
    await page.waitForTimeout(350);

    const out = await laid(page);

    expect(out.most).toBeGreaterThan(0);
    expect(out.at).toBe(out.most);
  });

  /* значит и бегунок начинает справа, а уходит влево вместе с чтением */
  test("бегунок начинает справа", async ({ page }) => {
    await open(page, { ...HORIZONTAL, reading: "rtl" });
    await page.waitForTimeout(350);

    const rtl = await laid(page);

    await open(page, HORIZONTAL);
    await page.waitForTimeout(350);

    const ltr = await laid(page);

    expect(ltr.thumb).toBe(0);
    expect(rtl.thumb!).toBeGreaterThan(100);
  });

  test("сами объекты библиотека не разворачивает", async ({ page }) => {
    await open(page, { ...HORIZONTAL, reading: "rtl" });
    await page.waitForTimeout(350);

    expect((await laid(page)).boxDir).toBe("");
  });

  test("на обычном чтении всё как было", async ({ page }) => {
    await open(page, HORIZONTAL);
    await page.waitForTimeout(350);

    const out = await laid(page);

    expect(out.order).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
    expect(out.at).toBe(0);
  });

  /* у вертикального списка горизонталь поперечная — колонки ложатся справа */
  test("вертикальный кладёт колонки справа", async ({ page }) => {
    await open(page, {
      count: 9,
      size: [300, 300],
      reading: "rtl",
      objects: { size: 80, gap: 10 },
      controls: { wheel: true },
    });
    await page.waitForTimeout(350);

    expect((await laid(page)).order.slice(0, 3)).toEqual(["2", "5", "8"]);
  });
});

/*
 * Разворот в круге отражается по всей ленте, а не по одной копии: сдвиг копии
 * прибавлен до отражения, и мерка в одну копию уносила все копии, кроме
 * нулевой, далеко влево — в окне не оставалось ничего.
 */
test.describe("разворот вместе с кругом", () => {
  const RIG = {
    count: 40,
    size: [680, 430],
    direction: "hybrid",
    objects: { size: 170, gap: 12, lines: 2 },
    render: { mode: "virtual", rootMargin: 200 },
    loop: true,
    controls: { wheel: true },
  };

  const inWindow = (page: Page) =>
    page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const box = view.getBoundingClientRect();

      const seen = [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
        .map((el) => ({ n: el.textContent ?? "", r: el.getBoundingClientRect() }))
        .filter(
          ({ r }) =>
            r.right > box.left &&
            r.left < box.right &&
            r.bottom > box.top &&
            r.top < box.bottom,
        );

      const top = Math.min(...seen.map(({ r }) => r.top));

      return {
        count: seen.length,
        row: seen
          .filter(({ r }) => Math.abs(r.top - top) < 2)
          .sort((one, two) => one.r.left - two.r.left)
          .map(({ n }) => n),
      };
    });

  const open = (page: Page, props: Record<string, unknown>) =>
    page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(props))}`,
    );

  test("объекты остаются в окне", async ({ page }) => {
    await open(page, { ...RIG, reading: "rtl" });
    await page.waitForTimeout(500);

    const rtl = await inWindow(page);

    await open(page, RIG);
    await page.waitForTimeout(500);

    const ltr = await inWindow(page);

    expect(ltr.count).toBeGreaterThan(0);
    expect(rtl.count).toBe(ltr.count);
  });

  /*
   * Много линий — лента становится очень широкой, и окно уезжает далеко от
   * нуля. Запрос по неотражённой позиции приходился тогда на другую сторону
   * ленты, и виртуализация не находила вообще ничего.
   */
  test("широкая лента: окно спрашивает про свою сторону", async ({ page }) => {
    const wide = { ...RIG, objects: { size: 170, gap: 12, lines: 20 } };

    await open(page, { ...wide, reading: "rtl" });
    await page.waitForTimeout(500);

    const rtl = await inWindow(page);

    await open(page, wide);
    await page.waitForTimeout(500);

    const ltr = await inWindow(page);

    expect(ltr.count).toBeGreaterThan(0);
    expect(rtl.count).toBe(ltr.count);
  });

  test("и лежат в обратном порядке", async ({ page }) => {
    await open(page, { ...RIG, reading: "rtl" });
    await page.waitForTimeout(500);

    const rtl = await inWindow(page);

    await open(page, RIG);
    await page.waitForTimeout(500);

    const ltr = await inWindow(page);

    expect(rtl.row).toEqual([...ltr.row].reverse());
  });
});

/*
 * Наружу горизонталь считается от начала списка, а не от левого края
 * разметки: у развёрнутого списка начало справа, и `scrollTo(0)` обязан
 * привести туда же, куда приводит у обычного, — к первому объекту.
 */
test.describe("позиция считается от начала списка", () => {
  const RIG = {
    count: 20,
    size: [300, 120],
    direction: "x",
    objects: { size: 80, gap: 10 },
    controls: { wheel: true },
  };

  const open = (page: Page, props: Record<string, unknown>) =>
    page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(props))}`,
    );

  const seen = (page: Page) =>
    page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const box = view.getBoundingClientRect();

      return {
        raw: Math.round(view.scrollLeft),
        told: (window as unknown as { __scroll?: { left: number } }).__scroll
          ?.left,
        row: [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
          .map((el) => ({ n: el.textContent ?? "", r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.right > box.left + 1 && r.left < box.right - 1)
          .sort((one, two) => one.r.left - two.r.left)
          .map(({ n }) => n),
      };
    });

  const goTo = async (page: Page, to: number) => {
    await page.evaluate(
      (value) =>
        (
          window as unknown as {
            __ms: { scrollTo: (v: number, o: object) => void };
          }
        ).__ms.scrollTo(value, { duration: 0 }),
      to,
    );
    await page.waitForTimeout(250);
  };

  test("ноль приводит к первому объекту, а он стоит справа", async ({
    page,
  }) => {
    await open(page, { ...RIG, reading: "rtl" });
    await page.waitForTimeout(350);
    await goTo(page, 0);

    const out = await seen(page);

    // объект 0 у правого края окна, разметка при этом стоит в своём конце
    expect(out.row[out.row.length - 1]).toBe("0");
    expect(out.raw).toBeGreaterThan(0);
  });

  test("одно и то же число приводит к тем же объектам", async ({ page }) => {
    await open(page, { ...RIG, reading: "rtl" });
    await page.waitForTimeout(350);
    await goTo(page, 400);

    const rtl = await seen(page);

    await open(page, RIG);
    await page.waitForTimeout(350);
    await goTo(page, 400);

    const ltr = await seen(page);

    expect(rtl.row).toEqual([...ltr.row].reverse());
    expect(rtl.told).toBe(400);
    expect(ltr.told).toBe(400);
  });
});

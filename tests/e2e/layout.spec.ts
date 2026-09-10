import { test, expect, Page } from "@playwright/test";

const open = (page: import("@playwright/test").Page, scenario: string) =>
  page.goto(`/?scenario=${scenario}`);

const offsets = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as any).__scroll ?? { left: 0, top: 0 });

test.describe("MorphScroll size: auto (real browser)", () => {
  test("takes its size from the surrounding box", async ({ page }) => {
    await open(page, "sizeAuto");
    const root = page.locator("[morph-scroll]");
    await expect(root).toBeVisible();

    const box = await root.boundingBox();
    expect(box?.width).toBeCloseTo(280, 0);
    expect(box?.height).toBeCloseTo(240, 0);

    // two columns fit across the measured width
    await expect(page.locator(".ms-object-box")).toHaveCount(20);
  });

  test("scrolls within the measured range", async ({ page }) => {
    await open(page, "sizeAuto");
    const element = page.locator(".ms-viewport");
    await element.hover();

    await page.mouse.wheel(0, 400);
    await expect.poll(async () => (await offsets(page)).top).toBeGreaterThan(0);

    /*
     * The measured width decides the layout too: 280 fits two 100px columns,
     * so 20 items form 10 rows of 1000px inside a 240px viewport.
     */
    await page.mouse.wheel(0, 100000);
    await expect
      .poll(async () => (await offsets(page)).top)
      .toBeCloseTo(10 * 100 - 240, 0);
  });
});

test.describe("MorphScroll type: slider drag (real browser)", () => {
  test("snaps to the next page when the drag passes the threshold", async ({
    page,
  }) => {
    await open(page, "sliderDrag");
    const element = page.locator(".ms-viewport");
    const box = (await element.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + box.height - 40);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + box.height - 80, { steps: 4 });
    await page.mouse.move(cx, box.y + box.height - 140, { steps: 4 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(300);
  });

  test("snaps back when the drag stays under the threshold", async ({
    page,
  }) => {
    await open(page, "sliderDrag");
    const element = page.locator(".ms-viewport");
    const box = (await element.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + box.height - 40);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + box.height - 50, { steps: 3 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(0);
  });
});

test.describe("MorphScroll slider bar drag (real browser)", () => {
  test("steps a page when the drag passes one slider element", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + 6);
    await page.mouse.down();
    // travel further than one element so a step is taken
    await page.mouse.move(cx, box.y + box.height - 6, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBeGreaterThan(0);
  });

  /*
   * Страницу выбирает то, где указатель, а не сколько он проехал: жест по
   * бару — это прицеливание в пункт, как перетаскивание бегунка.
   */
  test("lands on the element the pointer is over", async ({ page }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20; // 20 объектов — 20 пунктов

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + item * 4.5, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(4 * 300);
  });

  /*
   * Один пронос по бару перелистывает несколько раз, и звук или тактильный
   * отклик вешают именно на них: отчёт по концу жеста услышал бы только
   * последний пункт.
   */
  test("reports every element the drag passes through", async ({ page }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20;

    await page.evaluate(
      () => ((window as unknown as { __navigate: unknown[] }).__navigate = []),
    );

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + item * 3.5, { steps: 12 });
    await page.mouse.up();

    const log = await page.evaluate(
      () =>
        (window as unknown as { __navigate: { from: number; to: number }[] })
          .__navigate,
    );

    expect(log.map((e) => [e.from, e.to])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  /*
   * Перелёт должен читаться как движение, а не как подмена позиции: раньше он
   * длился меньше кадра, и промежуточные кадры выпадали через раз.
   */
  test("flies to the aimed element instead of jumping there", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20;

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + item / 2 + 1); // первое движение только берёт отсчёт
    await page.evaluate(() => ((window as any).__trail = []));
    // дальше одним движением, что бы весь путь был одним перелётом
    await page.mouse.move(cx, box.y + item * 4.5);
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(4 * 300);

    const trail: number[] = await page.evaluate(
      () => (window as any).__trail ?? [],
    );
    /*
     * Кадр между страницами: подставленная позиция не даёт ни одного, а
     * ехавшая — хотя бы один. Больше требовать нельзя: под полным прогоном
     * страница успевает меньше кадров, и счёт становился бы мерой нагрузки.
     */
    const between = trail.filter((top) => top % 300 !== 0);
    expect(between.length).toBeGreaterThanOrEqual(1);
  });

  test("waits for the right element when the pointer comes back from outside", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20;

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    // уводим далеко за бар — там прицел упирается в последний пункт
    await page.mouse.move(cx, box.y + box.height + 400, { steps: 10 });
    // и возвращаемся ко второму: он и должен быть ответом
    await page.mouse.move(cx, box.y + item * 2.5, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(2 * 300);
  });

  test("leaves the scroll alone for a nudge shorter than one element", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + 6);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + 10, { steps: 2 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    expect((await offsets(page)).top).toBe(0);
  });
});

/*
 * Узел края пишут один раз — так, как он выглядит сверху, — а по остальным
 * сторонам его разворачивает библиотека. Боковой полосе для этого мало
 * поворота: она узкая и высокая, а узел до поворота широкий и низкий, — ему
 * меняют стороны местами. Проверяем, что после разворота он ложится в слот
 * ровно, а не мимо.
 */
test.describe("edge slots", () => {
  test("один узел разворачивается на все четыре стороны и попадает в слот", async ({
    page,
  }) => {
    await open(page, "edgeTurns");
    await page.waitForTimeout(300);

    const box = (selector: string) =>
      page.locator(selector).evaluate((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();

        return [Math.round(rect.width), Math.round(rect.height)];
      });

    // толщину назвали числом: сверху это высота, сбоку ширина
    expect(await box(".ms-edge.ms-top")).toEqual([200, 24]);
    expect(await box(".ms-edge.ms-right")).toEqual([24, 200]);

    // и повёрнутый узел занимает слот целиком, а не торчит из него
    expect(await box(".ms-edge.ms-top .ms-edge-inner")).toEqual([200, 24]);
    expect(await box(".ms-edge.ms-right .ms-edge-inner")).toEqual([24, 200]);
    expect(await box(".ms-edge.ms-left .ms-edge-inner")).toEqual([24, 200]);
  });
});

/*
 * Долю видимости считать мешала не отрисовка, а отсутствие координат: их
 * включала одна виртуализация. Теперь их включает и сама просьба следить —
 * значит переменная доходит до всех карточек, а не только до окна из них.
 */
test.describe("content visibility without a render mode", () => {
  const seen = (page: import("@playwright/test").Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map((el) =>
        Number(el.style.getPropertyValue("--ms-content-visibility")),
      ),
    );

  test("переменная приходит каждой карточке, и они все на месте", async ({
    page,
  }) => {
    await open(page, "visibilityPlain");
    await page.waitForTimeout(300);

    const values = await seen(page);

    // никто не выброшен: двенадцать карточек, у каждой своё число
    expect(values).toHaveLength(12);
    expect(values.every((v) => v >= 0 && v <= 1)).toBe(true);

    // окно 200 при шаге 70 — сверху видно целиком, внизу не видно вовсе
    expect(values[0]).toBe(1);
    expect(values[11]).toBe(0);
  });

  test("после прокрутки числа переезжают вместе с окном", async ({ page }) => {
    await open(page, "visibilityPlain");
    await page.waitForTimeout(300);

    // до самого низа: двенадцать по 70 без последнего зазора — 830 на окно 200
    await page.locator(".ms-viewport").evaluate((el) => (el.scrollTop = 630));
    await page.waitForTimeout(300);

    const values = await seen(page);

    expect(values[0]).toBe(0);
    expect(values[11]).toBe(1);
  });
});

/*
 * Размер стороны можно не называть вовсе — тогда её решает CSS. Оборвать
 * линию по ширине в этом случае нечем, и обрывает её счёт: `lines` считает
 * штуками, а не пикселями, и это ровно тот случай, ради которого его и
 * называют.
 */
test.describe("линии без заданного размера", () => {
  const at = (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const box = view.getBoundingClientRect();

      return [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map(
        (el) => {
          const r = el.getBoundingClientRect();

          return {
            x: Math.round(r.left - box.left),
            y: Math.round(r.top - box.top),
          };
        },
      );
    });

  const load = async (
    page: import("@playwright/test").Page,
    objects: Record<string, unknown>,
  ) => {
    const props = { count: 6, vary: true, size: 300, objects };

    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(props))}`,
    );
    await page.waitForTimeout(300);
  };

  test("без счёта объекты идут в одну колонку", async ({ page }) => {
    await load(page, { gap: 10 });

    const boxes = await at(page);

    expect(new Set(boxes.map((one) => one.x)).size).toBe(1);
    expect(new Set(boxes.map((one) => one.y)).size).toBe(6);
  });

  test("названный счёт разводит их по линиям", async ({ page }) => {
    await load(page, { gap: 10, lines: 3 });

    const boxes = await at(page);
    const columns = [...new Set(boxes.map((one) => one.x))].sort(
      (a, b) => a - b,
    );
    const rows = [...new Set(boxes.map((one) => one.y))].sort((a, b) => a - b);

    expect(columns).toHaveLength(3);
    expect(rows).toHaveLength(2);

    // первая тройка — первая строка, вторая — вторая
    expect(boxes.slice(0, 3).every((one) => one.y === rows[0])).toBe(true);
    expect(boxes.slice(3).every((one) => one.y === rows[1])).toBe(true);
  });

  /* и ширина у каждой линии своя: её задаёт содержимое, а не число */
  test("ширина колонок остаётся содержимого", async ({ page }) => {
    await load(page, { gap: 10, lines: 3 });

    const widths = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map((el) =>
        Math.round(el.getBoundingClientRect().width),
      ),
    );

    expect(new Set(widths).size).toBeGreaterThan(1);
  });
});

/*
 * Не названный размер отвечает на вопрос «что такое объект здесь», а не
 * молчит: вертикальный список кладёт полосу во всю ширину со своей высотой,
 * горизонтальный — колонку во всю высоту со своей шириной, страница слайдера
 * это окно. Всё это считается, поэтому `render` работает сразу — раньше на
 * первом же знакомстве он отказывался и говорил об этом в консоль.
 */
test.describe("умолчание objects.size", () => {
  const open = async (page: Page, props: Record<string, unknown>) => {
    const said: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "warning") said.push(m.text());
    });

    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(props))}`,
    );
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(320);

    return {
      said,
      ...(await page.evaluate(() => {
        const view = document.querySelector<HTMLElement>(".ms-viewport")!;
        const boxes = [
          ...document.querySelectorAll<HTMLElement>(".ms-object-box"),
        ];
        const first = boxes[0]?.getBoundingClientRect();

        return {
          drawn: boxes.length,
          w: first ? Math.round(first.width) : 0,
          h: first ? Math.round(first.height) : 0,
          maxX: Math.round(view.scrollWidth - view.clientWidth),
          maxY: Math.round(view.scrollHeight - view.clientHeight),
        };
      })),
    };
  };

  test("вертикальный: полоса во всю ширину, и окно считается", async ({
    page,
  }) => {
    const got = await open(page, {
      count: 200,
      size: [400, 300],
      render: "virtual",
    });

    expect(got.said).toEqual([]);
    expect(got.w).toBe(400);
    expect(got.drawn).toBeLessThan(60); // окно работает, а не всё подряд
    expect(got.maxY).toBeGreaterThan(0);
  });

  test("горизонтальный: колонка во всю высоту", async ({ page }) => {
    const got = await open(page, {
      count: 200,
      direction: "x",
      size: [400, 300],
      render: "virtual",
    });

    expect(got.said).toEqual([]);
    expect(got.h).toBe(300);
    expect(got.drawn).toBeLessThan(60);
    expect(got.maxX).toBeGreaterThan(0);
  });

  test("страница слайдера — это окно", async ({ page }) => {
    const got = await open(page, {
      count: 8,
      size: [400, 300],
      mode: "slider",
      controls: { bar: "@dot" },
    });

    expect(got.said).toEqual([]);
    expect([got.w, got.h]).toEqual([400, 300]);
  });

  /*
   * При `hybrid` окна поперёк нет, и оборвать линию нечем, кроме счёта — но
   * счёт у него есть и без просьбы: одна линия. Список идёт в столбец, каждый
   * объект своей ширины, и вбок скролл едет настолько, насколько широк самый
   * широкий. Не написанный `lines` раньше означал не это, а одну строку.
   */
  test("hybrid без lines: то же, что lines: 1", async ({ page }) => {
    const props = {
      count: 40,
      direction: "hybrid",
      size: [60, 300],
      vary: true,
    };

    /* размер, названный числом, и был тем случаем, где эти двое расходились */
    const bare = await open(page, { ...props, objects: { size: 120 } });
    const named = await open(page, {
      ...props,
      objects: { size: 120, lines: 1 },
    });

    expect([bare.maxX, bare.maxY]).toEqual([named.maxX, named.maxY]);
    expect(bare.maxY).toBeGreaterThan(0); // столбец, а не строка

    /* а не названный размер и так укладывался столбцом — теперь ещё и молча */
    const auto = await open(page, props);

    expect(auto.said).toEqual([]);
    expect(auto.maxX).toBeGreaterThan(0); // вбок — до самого широкого объекта
    expect(auto.maxY).toBeGreaterThan(0); // вниз — по всему списку
  });

  /* а названный счёт при `hybrid` только добавляет линий к этой одной */
  test("hybrid: названный lines разводит по линиям", async ({ page }) => {
    const props = {
      count: 40,
      direction: "hybrid",
      size: [300, 300],
      vary: true,
      objects: { lines: 3 },
    };
    const got = await open(page, props);

    expect(got.said).toEqual([]);
    expect(got.maxY).toBeGreaterThan(0);
  });

  /* и круг, которому тоже нужен счёт, заводится без единого размера */
  test("круг заводится без размера", async ({ page }) => {
    const got = await open(page, { count: 20, size: [400, 300], loop: true });

    expect(got.said).toEqual([]);
    expect(got.drawn).toBeGreaterThan(20); // лента из копий
  });
});

/*
 * `objects.lines` в обычном скролле — потолок, а не задание: линию и без него
 * есть обо что оборвать, а названное число обрывает её раньше. Просить больше,
 * чем влезает, можно — но вырасти от этого список не должен, иначе он выходит
 * за окно вбок, и вертикальная прокрутка начинает ехать поперёк себя.
 *
 * У заданного числом размера так и было. У `"auto"` счёт подменял собой место:
 * восемь колонок вставали восемью, сколько бы ни было окна.
 */
test.describe("objects.lines против окна", () => {
  const spill = async (page: Page, props: Record<string, unknown>) => {
    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(props))}`,
    );
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(320);

    return page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const frame = view.getBoundingClientRect();
      const boxes = [
        ...document.querySelectorAll<HTMLElement>(".ms-object-box"),
      ].map((el) => el.getBoundingClientRect());

      return {
        /* сколько торчит за окном по каждой стороне */
        outX: Math.round(
          Math.max(0, Math.max(...boxes.map((b) => b.right)) - frame.right),
        ),
        outY: Math.round(
          Math.max(0, Math.max(...boxes.map((b) => b.bottom)) - frame.bottom),
        ),
        maxX: Math.round(view.scrollWidth - view.clientWidth),
        maxY: Math.round(view.scrollHeight - view.clientHeight),
      };
    });
  };

  /* разнобой по сторонам нужен только там, где стороны меряются */
  const rig = (size: number | "auto") => ({
    count: 24,
    size: [300, 300],
    vary: size === "auto",
  });

  for (const size of [90, "auto"] as const)
    test(`вертикальный со ${JSON.stringify(size)} не вылезает вбок`, async ({
      page,
    }) => {
      for (const lines of [4, 8, 20]) {
        const got = await spill(page, {
          ...rig(size),
          direction: "y",
          objects: { size, gap: 10, lines },
        });

        expect(got.outX, `lines: ${lines}`).toBe(0);
        expect(got.maxX, `lines: ${lines}`).toBe(0);
        expect(got.maxY).toBeGreaterThan(0); // а ехать вниз ему по-прежнему есть куда
      }
    });

  for (const size of [90, "auto"] as const)
    test(`горизонтальный со ${JSON.stringify(size)} не вылезает вниз`, async ({
      page,
    }) => {
      for (const lines of [4, 8, 20]) {
        const got = await spill(page, {
          ...rig(size),
          direction: "x",
          objects: { size, gap: 10, lines },
        });

        expect(got.outY, `lines: ${lines}`).toBe(0);
        expect(got.maxY, `lines: ${lines}`).toBe(0);
        expect(got.maxX).toBeGreaterThan(0);
      }
    });

  /*
   * А при `hybrid` окна поперёк нет, и счёт там не потолок, а само задание:
   * шесть просили — шесть и стоят, даже если это шире окна. Ехать туда есть
   * куда, в том и смысл двух осей.
   */
  test("hybrid: названный счёт остаётся точным", async ({ page }) => {
    const got = await spill(page, {
      ...rig("auto"),
      direction: "hybrid",
      objects: { size: "auto", gap: 10, lines: 6 },
    });

    expect(got.maxX).toBeGreaterThan(0);
    expect(got.maxY).toBeGreaterThan(0);
  });
});

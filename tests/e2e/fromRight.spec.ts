import { test, expect, type Page } from "@playwright/test";

/*
 * Перебор `fromRight` в связке со всем остальным.
 *
 * Проверка тут одна и та же на все сочетания, и она же единственная честная:
 * развёрнутый список обязан вести себя как обычный, только зеркально. Значит
 * каждый набор гоняется дважды — и ответы сверяются друг с другом, а не с
 * числами, выписанными заранее. Числа пришлось бы выписывать на каждое
 * сочетание, и они бы врали ровно там, где врёт код.
 */

type Config = Record<string, unknown>;

const url = (config: Config) =>
  `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(config))}`;

/** что видно в окне и где оно стоит */
const look = (page: Page) =>
  page.evaluate(() => {
    const view = document.querySelector<HTMLElement>(".ms-viewport")!;
    const box = view.getBoundingClientRect();

    const seen = [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
      .map((el) => ({ n: el.textContent ?? "", r: el.getBoundingClientRect() }))
      .filter(
        ({ r }) =>
          r.right > box.left + 1 &&
          r.left < box.right - 1 &&
          r.bottom > box.top + 1 &&
          r.top < box.bottom - 1,
      );

    const top = seen.length ? Math.min(...seen.map(({ r }) => r.top)) : 0;

    return {
      count: seen.length,
      told: (window as unknown as { __scroll?: { left: number } }).__scroll
        ?.left,
      // верхняя строка слева направо — её и сверяем с перевёрнутой
      row: seen
        .filter(({ r }) => Math.abs(r.top - top) < 2)
        .sort((one, two) => one.r.left - two.r.left)
        .map(({ n }) => n),
      // сколько остаётся до края с той стороны, где список начинается
      lead: seen.length
        ? Math.round(
            Math.min(...seen.map(({ r }) => Math.abs(box.right - r.right))),
          )
        : -1,
      tail: seen.length
        ? Math.round(
            Math.min(...seen.map(({ r }) => Math.abs(r.left - box.left))),
          )
        : -1,
    };
  });

/*
 * Ждём, пока раскладка перестанет меняться, а не отмеряем время: под полным
 * прогоном страница успевает меньше, и проверка ловила бы середину работы.
 */
const settle = async (page: Page) => {
  let was = "";
  let still = 0;

  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(80);

    const now = await page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport");
      const wrap = document.querySelector<HTMLElement>(".ms-objects-wrapper");

      const bar = document.querySelector(".ms-slider");
      const items = bar ? [...bar.querySelectorAll(".ms-slider-item")] : [];

      return [
        document.querySelectorAll(".ms-object-box").length,
        Math.round(view?.scrollLeft ?? 0),
        Math.round(wrap?.getBoundingClientRect().width ?? 0),
        // пометка приезжает позже позиции — без неё «устоялось» приходит рано
        items.findIndex((el) => el.classList.contains("ms-active")),
        // и место первого объекта: при измеряемом размере оно едет дольше всех
        Math.round(
          document
            .querySelector<HTMLElement>(".ms-object-box")
            ?.getBoundingClientRect().left ?? 0,
        ),
      ].join(":");
    });

    /*
     * Трёх одинаковых замеров подряд: раскладку рисуют пачками, и между двумя
     * пачками она стоит неподвижно, ещё не доехав.
     */
    still = now === was ? still + 1 : 0;
    if (still >= 2 && i > 2) return;

    was = now;
  }
};

/* — набор — */

const BASE: Config = {
  count: 40,
  size: [680, 430],
  objects: { size: 170, gap: 12 },
  controls: { wheel: true },
};

const cases: { name: string; config: Config }[] = [
  { name: "по x", config: { ...BASE, direction: "x" } },
  { name: "по обеим осям", config: { ...BASE, direction: "hybrid" } },
  { name: "по y — горизонталь поперечная", config: BASE },
  {
    name: "много линий",
    config: {
      ...BASE,
      direction: "x",
      objects: { size: 170, gap: 12, lines: 20 },
    },
  },
  {
    name: "в круге",
    config: { ...BASE, direction: "x", loop: true },
  },
  {
    name: "в круге по обеим осям",
    config: { ...BASE, direction: "hybrid", loop: true, objects: { size: 170, gap: 12, lines: 3 } },
  },
  {
    name: "с окном",
    config: {
      ...BASE,
      direction: "x",
      render: { mode: "virtual", rootMargin: 200, trackVisibility: true },
    },
  },
  {
    name: "с окном и кругом",
    config: {
      ...BASE,
      direction: "x",
      loop: true,
      render: { mode: "virtual", rootMargin: 200 },
    },
  },
  {
    name: "измеряемый размер",
    config: {
      ...BASE,
      direction: "x",
      vary: true,
      objects: { size: ["auto", 120], gap: 12 },
    },
  },
  {
    name: "размер отдан CSS",
    config: { ...BASE, direction: "x", vary: true, objects: { gap: 12, lines: 3 } },
  },
  {
    name: "с полями и выравниванием",
    config: {
      ...BASE,
      direction: "x",
      wrapper: { margin: [12, 12, 12, 12], align: ["center", "center"] },
      objects: { size: 170, gap: 12, align: "center" },
    },
  },
  {
    name: "со стрелками и местом под них",
    config: {
      ...BASE,
      direction: "x",
      controls: {
        wheel: true,
        arrows: { element: "@arrow", size: 38, reserveSpace: true },
      },
    },
  },
  {
    name: "с краем",
    config: { ...BASE, direction: "x", edge: { element: "@edge", size: 42 } },
  },
  {
    name: "слайдер",
    config: {
      ...BASE,
      direction: "x",
      mode: "slider",
      objects: { size: "full" },
      controls: { wheel: true, bar: "@dot" },
    },
  },
  {
    name: "переставленный порядок",
    config: {
      ...BASE,
      direction: "x",
      objects: { size: 170, gap: 12, lines: 4, order: "column" },
    },
  },
  {
    name: "весь набор разом",
    config: {
      count: 40,
      size: [680, 430],
      direction: "x",
      objects: { size: 170, gap: 12, lines: 20, align: "start", order: "row" },
      wrapper: { align: ["center", "center"], margin: [12, 12, 12, 12] },
      edge: { element: "@edge", size: 42 },
      controls: {
        wheel: { changeDirection: false },
        drag: true,
        keys: { mode: "step" },
        bar: { element: "@thumb", edgeGap: [8, 8], trackGap: [8, 8], thumbMinSize: 30 },
        arrows: { element: "@arrow", size: 38, reserveSpace: true },
      },
      render: { mode: "virtual", rootMargin: 200, trackVisibility: true },
      loop: true,
      duration: 220,
    },
  },
];

/* — сама проверка — */

for (const { name, config } of cases)
  test(name, async ({ page }) => {
    const noise: string[] = [];

    page.on("pageerror", (err) => noise.push(`исключение: ${err.message}`));
    page.on("console", (msg) => {
      const text = msg.text();

      if (msg.type() === "error" && !text.includes("[MS "))
        noise.push(`console.error: ${text}`);
    });

    await page.goto(url({ ...config, fromRight: true }));
    await settle(page);
    const right = await look(page);

    await page.goto(url(config));
    await settle(page);
    const left = await look(page);

    expect(noise, "консоль").toEqual([]);

    // рисуется столько же
    expect(left.count, `${name}: обычный список пуст`).toBeGreaterThan(0);
    expect(right.count, `${name}: развёрнутый список пуст`).toBe(left.count);

    // и то же самое, только наоборот
    expect(right.row, `${name}: порядок не зеркальный`).toEqual(
      [...left.row].reverse(),
    );

    /*
     * И открывается с того же места: у обычного списка первый объект отстоит
     * от левого края ровно на столько же, на сколько у развёрнутого от
     * правого. Это ловит и потерянное поле, и уехавшее открытие.
     *
     * Спрашиваем только там, где по горизонтали едут: у вертикального списка
     * она поперечная, и где стоит короткая строка целиком — дело
     * `wrapper.align`, а не разворота.
     */
    if (config.direction === "x" || config.direction === "hybrid")
      expect(right.lead, `${name}: начало списка встало не у своего края`).toBe(
        left.tail,
      );
  });

/*
 * Бегунок показывает, сколько пройдено списка, а не разметки. У развёрнутого
 * списка это разные числа: разметка считает слева, список — справа. И идёт он
 * по дорожке туда же, куда чтение.
 */
test.describe("бегунок", () => {
  const RIG: Config = {
    count: 40,
    size: [680, 430],
    direction: "x",
    objects: { size: 170, gap: 12, lines: 20 },
    controls: { wheel: true, bar: { element: "@thumb", thumbMinSize: 30 } },
    render: { mode: "virtual", rootMargin: 200 },
    loop: true,
  };

  const thumb = (page: Page) =>
    page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>(".ms-bar")!;
      const el = bar.querySelector<HTMLElement>(".ms-thumb")!;
      const track = bar.getBoundingClientRect();
      const at = el.getBoundingClientRect();

      return {
        head: Math.round(at.left - track.left),
        tail: Math.round(track.right - at.right),
      };
    });

  const goTo = (page: Page, to: number) =>
    page.evaluate(
      (value) =>
        (
          window as unknown as {
            __ms: { scrollTo: (v: number, o: object) => void };
          }
        ).__ms.scrollTo(value, { duration: 0 }),
      to,
    );

  test("на начале списка стоит у своего края", async ({ page }) => {
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);
    const right = await thumb(page);

    await page.goto(url(RIG));
    await settle(page);
    const left = await thumb(page);

    // обычный прижат слева, развёрнутый — справа, и ровно так же
    expect(left.head).toBe(0);
    expect(right.tail).toBe(0);
    expect(right.head).toBe(left.tail);
  });

  test("уходит по дорожке туда же, куда чтение", async ({ page }) => {
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);
    await goTo(page, 600);
    await page.waitForTimeout(250);
    const right = await thumb(page);

    await page.goto(url(RIG));
    await settle(page);
    await goTo(page, 600);
    await page.waitForTimeout(250);
    const left = await thumb(page);

    // одно и то же место списка — одно и то же место дорожки, зеркально
    expect(left.head).toBeGreaterThan(0);
    expect(right.tail).toBe(left.head);
  });

  /* и сам он ведёт список туда, куда его тянут */
  test("тянется в ту же сторону, что и список", async ({ page }) => {
    const row = (page: Page) =>
      page.evaluate(() => {
        const view = document.querySelector<HTMLElement>(".ms-viewport")!;
        const box = view.getBoundingClientRect();
        const seen = [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
          .map((el) => ({ n: el.textContent ?? "", r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.right > box.left + 1 && r.left < box.right - 1);
        const top = Math.min(...seen.map(({ r }) => r.top));

        return seen
          .filter(({ r }) => Math.abs(r.top - top) < 2)
          .sort((one, two) => one.r.left - two.r.left)
          .map(({ n }) => n);
      });

    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);

    const before = await row(page);
    const grip = (await page.locator(".ms-thumb").first().boundingBox())!;

    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      grip.x + grip.width / 2 - 80,
      grip.y + grip.height / 2,
      { steps: 6 },
    );
    await page.mouse.up();
    await page.waitForTimeout(350);

    const after = await row(page);

    // начало списка справа: тянем влево — идём вперёд, номера растут
    expect(Number(after[after.length - 1])).toBeGreaterThan(
      Number(before[before.length - 1]),
    );
  });
});

/*
 * Сторону чтения меняют и на живом скролле. Позиция в разметке при этом
 * остаётся прежней, а значить начинает противоположное: читавший начало
 * списка оказывался в его конце, а точка прогресса загоралась чужая.
 */
test.describe("переключение на живом скролле", () => {
  const RIG: Config = {
    count: 40,
    size: [680, 430],
    direction: "hybrid",
    mode: "slider",
    objects: { size: 170, gap: 12, lines: 20 },
    wrapper: { margin: [12, 12, 12, 12] },
    controls: { wheel: true, bar: "@dot" },
    render: { mode: "virtual", rootMargin: 200 },
    loop: true,
  };

  const look = (page: Page) =>
    page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const box = view.getBoundingClientRect();
      const bar = document.querySelector<HTMLElement>(".ms-slider")!;
      const items = [...bar.querySelectorAll(".ms-slider-item")];

      return {
        at: Math.round(view.scrollLeft),
        active: items.findIndex((el) => el.classList.contains("ms-active")),
        row: [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
          .map((el) => ({ n: el.textContent ?? "", r: el.getBoundingClientRect() }))
          .filter(
            ({ r }) =>
              r.right > box.left + 1 &&
              r.left < box.right - 1 &&
              r.bottom > box.top + 1 &&
              r.top < box.bottom - 1,
          )
          .sort((one, two) => one.r.left - two.r.left)
          .map(({ n }) => n),
      };
    });

  const set = async (page: Page, props: Config) => {
    await page.evaluate(
      (next) =>
        (window as unknown as { __set: (v: string) => void }).__set(next),
      JSON.stringify(props),
    );
    await settle(page);
  };

  const switched = (config: Config) =>
    `/?scenario=crashSwitch&props=${encodeURIComponent(JSON.stringify(config))}`;

  test("включение приводит туда же, куда приводит загрузка", async ({
    page,
  }) => {
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);

    const fresh = await look(page);

    await page.goto(switched(RIG));
    await settle(page);
    await set(page, { ...RIG, fromRight: true });

    const toggled = await look(page);

    expect(toggled.at).toBe(fresh.at);
    expect(toggled.active).toBe(fresh.active);
    expect(toggled.row).toEqual(fresh.row);
  });

  /* и обратно: читавший начало списка остаётся на его начале */
  test("выключение возвращает к тому же месту списка", async ({ page }) => {
    await page.goto(switched(RIG));
    await settle(page);

    const before = await look(page);

    await set(page, { ...RIG, fromRight: true });
    await set(page, RIG);

    const after = await look(page);

    expect(after.at).toBe(before.at);
    expect(after.active).toBe(before.active);
    expect(after.row).toEqual(before.row);
  });
});

/* Команды говорят на языке списка, а не разметки — в любом сочетании. */
for (const { name, config } of cases.slice(0, 8))
  test(`${name}: scrollTo говорит о списке`, async ({ page }) => {
    const goTo = (p: Page, to: number) =>
      p.evaluate(
        (value) =>
          (
            window as unknown as {
              __ms: { scrollTo: (v: number, o: object) => void };
            }
          ).__ms.scrollTo(value, { duration: 0 }),
        to,
      );

    await page.goto(url({ ...config, fromRight: true }));
    await settle(page);
    await goTo(page, 340);
    await page.waitForTimeout(250);
    const right = await look(page);

    await page.goto(url(config));
    await settle(page);
    await goTo(page, 340);
    await page.waitForTimeout(250);
    const left = await look(page);

    expect(right.row, `${name}: одно число — разные объекты`).toEqual(
      [...left.row].reverse(),
    );
    expect(right.told).toBe(left.told);
  });

/*
 * Слайдер считает страницами, а сетка страниц привязана к началу. У списка,
 * идущего справа, начало на другом конце, и сетка по разметке с ней не
 * совпадает: шаг туда и обратно возвращал не на то же место, прилипание
 * уводило на страницу назад, а точка помечалась чужая.
 */
test.describe("слайдер", () => {
  const RIG: Config = {
    count: 12,
    size: [400, 200],
    direction: "x",
    mode: "slider",
    objects: { size: "full" },
    controls: { wheel: true, drag: true, bar: "@dot" },
  };

  const state = (page: Page) =>
    page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const box = view.getBoundingClientRect();
      const dots = [...document.querySelectorAll(".ms-slider-item")];

      const seen = [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
        .map((el) => ({ n: el.textContent ?? "", r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.right > box.left + 1 && r.left < box.right - 1)
        .sort((one, two) => one.r.left - two.r.left);

      return {
        row: seen.map(({ n }) => n),
        active: dots.findIndex((el) => el.classList.contains("ms-active")),
        // расстояние от начала списка до своего края окна
        lead: seen.length
          ? Math.round(
              Math.min(...seen.map(({ r }) => Math.abs(box.right - r.right))),
            )
          : -1,
        tail: seen.length
          ? Math.round(
              Math.min(...seen.map(({ r }) => Math.abs(r.left - box.left))),
            )
          : -1,
      };
    });

  const step = async (page: Page, side: string) => {
    await page.evaluate(
      (to) =>
        (window as unknown as { __ms: { step: (s: string) => void } }).__ms.step(
          to,
        ),
      side,
    );
    await page.waitForTimeout(450);
  };

  test("шаг туда и обратно возвращает ровно на место", async ({ page }) => {
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);

    const before = await state(page);

    await step(page, "left");
    await step(page, "right");

    const after = await state(page);

    expect(after.row).toEqual(before.row);
    expect(after.lead).toBe(before.lead);
  });

  /*
   * И на широкой ленте в круге: там оборот делится на страницы нацело, но
   * начало списка на эту сетку не попадает — шаг обратно возвращал короче на
   * четверть страницы, и первая карточка оказывалась подрезана.
   */
  test("шаг туда и обратно в круге тоже возвращает на место", async ({
    page,
  }) => {
    const WIDE: Config = {
      count: 40,
      size: [680, 430],
      direction: "hybrid",
      mode: "slider",
      objects: { size: 170, gap: 12, lines: 20 },
      wrapper: { margin: [12, 12, 12, 12] },
      controls: { wheel: true, bar: "@dot" },
      render: { mode: "virtual", rootMargin: 200 },
      loop: true,
      fromRight: true,
    };

    await page.goto(url(WIDE));
    await settle(page);

    const before = await state(page);

    await step(page, "left");
    await step(page, "right");

    const after = await state(page);

    expect(after.row).toEqual(before.row);
    expect(after.lead).toBe(before.lead);
  });

  test("на начале списка помечена первая точка", async ({ page }) => {
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);

    expect((await state(page)).active).toBe(0);
  });

  /*
   * И стоит она у своего края: полоса страниц идёт туда же, куда список, так
   * что первая страница развёрнутого — правая точка, а не левая.
   */
  test("первая точка стоит у того же края, где начинается список", async ({
    page,
  }) => {
    const side = (page: Page) =>
      page.evaluate(() => {
        const bar = document.querySelector<HTMLElement>(".ms-slider")!;
        const items = [...bar.querySelectorAll<HTMLElement>(".ms-slider-item")];
        const at = items.findIndex((el) => el.classList.contains("ms-active"));
        const box = bar.getBoundingClientRect();
        const on = items[at].getBoundingClientRect();

        return on.left - box.left < box.width / 2 ? "left" : "right";
      });

    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);

    expect(await side(page)).toBe("right");

    await page.goto(url(RIG));
    await settle(page);

    expect(await side(page)).toBe("left");
  });

  test("точка ведёт на ту же страницу, что и в обычном списке", async ({
    page,
  }) => {
    const clickDot = async (p: Page) => {
      await p.setViewportSize({ width: 1000, height: 800 });

      const dot = (await p.locator(".ms-slider-item").nth(2).boundingBox())!;

      await p.mouse.move(dot.x + dot.width / 2, dot.y + dot.height / 2);
      await p.mouse.down();
      await p.mouse.up();
      await p.waitForTimeout(500);
    };

    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);
    await clickDot(page);
    const right = await state(page);

    await page.goto(url(RIG));
    await settle(page);
    await clickDot(page);
    const left = await state(page);

    expect(left.active).toBe(2);
    expect(right.active).toBe(left.active);
    expect(right.row).toEqual([...left.row].reverse());
  });

  /*
   * Прицел по бару брал страницу разметки, а пометка загоралась на странице
   * списка: движение шло куда просили, а подсвечивалась чужая точка.
   */
  test("протаскивание по бару и пометка говорят об одном", async ({ page }) => {
    const dragBar = async (p: Page, to: number) => {
      await p.setViewportSize({ width: 1000, height: 800 });

      const bar = (await p.locator(".ms-slider").boundingBox())!;

      await p.mouse.move(bar.x + bar.width * 0.05, bar.y + bar.height / 2);
      await p.mouse.down();
      await p.mouse.move(bar.x + bar.width * to, bar.y + bar.height / 2, {
        steps: 10,
      });
      await p.mouse.up();
      await p.waitForTimeout(600);
    };

    /*
     * Полоса развёрнута вместе со списком, поэтому одну и ту же страницу
     * спрашивают с зеркальных концов дорожки: у обычного списка это пятая
     * часть слева, у развёрнутого — та же пятая часть справа.
     */
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);
    await dragBar(page, 0.2);
    const right = await state(page);

    await page.goto(url(RIG));
    await settle(page);
    await dragBar(page, 0.8);
    const left = await state(page);

    expect(left.active).toBeGreaterThan(0);
    expect(right.active).toBe(left.active);
    expect(right.row).toEqual([...left.row].reverse());
  });

  /* и туда-обратно по бару возвращает ровно на место */
  test("протаскивание туда и назад возвращает на место", async ({ page }) => {
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForTimeout(200);

    const before = await state(page);
    const bar = (await page.locator(".ms-slider").boundingBox())!;

    // у развёрнутого списка начало дорожки — её правый конец
    const dragTo = async (from: number, to: number) => {
      await page.mouse.move(bar.x + bar.width * from, bar.y + bar.height / 2);
      await page.mouse.down();
      await page.mouse.move(bar.x + bar.width * to, bar.y + bar.height / 2, {
        steps: 10,
      });
      await page.mouse.up();
      await page.waitForTimeout(600);
    };

    await dragTo(0.95, 0.5);
    await dragTo(0.5, 0.99);

    const after = await state(page);

    expect(after.active).toBe(before.active);
    expect(after.row).toEqual(before.row);
    expect(after.lead).toBe(before.lead);
  });

  test("прилипание уходит на страницу вперёд, а не назад", async ({ page }) => {
    await page.goto(url({ ...RIG, fromRight: true }));
    await settle(page);

    const view = (await page.locator(".ms-viewport").boundingBox())!;
    const cx = view.x + view.width / 2;
    const cy = view.y + view.height / 2;

    // начало справа: тянем содержимое вправо — идём вперёд по списку
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(700);

    expect((await state(page)).active).toBe(1);
  });
});

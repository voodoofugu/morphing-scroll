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

const settle = (page: Page) => page.waitForTimeout(450);

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

      if (msg.type() === "error" && !text.includes("morph-scroll"))
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

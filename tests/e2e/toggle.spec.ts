import { test, expect, type Page } from "@playwright/test";

/*
 * Пропс, включённый на живом скролле, обязан приводить туда же, куда приводит
 * загрузка с ним. Разница между этими двумя состояниями — это память о
 * прошлом наборе: пересчитали не всё, и остаток прежнего расчёта продолжает
 * жить под новыми пропсами. Снаружи такое выглядит как «после обновления
 * страницы всё в порядке» и потому почти не ловится глазами.
 *
 * Проверяем оба направления — включение и выключение — и оба состояния: сразу
 * после смены и после того, как скролл покатали. Замерший скролл и скролл с
 * чужим шагом одинаково незаметны на снимке раскладки.
 */

type Config = Record<string, unknown>;

const url = (config: Config) =>
  `/?scenario=crashSwitch&props=${encodeURIComponent(JSON.stringify(config))}`;

const isPlain = (value: unknown): value is Config =>
  !!value && typeof value === "object" && !Array.isArray(value);

const merge = (base: Config, patch: Config): Config => {
  const out: Config = { ...base };

  for (const [key, value] of Object.entries(patch))
    out[key] =
      isPlain(value) && isPlain(out[key])
        ? merge(out[key] as Config, value)
        : value;

  return out;
};

/* — что снимаем — */

/*
 * Всё за один заход в браузер: между двумя вопросами проходит кадр, и ответы
 * оказались бы из разных состояний. Координаты — от окна прокрутки, чтобы
 * поля страницы не попадали в сравнение.
 */
const look = (page: Page, onlyVisible = false) =>
  page.evaluate((onlyVisible: boolean) => {
    const view = document.querySelector<HTMLElement>(".ms-viewport");

    if (!view) return { missing: true as const };

    const frame = view.getBoundingClientRect();
    const px = (value: number) => Math.round(value);
    const rel = (r: DOMRect) =>
      [px(r.left - frame.left), px(r.top - frame.top), px(r.width), px(r.height)].join(
        ",",
      );

    const boxes = [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
      .map((el) => ({ n: el.textContent ?? "", r: el.getBoundingClientRect() }))
      .filter(
        ({ r }) =>
          !onlyVisible ||
          (r.right > frame.left + 1 &&
            r.left < frame.right - 1 &&
            r.bottom > frame.top + 1 &&
            r.top < frame.bottom - 1),
      )
      /*
       * По месту на экране, а не по порядку в разметке: один и тот же вид
       * могут собрать разным порядком узлов, и сравнивать надо то, что видно.
       */
      .sort(
        (one, two) =>
          one.r.top - two.r.top || one.r.left - two.r.left ||
          one.n.localeCompare(two.n),
      )
      .map(({ n, r }) => `${n}@${rel(r)}`);

    const wrap = document.querySelector<HTMLElement>(".ms-objects-wrapper");
    const bar = document.querySelector<HTMLElement>(".ms-bar");
    const thumb = bar?.querySelector<HTMLElement>(".ms-thumb");
    const slider = document.querySelector<HTMLElement>(".ms-slider");
    const items = slider ? [...slider.querySelectorAll(".ms-slider-item")] : [];

    return {
      missing: false as const,
      at: `${px(view.scrollLeft)}:${px(view.scrollTop)}`,
      room: `${px(view.scrollWidth - view.clientWidth)}:${px(
        view.scrollHeight - view.clientHeight,
      )}`,
      window: `${px(frame.width)}:${px(frame.height)}`,
      wrap: wrap ? rel(wrap.getBoundingClientRect()) : null,
      boxes,
      bar: bar ? rel(bar.getBoundingClientRect()) : null,
      thumb: thumb ? rel(thumb.getBoundingClientRect()) : null,
      dots: items.length,
      active: items.findIndex((el) => el.classList.contains("ms-active")),
      edges: [...document.querySelectorAll<HTMLElement>(".ms-edge")].map(
        (el) =>
          `${el.className}|${rel(el.getBoundingClientRect())}|${el.style.getPropertyValue(
            "--ms-edge-visibility",
          )}`,
      ),
    };
  }, onlyVisible);

type Shot = Awaited<ReturnType<typeof look>>;

/*
 * Раскладку рисуют пачками, и между двумя соседними замерами она успевает
 * доехать. Ждём трёх одинаковых подряд, а не одного: середина работы похожа
 * на её конец ровно настолько, чтобы обмануть один замер.
 */
const settle = async (page: Page) => {
  let was = "";
  let still = 0;

  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(80);

    const now = await page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport");
      const wrap = document.querySelector<HTMLElement>(".ms-objects-wrapper");
      const boxes = [
        ...document.querySelectorAll<HTMLElement>(".ms-object-box"),
      ];
      const bar = document.querySelector(".ms-slider");
      const items = bar ? [...bar.querySelectorAll(".ms-slider-item")] : [];
      const box = wrap?.getBoundingClientRect();

      /*
       * Не только первый: он часто стоит в нуле и не двигается вовсе, а
       * остальные в это время ещё едут — «устоялось» приходило раньше, чем
       * доезжала раскладка.
       */
      const where = (el?: HTMLElement) => {
        const r = el?.getBoundingClientRect();

        return `${Math.round(r?.left ?? 0)},${Math.round(r?.top ?? 0)}`;
      };

      return [
        boxes.length,
        Math.round(view?.scrollLeft ?? 0),
        Math.round(view?.scrollTop ?? 0),
        Math.round(box?.width ?? 0),
        Math.round(box?.height ?? 0),
        where(boxes[0]),
        where(boxes[boxes.length >> 1]),
        where(boxes[boxes.length - 1]),
        items.findIndex((el) => el.classList.contains("ms-active")),
      ].join(":");
    });

    if (now === was && ++still >= 2) return;
    if (now !== was) still = 0;

    was = now;
  }
};

const open = async (page: Page, config: Config) => {
  await page.goto(url(config));
  // наведение меняет вид бара — во всех проходах указатель должен стоять там же
  await page.mouse.move(0, 0);
  await settle(page);
};

const set = async (page: Page, config: Config) => {
  await page.evaluate(
    (next) => (window as unknown as { __set: (v: string) => void }).__set(next),
    JSON.stringify(config),
  );
  await settle(page);
};

/* Один и тот же жест во всех проходах: сравнивают не движение, а его итог. */
const roll = async (page: Page) => {
  const box = await page.locator(".ms-viewport").boundingBox();

  if (!box) return;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(120, 240);
  await settle(page);
};

/* — наборы и переключатели — */

const PLAIN: Config = {
  count: 14,
  size: [300, 220],
  objects: { size: [80, 60], gap: 10 },
  controls: { wheel: true, bar: "@thumb" },
  duration: 40,
};

const MIRROR: Config = {
  count: 14,
  size: [300, 220],
  direction: "x",
  fromRight: true,
  objects: { size: [80, 60], gap: 10, lines: 2 },
  controls: { wheel: true, bar: "@thumb" },
  duration: 40,
};

const CIRCLE: Config = {
  count: 20,
  size: [300, 220],
  direction: "hybrid",
  loop: true,
  objects: { size: [80, 60], gap: 10, lines: 3 },
  render: { mode: "virtual" },
  controls: { wheel: true, bar: "@thumb" },
  duration: 40,
};

/*
 * `seen` — про тех, кто копит увиденное. `render: "lazy"` держит всё, что
 * когда-либо попадало в окно, и потому зависит от пройденного пути: загрузка
 * круга успевает моргнуть началом ленты, прежде чем встать на среднюю копию,
 * а включение на ходу — нет. Смонтированное за окном тут разное законно;
 * сверяем то, что на экране.
 */
type Toggle = { patch: Config; seen?: true };

const PLAIN_TOGGLES: Toggle[] = [
  { patch: { fromRight: true } },
  { patch: { direction: "x" } },
  { patch: { direction: "hybrid" } },
  { patch: { loop: true } },
  { patch: { mode: "slider" } },
  { patch: { mode: "sliderMenu" } },
  { patch: { render: "virtual" } },
  { patch: { render: "lazy" } },
  { patch: { trackVisibility: true } },
  { patch: { render: { mode: "virtual", rootMargin: 40, deferLoadOnScroll: true } } },
  { patch: { objects: { size: "full" } } },
  { patch: { objects: { size: "auto" }, vary: true } },
  { patch: { objects: { size: "firstChild" }, vary: true } },
  { patch: { objects: { lines: 1 } } },
  { patch: { objects: { lines: 5 } } },
  { patch: { objects: { gap: 40 } } },
  { patch: { objects: { gap: [4, 30] } } },
  { patch: { objects: { align: "center" } } },
  { patch: { objects: { align: "end" } } },
  { patch: { objects: { order: "column" } } },
  { patch: { wrapper: { margin: 20 } } },
  { patch: { wrapper: { margin: [10, 20, 30, 40] } } },
  { patch: { wrapper: { minSize: 500 } } },
  { patch: { wrapper: { minSize: 500, align: "center" } } },
  { patch: { controls: { wheel: false } } },
  { patch: { controls: { wheel: { changeDirection: true } } } },
  { patch: { controls: { drag: true } } },
  { patch: { controls: { keys: false } } },
  { patch: { controls: { keys: { mode: "pan", step: 40 } } } },
  { patch: { controls: { bar: true } } },
  { patch: {
    controls: {
      bar: {
        element: "@thumb",
        reverse: true,
        edgeGap: -4,
        trackGap: 6,
        thumbMinSize: 24,
        showOnHover: true,
      },
    },
  } },
  { patch: { controls: { arrows: { element: "@arrow", size: 30 } } } },
  { patch: { controls: { arrows: { element: "@arrow", size: 30, reserveSpace: true } } } },
  { patch: { edge: true } },
  { patch: { edge: { element: "@edge", size: 20 } } },
  { patch: { suspending: true } },
  { patch: { autoScrollOnDrag: true } },
  { patch: { duration: 400 } },
  { patch: { size: 200 } },
  { patch: { size: [400, 300] } },
  { patch: { count: 5 } },
  { patch: { count: 30 } },
];

const MIRROR_TOGGLES: Toggle[] = [
  { patch: { fromRight: false } },
  { patch: { loop: true } },
  { patch: { mode: "slider" } },
  { patch: { mode: "sliderMenu" } },
  { patch: { direction: "hybrid" } },
  { patch: { render: "virtual" } },
  { patch: { objects: { lines: 1 } } },
  { patch: { objects: { order: "column" } } },
  { patch: { objects: { align: "end" } } },
  { patch: { controls: { arrows: { element: "@arrow", size: 30 } } } },
  { patch: { wrapper: { margin: 20 } } },
];

const CIRCLE_TOGGLES: Toggle[] = [
  { patch: { fromRight: true } },
  { patch: { loop: false } },
  { patch: { mode: "slider" } },
  { patch: { render: "lazy" }, seen: true },
  { patch: { objects: { lines: 2 } } },
  { patch: { objects: { gap: 30 } } },
  { patch: { controls: { arrows: { element: "@arrow", size: 30 } } } },
  { patch: { edge: { element: "@edge", size: 20 } } },
];

const name = (patch: Config) =>
  JSON.stringify(patch).replace(/"/g, "").slice(0, 70);

/* — сама проверка — */

const same = (live: Shot, fresh: Shot, where: string) => {
  expect(live, `${where}: прокрутка не отрисовалась`).not.toEqual({
    missing: true,
  });
  expect(live, where).toEqual(fresh);
};

const compare = async (page: Page, base: Config, { patch, seen }: Toggle) => {
  const on = merge(base, patch);
  const shot = () => look(page, seen);

  await open(page, on);

  const freshOn = await shot();

  await roll(page);

  const freshOnRolled = await shot();

  await open(page, base);

  const freshOff = await shot();

  await roll(page);

  const freshOffRolled = await shot();

  // включение на ходу
  await open(page, base);
  await set(page, on);
  same(await shot(), freshOn, "включили на ходу");
  await roll(page);
  same(await shot(), freshOnRolled, "включили на ходу и покатали");

  // и выключение
  await open(page, on);
  await set(page, base);
  same(await shot(), freshOff, "выключили на ходу");
  await roll(page);
  same(await shot(), freshOffRolled, "выключили на ходу и покатали");
};

const suite = (title: string, base: Config, toggles: Toggle[]) =>
  test.describe(title, () => {
    for (const toggle of toggles)
      test(name(toggle.patch), async ({ page }) => {
        await compare(page, base, toggle);
      });
  });

/*
 * Колесо ходит по одному пути, а стрелка и палец — по своим: у них своя
 * арифметика страницы и свой перевод позиции в список. Сменённая сторона
 * чтения должна дойти и до них, иначе шаг после переключения считается по
 * прежней стороне — на глаз это «стрелка ведёт не туда».
 */
test.describe("после смены стороны работают и руки", () => {
  const step = async (page: Page) => {
    // у развёрнутого списка вперёд — это влево
    await page.locator(".ms-arrow-box.ms-left").click();
    await settle(page);
  };

  const drag = async (page: Page) => {
    const box = (await page.locator(".ms-viewport").boundingBox())!;
    const y = box.y + box.height / 2;
    // вперёд у развёрнутого списка тянут вправо: следующее лежит слева
    const from = box.x + 20;
    const by = (box.width - 40) / 8;

    await page.mouse.move(from, y);
    await page.mouse.down();

    for (let i = 1; i <= 8; i++) await page.mouse.move(from + i * by, y);

    await page.mouse.up();
    await settle(page);
  };

  /*
   * Слайдер: у него страница — своя арифметика, и именно ей сторона чтения
   * нужна на каждом шагу. В простой прокрутке палец просто везёт содержимое,
   * и подменить в ней нечего.
   */
  const HANDS: Config = {
    count: 14,
    size: [300, 220],
    direction: "x",
    mode: "slider",
    objects: { size: [100, 60], gap: 10, lines: 2 },
    controls: {
      wheel: true,
      drag: true,
      bar: "@dot",
      // место под стрелки своё: иначе они лежат поверх содержимого и
      // перехватывают нажатие у протаскивания
      arrows: { element: "@arrow", size: 30, reserveSpace: true },
    },
    duration: 40,
  };

  const on = merge(HANDS, { fromRight: true });

  /* прицел по полосе страниц: доля пути по ней читается со стороны чтения */
  const aim = async (page: Page) => {
    const bar = (await page.locator(".ms-slider").boundingBox())!;
    const y = bar.y + bar.height / 2;

    await page.mouse.move(bar.x + 4, y);
    await page.mouse.down();
    await page.mouse.move(bar.x + bar.width * 0.4, y);
    await page.mouse.move(bar.x + bar.width * 0.6, y);
    await page.mouse.up();
    await settle(page);
  };

  for (const [title, work] of [
    ["стрелка", step],
    ["протаскивание", drag],
    ["полоса страниц", aim],
  ] as const)
    test(title, async ({ page }) => {
      await open(page, on);

      const still = await look(page);

      await work(page);

      const fresh = await look(page);

      // жест, ничего не сдвинувший, сравнивал бы покой с покоем
      expect(fresh, `${title}: ничего не сдвинулось`).not.toEqual(still);

      await open(page, HANDS);
      await set(page, on);
      await work(page);

      same(await look(page), fresh, title);
    });
});

suite("обычный список", PLAIN, PLAIN_TOGGLES);
suite("список справа налево", MIRROR, MIRROR_TOGGLES);
suite("круг по обеим осям", CIRCLE, CIRCLE_TOGGLES);

/*
 * Два пропса законно ведут себя иначе, и это записано в их описании: оба
 * говорят о начале, а не о правиле на каждый кадр. Сравнивать их с загрузкой
 * нечего — проверяем ровно обещанное.
 */

test("initialPosition после загрузки уже ничего не двигает", async ({
  page,
}) => {
  await open(page, PLAIN);

  const before = await look(page);

  await set(page, merge(PLAIN, { initialPosition: 120 }));

  expect((await look(page)).at, "позиция сдвинулась").toBe(
    (before as { at: string }).at,
  );
});

/*
 * Правило это про конец: пока читающий стоит у конца — держит его там, и
 * поэтому включённое на нетронутом скролле уводит в конец, как и загрузка с
 * ним. А вот ушедшего от конца оно уже не трогает.
 */
test("stickToEnd не выдёргивает того, кто ушёл от конца", async ({ page }) => {
  const long = merge(PLAIN, { count: 40 });

  await open(page, long);
  await roll(page); // с места сдвинулись, но до конца далеко

  const before = await look(page);

  if (before.missing) throw new Error("прокрутка не отрисовалась");

  const [, top] = before.at.split(":").map(Number);
  const [, room] = before.room.split(":").map(Number);

  expect(room - top, "докатились до конца — проверять нечего").toBeGreaterThan(
    50,
  );

  await set(page, merge(long, { stickToEnd: true }));

  expect((await look(page)).at, "позиция сдвинулась").toBe(before.at);
});

/* но у конца — держит: содержимое выросло, и прокрутка идёт за ним */
test("stickToEnd держит конец, когда содержимое растёт", async ({ page }) => {
  const stuck = merge(PLAIN, { stickToEnd: true });

  await open(page, stuck);
  await set(page, merge(stuck, { count: 30 }));

  const now = await look(page);

  if (now.missing) throw new Error("прокрутка не отрисовалась");

  const [, top] = now.at.split(":").map(Number);
  const [, room] = now.room.split(":").map(Number);

  expect(room - top, "отстали от конца").toBeLessThan(2);
});

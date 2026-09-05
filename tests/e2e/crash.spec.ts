import { test, expect, type Page } from "@playwright/test";

/*
 * Перебор сочетаний. Остальные файлы проверяют по одному заранее выбранному
 * поведению, и в этом их слабость: они смотрят туда, куда кто-то догадался
 * посмотреть. Здесь наоборот — набор собирается перебором, а проверяются не
 * числа, а правила, которые обязаны держаться при любом сочетании: объекты не
 * налезают друг на друга, размеры остаются числами, активная точка одна,
 * бегунок не выходит за дорожку, консоль молчит.
 *
 * Набор задан списком, а не случайностью: упавшее сочетание должно падать и в
 * следующий раз.
 */

type Config = Record<string, unknown>;

const url = (config: Config) =>
  `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(config))}`;

/* — что перебираем — */

const DIRECTIONS = ["y", "x", "hybrid"] as const;
const MODES = [undefined, "slider", "sliderMenu"] as const;
const SIZES: unknown[] = [60, "auto", "full", "firstChild", [60, "auto"]];

/*
 * Набор строится обходом, а не случайностью: каждое измерение прокручивается
 * своим шагом, поэтому пары «направление + режим», «режим + размер» и так
 * далее встречаются все, а список остаётся коротким.
 */
const build = () => {
  const out: { name: string; config: Config }[] = [];

  for (let i = 0; i < 72; i++) {
    const direction = DIRECTIONS[i % 3];
    const mode = MODES[Math.floor(i / 3) % 3];
    const size = SIZES[Math.floor(i / 2) % SIZES.length];
    const loop = i % 4 === 1 || i % 4 === 2;
    const virtual = i % 5 === 0 ? "virtual" : i % 5 === 3 ? "lazy" : undefined;
    const lines = i % 6 === 0 ? 2 : i % 6 === 4 ? 3 : undefined;
    const align = (["start", "center", "end"] as const)[Math.floor(i / 5) % 3];

    const config: Config = {
      count: i % 7 === 3 ? 5 : 12,
      vary: size === "auto" || (Array.isArray(size) && size.includes("auto")),
      size: direction === "y" ? 300 : [300, 220],
      direction,
      ...(mode && { mode }),
      ...(loop && { loop }),
      ...(!loop && i % 13 === 4 && { stickToEnd: true }),
      ...(i % 10 === 6 && { initialPosition: 120 }),
      ...(i % 12 === 9 && { autoScrollOnDrag: true }),
      ...(i % 14 === 11 && { suspending: true }),
      objects: {
        size,
        gap: i % 3 === 0 ? 10 : [8, 12],
        ...(lines && { lines }),
        ...(i % 4 !== 2 && { align }),
        ...(i % 9 === 7 && { direction: "column" }),
      },
      render: {
        ...(virtual && { mode: virtual }),
        ...(i % 4 === 0 && { trackVisibility: true }),
        ...(i % 8 === 2 && { rootMargin: 40, deferLoadOnScroll: true }),
      },
      controls: {
        wheel: i % 7 === 5 ? { changeDirection: true } : true,
        drag: i % 2 === 0,
        keys:
          i % 6 === 1
            ? { mode: "pan", step: 40 }
            : i % 6 === 5
              ? { mode: "focus" }
              : i % 3 === 1,
        bar:
          i % 11 === 3
            ? {
                element: mode ? "@dot" : "@thumb",
                edgeGap: -4,
                trackGap: 6,
                reverse: true,
                showOnHover: true,
                thumbMinSize: 24,
              }
            : mode
              ? "@dot"
              : "@thumb",
        arrows: { element: "@arrow", size: 30, reserveSpace: i % 8 === 6 },
      },
      ...(i % 5 === 2 && { edge: { element: "@edge", size: 20 } }),
      ...(i % 11 === 6 && {
        wrapper: { margin: 12, align: "center", minSize: 400 },
      }),
      duration: 40,
    };

    out.push({
      name: `${direction}/${mode ?? "scroll"}/${JSON.stringify(size)}${
        loop ? "/loop" : ""
      }${virtual ? `/${virtual}` : ""}${lines ? `/cross${lines}` : ""}#${i}`,
      config,
    });
  }

  return out;
};

/* Края набора: не сочетания, а положения, где считать почти нечего. */
const EDGES: { name: string; config: Config }[] = [
  {
    name: "нет детей",
    config: { count: 0, size: 300, controls: { wheel: true, bar: "@thumb" } },
  },
  {
    name: "один ребёнок в круге",
    config: {
      count: 1,
      size: 300,
      loop: true,
      mode: "slider",
      controls: { wheel: true, bar: "@dot", arrows: { element: "@arrow" } },
      objects: { size: 100 },
    },
  },
  {
    name: "контент короче окна",
    config: {
      count: 2,
      size: 300,
      objects: { size: 50 },
      controls: { wheel: true, drag: true, bar: "@thumb" },
      edge: true,
    },
  },
  {
    name: "зазор больше объекта",
    config: {
      count: 6,
      size: 300,
      objects: { size: 20, gap: 120 },
      controls: { wheel: true, bar: "@thumb" },
    },
  },
  {
    name: "рядов больше, чем детей",
    config: {
      count: 3,
      size: [300, 220],
      direction: "hybrid",
      objects: { size: "auto", lines: 8, gap: 10 },
      vary: true,
      controls: { wheel: true, bar: "@thumb" },
    },
  },
  {
    name: "size none",
    config: {
      count: 8,
      size: 300,
      objects: { size: "none" },
      vary: true,
      controls: { wheel: true, drag: true, bar: "@thumb" },
    },
  },
  {
    name: "круг короче окна",
    config: {
      count: 2,
      size: 300,
      loop: true,
      objects: { size: 40 },
      controls: { wheel: true, bar: "@thumb", arrows: { element: "@arrow" } },
    },
  },
  {
    name: "родные бегунки в круге",
    config: {
      count: 10,
      size: 300,
      loop: true,
      objects: { size: 60, gap: 10 },
      controls: { wheel: true, bar: true },
    },
  },
  {
    name: "пусто с заглушкой",
    config: {
      count: 0,
      size: 300,
      objects: { size: 60, empty: { mode: "fallback", fallback: "@edge" } },
      controls: { wheel: true, bar: "@thumb" },
    },
  },
  {
    name: "ожидание с заглушкой",
    config: {
      count: 12,
      size: 300,
      suspending: true,
      fallback: "@edge",
      objects: { size: 60, gap: 10 },
      controls: { wheel: true, bar: "@thumb" },
      render: { mode: "virtual" },
    },
  },
  {
    name: "обёртка во всё окно и поля по сторонам",
    config: {
      count: 12,
      size: [300, 220],
      direction: "hybrid",
      objects: { size: 60, gap: 10, lines: 3 },
      wrapper: { margin: [10, 20, 30, 40], minSize: "full", align: "center" },
      controls: { wheel: true, bar: "@thumb" },
    },
  },
  {
    name: "размер отдан CSS, а отрисовка по счёту",
    config: {
      count: 12,
      size: 300,
      objects: { size: "none" },
      vary: true,
      render: { mode: "virtual" },
      controls: { wheel: true, bar: "@thumb" },
    },
  },
  {
    name: "длинный список в круге по окну",
    config: {
      count: 200,
      size: 300,
      loop: true,
      objects: { size: 60, lines: 1, gap: 10 },
      render: { mode: "virtual" },
      controls: { wheel: true, bar: "@thumb", arrows: { element: "@arrow", size: 30 } },
    },
  },
  {
    name: "одна колонка при обеих осях",
    config: {
      count: 12,
      size: [300, 220],
      direction: "hybrid",
      objects: { size: 60, lines: 1, gap: 10, order: "column" },
      controls: { wheel: true, drag: true, bar: "@thumb" },
    },
  },
  {
    name: "круг по обеим осям с each",
    config: {
      count: 9,
      size: [300, 220],
      direction: "hybrid",
      loop: true,
      vary: true,
      objects: { size: "auto", lines: 3, gap: 10 },
      controls: { wheel: true, drag: true, bar: "@thumb" },
      render: { trackVisibility: true },
    },
  },
];

/* — правила, которые обязаны держаться — */

/*
 * Всё, что стоит спрашивать у страницы, спрашивается разом: за один заход в
 * браузер, а не по вопросу на правило. Иначе между вопросами успевает пройти
 * кадр, и ответы окажутся из разных состояний.
 */
const inspect = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector("[morph-scroll]");
    if (!root) return { missing: true } as const;

    const boxes = [...document.querySelectorAll<HTMLElement>(".ms-object-box")];
    const rects = boxes.map((el) => {
      const r = el.getBoundingClientRect();

      return { x: r.x, y: r.y, w: r.width, h: r.height, key: el.className };
    });

    /* NaN в стиле — это уже поломка, даже если на вид ничего не заметно */
    const styled = [root, ...document.querySelectorAll<HTMLElement>("[style]")];
    const bad: string[] = [];

    for (const el of styled) {
      const style = (el as HTMLElement).getAttribute("style") ?? "";

      if (/NaN|Infinity|undefinedpx/.test(style))
        bad.push(`${(el as HTMLElement).className}: ${style}`);
    }

    /*
     * Переменные — это обещание наружу: по ним пишут стили, и значение вне
     * своих пределов там ничего не подсветит, а просто тихо соврёт.
     */
    const vars: string[] = [];
    const ranged = (name: string, from: number, till: number) => {
      for (const el of document.querySelectorAll<HTMLElement>("[style]")) {
        const raw = el.style.getPropertyValue(name);

        if (!raw) continue;

        const value = Number(raw);

        if (!Number.isFinite(value) || value < from || value > till)
          vars.push(`${name}: ${raw}`);
      }
    };

    ranged("--ms-content-visibility", 0, 1);
    ranged("--ms-edge-visibility", 0, 1);
    ranged("--ms-bar-visibility", 0, 1);

    const viewport = document.querySelector<HTMLElement>(".ms-viewport");

    const bars = [...document.querySelectorAll<HTMLElement>(".ms-bar")].map(
      (bar) => {
        const track = bar.getBoundingClientRect();
        const thumb = bar
          .querySelector<HTMLElement>(".ms-thumb")
          ?.getBoundingClientRect();

        return {
          track: { x: track.x, y: track.y, w: track.width, h: track.height },
          thumb: thumb && { x: thumb.x, y: thumb.y, w: thumb.width, h: thumb.height },
        };
      },
    );

    const sliders = [
      ...document.querySelectorAll<HTMLElement>(".ms-slider"),
    ].map((slider) => ({
      items: slider.querySelectorAll(".ms-slider-item").length,
      active: slider.querySelectorAll(".ms-slider-item.ms-active").length,
    }));

    const edges = [...document.querySelectorAll<HTMLElement>(".ms-edge")].map(
      (edge) => {
        const r = edge.getBoundingClientRect();

        return { w: r.width, h: r.height, cls: edge.className };
      },
    );

    return {
      missing: false as const,
      rects,
      bad,
      vars,
      bars,
      sliders,
      edges,
      scroll: viewport && {
        top: viewport.scrollTop,
        left: viewport.scrollLeft,
        maxTop: viewport.scrollHeight - viewport.clientHeight,
        maxLeft: viewport.scrollWidth - viewport.clientWidth,
      },
    };
  });

type Snapshot = Awaited<ReturnType<typeof inspect>>;

const overlaps = (rects: Extract<Snapshot, { missing: false }>["rects"]) => {
  const hits: string[] = [];

  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];

      // касание не считаем: у соседних объектов края совпадают законно
      const over =
        Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5 &&
        Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5;

      if (over) hits.push(`${i}×${j}`);
    }

  return hits;
};

const check = (snap: Snapshot, where: string, sized: boolean) => {
  if (snap.missing) throw new Error(`${where}: прокрутка не отрисовалась`);

  expect(snap.bad, `${where}: нечисло в стиле`).toEqual([]);
  expect(snap.vars, `${where}: переменная вне своих пределов`).toEqual([]);
  expect(overlaps(snap.rects), `${where}: объекты налезли`).toEqual([]);

  for (const slider of snap.sliders)
    expect(
      slider.active,
      `${where}: активных точек ${slider.active} из ${slider.items}`,
    ).toBeLessThanOrEqual(1);

  for (const bar of snap.bars) {
    if (!bar.thumb) continue;

    const { track, thumb } = bar;

    expect(thumb.x, `${where}: бегунок левее дорожки`).toBeGreaterThanOrEqual(
      track.x - 1,
    );
    expect(thumb.y, `${where}: бегунок выше дорожки`).toBeGreaterThanOrEqual(
      track.y - 1,
    );
    expect(
      thumb.x + thumb.w,
      `${where}: бегунок правее дорожки`,
    ).toBeLessThanOrEqual(track.x + track.w + 1);
    expect(
      thumb.y + thumb.h,
      `${where}: бегунок ниже дорожки`,
    ).toBeLessThanOrEqual(track.y + track.h + 1);
  }

  /*
   * Край размечает место — названной толщиной он обязан его занять. Без неё
   * толщину решает CSS, и ноль там законен: разметки просто нет.
   */
  if (sized)
    for (const edge of snap.edges) {
      expect(edge.w, `${where}: край без ширины (${edge.cls})`).toBeGreaterThan(0);
      expect(edge.h, `${where}: край без высоты (${edge.cls})`).toBeGreaterThan(0);
    }
};

/* — сама тряска — */

const shake = async (page: Page) => {
  const view = page.locator(".ms-viewport");
  const box = await view.boundingBox();
  if (!box) throw new Error("нет окна прокрутки");

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.mouse.move(cx, cy);
  for (const [dx, dy] of [
    [0, 300],
    [300, 0],
    [0, -200],
    [-500, -500],
  ])
    await page.mouse.wheel(dx, dy);

  await page.waitForTimeout(120);

  // перетаскивание содержимого — если его не включали, просто ничего не будет
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++)
    await page.mouse.move(cx - i * 12, cy - i * 10, { steps: 2 });
  await page.mouse.up();
  await page.waitForTimeout(120);

  /*
   * Бегунок тянем прямо за него: путь до содержимого у него свой, и половина
   * жалоб была именно на него — уезжал вперёд, залипал, вставал мимо.
   */
  const thumb = page.locator(".ms-thumb").first();

  if (await thumb.count()) {
    const grip = await thumb.boundingBox();

    if (grip) {
      await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
      await page.mouse.down();
      for (let i = 1; i <= 8; i++)
        await page.mouse.move(
          grip.x + grip.width / 2 + i * 9,
          grip.y + grip.height / 2 + i * 9,
          { steps: 2 },
        );
      await page.mouse.up();
      await page.waitForTimeout(150);
    }
  }

  // точки слайдера: по ним переходят кликом, и это отдельный путь
  const dots = page.locator(".ms-slider-item");
  const count = await dots.count();

  if (count > 1) {
    await dots.nth(count - 1).click({ force: true });
    await page.waitForTimeout(150);
    await dots.nth(0).click({ force: true });
    await page.waitForTimeout(150);
  }

  // стрелки: туда и обратно по каждой стороне
  for (const side of ["right", "bottom", "left", "top"]) {
    const arrow = page.locator(`.ms-arrow-box.ms-${side}`);

    if (await arrow.count()) await arrow.first().click({ force: true });
    await page.waitForTimeout(60);
  }

  // и то же самое командой, минуя разметку
  await page.evaluate(async () => {
    const ms = (window as any).__ms;
    if (!ms) return;

    ms.scrollTo(200, { duration: 0 });
    ms.scrollTo("end", { duration: 0 });
    ms.pan({ x: 40, y: 40 }, { duration: 0 });
    for (const side of ["top", "right", "bottom", "left"]) ms.step(side);
    ms.moveFocus("bottom");
  });
  await page.waitForTimeout(200);
};

/* — прогон — */

const cases = [...build(), ...EDGES];

for (const { name, config } of cases)
  test(name, async ({ page }) => {
    const noise: string[] = [];
    const edge = config.edge as { size?: number } | undefined;
    const sized = typeof edge?.size === "number";

    page.on("pageerror", (err) => noise.push(`исключение: ${err.message}`));
    page.on("console", (msg) => {
      /*
       * Собственные предупреждения библиотеки — не поломка, а ответ на
       * заведомо негодное сочетание, и такие в наборе есть нарочно: сказать
       * «так нельзя» она обязана, а сломаться при этом — нет. Подписаны они
       * своим именем, по нему и отличаем.
       */
      const text = msg.text();

      if (msg.type() === "error" && !text.includes("morph-scroll"))
        noise.push(`console.error: ${text}`);
    });

    await page.goto(url(config));
    await page.waitForTimeout(250);

    check(await inspect(page), "на открытии", sized);

    await shake(page);
    check(await inspect(page), "после тряски", sized);

    // на узком окне пересчёт идёт заново — и должен давать то же самое
    await page.setViewportSize({ width: 420, height: 420 });
    await page.waitForTimeout(250);
    check(await inspect(page), "после сужения", sized);

    expect(noise, "консоль").toEqual([]);
  });

/*
 * Второй заход — не про геометрию, а про движение. Раскладка может быть
 * безупречной на снимке и при этом дёргаться, уезжать не туда или не
 * возвращаться на своё место; такое видно только на ходу.
 */

/*
 * Что стоит под окном — вот единственная честная примета положения. Числа
 * прокрутки в круге сравнивать нельзя: позиция там подменяется переносом, и
 * то же самое место называется каждый раз другим числом.
 */
const shot = (page: Page) =>
  page.evaluate(() => {
    const view = document.querySelector<HTMLElement>(".ms-viewport");
    if (!view) return [];

    const win = view.getBoundingClientRect();

    return [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
      .map((el) => {
        const r = el.getBoundingClientRect();

        return { el, r };
      })
      .filter(
        ({ r }) =>
          r.right > win.left &&
          r.left < win.right &&
          r.bottom > win.top &&
          r.top < win.bottom,
      )
      .map(
        ({ el, r }) =>
          `${el.textContent}@${Math.round(r.left - win.left)},${Math.round(
            r.top - win.top,
          )}`,
      )
      .sort();
  });

/*
 * Ход считаем по самим объектам, а не по числу прокрутки: в круге число
 * прыгает на период, и по нему любой перенос выглядел бы рывком. На экране же
 * перенос обязан быть незаметным — за него и спрашиваем.
 */
const watchFrames = (page: Page) =>
  page.evaluate(() => {
    const win = window as any;
    const ids = new WeakMap<Element, number>();
    let next = 0;
    let prev = new Map<number, [number, number]>();

    win.__jerk = [] as [number, number][];

    /*
     * Счёт кадров помечаем номером: прошлый обход не обязан успеть заметить,
     * что его остановили, и без метки он продолжил бы писать в общий список
     * рядом с новым. Путь тогда складывался бы дважды.
     */
    const mine = (win.__watch = (win.__watch ?? 0) + 1);

    const tick = () => {
      const now = new Map<number, [number, number]>();

      for (const el of document.querySelectorAll<HTMLElement>(
        ".ms-object-box",
      )) {
        let id = ids.get(el);

        if (id === undefined) ids.set(el, (id = next++));

        const r = el.getBoundingClientRect();

        now.set(id, [r.left, r.top]);
      }

      const byX: number[] = [];
      const byY: number[] = [];

      for (const [id, [x, y]] of now) {
        const was = prev.get(id);

        if (was) {
          byX.push(x - was[0]);
          byY.push(y - was[1]);
        }
      }

      /*
       * Берём середину, а не наибольшее: пока идёт ход, объекты едут вместе, и
       * середина — это и есть ход. Наибольшее назвало бы рывком любой
       * одиночный перескок, а он законен: копия переставляется как раз затем,
       * чтобы остальные ехали ровно.
       */
      if (byX.length) {
        const mid = (list: number[]) =>
          list.sort((one, two) => one - two)[list.length >> 1];

        win.__jerk.push([mid(byX), mid(byY)]);
      }

      prev = now;
      if (win.__watch === mine) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });

/*
 * Из тех же кадров выходит и пройденный путь: сложив ход по кадрам, получаем,
 * куда содержимое уехало на самом деле. Число прокрутки этого не скажет —
 * оно в круге подменяется, — а сложенный ход скажет.
 */
const framesOf = (page: Page) =>
  page.evaluate(() => {
    const win = window as any;

    win.__watch = (win.__watch ?? 0) + 1;

    const seen = win.__jerk as [number, number][];
    let worst = 0;
    let byX = 0;
    let byY = 0;

    for (const [dx, dy] of seen) {
      worst = Math.max(worst, Math.hypot(dx, dy));
      byX += dx;
      byY += dy;
    }

    return { frames: seen.length, worst, byX: Math.abs(byX), byY: Math.abs(byY) };
  });

/*
 * Ходовой набор — без виртуальной отрисовки: там объекты снимаются и
 * ставятся заново, и «тот же объект уехал на столько-то» сказать не о ком.
 */
const MOVING: { name: string; config: Config }[] = [
  {
    name: "ход: круг, слайдер, y",
    config: {
      count: 8,
      size: 300,
      mode: "slider",
      loop: true,
      objects: { size: 60, gap: 10 },
      controls: { wheel: true, bar: "@dot", arrows: { element: "@arrow", size: 30 } },
      duration: 300,
    },
  },
  {
    name: "ход: круг, слайдер, x",
    config: {
      count: 8,
      size: [300, 120],
      direction: "x",
      mode: "slider",
      loop: true,
      objects: { size: 60, gap: 10 },
      controls: { wheel: true, bar: "@dot", arrows: { element: "@arrow", size: 30 } },
      duration: 300,
    },
  },
  {
    name: "ход: круг по обеим осям",
    config: {
      count: 9,
      size: [300, 220],
      direction: "hybrid",
      loop: true,
      objects: { size: 60, gap: 10, lines: 3 },
      controls: { wheel: true, bar: "@thumb", arrows: { element: "@arrow", size: 30 } },
      duration: 300,
    },
  },
  {
    name: "ход: круг с измеряемым размером",
    config: {
      count: 9,
      size: [300, 220],
      direction: "hybrid",
      loop: true,
      vary: true,
      objects: { size: "auto", gap: 10, lines: 3 },
      controls: { wheel: true, bar: "@thumb", arrows: { element: "@arrow", size: 30 } },
      render: { trackVisibility: true },
      duration: 300,
    },
  },
  {
    name: "ход: круг в меню-слайдере",
    config: {
      count: 10,
      size: 300,
      mode: "sliderMenu",
      loop: true,
      objects: { size: 100, gap: 20 },
      controls: { wheel: true, bar: "@dot", arrows: { element: "@arrow", size: 30 } },
      duration: 300,
    },
  },
  {
    name: "ход: обычная прокрутка",
    config: {
      count: 20,
      size: 300,
      objects: { size: 60, gap: 10 },
      controls: { wheel: true, bar: "@thumb", arrows: { element: "@arrow", size: 30 } },
      duration: 300,
    },
  },
  {
    name: "ход: слайдер без круга",
    config: {
      count: 8,
      size: [300, 120],
      direction: "x",
      mode: "slider",
      objects: { size: "full", gap: 10 },
      controls: { wheel: true, bar: "@dot", arrows: { element: "@arrow", size: 30 } },
      duration: 300,
    },
  },
];

for (const { name, config } of MOVING)
  test.describe(name, () => {
    /*
     * Ход обязан быть ходом, а не подменой: за кадр объекты не уезжают на
     * пол-окна. Именно так выглядит незамеченный перенос копий — на снимке
     * всё стоит правильно, а глазами видно прыжок.
     */
    test("ни один кадр не прыгает на пол-окна", async ({ page }) => {
      await page.goto(url(config));
      await page.waitForTimeout(300);

      const win = await page
        .locator(".ms-viewport")
        .evaluate((el) => [el.clientWidth, el.clientHeight]);
      const limit = Math.max(win[0], win[1]) / 2;

      await watchFrames(page);

      /*
       * Шагов несколько: перенос копий случается не на каждом, а только когда
       * окно уходит за копию. С одного шага можно до него не дойти — и тогда
       * проверка ничего не проверит.
       */
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => {
          const ms = (window as any).__ms;

          ms.step("bottom");
          ms.step("right");
        });
        await page.waitForTimeout(450);
      }

      const { frames, worst } = await framesOf(page);

      expect(frames, "кадров не набралось").toBeGreaterThan(10);
      expect(worst, `кадр уехал на ${Math.round(worst)} при пределе ${limit}`)
        .toBeLessThan(limit);
    });

    /*
     * Шаг туда и шаг обратно возвращают на то же место.
     */
    test("шаг туда и обратно возвращает под окно то же самое", async ({
      page,
    }) => {
      await page.goto(url(config));
      await page.waitForTimeout(300);

      const before = await shot(page);

      expect(before.length, "под окном пусто").toBeGreaterThan(0);

      for (const [one, two] of [
        ["bottom", "top"],
        ["right", "left"],
      ] as const) {
        await page.evaluate((side) => (window as any).__ms.step(side), one);
        await page.waitForTimeout(500);
        await page.evaluate((side) => (window as any).__ms.step(side), two);
        await page.waitForTimeout(500);
      }

      expect(await shot(page)).toEqual(before);
    });

    /*
     * Шаг — это одна страница, и с позиции между страницами тоже. Отсюда две
     * поломки сразу: шаг, перескакивающий страницу, и шаг, не делающий
     * ничего. Обе видно только с несетевой позиции — а в неё попадают колесом
     * или пальцем, то есть почти всегда.
     */
    test("каждый шаг сдвигает ровно на страницу, не больше и не на ноль", async ({
      page,
    }) => {
      await page.goto(url(config));
      await page.waitForTimeout(300);

      const win = await page
        .locator(".ms-viewport")
        .evaluate((el) => [el.clientWidth, el.clientHeight]);

      // сбиваем с сетки: числа нарочно некруглые
      await page.evaluate(() =>
        (window as any).__ms.pan({ x: 37, y: 43 }, { duration: 0 }),
      );
      await page.waitForTimeout(200);

      for (const side of ["bottom", "top", "right", "left"] as const) {
        const across = side === "right" || side === "left";
        const window = across ? win[0] : win[1];

        /*
         * Спрашивать ход можно только там, где есть куда идти: у прокрутки без
         * круга запас кончается, и шаг у самого края законно не делает ничего.
         * В круге запас есть всегда — края у него нет.
         */
        const room = await page.locator(".ms-viewport").evaluate((el, to) => {
          const along = to === "right" || to === "left";
          const at = along ? el.scrollLeft : el.scrollTop;
          const most = along
            ? el.scrollWidth - el.clientWidth
            : el.scrollHeight - el.clientHeight;

          return to === "left" || to === "top" ? at : most - at;
        }, side);

        await watchFrames(page);
        await page.evaluate((to) => (globalThis as any).__ms.step(to), side);
        await page.waitForTimeout(600);

        const { byX, byY } = await framesOf(page);
        const went = across ? byX : byY;

        if (room > 2)
          expect(went, `шаг ${side} не сдвинул ничего`).toBeGreaterThan(1);

        expect(
          went,
          `шаг ${side} перескочил страницу: ${Math.round(went)} при окне ${window}`,
        ).toBeLessThan(window + 40);
      }
    });
  });

/*
 * Третий заход — про смену набора на ходу. Скролл живёт дольше одного набора
 * пропсов: направление переключают, режим меняют, дети приходят и уходят. Всё,
 * что посчитано один раз и запомнено, тут и вылезает: второй набор ложится
 * поверх памяти о первом.
 */

const STEPS: Config[] = [
  { count: 12, size: 300, objects: { size: 60, gap: 10 } },
  { count: 12, size: 300, objects: { size: 60, gap: 10 }, loop: true },
  {
    count: 12,
    size: [300, 220],
    direction: "x",
    objects: { size: 60, gap: 10 },
    loop: true,
  },
  {
    count: 12,
    size: [300, 220],
    direction: "hybrid",
    mode: "slider",
    objects: { size: 60, gap: 10, lines: 3 },
    controls: { bar: "@dot" },
  },
  {
    count: 4,
    size: [300, 220],
    direction: "hybrid",
    vary: true,
    objects: { size: "auto", gap: 10, lines: 3 },
    render: { mode: "virtual" },
  },
  {
    count: 30,
    size: [300, 220],
    direction: "hybrid",
    vary: true,
    objects: { size: "auto", gap: 10, lines: 3 },
    loop: true,
  },
  { count: 0, size: 300, objects: { size: 60, gap: 10 } },
  {
    count: 12,
    size: 300,
    mode: "sliderMenu",
    objects: { size: "full" },
    controls: { bar: "@dot", arrows: { element: "@arrow", size: 30 } },
  },
];

test("набор меняется под живым скроллом", async ({ page }) => {
  const noise: string[] = [];

  page.on("pageerror", (err) => noise.push(`исключение: ${err.message}`));
  page.on("console", (msg) => {
    const text = msg.text();

    if (msg.type() === "error" && !text.includes("morph-scroll"))
      noise.push(`console.error: ${text}`);
  });

  await page.goto(
    `/?scenario=crashSwitch&props=${encodeURIComponent(
      JSON.stringify(STEPS[0]),
    )}`,
  );
  await page.waitForTimeout(250);

  // и назад по той же цепочке: возврат к прежнему набору — тоже смена
  const chain = [...STEPS.entries(), ...[...STEPS.entries()].reverse()];

  for (const [i, step] of chain) {
    await page.evaluate(
      (next) => (window as any).__set(next),
      JSON.stringify(step),
    );
    await page.waitForTimeout(300);

    const view = page.locator(".ms-viewport");
    const before = await view.evaluate((el) => [el.scrollLeft, el.scrollTop]);
    const room = await view.evaluate((el) => [
      el.scrollWidth - el.clientWidth,
      el.scrollHeight - el.clientHeight,
    ]);

    // между сменами ещё и катаем: осевшая раскладка врёт реже, чем едущая
    const box = await view.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(120, 240);
      await page.waitForTimeout(250);
    }

    check(await inspect(page), `набор ${i}`, false);

    /*
     * Смена набора не должна оставлять прокрутку замороженной: если ехать
     * есть куда, колесо обязано её сдвинуть. Замершая прокрутка выглядит как
     * целая, и на снимке раскладки к ней не придраться.
     */
    const controls = step.controls as { wheel?: unknown } | undefined;
    const wheels = !controls || !!controls.wheel;

    if (wheels && (room[0] > 2 || room[1] > 2)) {
      const after = await view.evaluate((el) => [el.scrollLeft, el.scrollTop]);

      expect(
        Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1]),
        `набор ${i}: колесо не сдвинуло прокрутку`,
      ).toBeGreaterThan(1);
    }
  }

  expect(noise, "консоль").toEqual([]);
});

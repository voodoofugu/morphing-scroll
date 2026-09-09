import { test, expect, Page } from "@playwright/test";

/*
 * Место, куда приезжает `scrollToObject`, ломалось раз за разом: чинишь
 * зеркальный список — расходится поле обёртки, чинишь поле — расходится
 * зазор. Каждый раз это был отдельный случай, и отдельный же случай его
 * чинил.
 *
 * Поэтому здесь не список примеров, а перебор: направление, сторона чтения,
 * поля, зазоры, укладка, режим, круг, отрисовка — и в каждом сочетании все
 * три `align` у трёх объектов. Ждать от них правильного числа нельзя, чисел
 * тут тысячи; ждать можно правила.
 *
 * Правило одно, и оно про то, что в этом месте лежит на самом деле: за
 * объектом стоит ещё один — между ними зазор объектов; объект крайний — за
 * ним поле обёртки. Столько он и отступает от края окна. Отсюда сходятся и
 * края: `scrollToObject(1, "start")` приезжает туда же, куда `scrollTo(0)`,
 * а `"end"` у последнего — туда, где список кончается.
 *
 * Оракул ниже считает это место сам — по разметке в браузере и объявленным
 * полям — и ничего не знает о том, как считает библиотека. Совпадение двух
 * независимых счётов и есть проверка.
 */

/** полный перебор: MS_SWEEP=1 npx playwright test scrollToObject */
const FULL = !!process.env.MS_SWEEP;

type Align = "start" | "center" | "end";

const expected = (
  lead: number, // ведущий край объекта в координатах содержимого
  size: number,
  view: number,
  leadPad: number, // отступ со стороны начала списка
  trailPad: number, // и со стороны его конца
  align: Align,
  mirrored: boolean,
) => {
  const room = view - size; // объект крупнее окна даёт отрицательный запас
  if (!mirrored) {
    if (align === "start") return lead - leadPad;
    if (align === "center") return lead - room / 2;
    return lead + size + trailPad - view;
  }
  // у идущего справа ведущий край объекта — правый
  if (align === "start") return lead + size + leadPad - view;
  if (align === "center") return lead + size + room / 2 - view;
  return lead - trailPad;
};

type Copy = {
  rl: number;
  rt: number;
  w: number;
  h: number;
  /* сколько содержимого лежит до объекта и после — по разметке */
  bx: number;
  ax: number;
  by: number;
  ay: number;
};
type Shot = {
  missing?: boolean;
  copies: Copy[];
  vw: number;
  vh: number;
  sx: number;
  sy: number;
  maxX: number;
  maxY: number;
};

/* все нарисованные повторы объекта: в круге их несколько, и годится любой */
const probe = (
  page: Page,
  target: number | string,
  align: unknown,
  text: string,
) =>
  page.evaluate(
    async ([target, align, text]: [number | string, unknown, string]) => {
      const ms = (window as unknown as { __ms: { scrollToObject: Function } })
        .__ms;
      ms.scrollToObject(target, { align });

      // место известно только по остановке: перелёт может быть и долгим
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      let still = 0;
      let last = [view.scrollLeft, view.scrollTop];
      for (let i = 0; i < 200 && still < 6; i++) {
        await new Promise((r) => setTimeout(r, 16));
        const now = [view.scrollLeft, view.scrollTop];
        still = now[0] === last[0] && now[1] === last[1] ? still + 1 : 0;
        last = now;
      }
      await new Promise((r) => setTimeout(r, 60));

      const frame = view.getBoundingClientRect();
      const wrap = document
        .querySelector<HTMLElement>(".ms-objects-wrapper")!
        .getBoundingClientRect();
      const els = [
        ...document.querySelectorAll<HTMLElement>(".ms-object-box"),
      ].filter((e) => e.textContent === text);
      if (!els.length) return { missing: true } as unknown;

      return {
        copies: els.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            rl: r.left - frame.left + view.scrollLeft,
            rt: r.top - frame.top + view.scrollTop,
            w: r.width,
            h: r.height,
            bx: r.left - wrap.left,
            ax: wrap.right - r.right,
            by: r.top - wrap.top,
            ay: wrap.bottom - r.bottom,
          };
        }),
        vw: view.clientWidth,
        vh: view.clientHeight,
        sx: view.scrollLeft,
        sy: view.scrollTop,
        maxX: view.scrollWidth - view.clientWidth,
        maxY: view.scrollHeight - view.clientHeight,
      } as unknown;
    },
    [target, align, text] as [number | string, unknown, string],
  ) as Promise<Shot>;

type Check = {
  tag: string;
  cfg: Record<string, unknown>;
  margin: number[]; // T R B L
  gap: [number, number]; // по осям: x, y
  endless?: boolean; // круг: краёв у оси нет
  fromRight: boolean;
  direction: "x" | "y" | "hybrid";
  targets: [number | string, string][]; // что просим -> текст, который ищем
};

const judge = async (page: Page, list: Check[], aligns: unknown[]) => {
  const bad: string[] = [];

  for (const c of list) {
    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(c.cfg))}`,
    );
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(220);

    const [mT, mR, mB, mL] = c.margin;

    for (const [target, text] of c.targets)
      for (const align of aligns) {
        const shot = await probe(page, target, align, text);
        if (shot.missing) {
          bad.push(`${c.tag} -> ${target} ${JSON.stringify(align)}: не нарисован`);
          continue;
        }

        const axes: ("x" | "y")[] =
          c.direction === "hybrid" ? ["x", "y"] : [c.direction];

        for (const axis of axes) {
          const isX = axis === "x";
          const wh = isX ? 0 : 1;
          const asked = ((Array.isArray(align) ? align[wh] : align) ??
            "start") as Align;
          const mirrored = isX && c.fromRight;
          const max = isX ? shot.maxX : shot.maxY;
          const got = isX ? shot.sx : shot.sy;

          // за край окна не уехать: у краёв все три просьбы сходятся в одну
          const wants = shot.copies.map((cp) => {
            const gap = c.gap[wh];
            /*
             * Отступ — то, что в этом месте лежит: за объектом ещё один
             * объект значит зазор, край содержимого — поле обёртки.
             */
            const low =
              c.endless || (isX ? cp.bx : cp.by) > 0.5 ? gap : isX ? mL : mT;
            const high =
              c.endless || (isX ? cp.ax : cp.ay) > 0.5 ? gap : isX ? mR : mB;

            return Math.min(
              max,
              Math.max(
                0,
                expected(
                  isX ? cp.rl : cp.rt,
                  isX ? cp.w : cp.h,
                  isX ? shot.vw : shot.vh,
                  mirrored ? high : low,
                  mirrored ? low : high,
                  asked,
                  mirrored,
                ),
              ),
            );
          });

          if (!wants.some((w) => Math.abs(got - w) <= 1.5))
            bad.push(
              `${c.tag} -> ${target} ${JSON.stringify(align)} ${axis}: ` +
                `${Math.round(got)} вместо ${wants.map((w) => Math.round(w)).join("|")} (max ${Math.round(max)})`,
            );
        }
      }
  }

  return bad;
};

/* ─── перебор первый: одна раскладка, все поля, зазоры и отрисовки ─── */

const MARGINS: [string, number[]][] = FULL
  ? [
      ["m0", [0, 0, 0, 0]],
      ["even", [12, 12, 12, 12]],
      ["odd", [8, 16, 24, 32]],
    ]
  : [
      ["m0", [0, 0, 0, 0]],
      ["odd", [8, 16, 24, 32]],
    ];

const GAPS: [string, unknown, [number, number]][] = FULL
  ? [
      ["g0", 0, [0, 0]],
      ["g12", 12, [12, 12]],
      ["gxy", [10, 20], [10, 20]],
    ]
  : [
      ["g0", 0, [0, 0]],
      ["gxy", [10, 20], [10, 20]],
    ];

for (const direction of ["x", "y", "hybrid"] as const)
  test(`the grid lands where the list rests: ${direction}`, async ({ page }) => {
    test.setTimeout(FULL ? 900_000 : 300_000);

    const list: Check[] = [];
    for (const fromRight of [false, true])
      for (const [mName, margin] of MARGINS)
        for (const [gName, gap, gapXY] of GAPS)
          for (const render of FULL ? [undefined, "virtual"] : ["virtual"])
            for (const lines of direction === "hybrid"
              ? [20]
              : FULL
                ? [1, 3]
                : [3])
              list.push({
                tag: `${direction} ${fromRight ? "fromRight" : "ltr"} ${mName} ${gName} ${render ?? "plain"} lines:${lines}`,
                cfg: {
                  count: 300,
                  direction,
                  fromRight,
                  size: [720, 460],
                  objects: { size: [150, 112], gap, lines, order: "row" },
                  wrapper: { margin },
                  duration: 0,
                  ...(render ? { render: { mode: render, rootMargin: 160 } } : {}),
                },
                margin,
                gap: gapXY,
                fromRight,
                direction,
                targets: [
                  [1, "0"],
                  [151, "150"],
                  [300, "299"],
                ],
              });

    expect(await judge(page, list, ["start", "center", "end"])).toEqual([]);
  });

/* ─── перебор второй: одни и те же поля, но всякий раз другая форма ─── */

const shapes = (
  direction: "x" | "y" | "hybrid",
  fromRight: boolean,
  margin: number[],
) => {
  const base = {
    count: 120,
    size: [720, 460],
    duration: 0,
    direction,
    fromRight,
    wrapper: { margin },
  };
  const grid = { size: [150, 112], gap: 12, lines: 5 };

  const all: [string, Record<string, unknown>, [number | string, string][]?][] =
    [
      ["order:column", { ...base, objects: { ...grid, order: "column" } }],
      [
        "each/vary",
        {
          ...base,
          vary: true,
          objects: { size: "auto", gap: 12, lines: 4 },
          render: { mode: "virtual", rootMargin: 200 },
        },
      ],
      [
        "arrows reserve",
        {
          ...base,
          objects: grid,
          controls: {
            arrows: { size: 40, reserveSpace: true, element: "@arrow" },
          },
        },
      ],
      [
        "wrapper.align",
        {
          ...base,
          objects: { ...grid, align: "center" },
          wrapper: { margin, align: ["center", "center"] },
        },
      ],
      ["slider", { ...base, mode: "slider", objects: grid, controls: { bar: "@dot" } }],
      [
        "sliderMenu",
        { ...base, mode: "sliderMenu", objects: grid, controls: { bar: "@dot" } },
      ],
      ["loop", { ...base, loop: true, objects: grid }],
      [
        "objects full",
        { ...base, count: 20, objects: { size: "full", gap: 12 } },
        [
          [1, "0"],
          [10, "9"],
          [20, "19"],
        ],
      ],
      // объект крупнее окна: `"end"` показывает его конец, а не начало
      ["tight view", { ...base, size: [140, 100], objects: grid }],
      [
        "fractional",
        {
          ...base,
          size: [717, 461],
          wrapper: { margin: margin.map((m) => m + 0.5) },
          objects: { size: [150.5, 112.5], gap: 11.5, lines: 5 },
        },
      ],
      [
        "by key & group",
        { ...base, groups: 10, objects: grid },
        [
          ["crash-60", "60"],
          ["s6", "60"],
        ],
      ],
    ];

  if (FULL) {
    all.push(["animated", { ...base, duration: 300, objects: grid }]);
    all.push([
      "lazy",
      { ...base, objects: grid, render: { mode: "lazy", rootMargin: 120 } },
    ]);
  }

  return all;
};

for (const direction of ["x", "y", "hybrid"] as const)
  test(`every shape lands where the list rests: ${direction}`, async ({
    page,
  }) => {
    test.setTimeout(FULL ? 900_000 : 300_000);

    const margin = [8, 16, 24, 32];
    const list: Check[] = [];

    for (const fromRight of [false, true])
      for (const [name, cfg, targets] of shapes(direction, fromRight, margin))
        list.push({
          tag: `${name} ${direction} ${fromRight ? "fromRight" : "ltr"}`,
          cfg: {
            ...cfg,
            /* у дробной формы поля свои — берём те, что назвала сама форма */
          },
          margin: ((cfg.wrapper as { margin: number[] }) ?? { margin }).margin,
          gap: name === "fractional" ? [11.5, 11.5] : [12, 12],
          endless: name === "loop",
          fromRight,
          direction,
          targets: targets ?? [
            [1, "0"],
            [61, "60"],
            [120, "119"],
          ],
        });

    const aligns: unknown[] = FULL
      ? ["start", "center", "end", ["center", "end"], undefined]
      : ["start", "center", "end", ["center", "end"]];

    expect(await judge(page, list, aligns)).toEqual([]);
  });

/*
 * Две команды подводят объект к краю — `scrollToObject` и `moveFocus`, — и
 * отступ у края они берут по одному правилу. Правило записано один раз, в
 * `edgePads`, но читают его два места, а сойтись они должны на пикселе.
 *
 * Сравнивать целиком их нельзя: `moveFocus` двигает ровно столько, чтобы
 * объект стал виден, а `scrollToObject` ставит его в названное место окна.
 * Сходятся они там, где это одно и то же — когда объект стоит сразу за краем
 * окна и въезжает в него с той стороны, к которой его и просят прижать.
 */
test("both ways of bringing an object to an edge agree", async ({ page }) => {
  test.setTimeout(120_000);

  const bad: string[] = [];

  for (const fromRight of [false, true])
    for (const margin of [
      [0, 0, 0, 0],
      [8, 16, 24, 32],
    ])
      for (const gap of [0, 12]) {
        const cfg = {
          count: 60,
          direction: "y",
          fromRight,
          size: [720, 460],
          objects: { size: [150, 112], gap, lines: 4 },
          wrapper: { margin },
          controls: { keys: { mode: "focus" } },
          duration: 0,
        };
        const tag = `${fromRight ? "fromRight" : "ltr"} m:${margin.join()} g:${gap}`;

        await page.goto(
          `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(cfg))}`,
        );
        await expect(page.locator(".ms-viewport")).toBeVisible();
        await page.waitForTimeout(220);

        /*
         * Шагаем фокусом вниз и запоминаем две встречи: первый объект, ради
         * которого пришлось ехать — за ним стоит ещё один, и отступ там
         * зазор, — и самый последний, за которым уже поле обёртки. Обе ветви
         * правила разом.
         */
        const byFocus = await page.evaluate(async () => {
          const ms = (window as any).__ms;
          const view = document.querySelector<HTMLElement>(".ms-viewport")!;
          const seen: { at: number; text: string }[] = [];
          let last: { at: number; text: string } | null = null;

          for (let i = 0; i < 60; i++) {
            ms.moveFocus("bottom", { duration: 0 });
            await new Promise((r) => setTimeout(r, 40));

            const box = document.activeElement as HTMLElement;
            const now = { at: view.scrollTop, text: box?.textContent ?? "" };
            if (!seen.length && now.at > 0) seen.push(now);
            if (last && last.text === now.text) break; // дальше некуда
            last = now;
          }
          if (last) seen.push(last);
          return seen;
        });

        if (byFocus.length < 2) {
          bad.push(`${tag}: фокус не дошёл до обоих случаев`);
          continue;
        }

        for (const met of byFocus) {
          const byCommand = await page.evaluate(async (text: string) => {
            const ms = (window as any).__ms;
            const view = document.querySelector<HTMLElement>(".ms-viewport")!;
            view.scrollTop = 0;
            await new Promise((r) => setTimeout(r, 40));

            ms.scrollToObject(Number(text) + 1, { align: "end", duration: 0 });
            await new Promise((r) => setTimeout(r, 120));
            return view.scrollTop;
          }, met.text);

          if (Math.abs(met.at - byCommand) > 1.5)
            bad.push(
              `${tag} -> объект ${met.text}: фокус ${Math.round(met.at)}, команда ${Math.round(byCommand)}`,
            );
        }
      }

  expect(bad).toEqual([]);
});

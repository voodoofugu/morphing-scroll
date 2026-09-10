import { test, expect, Page } from "@playwright/test";

/*
 * Зазор между объектами — обещание раскладки, и держаться оно должно с обеих
 * сторон от каждого. Проверяем не расстановку, а именно его: перебираем все
 * пары соседей и смотрим, не подошёл ли кто ближе обещанного.
 *
 * Ломалось это дважды, и оба раза — там, где место объекту выбирает не
 * очередь, а поиск. Заполнение резервировало зазор только за поставленным,
 * так что вставший позже и левее подходил к соседу вплотную; а толкание к
 * дальнему краю считало мешающими только пересёкшихся по главной оси и
 * сводило вплотную тех, кого укладка развела на волосок.
 */

/** полный перебор: MS_SWEEP=1 npx playwright test gaps */
const FULL = !!process.env.MS_SWEEP;

type Report = {
  n: number;
  minX: number | null;
  minY: number | null;
  tight: string[];
};

const measure = async (page: Page, cfg: Record<string, unknown>) => {
  await page.goto(
    `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(cfg))}`,
  );
  await expect(page.locator(".ms-viewport")).toBeVisible();
  await page.waitForTimeout(400);

  return page.evaluate(() => {
    const boxes = [
      ...document.querySelectorAll<HTMLElement>(".ms-object-box"),
    ].map((el) => {
      const b = el.getBoundingClientRect();
      return {
        name: el.textContent,
        left: b.left,
        right: b.right,
        top: b.top,
        bottom: b.bottom,
      };
    });

    const tight: string[] = [];
    let minX = Infinity;
    let minY = Infinity;

    /*
     * Соседи — те, кто пересекается по одной оси: между ними и лежит зазор по
     * другой. Кто разошёлся по обеим, соседями друг другу не приходится.
     */
    for (const a of boxes)
      for (const b of boxes) {
        if (a === b) continue;

        if (a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5 && a.right <= b.left + 0.5) {
          const gap = Math.round(b.left - a.right);
          minX = Math.min(minX, gap);
          if (gap < 9) tight.push(`x ${a.name}|${b.name}=${gap}`);
        }

        if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.bottom <= b.top + 0.5) {
          const gap = Math.round(b.top - a.bottom);
          minY = Math.min(minY, gap);
          if (gap < 9) tight.push(`y ${a.name}|${b.name}=${gap}`);
        }
      }

    return {
      n: boxes.length,
      minX: minX === Infinity ? null : minX,
      minY: minY === Infinity ? null : minY,
      tight: tight.slice(0, 6),
    } as Report;
  });
};

/* четыре формы размера — и каждая укладывается по-своему */
const SHAPES: [string, unknown][] = FULL
  ? [
      ["fill", "auto"],
      ["masonry-y", [90, "auto"]],
      ["masonry-x", ["auto", 90]],
      ["known", 90],
    ]
  : [
      ["fill", "auto"],
      ["masonry-y", [90, "auto"]],
    ];

const GAPS: unknown[] = FULL ? [24, [10, 30]] : [[10, 30]];

for (const direction of ["y", "x", "hybrid"] as const)
  test(`the gap holds on every side: ${direction}`, async ({ page }) => {
    test.setTimeout(FULL ? 600_000 : 300_000);

    const bad: string[] = [];

    for (const [shape, size] of SHAPES)
      for (const gap of GAPS)
        for (const align of ["start", "center", "end"] as const)
          for (const lines of direction === "hybrid"
            ? [3]
            : FULL
              ? [undefined, 4]
              : [undefined]) {
            const objects: Record<string, unknown> = { size, gap, align };
            if (lines) objects.lines = lines;

            const got = await measure(page, {
              count: 24,
              vary: true,
              size: [700, 460],
              direction,
              objects,
              wrapper: { margin: [12, 12, 12, 12] },
              render: { mode: "virtual", rootMargin: 160 },
            });

            const [gx, gy] = Array.isArray(gap)
              ? (gap as number[])
              : [gap as number, gap as number];
            const tag = `${direction} ${shape} gap=${JSON.stringify(gap)} ${align} lines=${lines}`;

            if (got.minX !== null && got.minX < gx - 1)
              bad.push(`${tag}: поперёк ${got.minX} вместо ${gx} ${got.tight.join(" ")}`);
            if (got.minY !== null && got.minY < gy - 1)
              bad.push(`${tag}: вдоль ${got.minY} вместо ${gy} ${got.tight.join(" ")}`);
          }

    expect(bad).toEqual([]);
  });

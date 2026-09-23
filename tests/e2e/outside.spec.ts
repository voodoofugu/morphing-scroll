import { test, expect, Page } from "@playwright/test";

/*
 * Класс `ms-outside-<сторона>` говорит, за какую сторону окна объект уходит.
 * Стоит только та сторона, которая его режет: сколько срезано, говорит
 * `--ms-content-visibility`, а это — куда.
 */
const SIDES = ["top", "right", "bottom", "left"] as const;

/** стороны каждого объекта по порядку: ["bottom"], [] у того, кто виден весь */
const sides = (page: Page) =>
  page.evaluate(
    (names) =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map((el) =>
        names.filter((side) => el.classList.contains(`ms-outside-${side}`)),
      ),
    SIDES as unknown as string[],
  );

const open = async (page: Page, scenario: string) => {
  await page.goto(`/?scenario=${scenario}`);
  await expect(page.locator(".ms-viewport")).toBeVisible();
  await page.waitForTimeout(350);
};

const scrollTo = async (page: Page, x: number, y: number) => {
  await page.locator(".ms-viewport").evaluate(
    (el, to) => {
      el.scrollLeft = to.x;
      el.scrollTop = to.y;
    },
    { x, y },
  );
  await page.waitForTimeout(300);
};

test.describe("стороны ухода", () => {
  test("столбец: снизу низ, сверху верх", async ({ page }) => {
    await open(page, "outsideColumn");

    // окно 200, шаг 70: первые три целиком, четвёртый и дальше — за низом
    let all = await sides(page);
    expect(all[0]).toEqual([]);
    expect(all[3]).toEqual(["bottom"]);
    expect(all[11]).toEqual(["bottom"]);

    // уезжаем вниз: первые уходят за верх, последние подходят снизу
    await scrollTo(page, 0, 300);

    all = await sides(page);
    expect(all[0]).toEqual(["top"]);
    expect(all[11]).toEqual(["bottom"]);

    // в самый низ: за низом не остаётся никого
    await scrollTo(page, 0, 630);

    all = await sides(page);
    expect(all[11]).toEqual([]);
    expect(all[0]).toEqual(["top"]);
  });

  test("ряд: те же стороны, но левая и правая", async ({ page }) => {
    await open(page, "outsideRow");

    let all = await sides(page);
    expect(all[0]).toEqual([]);
    expect(all[11]).toEqual(["right"]);

    await scrollTo(page, 300, 0);

    all = await sides(page);
    expect(all[0]).toEqual(["left"]);
    expect(all[11]).toEqual(["right"]);
  });

  test("по оси, которой нет, сторон не называем", async ({ page }) => {
    await open(page, "outsideColumn");

    const all = await sides(page);
    const lateral = all.flat().filter((s) => s === "left" || s === "right");

    // столбец шире окна не бывает, но и спрашивать про боковые нечего
    expect(lateral).toEqual([]);
  });

  test("гибрид: двух сторон разом не боимся", async ({ page }) => {
    await open(page, "outsideHybrid");

    // сетка 4 в ряд по 70: последний в ряду за правым краем, нижние — за низом
    await scrollTo(page, 40, 40);

    const all = await sides(page);

    // угловой объект срезан сразу двумя сторонами
    expect(all[0].sort()).toEqual(["left", "top"]);
    expect(all.some((s) => s.length === 2)).toBe(true);
  });

  /*
   * Это сказано в описании пропса, значит должно быть правдой: объект, не
   * влезающий в окно, режут обе стороны — выбирать из них «главную» было бы
   * выдумкой.
   */
  test("объект выше окна назовёт обе стороны", async ({ page }) => {
    await open(page, "outsideTall");

    // первый стоит с самого верха: его режет только низ
    let all = await sides(page);
    expect(all[0]).toEqual(["bottom"]);

    // заезжаем в его середину — окно теперь внутри объекта
    await scrollTo(page, 0, 60);

    all = await sides(page);
    expect(all[0].sort()).toEqual(["bottom", "top"]);
  });

  test("развёрнутый ряд: стороны те, что видит глаз", async ({ page }) => {
    await open(page, "outsideFromRight");

    const box = (page: Page) =>
      page.evaluate(() => {
        const view = document.querySelector<HTMLElement>(".ms-viewport")!;
        const frame = view.getBoundingClientRect();
        const first = document
          .querySelector<HTMLElement>('[data-testid="o-0"]')!
          .getBoundingClientRect();

        return { viewLeft: frame.left, viewRight: frame.right, first };
      });

    const { viewRight, first } = await box(page);

    // первый объект развёрнутого ряда стоит у правого края окна
    expect(Math.round(first.right)).toBeLessThanOrEqual(Math.round(viewRight));

    let all = await sides(page);

    // значит уходят объекты за левый край, а не за правый
    expect(all[11]).toEqual(["left"]);
    expect(all[0]).toEqual([]);

    /*
     * И обратно. Развёрнутый ряд стоит в начале при наибольшем `scrollLeft`,
     * так что другой его конец — это ноль: там первый объект уходит уже за
     * правый край. Обе стороны названы, и ни одна не перепутана местами.
     */
    await page.locator(".ms-viewport").evaluate((el) => (el.scrollLeft = 0));
    await page.waitForTimeout(300);

    all = await sides(page);
    expect(all[0]).toEqual(["right"]);
    expect(all[11]).toEqual([]);
  });
});

/*
 * Отрисовка с запасом и видимость — разные вопросы, и это сказано в описании
 * пропса: `render.rootMargin` рисует объекты за краем заранее, но видно их от
 * этого не становится.
 */
test.describe("запас отрисовки", () => {
  test("нарисованный заранее объект не считается видимым", async ({ page }) => {
    await open(page, "visibilityPreloaded");

    const drawn = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map(
        (el) => ({
          place: el.getAttribute("ms-child"),
          visible: el.style.getPropertyValue("--ms-content-visibility"),
          sides: [...el.classList].filter((c) => c.startsWith("ms-outside")),
        }),
      ),
    );

    // запас в 300 рисует далеко за окном: объектов больше, чем помещается
    expect(drawn.length).toBeGreaterThan(4);

    // но те, кого не видно, говорят ноль — и называют сторону, за которой они
    const hidden = drawn.filter((box) => box.visible === "0");
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.every((box) => box.sides.includes("ms-outside-bottom"))).toBe(
      true,
    );
  });
});

/*
 * `ms-child` — место объекта в списке. Считается оно с единицы, тем же счётом,
 * каким его берёт `scrollToObject`: просят «десятый», а не «объект с индексом
 * десять». Сам список CSS не видит: `:nth-child()` считает боксы в документе,
 * а при виртуализации их горстка.
 */
test.describe("номер объекта", () => {
  const places = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map((el) =>
        el.getAttribute("ms-child"),
      ),
    );

  test("стоит у каждого и считает с единицы", async ({ page }) => {
    await open(page, "outsideColumn");

    expect(await places(page)).toEqual(
      Array.from({ length: 12 }, (_, i) => String(i + 1)),
    );
  });

  test("при виртуализации говорит место в списке, а не в разметке", async ({
    page,
  }) => {
    await open(page, "indexVirtual");

    const first = await places(page);

    // сверху окна первым лежит первый же объект списка
    expect(first[0]).toBe("1");
    expect(first.length).toBeLessThan(40); // рисуются не все

    await scrollTo(page, 0, 700);

    const later = await places(page);

    // уехали на десять шагов: в документе снова горстка, но номера уже другие
    expect(later[0]).toBe("11");
    expect(later.length).toBeLessThan(40);

    // и номера идут подряд, без дыр
    expect(later.map(Number)).toEqual(
      later.map((_, i) => Number(later[0]) + i),
    );
  });

  /*
   * Два счёта в библиотеке разошлись бы незаметно, поэтому связь проверяем
   * прямо: к какому объекту уехал `scrollToObject`, тот номер и стоит.
   */
  test("тот же номер, что берёт scrollToObject", async ({ page }) => {
    await page.goto("/?scenario=focusCommand");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(350);

    await page.evaluate(() =>
      (window as any).__ms.scrollToObject(7, { duration: 0 }),
    );
    await page.waitForTimeout(400);

    const atTop = await page.evaluate(() => {
      const view = document.querySelector<HTMLElement>(".ms-viewport")!;
      const frame = view.getBoundingClientRect();

      return [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
        .filter((el) => {
          const box = el.getBoundingClientRect();

          return Math.abs(box.top - frame.top) < 2;
        })
        .map((el) => el.getAttribute("ms-child"));
    });

    /*
     * В этом списке по два объекта в ряду, и к началу окна встаёт весь ряд:
     * седьмой и восьмой. Проверяем оба — «седьмой где-то среди них» прошло бы
     * и при счёте с нуля, где тем же рядом были бы шестой и седьмой.
     */
    expect(atTop).toEqual(["7", "8"]);
  });
});

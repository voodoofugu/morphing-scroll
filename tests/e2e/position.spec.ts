import { test, expect, Page } from "@playwright/test";

const scrollTopOf = (page: Page) =>
  page.locator(".ms-viewport").evaluate((el) => (el as HTMLElement).scrollTop);

test.describe("MorphScroll initialPosition and stickToEnd (real browser)", () => {
  test("a number opens the scroll at that offset", async ({ page }) => {
    await page.goto("/?scenario=initialPosNumber");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await expect.poll(() => scrollTopOf(page)).toBe(200);
  });

  test("stickToEnd opens at the bottom", async ({ page }) => {
    await page.goto("/?scenario=stickToEnd");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    // wrapper 700 - viewport 300 => max scroll 400
    await expect.poll(() => scrollTopOf(page)).toBe(400);
  });
});

test.describe("MorphScroll sliderMenu (real browser)", () => {
  test("renders one slider element per page and marks the first active", async ({
    page,
  }) => {
    await page.goto("/?scenario=sliderMenu");
    const dots = page.locator(".ms-slider-item");
    await expect(dots).toHaveCount(20);
    await expect(dots.first()).toHaveClass(/\bms-active\b/);
  });

  test("clicking a later slider element scrolls toward it", async ({ page }) => {
    await page.goto("/?scenario=sliderMenu");
    const dots = page.locator(".ms-slider-item");
    await dots.nth(3).click();
    // neededSize (300) * index (3) = 900
    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(500);
  });

  /*
   * onNavigate различает, кто перелистнул страницу. Клик по точке и колесо
   * приводят к одному и тому же переходу, и отличаются они только причиной —
   * ради неё событие и существует.
   */
  const navigateLog = (page: Page) =>
    page.evaluate(
      () =>
        ((window as unknown as { __navigate?: unknown[] }).__navigate ??
          []) as { reason: string; axis: string; from: number; to: number }[],
    );

  test("onNavigate blames the bar for a click on a dot", async ({ page }) => {
    await page.goto("/?scenario=sliderMenu");
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);
    expect(await navigateLog(page)).toEqual([]); // первая раскладка — не переход

    await page.locator(".ms-slider-item").nth(3).click();

    await expect.poll(async () => (await navigateLog(page)).at(-1)).toMatchObject({
      reason: "bar",
      axis: "y",
      from: 0,
      to: 3,
    });

    /*
     * Один клик — одно событие. По дороге к четвёртой странице скролл проходит
     * через вторую и третью, и если отчитываться о каждой пройденной, на один
     * клик придётся три звука.
     */
    expect(await navigateLog(page)).toHaveLength(1);
  });

  /*
   * И отчитывается нажатие сразу, а не по приезде. Звук на смену страницы
   * вешают на это событие, и опоздав, он звучал уже после того, как страница
   * сменилась: стрелка щёлкала под палец, а точка — вдогонку.
   */
  test("нажатие на точку отчитывается до конца переезда", async ({ page }) => {
    const config = {
      count: 6,
      size: 300,
      mode: "sliderMenu", // нажатие живёт там
      objects: { size: "full" },
      controls: { bar: "@dot" },
      duration: 1500, // длинный переезд: успеть спросить в дороге
    };

    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(config))}`,
    );
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);

    await page.locator(".ms-slider-item").nth(3).click();

    // один заход в браузер: между двумя вопросами скролл успеет доехать
    const inFlight = await page.evaluate(() => ({
      log: ((window as unknown as { __navigate?: unknown[] }).__navigate ?? [])
        .length,
      top: document.querySelector<HTMLElement>(".ms-viewport")!.scrollTop,
    }));

    expect(inFlight.top, "скролл уже доехал — проверять нечего").toBeLessThan(
      600,
    );
    expect(inFlight.log, "о переходе ещё не отчитались").toBe(1);

    // и по приезде второго события не появляется
    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(890);
    expect(await navigateLog(page)).toHaveLength(1);
  });

  /* колесо над слайдером листает страницу — это просьба, и след у неё свой */
  test("onNavigate blames the wheel for a notch over a slider", async ({
    page,
  }) => {
    await page.goto("/?scenario=sliderMenu");
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);
    // обработчик колеса пересобирается рендером после измерения
    await page.waitForTimeout(300);

    await page.locator(".ms-viewport").hover();
    await page.mouse.wheel(0, 400);

    await expect.poll(async () => (await navigateLog(page)).at(-1)).toMatchObject({
      reason: "wheel",
      from: 0,
      to: 1,
    });
  });

  /*
   * А `"scroll"` остаётся за тем, что доехало само: тягу никто не называл
   * стрелкой или точкой, и страница у неё случается по пути.
   */
  test("onNavigate calls a drag that landed on a page a plain scroll", async ({
    page,
  }) => {
    const config = {
      count: 8,
      size: 300,
      mode: "sliderMenu",
      objects: { size: "full" },
      controls: { drag: true, bar: "@dot" },
      duration: 80,
    };

    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(config))}`,
    );
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);

    const box = (await page.locator(".ms-viewport").boundingBox())!;
    const x = box.x + box.width / 2;

    await page.mouse.move(x, box.y + box.height - 20);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++)
      await page.mouse.move(x, box.y + box.height - 20 - i * 26);
    await page.mouse.up();

    await expect.poll(async () => (await navigateLog(page)).at(-1)).toMatchObject({
      reason: "scroll",
    });
  });
});

/*
 * Три замера на глаз к перебору из `scrollToObject.spec.ts`: правило там
 * проверяется правилом, а здесь видно, как оно выглядит в пикселях.
 */
test.describe("MorphScroll scrollToObject: where it lands", () => {
  const RIG = {
    count: 300,
    direction: "hybrid",
    size: [720, 460],
    objects: { size: [150, 112], gap: 12, lines: 20 },
    wrapper: { margin: [12, 12, 12, 12] },
    controls: { wheel: true },
    render: { mode: "virtual", rootMargin: 160 },
    duration: 0,
  };

  const open = async (page: Page) => {
    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(RIG))}`,
    );
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".ms-viewport")
          .evaluate((el) => el.scrollHeight - el.clientHeight),
      )
      .toBeGreaterThan(0);
  };

  /* объект 151 — середина сетки: и слева, и сверху от него ещё есть куда ехать */
  const goTo = async (page: Page, align: unknown) => {
    await page.evaluate(
      (a) =>
        (
          window as unknown as {
            __ms: { scrollToObject: (t: number, o: object) => void };
          }
        ).__ms.scrollToObject(151, { align: a, duration: 0 }),
      align,
    );

    return expect
      .poll(() =>
        page.evaluate(() => {
          const view = document.querySelector<HTMLElement>(".ms-viewport")!;
          const frame = view.getBoundingClientRect();
          const box = [
            ...document.querySelectorAll<HTMLElement>(".ms-object-box"),
          ].find((el) => el.textContent === "150");

          if (!box) return null;

          const r = box.getBoundingClientRect();

          return [
            Math.round(r.left - frame.left),
            Math.round(frame.right - r.right),
            Math.round(r.top - frame.top),
            Math.round(frame.bottom - r.bottom),
          ];
        }),
      )
      .toEqual;
  };

  /* поле обёртки остаётся с той стороны, к которой прижимаются */
  test('"start" keeps the margin the list keeps at its start', async ({
    page,
  }) => {
    await open(page);
    await (await goTo(page, "start"))([12, 558, 12, 336]);
  });

  test('"end" keeps the margin the list keeps at its end', async ({ page }) => {
    await open(page);
    await (await goTo(page, "end"))([558, 12, 336, 12]);
  });

  /* при двух осях у каждой своё место в окне */
  test("a pair places the axes apart", async ({ page }) => {
    await open(page);
    await (await goTo(page, ["center", "end"]))([285, 285, 336, 12]);
  });
});

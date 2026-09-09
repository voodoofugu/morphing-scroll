import { test, expect, Page } from "@playwright/test";

const scrollTopOf = (page: Page, selector = ".ms-viewport") =>
  page.locator(selector).evaluate((el) => (el as HTMLElement).scrollTop);

const scrollLeftOf = (page: Page, selector = ".ms-viewport") =>
  page.locator(selector).evaluate((el) => (el as HTMLElement).scrollLeft);

type NavigateLog = { reason: string; axis: string; from: number; to: number }[];
const navigateLog = (page: Page) =>
  page.evaluate(
    () =>
      ((window as unknown as { __navigate?: unknown[] }).__navigate ??
        []) as NavigateLog,
  );

test.describe("MorphScroll physics (real browser)", () => {
  test("wheel scrolls the content vertically", async ({ page }) => {
    await page.goto("/?scenario=wheel");
    const el = page.locator(".ms-viewport");
    await expect(el).toBeVisible();

    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 400);

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);
  });

  test("wheel reports offsets through onScrollPosition", async ({ page }) => {
    await page.goto("/?scenario=wheel");
    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 400);

    await expect
      .poll(() => page.evaluate(() => (window as any).__scroll?.top ?? 0))
      .toBeGreaterThan(50);
  });

  test("the wheel over the bar leaves the page where it was", async ({
    page,
  }) => {
    await page.goto("/?scenario=barWheel");
    const bar = page.locator(".ms-bar");
    await expect(bar).toBeVisible();

    const box = await bar.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 400);

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);

    // страницу браузер катит своим ходом и не сразу — ждём, прежде чем верить
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("clicking the bottom arrow scrolls down", async ({ page }) => {
    await page.goto("/?scenario=arrows");
    const bottomArrow = page.locator(".ms-arrow-box.ms-bottom");
    await expect(bottomArrow).toBeVisible();
    await bottomArrow.click();

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);
  });

  /*
   * Три нажатия подряд доезжают одним движением: второе и третье попадают в
   * середину полёта первого. Считать шаг и отчитываться надо всё равно за
   * каждое — иначе быстрый человек листает медленнее спокойного.
   */
  test("a burst of arrow clicks turns a page each", async ({ page }) => {
    await page.goto("/?scenario=arrowsBurst");
    const down = page.locator(".ms-arrow-box.ms-bottom");
    await expect(down).toBeVisible();

    await page.evaluate(
      () => ((window as unknown as { __navigate: unknown[] }).__navigate = []),
    );

    await down.click();
    await down.click();
    await down.click();

    await expect.poll(() => scrollTopOf(page)).toBe(900);

    expect((await navigateLog(page)).map((e) => [e.from, e.to])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  test("the arrow steps by the window the arrows left behind", async ({
    page,
  }) => {
    await page.goto("/?scenario=arrowsReserved");
    const view = page.locator(".ms-viewport");
    // стрелки забрали по 40 с каждой стороны: окно 40, а не 120
    expect(await view.evaluate((el) => el.clientWidth)).toBe(40);

    await page.locator(".ms-arrow-box.ms-right").click();

    await expect.poll(() => scrollLeftOf(page)).toBe(40);
  });

  test("a command lands when only the layout knows the height", async ({
    page,
  }) => {
    await page.goto("/?scenario=commandOnNone");
    const view = page.locator(".ms-viewport");
    await expect(view).toBeVisible();

    await page.getByTestId("go-end").click();

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);
  });

  test("dragging the thumb scrolls the content", async ({ page }) => {
    await page.goto("/?scenario=thumb");
    const thumb = page.locator(".ms-thumb");
    await expect(thumb).toBeVisible();

    const box = await thumb.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 120, { steps: 8 });
    await page.mouse.up();

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(50);
  });

  test("content drag (grab) scrolls the content", async ({ page }) => {
    await page.goto("/?scenario=contentDrag");
    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();

    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // drag content upward -> scroll down
    await page.mouse.move(cx, cy - 150, { steps: 10 });
    await page.mouse.up();

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(20);
  });
});

test.describe("MorphScroll virtualization (real browser)", () => {
  test("virtual unmounts items scrolled out of view", async ({ page }) => {
    await page.goto("/?scenario=virtual");
    await expect(page.getByTestId("item-0")).toBeVisible();

    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    // scroll far past the first rows
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 400);

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(200);
    // the top item is removed from the DOM under virtualization
    await expect(page.getByTestId("item-0")).toHaveCount(0);
  });

  test("lazy keeps already-loaded items mounted after scrolling away", async ({
    page,
  }) => {
    await page.goto("/?scenario=lazy");
    // lazy needs a tick to paint the first visible items
    await expect(page.getByTestId("item-0")).toBeVisible();

    const el = page.locator(".ms-viewport");
    const box = await el.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 400);

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(200);
    // item-0 was loaded once, so lazy keeps it mounted (unlike virtual)
    await expect(page.getByTestId("item-0")).toHaveCount(1);
  });
});

/*
 * Клавиши работают только когда скролл в фокусе, а фокус в jsdom ведёт себя
 * иначе, чем в браузере, — поэтому проверка здесь.
 */
test.describe("MorphScroll keys (real browser)", () => {
  test("arrow keys nudge the content in pan mode", async ({ page }) => {
    await page.goto("/?scenario=keys");
    const viewport = page.locator(".ms-viewport");

    await viewport.click();
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => scrollTopOf(page)).toBe(60);

    await page.keyboard.press("ArrowDown");
    await expect.poll(() => scrollTopOf(page)).toBe(120);

    await page.keyboard.press("ArrowUp");
    await expect.poll(() => scrollTopOf(page)).toBe(60);
  });

  test("a slider pages instead, and says the keys did it", async ({ page }) => {
    await page.goto("/?scenario=keysStep");
    await expect(page.locator(".ms-slider-item.ms-active")).toHaveCount(1);

    await page.locator(".ms-viewport").click();
    await page.keyboard.press("ArrowDown");

    await expect.poll(() => scrollTopOf(page)).toBe(300);
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            ((window as unknown as { __navigate?: unknown[] }).__navigate ??
              []) as { reason: string; to: number }[],
        ),
      )
      .toMatchObject([{ reason: "keys", to: 1 }]);
  });

  test("does nothing without focus", async ({ page }) => {
    await page.goto("/?scenario=keys");
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    expect(await scrollTopOf(page)).toBe(0);
  });
});

test.describe("MorphScroll: a command on mount (real browser)", () => {
  test("lands when the sizes come from the props", async ({ page }) => {
    await page.goto("/?scenario=commandOnMount");

    await expect.poll(() => scrollTopOf(page)).toBe(600);
  });

  test("lands when the sizes have to be measured first", async ({ page }) => {
    await page.goto("/?scenario=commandOnMountMeasured");

    await expect.poll(() => scrollTopOf(page)).toBe(600);
  });

  test("the declarative position lands on measured sizes too", async ({
    page,
  }) => {
    await page.goto("/?scenario=positionOnMountMeasured");

    await expect.poll(() => scrollTopOf(page)).toBe(600);
  });

  /*
   * A handle picked up once has to keep working. Sizes that are measured
   * arrive after the first render, and a handle rebuilt on them leaves the
   * kept one holding zeroes — every target then clamps to where the scroll
   * already is, so the call goes through and does nothing at all. A command
   * that fails silently is the worst kind.
   */
  test("a handle kept from mount still moves once sizes are measured", async ({
    page,
  }) => {
    await page.goto("/?scenario=handleKept");
    await page.waitForTimeout(400);

    await page.evaluate(() =>
      (
        window as unknown as { __kept: { pan: (d: object, o: object) => void } }
      ).__kept.pan({ y: 120 }, { duration: 0 }),
    );

    await expect.poll(() => scrollTopOf(page)).toBe(120);
  });
});

test.describe("MorphScroll keys: focus (real browser)", () => {
  const focused = (page: Page) =>
    page.evaluate(() => document.activeElement?.textContent ?? "");

  test("the first arrow takes what is on screen, the next moves on", async ({
    page,
  }) => {
    await page.goto("/?scenario=keysFocus");
    await page.locator(".ms-viewport").click({ position: { x: 250, y: 20 } });

    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toBe("item 0");

    // сетка в два столбца: вниз — это через строку
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toBe("item 2");
  });

  test("sideways works in a vertical list too", async ({ page }) => {
    await page.goto("/?scenario=keysFocus");
    await page.locator(".ms-viewport").click({ position: { x: 250, y: 20 } });

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");

    expect(await focused(page)).toBe("item 1");
  });

  test("the scroll follows the focus out of view", async ({ page }) => {
    await page.goto("/?scenario=keysFocus");
    await page.locator(".ms-viewport").click({ position: { x: 250, y: 20 } });

    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowDown");

    await expect.poll(() => scrollTopOf(page)).toBeGreaterThan(100);
    expect(await focused(page)).toBe("item 10");

    // и уехало ровно настолько, что бы объект попал в окно, а не на страницу
    await expect.poll(() => scrollTopOf(page)).toBeLessThan(400);
  });

  /*
   * Окно 300, объекты по 100, зазор 20, поля обёртки 40: третий объект лежит
   * на 280..380, и что бы он поместился, хватило бы 80 — но тогда он встанет
   * вплотную к краю, хотя за ним есть зазор.
   */
  test("stops a gap short of the edge, not against it", async ({ page }) => {
    await page.goto("/?scenario=keysFocusSpaced");
    await page.locator(".ms-viewport").click({ position: { x: 250, y: 20 } });

    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");

    expect(await focused(page)).toBe("item 2");
    await expect.poll(() => scrollTopOf(page)).toBe(100);
  });

  test("opens the whole margin at the end of the run", async ({ page }) => {
    await page.goto("/?scenario=keysFocusSpaced");
    await page.locator(".ms-viewport").click({ position: { x: 250, y: 20 } });

    for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowDown");

    expect(await focused(page)).toBe("item 19");
    // 40 + 20*100 + 19*20 + 40 - 300: за последним объектом уже не зазор, а поле
    await expect.poll(() => scrollTopOf(page)).toBe(2160);
  });

  test("lands a window-sized object on the edge, gap and all", async ({
    page,
  }) => {
    await page.goto("/?scenario=keysFocusFull");
    await page.locator(".ms-viewport").click({ position: { x: 150, y: 20 } });

    await page.keyboard.press("ArrowRight"); // берёт то, что на экране
    await page.keyboard.press("ArrowRight"); // и переходит на следующий

    // окно 300 плюс зазор 20 — ровно шаг страницы, без довеска
    await expect
      .poll(() => page.evaluate(() => (window as any).__scroll?.left ?? 0))
      .toBe(320);
  });

  test("moveFocus does the same for a device the library never heard of", async ({
    page,
  }) => {
    await page.goto("/?scenario=focusCommand");

    await page.evaluate(() => (window as any).__ms.moveFocus("bottom"));
    expect(await focused(page)).toBe("item 0");

    await page.evaluate(() =>
      (window as any).__ms.moveFocus("bottom", { reason: "gamepad" }),
    );
    expect(await focused(page)).toBe("item 2");
  });
});

/*
 * Наружу пропускает не только тот, кому прокручивать нечего вовсе. Упереться
 * в свой край можно и на ходу — и там прежде начиналась резинка: палец
 * продолжает вести, а не едет никто. Нативный тач в этом месте отдаёт
 * внешнему, и отдавать надо так же.
 */
test.describe("MorphScroll: a gesture handed outward mid-move", () => {
  const positions = (page: import("@playwright/test").Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-viewport")].map((el) => ({
        inner: el.clientHeight === 120,
        at: Math.round(el.scrollTop),
        most: el.scrollHeight - el.clientHeight,
      })),
    );

  test("the outer takes over the moment the inner runs out", async ({
    page,
  }) => {
    await page.goto("/?scenario=nestedHandOff");
    await page.waitForTimeout(300);

    const start = await positions(page);
    const inner = start.find((one) => one.inner)!;
    const outer = start.find((one) => !one.inner)!;

    // обе прокрутки живые, иначе проверять нечего
    expect(inner.most).toBeGreaterThan(0);
    expect(outer.most).toBeGreaterThan(0);
    expect(outer.at).toBe(0);

    const host = (await page
      .locator('[data-testid="inner-host"]')
      .boundingBox())!;
    const cx = host.x + host.width / 2;
    const cy = host.y + host.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(cx, cy - i * 14, { steps: 1 });
      await page.waitForTimeout(10);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);

    const end = await positions(page);
    const innerEnd = end.find((one) => one.inner)!;
    const outerEnd = end.find((one) => !one.inner)!;

    // внутренний доехал до своего конца и там остановился
    expect(innerEnd.at).toBe(innerEnd.most);
    // а дальше повёл внешний — и повёл заметно, а не на пару пикселей
    expect(outerEnd.at).toBeGreaterThan(100);
  });
});

/*
 * Содержимое редко делится на окно нацело: последняя страница выходит короче
 * прочих, и позиция там прижата к концу, а не стоит на целой странице.
 * Отсчитывать от неё вниз нельзя — шаг назад перепрыгивал через страницу.
 */
test.describe("MorphScroll: a last page shorter than the rest", () => {
  const at = (page: import("@playwright/test").Page) =>
    page.locator(".ms-viewport").evaluate((el) => Math.round(el.scrollLeft));

  const step = async (
    page: import("@playwright/test").Page,
    side: "left" | "right",
  ) => {
    await page.evaluate(
      (to) =>
        (
          window as unknown as { __ms: { step: (s: string) => void } }
        ).__ms.step(to),
      side,
    );
    await page.waitForTimeout(350);
  };

  test("stepping back from the end goes one page, not two", async ({
    page,
  }) => {
    const props = {
      count: 12,
      size: [680, 200],
      direction: "x",
      mode: "slider",
      objects: { size: 170, gap: 12 },
      controls: { wheel: true, bar: "@dot" },
    };

    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(props))}`,
    );
    await page.waitForTimeout(350);

    const forward: number[] = [];

    for (let i = 0; i < 3; i++) {
      await step(page, "right");
      forward.push(await at(page));
    }

    const back: number[] = [];

    for (let i = 0; i < 3; i++) {
      await step(page, "left");
      back.push(await at(page));
    }

    // последний шаг вперёд упирается в конец, он короче страницы
    expect(forward[2]).toBeGreaterThan(forward[1]);

    // а назад идём теми же станциями, ни одной не пропустив
    expect(back).toEqual([forward[1], forward[0], 0]);
  });
});

/*
 * У слайдера страницы, а не пиксели, и колесо должно попадать в них так же,
 * как стрелка или точка на полосе. Свободная прокрутка оставляла между
 * страницами — на экране половина одной и половина другой, а пометка при этом
 * уже показывала на соседнюю.
 */
test.describe("MorphScroll: the wheel over a slider", () => {
  const config = (mode: string) => ({
    count: 8,
    size: 300,
    mode,
    objects: { size: "full" },
    controls: { wheel: true, bar: "@dot" },
    duration: 80,
  });

  const url = (mode: string) =>
    `/?scenario=crash&props=${encodeURIComponent(
      JSON.stringify(config(mode)),
    )}`;

  const over = async (page: Page) => {
    const box = (await page.locator(".ms-viewport").boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  };

  const active = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll(".ms-slider-item")].findIndex((el) =>
        el.classList.contains("ms-active"),
      ),
    );

  /* оба режима листают: меню — такой же слайдер, только полосу не тянут */
  for (const mode of ["slider", "sliderMenu"] as const)
    test(`${mode}: one notch turns one page`, async ({ page }) => {
      await page.goto(url(mode));
      await expect(page.locator(".ms-viewport")).toBeVisible();
      // размер страницы меряется по окну — до этого листать нечем
      await expect
        .poll(() =>
          page
            .locator(".ms-viewport")
            .evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBe(2100);
      // размер уже в разметке, но обработчик колеса пересоберётся рендером
      await page.waitForTimeout(300);
      await over(page);

      await page.mouse.wheel(0, 100); // деления хватает любого
      await expect.poll(() => scrollTopOf(page)).toBe(300);
      expect(await active(page)).toBe(1);

      await page.waitForTimeout(250);
      await page.mouse.wheel(0, 100);
      await expect.poll(() => scrollTopOf(page)).toBe(600);
      expect(await active(page)).toBe(2);

      expect((await navigateLog(page)).map((e) => [e.reason, e.to])).toEqual([
        ["wheel", 1],
        ["wheel", 2],
      ]);
    });

  /*
   * И над самой полосой тоже: она была единственным местом, где то же
   * движение везло пиксели и оставляло между страницами.
   */
  for (const mode of ["slider", "sliderMenu"] as const)
    test(`${mode}: a notch over the strip turns a page too`, async ({
      page,
    }) => {
      await page.goto(url(mode));
      await expect(page.locator(".ms-slider")).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator(".ms-viewport")
            .evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBe(2100);
      await page.waitForTimeout(300);

      const bar = (await page.locator(".ms-slider").boundingBox())!;
      await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);

      await page.mouse.wheel(0, 100);
      await expect.poll(() => scrollTopOf(page)).toBe(300);

      await page.waitForTimeout(250);
      await page.mouse.wheel(0, 100);
      await expect.poll(() => scrollTopOf(page)).toBe(600);
    });

  /*
   * Нажатие — механика меню, и обещать его слайдеру нечем: полосу там тянут,
   * и курсор должен говорить об этом, а не о клике.
   */
  test("the strip promises the gesture it actually has", async ({ page }) => {
    for (const mode of ["slider", "sliderMenu"] as const) {
      await page.goto(url(mode));
      await expect(page.locator(".ms-slider-item").first()).toBeVisible();

      const cursor = await page
        .locator(".ms-slider-item")
        .first()
        .evaluate((el) => getComputedStyle(el).cursor);

      expect(cursor, `${mode}: курсор обещает не тот жест`).toBe(
        mode === "sliderMenu" ? "pointer" : "grab",
      );
    }
  });

  /* и тяга содержимого прилипает к странице в обоих режимах */
  test("sliderMenu: a drag settles on a page too", async ({ page }) => {
    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(
        JSON.stringify({ ...config("sliderMenu"), controls: { drag: true, bar: "@dot" } }),
      )}`,
    );
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".ms-viewport")
          .evaluate((el) => el.scrollHeight - el.clientHeight),
      )
      .toBe(2100);
    await page.waitForTimeout(300);

    const box = (await page.locator(".ms-viewport").boundingBox())!;
    const x = box.x + box.width / 2;

    await page.mouse.move(x, box.y + box.height - 20);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++)
      await page.mouse.move(x, box.y + box.height - 20 - i * 26);

    // содержимое идёт за пальцем, а не ждёт отпускания
    expect(await scrollTopOf(page), "содержимое не пошло за пальцем").toBeGreaterThan(
      100,
    );

    await page.mouse.up();

    await expect.poll(() => scrollTopOf(page)).toBe(300);
  });

  /*
   * У трекпада на один жест приходятся десятки событий. Считай их все — и
   * список пролетает насквозь от одного движения пальцем.
   */
  test("a trackpad burst does not fly through the list", async ({ page }) => {
    await page.goto(url("slider"));
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".ms-viewport")
          .evaluate((el) => el.scrollHeight - el.clientHeight),
      )
      .toBe(2100);
    await page.waitForTimeout(300);
    await over(page);

    for (let i = 0; i < 10; i++) await page.mouse.wheel(0, 30);
    await page.waitForTimeout(500);

    const at = await scrollTopOf(page);

    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThanOrEqual(900); // десять событий — не десять страниц
    expect(at % 300).toBe(0); // и всё равно ровно на странице
  });
});

/*
 * Упёршись в край, скролл отдаёт колесо наружу — но не в тот же миг. Пока его
 * крутят, оно остаётся за тем, кто его вёл: так ведёт себя нативная прокрутка,
 * а иначе страница под списком трогается ровно в тот кадр, в котором список
 * кончился.
 */
test.describe("MorphScroll: the wheel at the very end", () => {
  const escaped = (page: Page) =>
    page.evaluate(() => (window as unknown as { __out: number }).__out);

  for (const mode of ["scroll", "slider"] as const)
    test(`${mode}: keeps the wheel while it is being turned`, async ({
      page,
    }) => {
      const config = {
        count: 8,
        size: 300,
        mode,
        objects: { size: "full" },
        controls: { wheel: true, bar: mode === "scroll" ? "@thumb" : "@dot" },
        duration: 80,
      };

      await page.goto(
        `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(config))}`,
      );
      await expect(page.locator(".ms-viewport")).toBeVisible();

      await expect
        .poll(() =>
          page
            .locator(".ms-viewport")
            .evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBe(2100);
      await page.waitForTimeout(300);

      const box = (await page.locator(".ms-viewport").boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

      await page.evaluate(() => {
        (window as unknown as { __out: number }).__out = 0;
        document.addEventListener(
          "wheel",
          () => (window as unknown as { __out: number }).__out++,
          { passive: true },
        );
      });

      // один жест: доезжаем до конца и продолжаем крутить
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(50);
      }

      expect(await scrollTopOf(page)).toBe(2100); // конец
      expect(await escaped(page), "колесо ушло наружу посреди жеста").toBe(0);

      // жест кончился — следующее деление достаётся тому, кто снаружи
      await page.waitForTimeout(500);
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(150);

      expect(await escaped(page), "колесо не отдали и после паузы").toBe(1);
    });
});

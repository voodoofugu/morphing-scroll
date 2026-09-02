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

import { test, expect, Page, Locator } from "@playwright/test";

/**
 * Touch physics. The integrator behind inertia is unit-tested; what only a
 * real device can show is the handoff — a flick ends, the finger is gone, and
 * the content keeps moving on its own.
 *
 * Playwright's touchscreen only taps, so the gesture goes through CDP, which
 * produces genuine input events and therefore genuine pointer events.
 */
const scrollTop = (el: Locator) =>
  el.evaluate((n) => (n as HTMLElement).scrollTop);

type Point = { x: number; y: number };

const swipe = async (
  page: Page,
  from: Point,
  to: Point,
  { steps = 6, stepDelay = 8, holdBeforeRelease = 0 } = {},
) => {
  const client = await page.context().newCDPSession(page);
  const send = (type: string, points: Point[]) =>
    client.send("Input.dispatchTouchEvent", {
      type: type as "touchStart",
      touchPoints: points.map((p) => ({ x: p.x, y: p.y })),
    });

  await send("touchStart", [from]);
  for (let i = 1; i <= steps; i++) {
    await send("touchMove", [
      {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      },
    ]);
    await page.waitForTimeout(stepDelay);
  }
  if (holdBeforeRelease) await page.waitForTimeout(holdBeforeRelease);
  await send("touchEnd", []);
};

const openScroll = async (page: Page) => {
  await page.goto("/?scenario=wheel");
  const el = page.locator(".ms-viewport");
  await expect(el).toBeVisible();
  return { el, box: (await el.boundingBox())! };
};

test.describe("MorphScroll touch (real device emulation)", () => {
  test("drags the content with a finger", async ({ page }) => {
    const { el, box } = await openScroll(page);

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 40 },
      { stepDelay: 40 }, // slow enough that inertia does not kick in
    );

    expect(await scrollTop(el)).toBeGreaterThan(100);
  });

  test("keeps going after a flick, then settles", async ({ page }) => {
    const { el, box } = await openScroll(page);

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 20 },
    );

    const atRelease = await scrollTop(el);

    // the finger is gone; the content should still be travelling
    await expect
      .poll(() => scrollTop(el), { timeout: 2000 })
      .toBeGreaterThan(atRelease);

    // and it has to stop on its own
    await page.waitForTimeout(1200);
    const settled = await scrollTop(el);
    await page.waitForTimeout(300);
    expect(await scrollTop(el)).toBe(settled);
  });

  test("does not coast when the finger rests before lifting", async ({
    page,
  }) => {
    const { el, box } = await openScroll(page);

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 20 },
      { holdBeforeRelease: 400 }, // past INERTIA_RELEASE_TIMEOUT
    );

    const atRelease = await scrollTop(el);
    await page.waitForTimeout(400);

    expect(await scrollTop(el)).toBe(atRelease);
  });

  test("a tap still reaches the content underneath", async ({ page }) => {
    await page.goto("/?scenario=wheel");
    const first = page.getByTestId("item-0");
    await expect(first).toBeVisible();

    const box = (await first.boundingBox())!;
    // a press that moves under the 2px threshold stays a tap
    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      { x: box.x + box.width / 2, y: box.y + box.height / 2 - 1 },
      { steps: 1 },
    );

    expect(
      await page.locator(".ms-viewport").evaluate((n) => (n as HTMLElement).scrollTop),
    ).toBe(0);
  });
});

/*
 * Два места, где поведение поменялось и где палец — основной способ работы.
 */
test.describe("MorphScroll touch: nesting and taps", () => {
  test("палец двигает тот список, на котором лежит", async ({ page }) => {
    await page.goto("/?scenario=nestedTouch");

    const views = page.locator(".ms-viewport");
    const outer = views.nth(0);
    const inner = views.nth(1);
    await expect(inner).toBeVisible();

    const box = (await inner.boundingBox())!;

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 20 },
      { stepDelay: 40 },
    );
    await page.waitForTimeout(400);

    expect(await scrollTop(inner)).toBeGreaterThan(0);
    expect(await scrollTop(outer)).toBe(0);
  });

  test("пункт меню отзывается на нажатие пальцем", async ({ page }) => {
    await page.goto("/?scenario=sliderTapTouch");

    const dots = page.locator(".ms-slider-item");
    await expect(dots.first()).toBeVisible();

    await dots.nth(2).tap();
    await page.waitForTimeout(400);

    expect(await scrollTop(page.locator(".ms-viewport"))).toBe(600);
  });
});

/*
 * Владение инерцией переходит вместе с жестом: бросок докатывается у того,
 * кто вёл в момент отпускания, а не пропадает вместе с передачей.
 */
test("a flick handed outward coasts in the scroll that took it", async ({
  page,
}) => {
  await page.goto("/?scenario=nestedHandOff");
  await page.waitForTimeout(300);

  const outerAt = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLElement>(".ms-viewport")].find(
          (el) => el.clientHeight !== 120,
        )!.scrollTop,
    );

  const host = (await page.locator('[data-testid="inner-host"]').boundingBox())!;
  const cx = Math.round(host.x + host.width / 2);
  const cy = Math.round(host.y + host.height / 2);

  const client = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", y: number) =>
    client.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x: cx, y }],
    });

  await touch("touchStart", cy);
  for (let i = 1; i <= 14; i++) {
    await touch("touchMove", cy - i * 22);
    await page.waitForTimeout(10);
  }

  const onRelease = await outerAt();

  await touch("touchEnd", 0);
  await page.waitForTimeout(900);

  // палец отпустили на ходу — внешний обязан докатиться сам
  expect(await outerAt()).toBeGreaterThan(onRelease + 40);
});

/*
 * То же правило для пальца: лента посреди вертикального списка берёт только
 * горизонтальный свайп, а вертикальный уходит списку снаружи.
 */
test.describe("ось жеста: палец", () => {
  const openStrip = async (page: Page, scenario = "nestedCross") => {
    await page.goto(`/?scenario=${scenario}`);
    await expect(page.locator(".ms-viewport").nth(1)).toBeVisible();
    await page.waitForTimeout(350);

    const b = (await page.locator('[data-testid="strip-host"]').boundingBox())!;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };

  const at = (page: Page) =>
    page.evaluate(() => {
      const [outer, strip] = [...document.querySelectorAll<HTMLElement>(".ms-viewport")];
      return { outer: outer.scrollTop, strip: strip.scrollLeft };
    });

  test("вертикальный свайп над лентой ведёт внешний список", async ({ page }) => {
    const c = await openStrip(page);

    await swipe(page, { x: c.x, y: c.y + 40 }, { x: c.x + 3, y: c.y - 80 }, { steps: 10, stepDelay: 30 });
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.outer).toBeGreaterThan(30);
    expect(got.strip).toBe(0);
  });

  test("горизонтальный свайп по-прежнему ведёт ленту", async ({ page }) => {
    const c = await openStrip(page);

    await swipe(page, { x: c.x + 100, y: c.y }, { x: c.x - 100, y: c.y + 3 }, { steps: 10, stepDelay: 30 });
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.strip).toBeGreaterThan(30);
    expect(got.outer).toBe(0);
  });

  /*
   * С нативным баром окно внешнего — настоящий скроллер. Отдай вложенная
   * лента пан браузеру, он отнял бы свайп на полпути: отменил бы указатель и
   * повёл внешний сам, мимо его инерции. Поэтому вложенная пан не отдаёт.
   */
  test("внешний с нативным баром не теряет свайп", async ({ page }) => {
    const c = await openStrip(page, "nestedCrossNative");
    await page.evaluate(() => {
      const w = window as Window & { cancels?: number };
      w.cancels = 0;
      document.addEventListener("pointercancel", () => w.cancels!++, true);
    });

    await swipe(page, { x: c.x, y: c.y + 40 }, { x: c.x + 3, y: c.y - 80 }, { steps: 10, stepDelay: 30 });
    await page.waitForTimeout(500);

    const got = await at(page);
    const cancels = await page.evaluate(
      () => (window as Window & { cancels?: number }).cancels,
    );
    expect(cancels).toBe(0);
    expect(got.outer).toBeGreaterThan(30);
    expect(got.strip).toBe(0);
  });
});

/*
 * Лента прямо на обычной странице. Снаружи у неё нет MorphScroll, которому
 * библиотека могла бы передать поперечный жест, и вертикальный свайп над ней
 * был мёртв целиком: не ехала ни лента, ни страница. Такой скролл отдаёт пан
 * поперёк себя браузеру.
 */
test.describe("лента на обычной странице", () => {
  const openPageStrip = async (page: Page) => {
    await page.goto("/?scenario=pageStrip");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(350);

    const b = (await page.locator('[data-testid="page-strip-host"]').boundingBox())!;
    return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + 60) };
  };

  const at = (page: Page) =>
    page.evaluate(() => ({
      page: window.scrollY,
      strip: document.querySelector<HTMLElement>(".ms-viewport")!.scrollLeft,
    }));

  test("вертикальный свайп над лентой листает страницу", async ({ page }) => {
    const c = await openPageStrip(page);

    await swipe(page, { x: c.x, y: c.y }, { x: c.x + 3, y: c.y - 120 }, { steps: 10, stepDelay: 30 });
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.page).toBeGreaterThan(30);
    expect(got.strip).toBe(0);
  });

  test("горизонтальный свайп ведёт ленту, а не страницу", async ({ page }) => {
    const c = await openPageStrip(page);

    await swipe(page, { x: c.x + 100, y: c.y }, { x: c.x - 100, y: c.y + 3 }, { steps: 10, stepDelay: 30 });
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.strip).toBeGreaterThan(30);
    expect(got.page).toBe(0);
  });
});

import { test, expect, Page, Locator } from "@playwright/test";

/**
 * Touch physics. Playwright's touchscreen only taps, so gestures go through
 * CDP, which produces genuine input events and therefore genuine pointer
 * events.
 */
const scrollTop = (el: Locator) =>
  el.evaluate((n) => (n as HTMLElement).scrollTop);

type Point = { x: number; y: number };

const gesture = async (
  page: Page,
  points: Point[],
  { stepDelay = 8, holdBeforeRelease = 0 } = {},
) => {
  const client = await page.context().newCDPSession(page);
  const send = (type: string, touchPoints: Point[]) =>
    client.send("Input.dispatchTouchEvent", {
      type: type as "touchStart",
      touchPoints: touchPoints.map((p) => ({ x: p.x, y: p.y })),
    });

  await send("touchStart", [points[0]]);
  for (const point of points.slice(1)) {
    await send("touchMove", [point]);
    await page.waitForTimeout(stepDelay);
  }
  if (holdBeforeRelease) await page.waitForTimeout(holdBeforeRelease);
  await send("touchEnd", []);
};

const swipe = async (
  page: Page,
  from: Point,
  to: Point,
  { steps = 6, stepDelay = 8, holdBeforeRelease = 0 } = {},
) => {
  await gesture(
    page,
    [
      from,
      ...Array.from({ length: steps }, (_, index) => {
        const i = index + 1;
        return {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
        };
      }),
    ],
    { stepDelay, holdBeforeRelease },
  );
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

  test("uses the pointer itself when coarse media is unavailable", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);

      window.matchMedia = (query: string) =>
        query === "(pointer: coarse)"
          ? ({
              matches: false,
              media: query,
              onchange: null,
              addListener() {},
              removeListener() {},
              addEventListener() {},
              removeEventListener() {},
              dispatchEvent: () => false,
            } as MediaQueryList)
          : real(query);
    });

    const { el, box } = await openScroll(page);

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 20 },
      { x: box.x + box.width / 2, y: box.y + 40 },
      { stepDelay: 40 },
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

/* На границе touch-drag остаётся у внутреннего MorphScroll. */
test("an owned touch drag rubber-bands without moving the outer", async ({
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

  const rubber = await page
    .locator('[data-testid="inner-host"] .ms-objects-wrapper')
    .evaluate((element) => (element as HTMLElement).style.transform);
  expect(rubber).not.toBe("");
  expect(await outerAt()).toBe(0);

  await touch("touchEnd", 0);
  await page.waitForTimeout(900);

  expect(await outerAt()).toBe(0);
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

  test("wheel включает приём жеста внешним списком на touch", async ({ page }) => {
    const c = await openStrip(page, "nestedCrossWheelOnly");

    await swipe(page, { x: c.x, y: c.y + 40 }, { x: c.x + 3, y: c.y - 80 }, { steps: 10, stepDelay: 30 });
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.outer).toBeGreaterThan(30);
    expect(got.strip).toBe(0);
  });

  test("обычный scroll-box между списками получает поперечный pan", async ({
    page,
  }) => {
    const c = await openStrip(page, "nestedCrossNativeMiddle");

    await swipe(
      page,
      { x: c.x, y: c.y + 40 },
      { x: c.x + 3, y: c.y - 80 },
      { steps: 10, stepDelay: 30 },
    );
    await page.waitForTimeout(500);

    const got = await at(page);
    const native = await page
      .locator('[data-testid="native-middle"]')
      .evaluate((element) => element.scrollTop);

    expect(native).toBeGreaterThan(30);
    expect(got.outer).toBe(0);
    expect(got.strip).toBe(0);
  });

  test("после выбора горизонтали жест не переключается на вертикальный scroll", async ({
    page,
  }) => {
    const c = await openStrip(page, "nestedCrossNativeMiddle");

    await gesture(
      page,
      [
        { x: c.x + 90, y: c.y },
        ...Array.from({ length: 6 }, (_, i) => ({
          x: c.x + 90 - (i + 1) * 24,
          y: c.y + i,
        })),
        ...Array.from({ length: 6 }, (_, i) => ({
          x: c.x - 55 - i,
          y: c.y + (i + 1) * 22,
        })),
      ],
      { stepDelay: 30 },
    );
    await page.waitForTimeout(500);

    const got = await at(page);
    const native = await page
      .locator('[data-testid="native-middle"]')
      .evaluate((element) => element.scrollTop);

    expect(got.strip).toBeGreaterThan(30);
    expect(native).toBe(0);
    expect(got.outer).toBe(0);
  });

  test("hybrid не отдаёт жест из-за смены направления после старта", async ({
    page,
  }) => {
    const c = await openStrip(page, "nestedCrossHybrid");

    await gesture(
      page,
      [
        { x: c.x + 90, y: c.y },
        ...Array.from({ length: 6 }, (_, i) => ({
          x: c.x + 90 - (i + 1) * 24,
          y: c.y + i,
        })),
        ...Array.from({ length: 6 }, (_, i) => ({
          x: c.x - 55 - i,
          y: c.y + (i + 1) * 22,
        })),
      ],
      { stepDelay: 30 },
    );
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.strip).toBeGreaterThan(30);
    expect(got.outer).toBe(0);
  });

  test("hybrid сразу отдаёт наружу недоступную ведущую ось", async ({
    page,
  }) => {
    const c = await openStrip(page, "nestedCrossHybrid");

    await swipe(
      page,
      { x: c.x, y: c.y + 40 },
      { x: c.x + 3, y: c.y - 80 },
      { steps: 10, stepDelay: 30 },
    );
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.outer).toBeGreaterThan(30);
    expect(got.strip).toBe(0);
  });

  test("hybrid сохраняет выбранную ось на её границе", async ({ page }) => {
    await page.goto("/?scenario=nestedHybridEdge");
    await page.waitForTimeout(350);
    const host = (await page
      .locator('[data-testid="hybrid-edge-host"]')
      .boundingBox())!;
    const outerBox = (await page.locator(".ms-viewport").first().boundingBox())!;
    const start = {
      x: Math.max(host.x, outerBox.x) + 50,
      y: host.y + host.height / 2,
    };

    await gesture(
      page,
      [
        start,
        ...Array.from({ length: 30 }, (_, i) => ({
          x: start.x - (i + 1) * 18,
          y: start.y + 2,
        })),
      ],
      { stepDelay: 20 },
    );
    await page.waitForTimeout(500);

    const [outer, inner] = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-viewport")].map(
        (element) => ({
          at: Math.round(element.scrollLeft),
          most: element.scrollWidth - element.clientWidth,
        }),
      ),
    );

    expect(inner.at).toBe(inner.most);
    expect(outer.at).toBe(0);
  });

  test("hybrid без диапазона не запирает нативную страницу", async ({ page }) => {
    await page.goto("/?scenario=emptyHybridNativePage");
    const box = (await page.locator(".empty-hybrid .ms-viewport").boundingBox())!;

    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height - 30 },
      { x: box.x + box.width / 2, y: box.y + 30 },
      { steps: 10, stepDelay: 30 },
    );

    expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBeGreaterThan(30);
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

  /* бегунок ленты — её: палец на нём не тянет внешний список */
  test("бегунок ленты не тянет внешний список", async ({ page }) => {
    await page.goto("/?scenario=nestedCrossBar");
    const thumb = page.locator('[data-testid="strip-host"] .ms-thumb');
    await expect(thumb).toBeVisible();
    await page.waitForTimeout(350);

    const b = (await thumb.boundingBox())!;
    const t = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await swipe(page, t, { x: t.x + 120, y: t.y - 20 }, { steps: 10, stepDelay: 30 });
    await page.waitForTimeout(500);

    const got = await at(page);
    expect(got.strip).toBeGreaterThan(40);
    expect(got.outer).toBe(0);
  });
});

test.describe("нативный overflow по оси MorphScroll", () => {
  for (const [name, scenario] of [
    ["scroll", "nativeSameAxisScroll"],
    ["slider", "nativeSameAxisSlider"],
    ["sliderMenu", "nativeSameAxisSliderMenu"],
  ] as const) {
    test(`${name}: браузер не отнимает горизонтальный жест`, async ({ page }) => {
      await page.goto(`/?scenario=${scenario}`);
      await page.waitForTimeout(350);
      await page.evaluate(() => {
        const state = window as Window & { cancels?: number };
        state.cancels = 0;
        document.addEventListener(
          "pointercancel",
          () => state.cancels!++,
          true,
        );
      });

      const box = (await page.locator(".ms-viewport").boundingBox())!;
      await expect(page.locator("[morph-scroll]")).toHaveCSS(
        "touch-action",
        "pan-y pinch-zoom",
      );
      await swipe(
        page,
        { x: box.x + 180, y: box.y + box.height / 2 },
        { x: box.x + 40, y: box.y + box.height / 2 + 2 },
        { steps: 10, stepDelay: 30 },
      );
      await page.waitForTimeout(500);

      const result = await page.evaluate(() => ({
        inner: document.querySelector<HTMLElement>(".ms-viewport")!.scrollLeft,
        native: document.querySelector<HTMLElement>(
          '[data-testid="native-same-axis"]',
        )!.scrollLeft,
        cancels: (window as Window & { cancels?: number }).cancels,
      }));

      expect(result.inner).toBeGreaterThan(30);
      expect(result.native).toBe(0);
      expect(result.cancels).toBe(0);
    });
  }

  for (const [name, scenario, selector, axis, nativeTestId] of [
    ["бегунок x", "nativeSameAxisThumb", ".ms-thumb", "x", "native-same-axis"],
    [
      "полоса slider x",
      "nativeSameAxisSliderBar",
      ".ms-slider",
      "x",
      "native-same-axis",
    ],
    [
      "бегунок y",
      "nativeControlThumbY",
      ".ms-bar.ms-y .ms-thumb",
      "y",
      "native-control-axes",
    ],
    [
      "бегунок hybrid x",
      "nativeControlThumbHybrid",
      ".ms-bar.ms-x .ms-thumb",
      "x",
      "native-control-axes",
    ],
    [
      "бегунок hybrid y",
      "nativeControlThumbHybrid",
      ".ms-bar.ms-y .ms-thumb",
      "y",
      "native-control-axes",
    ],
    [
      "полоса slider y",
      "nativeControlSliderY",
      ".ms-slider.ms-y",
      "y",
      "native-control-axes",
    ],
    [
      "полоса slider hybrid x",
      "nativeControlSliderHybrid",
      ".ms-slider.ms-x",
      "x",
      "native-control-axes",
    ],
    [
      "полоса slider hybrid y",
      "nativeControlSliderHybrid",
      ".ms-slider.ms-y",
      "y",
      "native-control-axes",
    ],
  ] as const) {
    test(`${name} не теряет touch внутри нативного overflow`, async ({
      page,
    }) => {
      await page.goto(`/?scenario=${scenario}`);
      await page.waitForTimeout(350);

      const control = page.locator(selector);
      await control.scrollIntoViewIfNeeded();
      const box = (await control.boundingBox())!;
      const from = {
        x: box.x + box.width * (axis === "x" ? 0.2 : 0.5),
        y: box.y + box.height * (axis === "y" ? 0.2 : 0.5),
      };
      const to = {
        x: box.x + box.width * (axis === "x" ? 0.8 : 0.5),
        y: box.y + box.height * (axis === "y" ? 0.8 : 0.5),
      };
      /*
       * Проверяем и JS-страховку: на отдельных мобильных браузерах нативный
       * overflow успевает начать pan, даже когда ось закрыта touch-action.
       * Control должен удержаться корневым non-passive listener и без CSS.
       */
      await page.evaluate(() => {
        const state = window as Window & { cancels?: number };
        state.cancels = 0;
        document.querySelector<HTMLElement>("[morph-scroll]")!.style.touchAction =
          "auto";
        document.addEventListener(
          "pointercancel",
          () => state.cancels!++,
          true,
        );
      });
      const nativeBefore = await page
        .locator(`[data-testid="${nativeTestId}"]`)
        .evaluate((element) => [
          (element as HTMLElement).scrollLeft,
          (element as HTMLElement).scrollTop,
        ]);
      await swipe(page, from, to, { steps: 10, stepDelay: 30 });
      await page.waitForTimeout(500);

      const result = await page.evaluate((testId) => {
        const inner = document.querySelector<HTMLElement>(".ms-viewport")!;
        const native = document.querySelector<HTMLElement>(
          `[data-testid="${testId}"]`,
        )!;
        return {
          inner: [inner.scrollLeft, inner.scrollTop],
          native: [native.scrollLeft, native.scrollTop],
          cancels: (window as Window & { cancels?: number }).cancels,
        };
      }, nativeTestId);
      expect(result.inner[axis === "x" ? 0 : 1]).toBeGreaterThan(30);
      expect(result.native).toEqual(nativeBefore);
      expect(result.cancels).toBe(0);
    });
  }

  test("нативная граница не пропускает relay к внешнему MorphScroll", async ({
    page,
  }) => {
    await page.goto("/?scenario=nativeRelayBoundary");
    await page.waitForTimeout(350);

    const inner = page.locator(".ms-viewport").nth(1);
    const box = (await inner.boundingBox())!;
    await swipe(
      page,
      { x: box.x + 240, y: box.y + box.height / 2 },
      { x: box.x + 40, y: box.y + box.height / 2 + 2 },
      { steps: 12, stepDelay: 30 },
    );
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const [outer, inside] = [
        ...document.querySelectorAll<HTMLElement>(".ms-viewport"),
      ];
      const native = document.querySelector<HTMLElement>(
        '[data-testid="native-relay-boundary"]',
      )!;
      return {
        outer: outer.scrollLeft,
        native: native.scrollLeft,
        inside: inside.scrollLeft,
      };
    });

    expect(result.inside).toBeGreaterThan(1);
    expect(result.outer).toBe(0);
    expect(result.native).toBe(0);
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

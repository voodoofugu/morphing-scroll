import { test, expect, Page } from "@playwright/test";

/*
 * Скролл, который едет по одной оси, берёт только тот жест, что идёт вдоль
 * неё. Поперечный принадлежит тому, кто снаружи: лента посреди вертикального
 * списка раньше забирала любую тягу и выбрасывала её поперечную часть — палец
 * вёл вниз, а список стоял.
 */
const positions = (page: Page) =>
  page.evaluate(() => {
    const [outer, strip] = [...document.querySelectorAll<HTMLElement>(".ms-viewport")];
    return { outer: Math.round(outer.scrollTop), strip: Math.round(strip.scrollLeft) };
  });

const dragOverStrip = async (page: Page, dx: number, dy: number) => {
  await page.goto("/?scenario=nestedCross");
  await expect(page.locator(".ms-viewport").nth(1)).toBeVisible();
  await page.waitForTimeout(350);

  const b = (await page.locator('[data-testid="strip-host"]').boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++)
    await page.mouse.move(x + (dx * i) / 12, y + (dy * i) / 12);
  await page.mouse.up();
  await page.waitForTimeout(450);

  return positions(page);
};

test.describe("ось жеста: тяга мышью", () => {
  test("вертикальная тяга над лентой ведёт внешний список", async ({ page }) => {
    const got = await dragOverStrip(page, 4, -120);

    expect(got.outer).toBeGreaterThan(40);
    expect(got.strip).toBe(0);
  });

  test("горизонтальная тяга по-прежнему ведёт ленту", async ({ page }) => {
    const got = await dragOverStrip(page, -120, 4);

    expect(got.strip).toBeGreaterThan(40);
    expect(got.outer).toBe(0);
  });
});

/*
 * Удержанная стрелка повторяется раз в тридцать миллисекунд, а шаг едет
 * дольше. Каждый повтор начинал заново от середины пути, и за секунду
 * удержания выходило в шесть раз меньше, чем у нативной прокрутки.
 * Сравниваем с нативным div в том же браузере: headless не повторяет
 * удержанную клавишу сам, поэтому повтор изображаем серией нажатий.
 */
test("удержанная стрелка едет со скоростью натива", async ({ page }) => {
  const hold = async (selector: string) => {
    await page.locator(selector).focus();
    const read = () =>
      page.locator(selector).evaluate((el) => (el as HTMLElement).scrollTop);
    const start = await read();

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(33);
    }
    await page.waitForTimeout(400);

    return (await read()) - start;
  };

  await page.goto("/?scenario=wheel");
  await page.evaluate(() => {
    document.body.innerHTML = `<div id="native" tabindex="0" style="width:300px;height:300px;overflow:auto"><div style="height:20000px"></div></div>`;
  });
  const native = await hold("#native");

  await page.goto(
    `/?scenario=crash&props=${encodeURIComponent(
      JSON.stringify({
        count: 300,
        size: [300, 300],
        objects: { size: [280, 60], gap: 10 },
        controls: { keys: { mode: "pan" } },
      }),
    )}`,
  );
  await expect(page.locator(".ms-viewport")).toBeVisible();
  await page.waitForTimeout(350);
  const ours = await hold(".ms-viewport");

  expect(native).toBeGreaterThan(600); // эталон и правда уехал
  expect(ours).toBeGreaterThan(native * 0.8);
});

/*
 * У колеса то же правило. Трекпадная диагональ вниз над лентой в вертикальном
 * списке сдвигала ленту на пару пикселей и глотала остальное: любой ненулевой
 * поперечный сдвиг глушил вертикальный целиком. Отдаём её наружу — но только
 * если снаружи есть кому ехать. Иначе ввод просто пропадал бы.
 */
test.describe("ось жеста: колесо", () => {
  const wheelOverStrip = async (page: Page, dx: number, dy: number) => {
    await page.goto("/?scenario=nestedCross");
    await expect(page.locator(".ms-viewport").nth(1)).toBeVisible();
    await page.waitForTimeout(350);

    const b = (await page.locator('[data-testid="strip-host"]').boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.wheel(dx, dy);
    await page.waitForTimeout(500);

    return positions(page);
  };

  const alone = async (page: Page, direction: "x" | "y", dx: number, dy: number) => {
    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(
        JSON.stringify({
          count: 30,
          direction,
          size: [300, 200],
          objects: { size: [100, 90], gap: 10 },
          controls: { wheel: true },
        }),
      )}`,
    );
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(350);

    const view = page.locator(".ms-viewport");
    const b = (await view.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.wheel(dx, dy);
    await page.waitForTimeout(500);

    return view.evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }));
  };

  test("диагональ вниз над лентой листает внешний список", async ({ page }) => {
    const got = await wheelOverStrip(page, 12, 150);

    expect(got.outer).toBeGreaterThan(40);
    expect(got.strip).toBe(0);
  });

  /* у мыши поперечного канала нет — её колесо по-прежнему ведёт ленту */
  test("колесо мыши ведёт ленту", async ({ page }) => {
    const got = await wheelOverStrip(page, 0, 150);

    expect(got.strip).toBeGreaterThan(40);
    expect(got.outer).toBe(0);
  });

  /*
   * Снаружи не MorphScroll, а сама страница или обычный блок с прокруткой:
   * их не спросить через список скроллов, их ищем по предкам.
   */
  const wheelOverPlain = async (page: Page, scenario: string, host: string) => {
    await page.goto(`/?scenario=${scenario}`);
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(350);

    const b = (await page.locator(`[data-testid="${host}"]`).boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.wheel(12, 150);
    await page.waitForTimeout(500);

    return page.evaluate(() => {
      const box = document.querySelector<HTMLElement>('[data-testid="strip-box"]');
      const strip = document.querySelector<HTMLElement>(".ms-viewport")!;
      return {
        page: Math.round(window.scrollY),
        box: Math.round(box?.scrollTop ?? 0),
        strip: Math.round(strip.scrollLeft),
      };
    });
  };

  test("диагональ вниз над лентой листает страницу", async ({ page }) => {
    const got = await wheelOverPlain(page, "pageStrip", "page-strip-host");

    expect(got.page).toBeGreaterThan(40);
    expect(got.strip).toBe(0);
  });

  test("диагональ вниз над лентой листает блок вокруг", async ({ page }) => {
    const got = await wheelOverPlain(page, "boxStrip", "box-strip-host");

    expect(got.box).toBeGreaterThan(40);
    expect(got.strip).toBe(0);
  });

  /* снаружи никого — диагональ остаётся ленте, а не пропадает */
  test("одинокая лента диагональ не теряет", async ({ page }) => {
    const got = await alone(page, "x", 120, 240);

    expect(got.left).toBeGreaterThan(1);
  });

  /* подмена оси — только у горизонтальных: вертикальный от свайпа вбок не едет */
  test("вертикальный список не едет от горизонтального свайпа", async ({ page }) => {
    const got = await alone(page, "y", 150, 0);

    expect(got.top).toBe(0);
  });
});

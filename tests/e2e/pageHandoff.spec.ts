import { test, expect, Page } from "@playwright/test";

/*
 * Список на обычной странице: пока он может ехать сам, страница стоит; когда
 * не может — жест переходит к ней. Между этими двумя состояниями страница не
 * должна вздрагивать, а ровно это и делал фокус, взятый на колесо: браузер
 * подтягивал к нему страницу, а прокрутка возвращала её обратно.
 */
const watch = (page: Page) =>
  page.evaluate(() => {
    const vp = document.querySelector<HTMLElement>(".ms-viewport")!;
    const log: Array<[number, number]> = [];
    let raf = 0;
    const tick = () => {
      log.push([Math.round(window.scrollY), Math.round(vp.scrollTop)]);
      raf = requestAnimationFrame(tick);
    };
    tick();
    (window as any).__stop = () => {
      cancelAnimationFrame(raf);
      return log;
    };
  });

const collected = (page: Page) =>
  page.evaluate(
    () => (window as any).__stop() as Array<[number, number]>,
  ) as Promise<Array<[number, number]>>;

/** колесо трекпада: много мелких шагов подряд */
const stream = async (page: Page, delta: number, times = 25) => {
  for (let i = 0; i < times; i += 1) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(8);
  }
};

const overList = async (page: Page) => {
  const box = (await page.locator(".ms-viewport").boundingBox())!;
  await page.mouse.move(
    Math.round(box.x + box.width / 2),
    Math.round(box.y + 40),
  );
};

test.describe("список на обычной странице", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?scenario=pageColumn");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(350);
    await overList(page);
  });

  test("страница не вздрагивает, когда ехать некуда никому", async ({
    page,
  }) => {
    await watch(page);
    await stream(page, -8); // вверх: и список, и страница уже наверху
    await page.waitForTimeout(600);

    const log = await collected(page);
    const pageTrail = log.map((row) => row[0]);
    const listTrail = log.map((row) => row[1]);

    expect(Math.max(...pageTrail)).toBe(0);
    expect(Math.max(...listTrail)).toBe(0);
  });

  test("вниз едет список, а страница стоит", async ({ page }) => {
    await watch(page);
    await stream(page, 8);
    await page.waitForTimeout(600);

    const log = await collected(page);
    expect(Math.max(...log.map((row) => row[0]))).toBe(0);
    expect(log[log.length - 1][1]).toBeGreaterThan(100);
  });

  test("когда списку дальше некуда, жест берёт страница", async ({ page }) => {
    await page.evaluate(() => {
      const vp = document.querySelector<HTMLElement>(".ms-viewport")!;
      vp.scrollTop = vp.scrollHeight;
    });
    await page.waitForTimeout(300);

    await watch(page);
    await stream(page, 8);
    await page.waitForTimeout(600);

    const log = await collected(page);
    const pageTrail = log.map((row) => row[0]);
    // страница едет вниз и только вниз
    expect(pageTrail[pageTrail.length - 1]).toBeGreaterThan(100);
    expect(pageTrail.filter((v, i) => i > 0 && v < pageTrail[i - 1])).toEqual(
      [],
    );
  });
});

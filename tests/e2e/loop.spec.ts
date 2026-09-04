import { test, expect } from "@playwright/test";

/*
 * Шесть объектов по 60 с зазором 10 дают протяжённость 410, период — 420:
 * копии стыкуются через тот же зазор, что и объекты внутри копии. Окно 300
 * короче периода, значит копий три, а лента — 1260.
 */
const PERIOD = 420;
const SPAN = 1260;

const scrollTop = (page: import("@playwright/test").Page) =>
  page.locator(".ms-viewport").evaluate((el) => el.scrollTop);

const settle = (page: import("@playwright/test").Page) =>
  page.waitForTimeout(200);

test.describe("loop (real browser)", () => {
  test("лента конечная и открывается со средней копии", async ({ page }) => {
    await page.goto("/?scenario=loopY");
    await settle(page);

    expect(
      await page.locator(".ms-viewport").evaluate((el) => el.scrollHeight),
    ).toBe(SPAN);
    expect(await scrollTop(page)).toBe(PERIOD);
  });

  /*
   * То, ради чего всё: уехать за границу средней копии нельзя — позиция
   * переносится на период, и под окном остаётся тот же контент.
   */
  test("уход вперёд за копию возвращает на период назад", async ({ page }) => {
    await page.goto("/?scenario=loopY");
    await settle(page);

    await page
      .locator(".ms-viewport")
      .evaluate((el) => (el.scrollTop = 900));
    await settle(page);

    expect(await scrollTop(page)).toBe(900 - PERIOD);
  });

  test("уход назад за копию возвращает на период вперёд", async ({ page }) => {
    await page.goto("/?scenario=loopY");
    await settle(page);

    await page.locator(".ms-viewport").evaluate((el) => (el.scrollTop = 100));
    await settle(page);

    expect(await scrollTop(page)).toBe(100 + PERIOD);
  });

  /*
   * Шва быть не должно: в точке стыка под окном стоят последний объект одной
   * копии и первый следующей, ровно через тот же зазор.
   */
  test("на стыке копий зазор такой же, как внутри копии", async ({ page }) => {
    await page.goto("/?scenario=loopY");
    await settle(page);

    // конец копии: последний объект копии 1 кончается на 420 + 410
    await page.locator(".ms-viewport").evaluate((el) => (el.scrollTop = 760));
    await settle(page);

    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
        .map((el) => {
          const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
            el.style.transform,
          );

          return {
            n: Number(el.textContent),
            y: Math.round(Number(m?.[2] ?? 0)),
            h: Math.round(el.getBoundingClientRect().height),
          };
        })
        .sort((one, two) => one.y - two.y),
    );

    // между соседями по ленте всегда ровно зазор, и на стыке тоже
    for (let i = 1; i < boxes.length; i++)
      expect(boxes[i].y - (boxes[i - 1].y + boxes[i - 1].h)).toBe(10);

    // а номера идут по кругу: за пятым снова нулевой
    const order = boxes.map((b) => b.n);
    for (let i = 1; i < order.length; i++)
      expect(order[i]).toBe((order[i - 1] + 1) % 6);
  });

  test("во вьюпорте живёт горстка объектов, а не вся лента", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopY");
    await settle(page);

    const mounted = await page.locator(".ms-object-box").count();

    // окно 300 при шаге 70 — это пять-шесть объектов, а не 18 копий
    expect(mounted).toBeLessThan(10);
    expect(mounted).toBeGreaterThan(2);
  });

  /*
   * Настоящее колесо через стык: позиция обязана остаться в средней копии,
   * сколько ни крути, а объекты — идти подряд. Это и есть «бесконечно».
   */
  test("колесом можно крутить сколько угодно, позиция остаётся в круге", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopY");
    await settle(page);

    const view = page.locator(".ms-viewport");
    await view.hover();

    for (let turn = 0; turn < 12; turn++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(60);

      const at = await scrollTop(page);

      expect(at).toBeGreaterThanOrEqual(PERIOD);
      expect(at).toBeLessThan(PERIOD * 2);
    }

    // и после всей этой крутки лента не выросла ни на пиксель
    expect(await view.evaluate((el) => el.scrollHeight)).toBe(SPAN);

    const order = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
        .map((el) => {
          const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
            el.style.transform,
          );

          return { n: Number(el.textContent), y: Number(m?.[2] ?? 0) };
        })
        .sort((one, two) => one.y - two.y)
        .map((box) => box.n),
    );

    for (let i = 1; i < order.length; i++)
      expect(order[i]).toBe((order[i - 1] + 1) % 6);
  });

  /*
   * Перетаскивание с инерцией — второй путь, у которого своя отметка. Если её
   * не нести вместе с позицией, окно после броска утащит за границу круга.
   */
  test("бросок с инерцией не выносит за круг", async ({ page }) => {
    await page.goto("/?scenario=loopDrag");
    await settle(page);

    const box = (await page.locator(".ms-viewport").boundingBox())!;
    const midX = box.x + box.width / 2;

    for (let throw_ = 0; throw_ < 5; throw_++) {
      await page.mouse.move(midX, box.y + box.height - 20);
      await page.mouse.down();

      for (let step = 1; step <= 6; step++)
        await page.mouse.move(midX, box.y + box.height - 20 - step * 40);

      await page.mouse.up();
      await page.waitForTimeout(500);

      const at = await scrollTop(page);

      expect(at).toBeGreaterThanOrEqual(PERIOD);
      expect(at).toBeLessThan(PERIOD * 2);
    }
  });

  test("вбок круг ходит так же", async ({ page }) => {
    await page.goto("/?scenario=loopX");
    await settle(page);

    const view = page.locator(".ms-viewport");
    expect(await view.evaluate((el) => el.scrollWidth)).toBe(SPAN);
    expect(await view.evaluate((el) => el.scrollLeft)).toBe(PERIOD);

    await view.evaluate((el) => (el.scrollLeft = 900));
    await settle(page);

    expect(await view.evaluate((el) => el.scrollLeft)).toBe(900 - PERIOD);
  });
});

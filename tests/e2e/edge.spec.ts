import { test, expect, Page } from "@playwright/test";

/*
 * Край гаснет, когда с этой стороны ехать больше некуда: `ms-disabled` — это
 * и есть сигнал «доехали». Мера содержимого дробная, а `scrollTop` браузер
 * отдаёт целым, и остаток меньше пикселя однажды не давал концу наступить
 * вовсе: список стоял в самом низу, а край всё горел.
 */
const edges = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll(".ms-edge")].map((el) => [
        el.className.replace("ms-edge ", "").replace(" ms-disabled", ""),
        el.classList.contains("ms-disabled") ? "погас" : "горит",
      ]),
    ),
  );

const place = (page: Page) =>
  page.evaluate(() => {
    const vp = document.querySelector<HTMLElement>(".ms-viewport")!;
    return {
      top: Math.round(vp.scrollTop),
      room: Math.round(vp.scrollHeight - vp.clientHeight),
    };
  });

test.describe("край знает, что доехали", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?scenario=edgeFraction");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.waitForTimeout(400);
  });

  test("наверху горит нижний, внизу — верхний", async ({ page }) => {
    expect(await edges(page)).toEqual({ "ms-top": "погас", "ms-bottom": "горит" });

    const box = (await page.locator(".ms-viewport").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 40; i += 1) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(10);
    }
    await page.waitForTimeout(700);

    // именно в самом низу, а не где-то рядом
    const at = await place(page);
    expect(at.top).toBe(at.room);

    expect(await edges(page)).toEqual({ "ms-top": "горит", "ms-bottom": "погас" });
  });

  test("тронулись с конца — край снова горит", async ({ page }) => {
    await page.evaluate(() => {
      const vp = document.querySelector<HTMLElement>(".ms-viewport")!;
      vp.scrollTop = vp.scrollHeight;
    });
    await page.waitForTimeout(500);
    expect((await edges(page))["ms-bottom"]).toBe("погас");

    await page.evaluate(() => {
      document.querySelector<HTMLElement>(".ms-viewport")!.scrollTop -= 60;
    });
    await page.waitForTimeout(500);
    expect(await edges(page)).toEqual({ "ms-top": "горит", "ms-bottom": "горит" });
  });
});

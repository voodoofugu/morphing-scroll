import { test, expect, Page } from "@playwright/test";

const offsets = (page: Page) =>
  page.locator(".ms-viewport").evaluate((el) => ({
    top: (el as HTMLElement).scrollTop,
    left: (el as HTMLElement).scrollLeft,
  }));

const wheelOverElement = async (page: Page) => {
  const box = (await page.locator(".ms-viewport").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 400);
};

test.describe("MorphScroll hybrid wheel (real browser)", () => {
  test("default hybrid wheel scrolls the vertical axis", async ({ page }) => {
    await page.goto("/?scenario=hybridWheel");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await wheelOverElement(page);

    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);
    expect((await offsets(page)).left).toBe(0);
  });

  test("changeDirection redirects wheel to the horizontal axis", async ({
    page,
  }) => {
    await page.goto("/?scenario=hybridChangeDir");
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await wheelOverElement(page);

    await expect
      .poll(() => offsets(page).then((o) => o.left))
      .toBeGreaterThan(50);
    expect((await offsets(page)).top).toBe(0);
  });

  /*
   * Клавиша возвращает колесо на ту ось, которую у него забрал
   * `changeDirection`. Только там она и нужна: без него колесо и так двигает
   * вертикаль, горизонталь у браузера своя, и буква, молча меняющая поведение
   * колеса, была бы неожиданностью на пустом месте.
   */
  test("a held key hands the wheel back to the other axis", async ({
    page,
  }) => {
    await page.goto("/?scenario=hybridChangeDir");
    await expect(page.locator(".ms-viewport")).toBeVisible();

    await page.locator(".ms-viewport").click({ position: { x: 20, y: 20 } });
    await page.keyboard.down("x");
    await wheelOverElement(page);

    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);
    expect((await offsets(page)).left).toBe(0);

    await page.keyboard.up("x");
  });

  test("without changeDirection the key does nothing", async ({ page }) => {
    await page.goto("/?scenario=hybridWheel");
    await expect(page.locator(".ms-viewport")).toBeVisible();

    await page.locator(".ms-viewport").click({ position: { x: 20, y: 20 } });
    await page.keyboard.down("x");
    await wheelOverElement(page);

    // как и без клавиши: вертикаль едет, горизонталь стоит
    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);
    expect((await offsets(page)).left).toBe(0);

    await page.keyboard.up("x");
  });
});

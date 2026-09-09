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

    /*
     * Фокуса никто не давал — модификатор зажимают до того, как коснулись
     * списка, и его нажатие уходит куда угодно, только не сюда. Состояние
     * модификатора приходит с самим колесом, поэтому этого и хватает.
     */
    await page.keyboard.down("Shift");
    await wheelOverElement(page);

    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);
    expect((await offsets(page)).left).toBe(0);

    await page.keyboard.up("Shift");
  });

  /*
   * Сочетание: «+» соединяет коды в одно, и держать надо оба. Буквы в событии
   * колеса нет, её нажатие ловится на самом скролле — фокус тут обязателен.
   */
  test("a combination needs every key of it", async ({ page }) => {
    const config = {
      count: 40,
      size: [300, 220],
      direction: "hybrid",
      // восемь в ряд и пять рядов: вылезает по обеим осям, есть между чем менять
      objects: { size: 60, gap: 10, lines: 8 },
      controls: {
        wheel: { changeDirection: true, changeDirectionBtn: "ShiftLeft+KeyX" },
      },
      duration: 0,
    };

    await page.goto(
      `/?scenario=crash&props=${encodeURIComponent(JSON.stringify(config))}`,
    );
    await expect(page.locator(".ms-viewport")).toBeVisible();
    await page.locator(".ms-viewport").click({ position: { x: 20, y: 20 } });

    // половина сочетания — колесо остаётся на своей оси
    await page.keyboard.down("Shift");
    await page.waitForTimeout(150); // нажатию нужно дойти раньше колеса
    await wheelOverElement(page);
    await expect.poll(() => offsets(page).then((o) => o.left)).toBeGreaterThan(50);
    expect((await offsets(page)).top).toBe(0);

    // вторая половина — и ось меняется
    await page.keyboard.down("x");
    await page.waitForTimeout(150);
    await wheelOverElement(page);
    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);

    await page.keyboard.up("x");
    await page.keyboard.up("Shift");
  });

  /*
   * С зажатым модификатором браузер докладывает поворот колеса вбок — это его
   * собственный способ прокрутить горизонталь. Ось, которую мы в этот момент
   * вернули, увидела бы ноль, поэтому берём поворот с той стороны, где он
   * пришёл.
   */
  test("a handed-over axis takes the turn sideways too", async ({ page }) => {
    await page.goto("/?scenario=hybridChangeDir");
    await expect(page.locator(".ms-viewport")).toBeVisible();

    await page.locator(".ms-viewport").click({ position: { x: 20, y: 20 } });
    await page.keyboard.down("Shift");

    const box = (await page.locator(".ms-viewport").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(400, 0); // как его шлёт браузер под модификатором

    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);
    expect((await offsets(page)).left).toBe(0);

    await page.keyboard.up("Shift");
  });

  test("without changeDirection the key does nothing", async ({ page }) => {
    await page.goto("/?scenario=hybridWheel");
    await expect(page.locator(".ms-viewport")).toBeVisible();

    await page.locator(".ms-viewport").click({ position: { x: 20, y: 20 } });
    await page.keyboard.down("Shift");
    await wheelOverElement(page);

    // как и без клавиши: вертикаль едет, горизонталь стоит
    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);
    expect((await offsets(page)).left).toBe(0);

    await page.keyboard.up("Shift");
  });
});

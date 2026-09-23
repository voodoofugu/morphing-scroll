import { test, expect, Page } from "@playwright/test";

/*
 * Пока тянут прокрутку, браузер не должен заодно выделять текст: жест —
 * это перетаскивание, а не протяжка по строкам. Блокировка снимается вместе
 * с жестом, так что обычное выделение остаётся возможным.
 *
 * Проверка идёт и в WebKit: там правило `user-select` доходит до элемента
 * позже, чем начинается выделение, и одного его не хватает.
 */
const selected = (page: Page) =>
  page.evaluate(() => window.getSelection()?.toString() ?? "");

const dragFrom = async (page: Page, box: DOMRect | null, by: number) => {
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  // мелкими шагами, как ведёт рукой человек: одним прыжком выделение не идёт
  await page.mouse.move(x, y + by, { steps: 12 });
};

test.describe("a drag does not select the page", () => {
  test("dragging the thumb leaves the text alone", async ({ page }) => {
    await page.goto("/?scenario=wheel");

    const thumb = page.locator(".ms-thumb");
    await dragFrom(page, (await thumb.boundingBox()) as DOMRect, 120);

    expect(await selected(page)).toBe("");

    await page.mouse.up();
    expect(await selected(page)).toBe("");
  });

  test("dragging the content leaves the text alone", async ({ page }) => {
    await page.goto("/?scenario=contentDrag");

    const viewport = page.locator(".ms-viewport");
    await dragFrom(page, (await viewport.boundingBox()) as DOMRect, -90);

    expect(await selected(page)).toBe("");

    await page.mouse.up();
    expect(await selected(page)).toBe("");
  });

  /*
   * Следствие видно не везде: в одних движках выделение не начинается из-за
   * стиля, в других — только из-за отказа событию. Здесь спрашиваем прямо,
   * отвечает ли библиотека «нет» на попытку начать выделение.
   */
  test("a drag turns the browser's own selection down", async ({ page }) => {
    await page.goto("/?scenario=wheel");

    const ask = () =>
      page.evaluate(() =>
        document
          .querySelector(".box")!
          .dispatchEvent(
            new Event("selectstart", { bubbles: true, cancelable: true }),
          ),
      );

    expect(await ask()).toBe(true); // до жеста выделять можно

    const thumb = page.locator(".ms-thumb");
    await dragFrom(page, (await thumb.boundingBox()) as DOMRect, 80);

    // спрашиваем, когда жест уже начался, а не когда мы просто нажали
    await expect(thumb).toHaveClass(/ms-grabbing/);
    expect(await ask()).toBe(false);

    await page.mouse.up();
    expect(await ask()).toBe(true);
  });

  test("after the drag the text can be selected again", async ({ page }) => {
    await page.goto("/?scenario=wheel");

    const thumb = page.locator(".ms-thumb");
    await dragFrom(page, (await thumb.boundingBox()) as DOMRect, 60);
    await page.mouse.up();

    const item = (await page
      .getByTestId("item-0")
      .boundingBox()) as DOMRect | null;
    await page.mouse.move(item!.x + 4, item!.y + item!.height / 2);
    await page.mouse.down();
    await page.mouse.move(item!.x + item!.width - 4, item!.y + item!.height / 2, {
      steps: 12,
    });
    await page.mouse.up();

    expect(await selected(page)).toContain("item");
  });
});

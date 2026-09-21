import { test, expect, Page } from "@playwright/test";

/*
 * `ms-grabbing` — это хук для оформления того, что сейчас тянут. Он должен
 * садиться на элемент библиотеки: на бегунок, на полосу слайдера или на окно
 * прокрутки, — а не на ту внутренность пользовательского бегунка, в которую
 * случайно попал указатель. Иначе по классу нечего стилизовать: что окажется
 * под пальцем, автор разметки заранее не знает.
 */
const holders = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".ms-grabbing")].map((el) =>
      el.className.replace("ms-grabbing", "").trim(),
    ),
  );

test.describe("ms-grabbing marks the element being dragged", () => {
  test("a thumb drag marks the thumb, not what is drawn inside it", async ({
    page,
  }) => {
    await page.goto("/?scenario=wheel");
    // как в жизни: свой бегунок занимает всю коробку, и указатель попадает в него
    await page.addStyleTag({ content: ".thumb { height: 100%; }" });

    const thumb = page.locator(".ms-thumb");
    const box = (await thumb.boundingBox())!;
    // нажимаем ровно в середину — там лежит свой элемент бегунка
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    await expect(thumb).toHaveClass(/ms-grabbing/);
    await expect(page.locator(".thumb")).not.toHaveClass(/ms-grabbing/);
    expect(await holders(page)).toEqual(["ms-thumb"]);

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 40);
    await expect(thumb).toHaveClass(/ms-grabbing/);

    await page.mouse.up();
    await expect(thumb).not.toHaveClass(/ms-grabbing/);
    expect(await holders(page)).toEqual([]);
  });

  test("a content drag marks the viewport", async ({ page }) => {
    await page.goto("/?scenario=contentDrag");

    const viewport = page.locator(".ms-viewport");
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 30);

    expect(await holders(page)).toEqual(["ms-viewport"]);

    await page.mouse.up();
    expect(await holders(page)).toEqual([]);
  });
});

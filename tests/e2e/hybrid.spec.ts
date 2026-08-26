import { test, expect, Page } from "@playwright/test";

const offsets = (page: Page) =>
  page.locator(".ms-element").evaluate((el) => ({
    top: (el as HTMLElement).scrollTop,
    left: (el as HTMLElement).scrollLeft,
  }));

const wheelOverElement = async (page: Page) => {
  const box = (await page.locator(".ms-element").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 400);
};

test.describe("MorphScroll hybrid wheel (real browser)", () => {
  test("default hybrid wheel scrolls the vertical axis", async ({ page }) => {
    await page.goto("/?scenario=hybridWheel");
    await expect(page.locator(".ms-element")).toBeVisible();
    await wheelOverElement(page);

    await expect.poll(() => offsets(page).then((o) => o.top)).toBeGreaterThan(50);
    expect((await offsets(page)).left).toBe(0);
  });

  test("changeDirection redirects wheel to the horizontal axis", async ({
    page,
  }) => {
    await page.goto("/?scenario=hybridChangeDir");
    await expect(page.locator(".ms-element")).toBeVisible();
    await wheelOverElement(page);

    await expect
      .poll(() => offsets(page).then((o) => o.left))
      .toBeGreaterThan(50);
    expect((await offsets(page)).top).toBe(0);
  });
});

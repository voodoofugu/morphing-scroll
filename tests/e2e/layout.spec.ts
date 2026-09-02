import { test, expect } from "@playwright/test";

const open = (page: import("@playwright/test").Page, scenario: string) =>
  page.goto(`/?scenario=${scenario}`);

const offsets = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as any).__scroll ?? { left: 0, top: 0 });

test.describe("MorphScroll size: auto (real browser)", () => {
  test("takes its size from the surrounding box", async ({ page }) => {
    await open(page, "sizeAuto");
    const root = page.locator("[morph-scroll]");
    await expect(root).toBeVisible();

    const box = await root.boundingBox();
    expect(box?.width).toBeCloseTo(280, 0);
    expect(box?.height).toBeCloseTo(240, 0);

    // two columns fit across the measured width
    await expect(page.locator(".ms-object-box")).toHaveCount(20);
  });

  test("scrolls within the measured range", async ({ page }) => {
    await open(page, "sizeAuto");
    const element = page.locator(".ms-viewport");
    await element.hover();

    await page.mouse.wheel(0, 400);
    await expect.poll(async () => (await offsets(page)).top).toBeGreaterThan(0);

    /*
     * The measured width decides the layout too: 280 fits two 100px columns,
     * so 20 items form 10 rows of 1000px inside a 240px viewport.
     */
    await page.mouse.wheel(0, 100000);
    await expect
      .poll(async () => (await offsets(page)).top)
      .toBeCloseTo(10 * 100 - 240, 0);
  });
});

test.describe("MorphScroll type: slider drag (real browser)", () => {
  test("snaps to the next page when the drag passes the threshold", async ({
    page,
  }) => {
    await open(page, "sliderDrag");
    const element = page.locator(".ms-viewport");
    const box = (await element.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + box.height - 40);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + box.height - 80, { steps: 4 });
    await page.mouse.move(cx, box.y + box.height - 140, { steps: 4 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(300);
  });

  test("snaps back when the drag stays under the threshold", async ({
    page,
  }) => {
    await open(page, "sliderDrag");
    const element = page.locator(".ms-viewport");
    const box = (await element.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + box.height - 40);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + box.height - 50, { steps: 3 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(0);
  });
});

test.describe("MorphScroll slider bar drag (real browser)", () => {
  test("steps a page when the drag passes one slider element", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + 6);
    await page.mouse.down();
    // travel further than one element so a step is taken
    await page.mouse.move(cx, box.y + box.height - 6, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBeGreaterThan(0);
  });

  /*
   * Страницу выбирает то, где указатель, а не сколько он проехал: жест по
   * бару — это прицеливание в пункт, как перетаскивание бегунка.
   */
  test("lands on the element the pointer is over", async ({ page }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20; // 20 объектов — 20 пунктов

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + item * 4.5, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(4 * 300);
  });

  /*
   * Один пронос по бару перелистывает несколько раз, и звук или тактильный
   * отклик вешают именно на них: отчёт по концу жеста услышал бы только
   * последний пункт.
   */
  test("reports every element the drag passes through", async ({ page }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20;

    await page.evaluate(
      () => ((window as unknown as { __navigate: unknown[] }).__navigate = []),
    );

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + item * 3.5, { steps: 12 });
    await page.mouse.up();

    const log = await page.evaluate(
      () =>
        (window as unknown as { __navigate: { from: number; to: number }[] })
          .__navigate,
    );

    expect(log.map((e) => [e.from, e.to])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  /*
   * Перелёт должен читаться как движение, а не как подмена позиции: раньше он
   * длился меньше кадра, и промежуточные кадры выпадали через раз.
   */
  test("flies to the aimed element instead of jumping there", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20;

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + item / 2 + 1); // первое движение только берёт отсчёт
    await page.evaluate(() => ((window as any).__trail = []));
    // дальше одним движением, что бы весь путь был одним перелётом
    await page.mouse.move(cx, box.y + item * 4.5);
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(4 * 300);

    const trail: number[] = await page.evaluate(
      () => (window as any).__trail ?? [],
    );
    // кадры между страницами — их не бывает, когда позицию просто подставляют
    const between = trail.filter((top) => top % 300 !== 0);
    expect(between.length).toBeGreaterThanOrEqual(3);
  });

  test("waits for the right element when the pointer comes back from outside", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;
    const item = box.height / 20;

    await page.mouse.move(cx, box.y + item / 2);
    await page.mouse.down();
    // уводим далеко за бар — там прицел упирается в последний пункт
    await page.mouse.move(cx, box.y + box.height + 400, { steps: 10 });
    // и возвращаемся ко второму: он и должен быть ответом
    await page.mouse.move(cx, box.y + item * 2.5, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await offsets(page)).top).toBe(2 * 300);
  });

  test("leaves the scroll alone for a nudge shorter than one element", async ({
    page,
  }) => {
    await open(page, "sliderThumbDrag");
    const bar = page.locator(".ms-slider");
    const box = (await bar.boundingBox())!;
    const cx = box.x + box.width / 2;

    await page.mouse.move(cx, box.y + 6);
    await page.mouse.down();
    await page.mouse.move(cx, box.y + 10, { steps: 2 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    expect((await offsets(page)).top).toBe(0);
  });
});

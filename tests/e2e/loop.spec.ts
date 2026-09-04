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

    /*
     * Считаем, сколько контента проехало под окном. Переносы из счёта
     * выкидываем — это не движение, а подмена, — и остаётся ровно то, что
     * накрутило колесо. У колеса своя отметка, и если её не перенести вместе с
     * позицией, после каждого стыка оно рвётся к старой: контент пролетает в
     * разы больше накрученного.
     */
    await page.evaluate((period) => {
      const el = document.querySelector(".ms-viewport")!;
      const trail = { last: el.scrollTop, travelled: 0 };

      (window as unknown as { __trail: typeof trail }).__trail = trail;

      el.addEventListener("scroll", () => {
        const step = el.scrollTop - trail.last;

        trail.last = el.scrollTop;

        if (Math.abs(Math.abs(step) - period) > 8)
          trail.travelled += Math.abs(step);
      });
    }, PERIOD);

    /*
     * Крутим подряд, не давая доехать: рывок случается только пока анимация
     * жива. Отпусти её осесть между щелчками — и колесо возьмёт отметку заново
     * с текущей позиции, а разницы будет не видно.
     */
    for (let turn = 0; turn < 12; turn++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(90);
    }

    /*
     * Подмена живёт в обработчике прокрутки, а он приходит уже после кадра —
     * значит один кадр позиция стоит чуть за границей. Это не видно, там
     * настоящая копия, и само проходит: спрашиваем устоявшееся.
     */
    await expect
      .poll(async () => {
        const at = await scrollTop(page);

        return at >= PERIOD && at < PERIOD * 2;
      })
      .toBe(true);

    const travelled = await page.evaluate(
      () =>
        (window as unknown as { __trail: { travelled: number } }).__trail
          .travelled,
    );

    // накрутили 2400, с доездом выходит около четырёх тысяч — но не десятки
    expect(travelled).toBeLessThan(12_000);

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

  /*
   * Круг сам по себе, без виртуализации: копии всё так же стоят по
   * координатам и всё так же водятся подменой — просто смонтированы все.
   */
  test("без render.mode круг работает, только монтирует всё", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopPlain");
    await settle(page);

    const view = page.locator(".ms-viewport");

    expect(await view.evaluate((el) => el.scrollHeight)).toBe(SPAN);
    expect(await scrollTop(page)).toBe(PERIOD);

    // шесть объектов на три копии — все на месте, окно никто не сужал
    expect(await page.locator(".ms-object-box").count()).toBe(18);

    await view.evaluate((el) => (el.scrollTop = 900));
    await settle(page);

    expect(await scrollTop(page)).toBe(900 - PERIOD);

    // и стоят они подряд, через тот же зазор
    const ys = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")]
        .map((el) => {
          const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
            el.style.transform,
          );

          return Math.round(Number(m?.[2] ?? 0));
        })
        .sort((one, two) => one - two),
    );

    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBe(70);
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

  /*
   * Страницы кругу не помеха: их столько, сколько в обороте, а не сколько
   * копий уместилось в ленту.
   */
  test("слайдер показывает точки оборота, а не всей ленты", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopSlider");
    await settle(page);

    // шесть страниц по 300 — оборот 1800, лента 5400
    expect(
      await page.locator(".ms-viewport").evaluate((el) => el.scrollHeight),
    ).toBe(5400);
    expect(await scrollTop(page)).toBe(1800);

    expect(await page.locator(".ms-slider-item").count()).toBe(6);
    expect(await page.locator(".ms-slider-item.ms-active").count()).toBe(1);
  });

  test("активная точка идёт по кругу и возвращается к первой", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopSlider");
    await settle(page);

    const activeAt = async () =>
      page.evaluate(() =>
        [...document.querySelectorAll(".ms-slider-item")].findIndex((el) =>
          el.classList.contains("ms-active"),
        ),
      );

    expect(await activeAt()).toBe(0);

    const view = page.locator(".ms-viewport");

    for (const expected of [1, 2, 3, 4, 5, 0]) {
      await view.evaluate((el) => (el.scrollTop += 300));
      await settle(page);

      expect(await activeAt()).toBe(expected);
    }

    // а позиция всё это время не выходила из круга
    const at = await scrollTop(page);
    expect(at).toBeGreaterThanOrEqual(1800);
    expect(at).toBeLessThan(3600);
  });

  /*
   * Когда оборот не кратен окну, место внутри оборота и место в ленте
   * расходятся — и считать страницу по ленте уже нельзя.
   */
  test("страницу считает по обороту, даже когда он не кратен окну", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopSliderGap");
    await settle(page);

    const view = page.locator(".ms-viewport");

    // шесть страниц по 300 с зазором 20 — оборот 1920, лента 5760
    expect(await view.evaluate((el) => el.scrollHeight)).toBe(5760);
    expect(await scrollTop(page)).toBe(1920);

    // шестьдесят внутрь оборота — это всё ещё первая страница
    await view.evaluate((el) => (el.scrollTop = 1980));
    await settle(page);

    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll(".ms-slider-item")].findIndex((el) =>
          el.classList.contains("ms-active"),
        ),
      ),
    ).toBe(0);
  });

  test("стрелка листает страницы и не упирается в край", async ({ page }) => {
    await page.goto("/?scenario=loopSlider");
    await settle(page);

    const next = page.locator(".ms-arrow-box.ms-bottom");

    // ни одна стрелка не тупик: в круге всегда есть куда ехать
    await expect(page.locator(".ms-arrow-box.ms-disabled")).toHaveCount(0);

    for (let turn = 0; turn < 8; turn++) {
      await next.click();
      await page.waitForTimeout(320);
    }

    const at = await scrollTop(page);
    expect(at).toBeGreaterThanOrEqual(1800);
    expect(at).toBeLessThan(3600);
  });

  /*
   * При `hybrid` едут обе стороны, значит и круг идёт по обеим: контент
   * повторяется и вправо, и вниз, а копии ложатся решёткой.
   */
  test("hybrid ходит по кругу в обе стороны", async ({ page }) => {
    await page.goto("/?scenario=loopHybrid");
    await settle(page);

    const view = page.locator(".ms-viewport");

    // обороты 200 вширь и 210 ввысь, по три копии на сторону
    expect(await view.evaluate((el) => el.scrollWidth)).toBe(600);
    expect(await view.evaluate((el) => el.scrollHeight)).toBe(630);

    // открывается со средней клетки решётки
    expect(await view.evaluate((el) => el.scrollLeft)).toBe(200);
    expect(await view.evaluate((el) => el.scrollTop)).toBe(210);

    // уход за клетку возвращает по обеим осям независимо
    await view.evaluate((el) => {
      el.scrollLeft = 430;
      el.scrollTop = 450;
    });
    await settle(page);

    expect(await view.evaluate((el) => el.scrollLeft)).toBe(230);
    expect(await view.evaluate((el) => el.scrollTop)).toBe(240);

    // и назад по одной оси, не трогая другую
    await view.evaluate((el) => (el.scrollLeft = 100));
    await settle(page);

    expect(await view.evaluate((el) => el.scrollLeft)).toBe(300);
    expect(await view.evaluate((el) => el.scrollTop)).toBe(240);
  });

  /*
   * Измеряемый размер: период известен только после замера, поэтому круг
   * включается сам, когда мерить больше нечего. Высоты 40, 80, 50, 30 через
   * зазор 10 дают протяжённость 230, оборот — 240, лента — 720.
   */
  test("объекты своего размера тоже ходят по кругу", async ({ page }) => {
    await page.goto("/?scenario=loopEach");

    const view = page.locator(".ms-viewport");

    // ждём, пока замер кончится и круг соберётся
    await expect.poll(() => view.evaluate((el) => el.scrollHeight)).toBe(720);

    expect(await scrollTop(page)).toBe(240);

    await view.evaluate((el) => (el.scrollTop = 500));
    await settle(page);

    expect(await scrollTop(page)).toBe(260);

    // и объекты идут по кругу: за третьим снова нулевой, через тот же зазор
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

    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].y - (boxes[i - 1].y + boxes[i - 1].h)).toBe(10);
      expect(boxes[i].n).toBe((boxes[i - 1].n + 1) % 4);
    }
  });

  /*
   * Тот же круг, но копии смонтированы все — у каждого ключа в документе по
   * три бокса разом. Замер должен пережить и это: следить надо за всеми
   * копиями, иначе уход одной стирает размер, которым живут остальные.
   */
  test("свой размер меряется, даже когда копий каждого несколько", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopEachPlain");

    const view = page.locator(".ms-viewport");

    await expect.poll(() => view.evaluate((el) => el.scrollHeight)).toBe(720);

    // четыре объекта на три копии — все на месте
    expect(await page.locator(".ms-object-box").count()).toBe(12);

    // и у каждого свой размер, а не общий: 40, 80, 50, 30 по три раза
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".ms-object-box")].map((el) =>
        Math.round(el.getBoundingClientRect().height),
      ),
    );

    expect(heights.filter((h) => h === 40)).toHaveLength(3);
    expect(heights.filter((h) => h === 80)).toHaveLength(3);
    expect(heights.filter((h) => h === 50)).toHaveLength(3);
    expect(heights.filter((h) => h === 30)).toHaveLength(3);

    // и круг всё так же водит позицию
    await view.evaluate((el) => (el.scrollTop = 500));
    await settle(page);

    expect(await scrollTop(page)).toBe(260);
  });

  /*
   * Шаг стрелки рано или поздно приходится на стык. Плавная прокрутка едет от
   * запомненного начала к запомненной цели и живую позицию не смотрит — если
   * перенос не сдвинет её цель, следующий же кадр затрёт перенос, и шаг
   * пропадёт. Проверяем, что ни один из десяти не пропал.
   */
  test("стрелка шагает и через стык копий", async ({ page }) => {
    await page.goto("/?scenario=loopArrows");
    await settle(page);

    const next = page.locator(".ms-arrow-box.ms-bottom");
    const seen: number[] = [];

    for (let step = 0; step < 10; step++) {
      const before = await scrollTop(page);

      await next.click();
      await page.waitForTimeout(260);

      const after = await scrollTop(page);

      // сдвиг либо на шаг вперёд, либо на шаг минус период — если был перенос
      seen.push(Math.round(after - before));
    }

    const period = 420;
    const moved = seen.filter(
      (step) => Math.abs(step) > 1 && Math.abs(step + period) !== 0,
    );

    // все десять шагов состоялись
    expect(moved).toHaveLength(10);

    // и позиция всё это время оставалась в круге
    const at = await scrollTop(page);
    expect(at).toBeGreaterThanOrEqual(period);
    expect(at).toBeLessThan(period * 2);
  });

  /*
   * Дорожка бегунка стоит за оборот, а не за ленту, — значит и ход бегунка
   * надо переводить в оборот. Считай его по ленте, и тот же ход увёз бы
   * контент во столько раз дальше, сколько копий в ленте.
   */
  test("бегунок увозит контент ровно на свой ход, а не на всю ленту", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopThumb");
    await settle(page);

    const thumb = page.locator(".ms-thumb");
    await expect(thumb).toBeVisible();

    const box = (await thumb.boundingBox())!;
    const track = 300;
    const travel = track - box.height;

    const before = await scrollTop(page);

    // ведём бегунок на половину его хода — это половина оборота
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height / 2 + travel / 2,
      { steps: 10 },
    );
    await page.mouse.up();
    await settle(page);

    const moved = (await scrollTop(page)) - before;

    // половина оборота — это 210; допуск на округления дорожки
    expect(moved).toBeGreaterThan(150);
    expect(moved).toBeLessThan(280);
  });

  /*
   * Число в круге значит место внутри оборота, а не в ленте: попросить встать
   * «на 100» можно только про контент. Позиция при этом живёт в средней копии,
   * поэтому 100 — это 520.
   */
  test("scrollTo ведёт к месту внутри оборота", async ({ page }) => {
    await page.goto("/?scenario=loopCommand");
    await settle(page);

    const period = 420;

    await page.getByTestId("to-100").click();
    await settle(page);

    expect(await scrollTop(page)).toBe(period + 100);

    await page.getByTestId("to-300").click();
    await settle(page);

    expect(await scrollTop(page)).toBe(period + 300);
  });

  test("то же число дважды едет оба раза", async ({ page }) => {
    await page.goto("/?scenario=loopCommand");
    await settle(page);

    const period = 420;

    await page.getByTestId("to-300").click();
    await settle(page);
    expect(await scrollTop(page)).toBe(period + 300);

    // уехали сами, и просим то же самое снова
    await page
      .locator(".ms-viewport")
      .evaluate((el) => (el.scrollTop = 500));
    await settle(page);

    await page.getByTestId("to-300").click();
    await settle(page);

    expect(await scrollTop(page)).toBe(period + 300);
  });

  /*
   * Резиновость показывает, что дальше края нет. В круге края нет вовсе, и
   * отскок означал бы конец там, где контент продолжается.
   */
  test("не пружинит при перетаскивании: краёв в круге нет", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopTight");
    await settle(page);

    const box = (await page.locator(".ms-viewport").boundingBox())!;
    const midX = box.x + box.width / 2;

    // тащим долго и в одну сторону — как раз тем жестом, что раньше упирался
    await page.mouse.move(midX, box.y + 30);
    await page.mouse.down();

    let bounced = false;

    for (let step = 1; step <= 14; step++) {
      await page.mouse.move(midX, box.y + 30 + step * 30);

      const shifted = await page
        .locator(".ms-objects-wrapper")
        .evaluate((el) => (el as HTMLElement).style.transform);

      if (shifted.includes("translate") && !shifted.includes("(0px, 0px)"))
        bounced = true;
    }

    await page.mouse.up();

    expect(bounced).toBe(false);
  });

  /*
   * Оборот редко делится на окно нацело. Остаток в обычном скролле отдельной
   * страницей не считается — он и есть остаток, — а в круге замыкается на
   * начало: без своей точки последняя часть оборота показывалась бы первой, и
   * та залипала бы на полтора окна вместо одного.
   *
   * Здесь оборот ввысь 700 при окне 210 — это три с третью окна, значит точек
   * четыре, и активная идёт по ним подряд.
   */
  test("активная точка не залипает, когда оборот не делится на окно нацело", async ({
    page,
  }) => {
    await page.goto("/?scenario=loopSliderHybrid");
    await settle(page);

    const state = () =>
      page.evaluate(() => {
        const bar = document.querySelector(".ms-slider")!;
        const items = [...bar.querySelectorAll(".ms-slider-item")];

        return {
          count: items.length,
          active: items.findIndex((el) => el.classList.contains("ms-active")),
        };
      });

    // 700 на 210 — четыре точки, а не три
    expect((await state()).count).toBe(4);

    const seen: number[] = [(await state()).active];

    for (let step = 0; step < 6; step++) {
      await page.locator(".ms-viewport").evaluate((el) => (el.scrollTop += 100));
      await settle(page);

      seen.push((await state()).active);
    }

    // за оборот проходим все четыре подряд и ни разу не возвращаемся раньше
    expect(seen).toEqual([0, 0, 1, 1, 2, 2, 3]);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import focusStep from "@morphing-scroll/src/helpers/focusStep";

/*
 * Сосед считается по геометрии, а не по порядку в DOM, поэтому здесь у
 * каждого объекта свой прямоугольник: jsdom сам их не раскладывает.
 */

const VIEW = { left: 0, top: 0, width: 200, height: 200 };

type Box = { left: number; top: number; width: number; height: number };

const rect = (b: Box) =>
  ({
    ...b,
    right: b.left + b.width,
    bottom: b.top + b.height,
    x: b.left,
    y: b.top,
    toJSON: () => "",
  }) as DOMRect;

/** сетка 2x3: колонки по 100, строки по 80 */
const GRID: Box[] = [
  { left: 0, top: 0, width: 100, height: 80 },
  { left: 100, top: 0, width: 100, height: 80 },
  { left: 0, top: 80, width: 100, height: 80 },
  { left: 100, top: 80, width: 100, height: 80 },
  { left: 0, top: 160, width: 100, height: 80 }, // ниже окна
  { left: 100, top: 160, width: 100, height: 80 },
];

const build = (layout: Box[] = GRID, inner?: (i: number) => string) => {
  document.body.innerHTML = "";

  const scrollEl = document.createElement("div");
  scrollEl.getBoundingClientRect = () => rect(VIEW);

  const wrapper = document.createElement("div");
  scrollEl.append(wrapper);
  document.body.append(scrollEl);

  const boxes = layout.map((box, i) => {
    const el = document.createElement("div");
    el.className = "ms-object-box";
    el.dataset.index = String(i);
    el.getBoundingClientRect = () => rect(box);
    if (inner) el.innerHTML = inner(i);
    wrapper.append(el);
    return el;
  });

  return { scrollEl, wrapper, boxes };
};

const focusedIndex = () => {
  const active = document.activeElement as HTMLElement | null;
  return active?.closest<HTMLElement>(".ms-object-box")?.dataset.index ?? null;
};

describe("focusStep", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("takes the first object in view when nothing is focused yet", () => {
    const { wrapper, scrollEl } = build();

    const moved = focusStep(wrapper, scrollEl, "bottom");

    expect(focusedIndex()).toBe("0");
    expect(moved?.delta).toEqual({ x: 0, y: 0 });
  });

  it("moves along the row", () => {
    const { wrapper, scrollEl } = build();
    focusStep(wrapper, scrollEl, "bottom"); // встаём на 0

    focusStep(wrapper, scrollEl, "right");

    expect(focusedIndex()).toBe("1");
  });

  it("moves down a row, not diagonally", () => {
    const { wrapper, scrollEl } = build();
    focusStep(wrapper, scrollEl, "bottom");
    focusStep(wrapper, scrollEl, "right"); // объект 1, правый верхний

    focusStep(wrapper, scrollEl, "bottom");

    expect(focusedIndex()).toBe("3");
  });

  it("keeps to its own column instead of cutting the corner", () => {
    /*
     * Ближе — не значит туда: сосед по диагонали может оказаться и ближе, но
     * «вниз» в столбце должно вести вниз по столбцу.
     */
    const { wrapper, scrollEl } = build([
      { left: 0, top: 0, width: 40, height: 40 },
      { left: 50, top: 100, width: 40, height: 40 }, // ближе, но вбок
      { left: 0, top: 300, width: 40, height: 40 }, // свой столбец
    ]);
    focusStep(wrapper, scrollEl, "bottom"); // объект 0

    focusStep(wrapper, scrollEl, "bottom");

    expect(focusedIndex()).toBe("2");
  });

  it("stays put at the edge of the run", () => {
    const { wrapper, scrollEl } = build();
    focusStep(wrapper, scrollEl, "bottom"); // объект 0

    const moved = focusStep(wrapper, scrollEl, "left");

    expect(moved).toBe(null);
    expect(focusedIndex()).toBe("0");
  });

  it("asks for the scroll only when the object is out of view", () => {
    const { wrapper, scrollEl } = build();
    focusStep(wrapper, scrollEl, "bottom"); // 0
    const inside = focusStep(wrapper, scrollEl, "bottom"); // 2, ещё видно

    expect(inside?.delta).toEqual({ x: 0, y: 0 });

    const below = focusStep(wrapper, scrollEl, "bottom"); // 4, ниже окна

    expect(focusedIndex()).toBe("4");
    expect(below?.delta.y).toBe(40); // 240 - 200
  });

  it("focuses the object itself, not what it holds", () => {
    // подсветка идёт по карточке целиком, иначе выделяется кнопка внутри
    const { wrapper, scrollEl, boxes } = build(
      GRID,
      (i) => `<button>go ${i}</button>`,
    );

    focusStep(wrapper, scrollEl, "bottom");

    expect(document.activeElement).toBe(boxes[0]);
  });

  it("makes an object focusable only when it has to", () => {
    const { wrapper, scrollEl, boxes } = build();

    expect(boxes[0].hasAttribute("tabindex")).toBe(false);

    focusStep(wrapper, scrollEl, "bottom");

    expect(boxes[0].tabIndex).toBe(-1);
    expect(document.activeElement).toBe(boxes[0]);
  });

  it("leaves a tabindex the author set alone", () => {
    const { wrapper, scrollEl, boxes } = build();
    boxes[0].tabIndex = 0;

    focusStep(wrapper, scrollEl, "bottom");

    expect(boxes[0].tabIndex).toBe(0);
    expect(document.activeElement).toBe(boxes[0]);
  });

  /*
   * Объект, доехавший до края окна, не должен стоять к нему вплотную, пока
   * рядом есть место. Между объектами это место — зазор, за крайним из них
   * зазора нет, там поле обёртки.
   */
  describe("spacing", () => {
    /** две колонки по 100 с зазором 20, четыре ряда по 80 с зазором 10 */
    const SPACED: Box[] = [
      { left: 0, top: 30, width: 100, height: 80 },
      { left: 120, top: 30, width: 100, height: 80 },
      { left: 0, top: 120, width: 100, height: 80 },
      { left: 120, top: 120, width: 100, height: 80 },
      { left: 0, top: 210, width: 100, height: 80 },
      { left: 120, top: 210, width: 100, height: 80 },
      { left: 0, top: 300, width: 100, height: 80 },
      { left: 120, top: 300, width: 100, height: 80 },
    ];

    const SPACING = {
      gap: [20, 10] as [number, number],
      margin: [30, 40, 30, 0] as [number, number, number, number],
    };

    const down = (wrapper: HTMLElement, scrollEl: HTMLElement, times: number) => {
      let moved = null as ReturnType<typeof focusStep>;
      for (let i = 0; i < times; i++)
        moved = focusStep(wrapper, scrollEl, "bottom", SPACING);

      return moved;
    };

    it("leaves the gap between the object and the edge", () => {
      const { wrapper, scrollEl } = build(SPACED);

      // 0 -> 2 (виден целиком) -> 4: первый, ради которого надо ехать
      const moved = down(wrapper, scrollEl, 3);

      expect(focusedIndex()).toBe("4");
      // 290 - 200 доводит вплотную, зазор до следующего ряда добавляет ещё 10
      expect(moved?.delta.y).toBe(100);
    });

    it("leaves the wrapper margin where the objects run out", () => {
      const { wrapper, scrollEl } = build(SPACED);

      const moved = down(wrapper, scrollEl, 4); // последний ряд

      expect(focusedIndex()).toBe("6");
      // 380 - 200 доводит вплотную; за последним рядом уже не зазор, а поле, 30
      expect(moved?.delta.y).toBe(210);
    });

    it("counts the side the object actually leaves the view by", () => {
      const { wrapper, scrollEl } = build(SPACED);
      focusStep(wrapper, scrollEl, "bottom", SPACING); // объект 0

      const moved = focusStep(wrapper, scrollEl, "right", SPACING);

      expect(focusedIndex()).toBe("1");
      // 220 - 200 вплотную, правее объектов нет — добавляется поле, 40
      expect(moved?.delta.x).toBe(60);
    });

    it("gives only the room the object leaves", () => {
      /*
       * Отступ шире, чем место вокруг объекта: взять его целиком нельзя — он
       * вытолкнул бы объект обратно за край. Берётся, сколько есть.
       */
      const { wrapper, scrollEl } = build([
        { left: 0, top: 0, width: 100, height: 80 },
        { left: 0, top: 210, width: 100, height: 80 },
      ]);
      focusStep(wrapper, scrollEl, "bottom", SPACING); // объект 0

      const moved = focusStep(wrapper, scrollEl, "bottom", {
        gap: [20, 400],
        margin: [400, 0, 400, 0],
      });

      expect(focusedIndex()).toBe("1");
      // окно 200, объект 80: свободных 120, дальше объект встаёт началом к краю
      expect(moved?.delta.y).toBe(210);
    });

    /*
     * Объект во весь размер окна места вокруг себя не оставляет, значит и
     * отступа быть не может: страница обязана встать ровно по краю, а не мимо
     * него на ширину зазора.
     */
    it("puts an object the size of the window exactly on the edge", () => {
      const { wrapper, scrollEl } = build([
        { left: 0, top: 0, width: 100, height: 200 },
        { left: 0, top: 220, width: 100, height: 200 },
        { left: 0, top: 440, width: 100, height: 200 },
      ]);
      focusStep(wrapper, scrollEl, "bottom", SPACING); // объект 0

      const moved = focusStep(wrapper, scrollEl, "bottom", SPACING);

      expect(focusedIndex()).toBe("1");
      expect(moved?.delta.y).toBe(220); // ровно шаг страницы: 200 объект + 20 зазор
    });

    // назад — то же самое: границу держит уже другой край объекта
    it("puts a window-sized object on the edge going back as well", () => {
      const { wrapper, scrollEl } = build([
        { left: 0, top: -220, width: 100, height: 200 }, // выше окна
        { left: 0, top: 0, width: 100, height: 200 }, // в окне
      ]);
      focusStep(wrapper, scrollEl, "bottom", SPACING); // встаём на видимый

      const moved = focusStep(wrapper, scrollEl, "top", SPACING);

      expect(focusedIndex()).toBe("0");
      expect(moved?.delta.y).toBe(-220);
    });

    it("asks for nothing when the object is already in view", () => {
      const { wrapper, scrollEl } = build(SPACED);

      const moved = down(wrapper, scrollEl, 2); // объект 2, 120..200

      expect(focusedIndex()).toBe("2");
      expect(moved?.delta).toEqual({ x: 0, y: 0 });
    });
  });

  it("says nothing when there is nothing to move through", () => {
    const { wrapper, scrollEl } = build([]);

    expect(focusStep(wrapper, scrollEl, "bottom")).toBe(null);
    expect(focusStep(null, scrollEl, "bottom")).toBe(null);
  });
});

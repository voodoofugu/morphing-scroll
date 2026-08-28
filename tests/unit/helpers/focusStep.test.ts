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

  it("says nothing when there is nothing to move through", () => {
    const { wrapper, scrollEl } = build([]);

    expect(focusStep(wrapper, scrollEl, "bottom")).toBe(null);
    expect(focusStep(null, scrollEl, "bottom")).toBe(null);
  });
});

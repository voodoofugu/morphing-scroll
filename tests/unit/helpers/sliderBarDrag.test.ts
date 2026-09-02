import { describe, it, expect, vi, afterEach } from "vitest";
import handleMouseOrTouch from "@morphing-scroll/src/helpers/handleMouseOrTouch";
import createPointerRuntime from "@morphing-scroll/src/helpers/createPointerRuntime";
import createTasks from "@morphing-scroll/src/helpers/createTasks";
import CONST from "@morphing-scroll/src/constants";
import { stubLayout, pointer } from "../../helpers/dom";

/**
 * Жест по бару слайдера — это прицеливание: страницу выбирает то, куда
 * указатель показывает, а не сколько он проехал. `smoothScroll` здесь заглушка,
 * так что позиция прокрутки не двигается — ровно как в середине перелёта, пока
 * анимация ещё едет.
 */

const PAGE = 300; // окно 300px без зазора — столько же в шаге страницы
const PAGES = 20;
const BAR_HEIGHT = 200; // пункт бара — 10px

let cleanup: (() => void) | null = null;

afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = "";
});

const setup = ({ duration = 200 } = {}) => {
  const scrollEl = document.createElement("div");
  document.body.appendChild(scrollEl);
  stubLayout(scrollEl, {
    clientWidth: 300,
    clientHeight: PAGE,
    scrollWidth: 300,
    scrollHeight: PAGE * PAGES,
  });

  const bar = document.createElement("div");
  bar.className = "ms-slider";
  const item = document.createElement("div");
  item.className = "ms-slider-item";
  bar.appendChild(item);
  document.body.appendChild(bar);
  bar.getBoundingClientRect = () =>
    ({
      width: 20,
      height: BAR_HEIGHT,
      top: 0,
      left: 0,
      right: 20,
      bottom: BAR_HEIGHT,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

  const smoothScroll = vi.fn();
  const emitNavigate = vi.fn();
  const runtime = createPointerRuntime();

  handleMouseOrTouch({
    scrollElement: scrollEl as unknown as HTMLDivElement,
    target: item,
    clickedObject: { current: "thumb" },
    mode: "slider",
    direction: "y",
    scrollStateRef: {
      targetScrollX: 0,
      targetScrollY: 0,
      animating: false,
      animationFrameId: null,
    },
    sizeLocal: [300, PAGE],
    smoothScroll,
    triggerUpdate: () => {},
    thumbSize: 0,
    axisFromAtr: "y",
    duration,
    scrollBarEdge: [0, 0],
    rafScrollAnim: { schedule: (_key: string, fn: () => void) => fn(), cancel: () => {} },
    isTouched: false,
    gap: [0, 0],
    overscrollRef: { current: { x: 0, y: 0 } },
    objLengthPerSize: [1, PAGES],
    isDraggingRef: { current: false },
    maxScrollSize: [0, PAGE * (PAGES - 1)],
    emitNavigate,
    pointerId: 1,
    runtime,
    tasks: createTasks(),
  } as never);

  cleanup = () => runtime.destroy();

  // первое движение только берёт отсчёт координат
  const move = (y: number) => pointer("pointermove", 10, y, document);
  move(5);

  return { scrollEl, smoothScroll, emitNavigate, move };
};

describe("slider bar drag", () => {
  it("aims at the element under the pointer", () => {
    const { smoothScroll, move } = setup();

    move(45); // пятый пункт бара — пятая страница

    expect(smoothScroll).toHaveBeenCalledWith(
      4 * PAGE,
      "y",
      CONST.SLIDER_AIM_DURATION,
    );
  });

  // прицеливание короче обычной прокрутки, но не длиннее того, что попросили
  it("keeps the flight shorter when the scroll itself animates faster", () => {
    const { smoothScroll, move } = setup({ duration: 60 });

    move(45);

    expect(smoothScroll).toHaveBeenCalledWith(4 * PAGE, "y", 60);
  });

  /*
   * Один пронос по бару перелистывает несколько раз. Ждать конца жеста
   * нельзя: конец у них общий, и все переходы, кроме последнего, пропали бы.
   */
  it("reports every element the pointer passes through", () => {
    const { emitNavigate, move } = setup();

    move(15); // второй пункт
    move(25); // третий
    move(45); // пятый

    expect(emitNavigate.mock.calls).toEqual([
      ["bar", "y", 0, 1],
      ["bar", "y", 1, 2],
      ["bar", "y", 2, 4],
    ]);
  });

  it("stays quiet while the pointer keeps naming the same element", () => {
    const { smoothScroll, move } = setup();

    move(45);
    move(46);
    move(49);

    expect(smoothScroll).toHaveBeenCalledTimes(1);
  });

  it("reports nothing while the element stays the same", () => {
    const { emitNavigate, move } = setup();

    move(45);
    move(46);
    move(49);

    expect(emitNavigate).toHaveBeenCalledTimes(1);
  });

  /*
   * Перелёт ещё едет, а позиция прокрутки лежит между страницами: судить по ней
   * нельзя — прицел в ту страницу, откуда мы как раз уезжаем, читался бы как
   * «мы там и стоим», и перелёт не отменялся.
   */
  it("turns back to the element the pointer returns to", () => {
    const { smoothScroll, move } = setup();

    move(45); // прицелились в пятую
    move(5); // и вернулись в первую, не дождавшись перелёта

    expect(smoothScroll).toHaveBeenLastCalledWith(
      0,
      "y",
      CONST.SLIDER_AIM_DURATION,
    );
  });

  it("aims at the last element while the pointer is past the bar", () => {
    const { smoothScroll, move } = setup();

    move(BAR_HEIGHT + 400);

    expect(smoothScroll).toHaveBeenCalledWith(
      (PAGES - 1) * PAGE,
      "y",
      CONST.SLIDER_AIM_DURATION,
    );
  });
});

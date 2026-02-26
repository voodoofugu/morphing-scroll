import { MorphScrollT } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { mouseOnEl } from "./mouseOn";
import startInertiaScroll from "./startInertiaScroll";
import clampValue from "./clampValue";
import { cancelTask } from "./taskManager";
import {
  overscrollBackAnim,
  stopOverscrollBackAnim,
} from "./overscrollBackAnim";

import CONST from "../constants";

type ClickedT = "thumb" | "slider" | "wrapp" | null;

let checkMove = {
  x: 0,
  y: 0,
};
let checkSliderThumbSize = {
  x: 0,
  y: 0,
};
let abortController: AbortController | undefined;
let velocity = {
  x: 0,
  y: 0,
  t: 0,
  distX: 0, // дистанция для границы запуска конца touch анимации
  distY: 0,
};
let prevCoords: {
  x: {
    value: number;
    leftover: number;
    raw: number;
  };
  y: {
    value: number;
    leftover: number;
    raw: number;
  };
} | null = null;

type HandleMouseT = {
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  target: HTMLElement | null;
  clickedObject: React.MutableRefObject<ClickedT>;
  scrollContentRef: HTMLDivElement | null;
  type: MorphScrollT["type"];
  direction: "x" | "y" | "hybrid";
  scrollStateRef: ScrollStateRefT;
  sizeLocal: number[];
  smoothScroll: (
    targetScrollTop: number | null,
    direction: "y" | "x",
    duration: number,
    callback?: () => void,
  ) => Promise<string | null | undefined> | null;
  triggerUpdate: () => void;
  thumbSize: number;
  axisFromAtr: "x" | "y" | null;
  duration: number;
  scrollBarEdge: number[];
  rafScrollAnim: {
    schedule: (fn: () => void) => void;
    cancel: () => void;
  };
  isTouched: boolean;
  pointerId: number;
  gap: number[];
  objectsWrapperSize: number[];
  overscrollRef: React.MutableRefObject<{
    x: number;
    y: number;
  }>;
};

type HandleMoveT = Omit<
  HandleMouseT,
  "controller" | "scrollBarOnHover" | "scrollContentRef" | "mouseOnRefHandle"
> & {
  event: PointerEvent;
  fullMargin: number[];
  scrollElementWH: number[];
  objectsWrapperWH: number[];
  wrapElWH: number[];
  visualDiff: number[];
  thumbRatio: number;
  maxTopOrLeft: number[];
  sliderElSize?: number[];
};

type HandleUpT = Omit<HandleMouseT, "scrollStateRef" | "sizeLocal"> & {
  event: PointerEvent;
  thumbRatio: number;
};

function getVisualToLayoutScale(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return [rect.width / el.clientWidth, rect.height / el.clientHeight];
}

const cursorClassChange = (
  clicked: ClickedT,
  target: HTMLElement | null,
  scrollElementRef: HTMLDivElement | null,
  mode: "start" | "end" = "start",
) => {
  if (!clicked) return;

  if (["thumb", "slider"].includes(clicked)) {
    // уточняем кликнутый объект для slider
    if (clicked === "slider") {
      mouseOnEl(target?.closest(".ms-slider") as HTMLDivElement | null, mode);
    } else mouseOnEl(target, mode);
  } else if (clicked === "wrapp") {
    mouseOnEl(scrollElementRef, mode);
  }
};

const applyThumb = (
  axis: "x" | "y",
  args: HandleMoveT,
  move: number,
  prevLeftover: number,
  thumbRatio: number,
) => {
  if (!args.scrollElementRef || !args.objectsWrapperRef) return;

  const scrollEl = args.scrollElementRef;
  const fullDelta = move * thumbRatio + prevLeftover;
  const intDelta = Math.trunc(fullDelta);

  if (prevCoords) prevCoords[axis].leftover = fullDelta - intDelta;

  if (axis === "x") {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollX === "number"
        ? args.scrollStateRef.targetScrollX
        : scrollEl.scrollLeft;

    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
    args.scrollStateRef.targetScrollX = clampValue(
      prevTarget + intDelta,
      0,
      maxScroll,
    );
  } else {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollY === "number"
        ? args.scrollStateRef.targetScrollY
        : scrollEl.scrollTop;

    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;

    args.scrollStateRef.targetScrollY = clampValue(
      prevTarget + intDelta,
      0,
      maxScroll,
    );
  }

  // для перетягивания
  if (scrollEl.scrollLeft !== args.scrollStateRef.targetScrollX) {
    scrollEl.scrollLeft = args.scrollStateRef.targetScrollX;
  }
  if (scrollEl.scrollTop !== args.scrollStateRef.targetScrollY) {
    scrollEl.scrollTop = args.scrollStateRef.targetScrollY;
  }
};

const motionHandler = (
  axis: "x" | "y",
  thumbRatio: number,
  visualDiff: number[],
  args: HandleMoveT,
) => {
  const el = args.scrollElementRef as HTMLDivElement;
  if (!el) return;

  // --- получение координат ---
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (!point) return;

  // --- инициализация предыдущей точки ---
  if (!prevCoords) {
    prevCoords = {
      x: { value: point.x, leftover: 0, raw: 0 },
      y: { value: point.y, leftover: 0, raw: 0 },
    };

    return;
  }

  const prev = prevCoords;

  const delta = {
    x: point.x - prev.x.value,
    y: point.y - prev.y.value,
  };

  // если checkMove больше 5px (запас), то считаем, что это scroll, и захватываем указатель
  const stableCheckMove = Math.abs(checkMove[axis]);
  if (!el.hasPointerCapture(args.pointerId) && stableCheckMove > 5) {
    el.setPointerCapture(args.pointerId);
  } else if (stableCheckMove < 6) checkMove[axis] += delta[axis];

  // логика для плавного скроллинга пальцем
  if (args.isTouched) {
    const now = performance.now();

    if (!velocity.t) {
      velocity.t = now;
    } else {
      const dt = Math.max(now - velocity.t, 8);

      velocity = {
        x: velocity.x * 0.8 + (delta.x / dt) * 0.2,
        y: velocity.y * 0.8 + (delta.y / dt) * 0.2,
        t: now,
        distX: (velocity.distX ?? 0) + Math.abs(delta.x),
        distY: (velocity.distY ?? 0) + Math.abs(delta.y),
      };
    }
  }

  const move =
    args.clickedObject.current === "wrapp" ? -delta[axis] : delta[axis];

  const topOrLeft = axis === "y" ? "scrollTop" : "scrollLeft";
  const wh = axis === "x" ? 0 : 1;

  // - spring-bounce - если overscroll уже есть
  const maxTopOrLeft =
    axis === "x" ? args.maxTopOrLeft[0] : args.maxTopOrLeft[1];

  const applyRubberBand = (drag: number) => {
    const K =
      (axis === "x" ? args.objectsWrapperSize[0] : args.objectsWrapperSize[1]) *
      CONST.RUBBER_STIFFNESS;
    return (drag * K) / (K + Math.abs(drag));
  };

  const state = prevCoords[axis];
  if (state.raw !== 0) {
    state.raw += delta[axis] * CONST.MICRO_DAMPENING;

    args.overscrollRef.current[axis] = applyRubberBand(state.raw);
    args.triggerUpdate();

    // если пересекли 0 — полностью выходим
    const prevRaw = state.raw - delta[axis] * CONST.MICRO_DAMPENING;
    if (Math.sign(state.raw) !== Math.sign(prevRaw)) {
      state.raw = 0;
      args.overscrollRef.current[axis] = 0;
      args.triggerUpdate();
      return;
    }

    return;
  }

  // -

  // обновление предыдущих координат, важно делать заранее
  if (args.type === "slider") checkSliderThumbSize[axis] += move;

  // --- логика для thumb ---
  if (args.clickedObject.current === "thumb" && args.type !== "slider") {
    applyThumb(axis, args, move, prev[axis].leftover, thumbRatio);
    return;
  }

  // --- логика для wrapp ---
  if (args.clickedObject.current === "wrapp") {
    const diff = visualDiff[wh];

    if (!Number.isFinite(diff) || diff === 0) {
      // важно: сбрасываем состояние, иначе жест «залипнет»
      prevCoords = null;
      return;
    }

    el[topOrLeft] += move / diff;

    // - spring-bounce -
    if (
      (el[topOrLeft] <= 0 && delta[axis] > 0) ||
      (el[topOrLeft] >= maxTopOrLeft && delta[axis] < 0)
    ) {
      state.raw += delta[axis];
      args.overscrollRef.current[axis] = applyRubberBand(state.raw);
      args.triggerUpdate();

      return;
    }

    return;
  }

  //  --- логика для slider ---
  const scroll = el[topOrLeft];

  // проверка если checkSliderThumbSize меньше размера элемента thumb слайдера
  if (
    args.sliderElSize &&
    Math.abs(checkSliderThumbSize[axis]) <
      args.sliderElSize[axis === "x" ? 0 : 1]
  )
    return;

  // правильное обновление перемещения
  const getNewPosition = (delta: 1 | -1) => {
    const clientSize = el[axis === "x" ? "clientWidth" : "clientHeight"];
    const step = clientSize + args.gap[wh];

    const page = Math.floor(Math.max(0, scroll) / step);
    const nextPage = page + delta;

    return step * nextPage;
  };

  const nextScroll =
    move > 0 && scroll + args.sizeLocal[wh] < args.wrapElWH[wh]
      ? getNewPosition(1)
      : move < 0 && scroll > 0
        ? getNewPosition(-1)
        : null;

  checkSliderThumbSize[axis] = 0; // обязательно сбрасываем

  // быстрое движение для слайдера по thumb длящееся 10мс
  args.smoothScroll(nextScroll, axis, 10);
};

function handleMouseOrTouch(args: HandleMouseT) {
  stopOverscrollBackAnim.stop();
  // удаляем RAF и задачу слайдера
  (["x", "y"] as const).forEach((axis) => {
    args.rafScrollAnim.cancel();
    cancelTask(`smoothScrollBlock${axis}`); // обязательно убираем анимацию
  });

  // обновление targetScroll заранее
  const el = args.scrollElementRef;
  if (!el) return;

  args.scrollStateRef.targetScrollX = el.scrollLeft;
  args.scrollStateRef.targetScrollY = el.scrollTop;

  // reset inertia state for new gesture
  velocity = {
    x: 0,
    y: 0,
    t: 0,
    distX: 0,
    distY: 0,
  };

  // получение некоторых данных заранее при клике
  let fullMargin: number[] = [],
    scrollElementWH: number[] = [],
    objectsWrapperWH: number[] = [],
    wrapElWH: number[] = [],
    visualDiff: number[] = [];

  if (args.clickedObject.current === "thumb") {
    const styles = getComputedStyle(args.objectsWrapperRef!);
    const getMrg = (dir: "x" | "y") => {
      const toNum = (value: string) => parseFloat(value);
      if (dir === "x")
        return toNum(styles.marginLeft) + toNum(styles.marginRight);
      else return toNum(styles.marginTop) + toNum(styles.marginBottom);
    };

    fullMargin = [getMrg("x"), getMrg("y")];
    scrollElementWH = [el.clientWidth, el.clientHeight];

    objectsWrapperWH = [
      args.objectsWrapperRef!.clientWidth,
      args.objectsWrapperRef!.clientHeight,
    ];
  }
  if (args.type === "slider") {
    wrapElWH = [
      args.objectsWrapperRef!.clientWidth,
      args.objectsWrapperRef!.clientHeight,
    ];
  }

  if (["scroll", "slider"].includes(args.type!))
    visualDiff = getVisualToLayoutScale(el);
  // --------------------------------------------

  // получаем thumbRatio
  let thumbRatio = 1;
  if (args.clickedObject.current === "thumb" && args.axisFromAtr) {
    const wh = args.axisFromAtr === "x" ? 0 : 1;
    const maxThumbPos =
      (scrollElementWH[wh] - args.scrollBarEdge[wh] - args.thumbSize) *
      visualDiff[wh];
    const objectsWrapperSize = objectsWrapperWH[wh] + fullMargin[wh]; // не забываем прибавить margin
    const scrollableSize = objectsWrapperSize - scrollElementWH[wh];
    thumbRatio = scrollableSize / maxThumbPos;
    // защита
    if (!Number.isFinite(thumbRatio) || thumbRatio <= 0) {
      thumbRatio = 1;
    }
  }

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, el);

  // слушатели для движения и отжатия
  abortController?.abort(); // отменяем предыдущие слушатели
  const controller = new AbortController();
  abortController = controller;
  const { signal } = controller;

  const onMoveLocal = (e: PointerEvent) => {
    // вычисления заранее размер для slider элемента thumb
    let sliderElSize: number[] | undefined;
    if (args.clickedObject.current === "thumb" && args.type === "slider") {
      const getRectSize = (axis: "x" | "y") => {
        const rect = args.scrollContentRef
          ?.querySelector(".ms-slider-element.active")
          ?.getBoundingClientRect();
        if (!rect) return 1;
        return axis === "x" ? rect.width : rect.height;
      };

      sliderElSize = [getRectSize("x"), getRectSize("y")];
    }

    const maxTopOrLeft = [
      args.objectsWrapperSize[0] - args.sizeLocal[0],
      args.objectsWrapperSize[1] - args.sizeLocal[1],
    ];

    handleMove({
      ...args,
      event: e,
      fullMargin,
      scrollElementWH,
      objectsWrapperWH,
      wrapElWH,
      visualDiff,
      thumbRatio,
      maxTopOrLeft,
      sliderElSize,
    });
  };

  document.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerId !== args.pointerId) return;
      onMoveLocal(e);
    },
    { signal },
  );

  const endHandler = (e: PointerEvent) => {
    if (e.pointerId !== args.pointerId) return; // убираем лишние события
    el.releasePointerCapture(args.pointerId);

    handleUp({
      ...args,
      event: e as any,
      thumbRatio,
    });
  };

  document.addEventListener("pointerup", endHandler, { signal });
  document.addEventListener("pointercancel", endHandler, { signal });
}

function handleMove(args: HandleMoveT) {
  const dir = args.direction || "y";

  if (dir === "hybrid") {
    if (["wrapp", "slider"].includes(args.clickedObject.current!)) {
      (["x", "y"] as const).forEach((axis) =>
        motionHandler(axis, args.thumbRatio, args.visualDiff, args),
      );
    } else if (args.axisFromAtr)
      motionHandler(args.axisFromAtr, args.thumbRatio, args.visualDiff, args);
  } else
    motionHandler(
      args.axisFromAtr ? args.axisFromAtr : dir,
      args.thumbRatio,
      args.visualDiff,
      args,
    );

  // обновление prevCoords
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (prevCoords) {
    prevCoords.x.value = point.x;
    prevCoords.y.value = point.y;
  }
}

function handleUp(args: HandleUpT) {
  if (args.pointerId !== args.pointerId) return; // убирает все лишние события типа click (клики по контенту)
  abortController?.abort(); // удаляем слушатели

  const el = args.scrollElementRef as HTMLDivElement;
  if (!el) return;

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, el, "end");

  // логика для слайдера
  if (args.type === "slider" && args.clickedObject.current !== "thumb") {
    const acc = checkSliderThumbSize; // размеры передвижения

    const runScroll = (dir: "x" | "y", math: "floor" | "ceil") => {
      const isX = dir === "x";

      const position = el[isX ? "scrollLeft" : "scrollTop"];
      const gapPerDir = isX ? args.gap[0] : args.gap[1];
      const clientSize = el[isX ? "clientWidth" : "clientHeight"];

      const step = clientSize + gapPerDir;

      const page = Math[math](Math.max(0, position) / step);

      // return step * nextPage;
      args.smoothScroll(step * page, dir, args.duration);
    };

    const resolveScroll = (dir: "x" | "y", value: number) => {
      // запас 20px для перелистывания
      if (Math.abs(value) > 20) runScroll(dir, value > 0 ? "ceil" : "floor");
      else runScroll(dir, value < 0 ? "ceil" : "floor"); // возвращает назад
    };

    if (acc.x === 0 && acc.y === 0) {
      if (args.direction === "hybrid")
        (["x", "y"] as const).forEach((dir) => resolveScroll(dir, acc[dir]));
      else resolveScroll(args.direction, acc[args.direction]);
    } else
      (Object.entries(acc) as ["x" | "y", number][]).forEach(([dir, value]) => {
        if (value !== 0) resolveScroll(dir, value);
      });
  }

  // --- inertia scroll for touch ---
  if (
    args.isTouched &&
    args.type === "scroll" &&
    args.clickedObject.current !== "slider"
  ) {
    const inertLogic = (axis: "x" | "y") => {
      // умножаем velocity на thumbRatio для правильного передвижение по thumb
      const vel = velocity[axis] * args.thumbRatio;
      const dist = axis === "x" ? velocity.distX : velocity.distY;

      const now = performance.now();
      const dtFromLastMove = now - velocity.t; // убираем скроллинг при резком отпускании пальца

      if (
        dtFromLastMove < CONST.INERTIA_RELEASE_TIMEOUT &&
        Math.abs(vel) > CONST.MIN_VELOCITY &&
        dist > CONST.MIN_DISTANCE
      ) {
        startInertiaScroll({
          el,
          axis,
          velocity: args.clickedObject.current === "thumb" ? vel : -vel,
          rafSchedule: args.rafScrollAnim.schedule,
        });
      }
    };

    if (args.direction === "hybrid") {
      if (args.clickedObject.current === "wrapp") {
        (["x", "y"] as const).forEach((el) => inertLogic(el));
      } else {
        inertLogic(args.axisFromAtr!);
      }
    } else {
      inertLogic(args.axisFromAtr ? args.axisFromAtr : args.direction!);
    }
  }

  // сбрасываем
  prevCoords = null;

  if (args.overscrollRef.current.x !== 0)
    overscrollBackAnim(args.overscrollRef, "x", args.triggerUpdate);
  if (args.overscrollRef.current.y !== 0)
    overscrollBackAnim(args.overscrollRef, "y", args.triggerUpdate);

  el.releasePointerCapture(args.pointerId);
  args.clickedObject.current = null;
  velocity = {
    x: 0,
    y: 0,
    t: 0,
    distX: 0,
    distY: 0,
  };
  checkMove = { x: 0, y: 0 };
  checkSliderThumbSize = {
    x: 0,
    y: 0,
  };
  // обновляем
  args.triggerUpdate();
}

export default handleMouseOrTouch;

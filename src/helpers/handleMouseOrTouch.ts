import { MorphScroll, Vec2 } from "../types/types";
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
    rest: number;
    raw: number;
  };
  y: {
    value: number;
    rest: number;
    raw: number;
  };
} | null = null;

type HandleMouseT = {
  scrollElement: HTMLDivElement | null;
  objectsWrapper: HTMLDivElement | null;
  target: HTMLElement | null;
  clickedObject: React.MutableRefObject<ClickedT>;
  type: MorphScroll["type"];
  direction: "x" | "y" | "hybrid";
  scrollStateRef: ScrollStateRefT;
  sizeLocal: number[];
  smoothScroll: (
    targetScroll: number | null,
    direction: "x" | "y",
    duration: number,
  ) => Promise<void> | null;
  triggerUpdate: () => void;
  thumbSize: number;
  axisFromAtr: "x" | "y" | null;
  duration: number;
  scrollBarEdge: number[];
  rafScrollAnim: {
    schedule: (kay: string, fn: () => void) => void;
    cancel: () => void;
  };
  isTouched: boolean;
  gap: number[];
  overscrollRef: React.MutableRefObject<{
    x: number;
    y: number;
  }>;
  objLengthPerSize: number[];
  isDraggingRef: React.MutableRefObject<boolean>;
  maxScrollSize: Vec2;
};

type HandleMoveT = Omit<
  HandleMouseT,
  "controller" | "scrollBarOnHover" | "scrollContentRef" | "mouseOnRefHandle"
> & {
  event: PointerEvent;
  scrollElementWH: number[];
  objectsWrapperWH: number[];
  wrapElWH: number[];
  visualDiff: number[];
  thumbRatio: number;
  maxScrollSize: Vec2;
  sliderElSize?: number[];
};

type HandleUpT = Omit<HandleMouseT, "scrollStateRef" | "sizeLocal"> & {
  event: PointerEvent;
  thumbRatio: number;
  maxScrollSize: Vec2;
};

function getVisualToLayoutScale(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return [rect.width / el.clientWidth, rect.height / el.clientHeight];
}

const cursorClassChange = (
  clicked: ClickedT,
  target: HTMLElement | null,
  scrollElement: HTMLDivElement | null,
  mode: "start" | "end",
) => {
  if (!clicked) return;
  let elem: HTMLElement | null = null;

  // уточняем elem
  if (["thumb", "slider"].includes(clicked)) {
    if (clicked === "slider")
      elem = target?.closest(".ms-slider") as HTMLDivElement | null;
    else elem = target;
  } else if (clicked === "wrapp") elem = scrollElement;

  mouseOnEl(elem, mode);
};

const applyThumb = (
  axis: "x" | "y",
  args: HandleMoveT,
  move: number,
  prevLeftover: number,
  thumbRatio: number,
) => {
  if (!args.scrollElement || !args.objectsWrapper) return;

  const scrollEl = args.scrollElement;
  const fullDelta = move * thumbRatio + prevLeftover;
  const intDelta = Math.trunc(fullDelta);

  if (prevCoords) prevCoords[axis].rest = fullDelta - intDelta;

  if (axis === "x") {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollX === "number"
        ? args.scrollStateRef.targetScrollX
        : scrollEl.scrollLeft;

    args.scrollStateRef.targetScrollX = clampValue(
      prevTarget + intDelta,
      0,
      args.maxScrollSize[0],
    );
  } else {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollY === "number"
        ? args.scrollStateRef.targetScrollY
        : scrollEl.scrollTop;

    args.scrollStateRef.targetScrollY = clampValue(
      prevTarget + intDelta,
      0,
      args.maxScrollSize[1],
    );
  }

  // для перетягивания
  if (scrollEl.scrollLeft !== args.scrollStateRef.targetScrollX)
    scrollEl.scrollLeft = args.scrollStateRef.targetScrollX;

  if (scrollEl.scrollTop !== args.scrollStateRef.targetScrollY)
    scrollEl.scrollTop = args.scrollStateRef.targetScrollY;
};

const motionHandler = (
  axis: "x" | "y",
  thumbRatio: number,
  visualDiff: number[],
  args: HandleMoveT,
) => {
  const el = args.scrollElement as HTMLDivElement;
  if (!el) return;

  const isX = axis === "x";

  // --- получение координат ---
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (!point) return;

  // --- инициализация предыдущей точки ---
  const applyRubberBand = (
    drag: number,
    axisLocal: "x" | "y",
    invert?: boolean,
  ) => {
    if (drag === 0) return 0;

    const viewportSize =
      axisLocal === "x" ? args.sizeLocal[0] : args.sizeLocal[1];
    const K =
      Math.max(CONST.MIN_THRESHOLD_SIZE, viewportSize) * CONST.RUBBER_STIFFNESS;

    const abs = Math.abs(drag);

    return clampValue(
      (drag * K) / (K + (invert ? -abs : abs)),
      -CONST.BOUNCE_MAX_OVERSCROLL,
      CONST.BOUNCE_MAX_OVERSCROLL,
    );
  };

  if (!prevCoords) {
    prevCoords = {
      x: {
        value: point.x,
        rest: 0,
        raw: applyRubberBand(args.overscrollRef.current.x, "x", true),
      },
      y: {
        value: point.y,
        rest: 0,
        raw: applyRubberBand(args.overscrollRef.current.y, "y", true),
      },
    };

    return;
  }

  const prev = prevCoords;

  const delta = {
    x: point.x - prev.x.value,
    y: point.y - prev.y.value,
  };

  // если checkMove больше 2px (запас), то считаем, что это scroll, и захватываем указатель
  const stableCheckMove = Math.abs(checkMove[axis]);
  if (stableCheckMove > 2) {
    args.isDraggingRef.current = true;
  } else if (stableCheckMove < 3) checkMove[axis] += delta[axis];

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

  const topOrLeft = isX ? "scrollLeft" : "scrollTop";
  const wh = isX ? 0 : 1;

  // --- логика для thumb ---
  if (args.clickedObject.current === "thumb" && args.type !== "slider") {
    applyThumb(axis, args, move, prev[axis].rest, thumbRatio);
    return;
  }

  // обновление предыдущих координат для ! wrapp при slider
  if (args.type === "slider") checkSliderThumbSize[axis] += move;

  // --- логика для wrapp ---
  if (args.clickedObject.current === "wrapp") {
    const diff = visualDiff[wh];

    if (!Number.isFinite(diff) || diff === 0) {
      // важно: сбрасываем состояние, иначе жест «залипнет»
      prevCoords = null;
      return;
    }

    // - spring-bounce -
    // если overscroll уже есть
    const state = prevCoords[axis];
    if (state.raw !== 0) {
      state.raw += delta[axis] * CONST.MICRO_DAMPENING;

      args.overscrollRef.current[axis] = applyRubberBand(state.raw, axis);
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

    const maxScrollSize = isX ? args.maxScrollSize[0] : args.maxScrollSize[1];

    // обновляем
    el[topOrLeft] = clampValue(el[topOrLeft] + move / diff, 0, maxScrollSize);

    // если вышли за границу (резиновое растяжение)
    if (
      (el[topOrLeft] <= 0 && delta[axis] > 0) ||
      (el[topOrLeft] >= maxScrollSize && delta[axis] < 0)
    ) {
      state.raw += delta[axis];
      args.overscrollRef.current[axis] = applyRubberBand(state.raw, axis);
      args.triggerUpdate();

      return;
    }
    // -

    return;
  }

  //  --- логика для slider ---
  const scroll = el[topOrLeft];

  // проверка если checkSliderThumbSize меньше размера элемента thumb слайдера
  if (
    args.sliderElSize &&
    Math.abs(checkSliderThumbSize[axis]) < args.sliderElSize[isX ? 0 : 1]
  )
    return;

  // правильное обновление перемещения
  const getNewPosition = (delta: 1 | -1) => {
    const clientSize = el[isX ? "clientWidth" : "clientHeight"];
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
  // останавливаем overscroll анимацию назад, если она есть
  stopOverscrollBackAnim();

  // удаляем RAF и задачу слайдера
  (["x", "y"] as const).forEach((axis) => {
    args.rafScrollAnim.cancel();
    cancelTask(`smoothScrollBlock${axis}`); // обязательно убираем анимацию
  });

  // обновление targetScroll заранее
  const el = args.scrollElement;
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
  let scrollElementWH: number[] = [],
    objectsWrapperWH: number[] = [],
    wrapElWH: number[] = [],
    visualDiff: number[] = [];

  if (args.clickedObject.current === "thumb") {
    scrollElementWH = [el.clientWidth, el.clientHeight];

    objectsWrapperWH = [
      args.objectsWrapper!.clientWidth,
      args.objectsWrapper!.clientHeight,
    ];
  }
  if (args.type === "slider") {
    wrapElWH = [
      args.objectsWrapper!.clientWidth,
      args.objectsWrapper!.clientHeight,
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
    const scrollableSize = objectsWrapperWH[wh] - scrollElementWH[wh];
    thumbRatio = scrollableSize / maxThumbPos;
    // защита
    if (!Number.isFinite(thumbRatio) || thumbRatio <= 0) {
      thumbRatio = 1;
    }
  }

  // меняем курсор и класс
  cursorClassChange(args.clickedObject.current, args.target, el, "start");

  // слушатели для движения и отжатия
  abortController?.abort(); // отменяем предыдущие слушатели
  const controller = new AbortController();
  abortController = controller;
  const { signal } = controller;

  const onMoveLocal = (e: PointerEvent) => {
    // вычисления заранее размер для slider элемента thumb
    let sliderElSize: number[] | undefined;
    if (args.clickedObject.current === "thumb" && args.type === "slider") {
      const bar = args.target?.closest(".ms-slider") as HTMLElement | null;
      if (!bar) return;

      const getRectSize = (axis: "x" | "y"): number => {
        const rect = bar.getBoundingClientRect();
        return Math.round(
          (axis === "x" ? rect.width : rect.height) /
            args.objLengthPerSize[axis === "x" ? 0 : 1],
        );
      };
      sliderElSize = [getRectSize("x"), getRectSize("y")];
    }

    handleMove({
      ...args,
      event: e,
      scrollElementWH,
      objectsWrapperWH,
      wrapElWH,
      visualDiff,
      thumbRatio,
      sliderElSize,
    });
  };

  document.addEventListener(
    "pointermove",
    (e) => {
      onMoveLocal(e);
    },
    { signal },
  );

  const endHandler = (e: PointerEvent) => {
    args.isDraggingRef.current = false; // сбрасываем флаг перетаскивания заранее

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
  abortController?.abort(); // удаляем слушатели

  const el = args.scrollElement as HTMLDivElement;
  if (!el) return;

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, el, "end");

  // логика для слайдера
  if (args.type === "slider" && args.clickedObject.current !== "thumb") {
    const acc = checkSliderThumbSize; // размеры передвижения

    const runScroll = (dir: "x" | "y", deltaDir?: 1 | -1) => {
      const isX = dir === "x";

      const maxTopOrLeft = isX ? args.maxScrollSize[0] : args.maxScrollSize[1];
      const position = el[isX ? "scrollLeft" : "scrollTop"];
      const gapPerDir = isX ? args.gap[0] : args.gap[1];
      const clientSize = el[isX ? "clientWidth" : "clientHeight"];

      const step = clientSize + gapPerDir;

      const currentPage = Math[
        !deltaDir ? "round" : deltaDir > 0 ? "floor" : "ceil"
      ](position / step);
      const nextValue = (currentPage + (deltaDir ?? 0)) * step;

      // защита от скролла за границы
      if (nextValue <= maxTopOrLeft && nextValue >= 0)
        args.smoothScroll(nextValue, dir, args.duration);
    };

    const resolveScroll = (dir: "x" | "y", value: number) => {
      // запас 20px для перелистывания
      if (Math.abs(value) > 20) runScroll(dir, value > 0 ? 1 : -1);
      else runScroll(dir); // возвращает назад
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

  // - сбрасываем -
  prevCoords = null;
  if (args.overscrollRef.current.x !== 0)
    overscrollBackAnim(args.overscrollRef, "x", args.triggerUpdate);
  if (args.overscrollRef.current.y !== 0)
    overscrollBackAnim(args.overscrollRef, "y", args.triggerUpdate);

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
  return args.triggerUpdate();
}

export default handleMouseOrTouch;

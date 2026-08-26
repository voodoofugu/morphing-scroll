import type { Tasks } from "./createTasks";
import type { PointerRuntime } from "./createPointerRuntime";

import { MorphScroll, Vec2 } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { mouseOnEl } from "./mouseOn";
import startInertiaScroll from "./startInertiaScroll";
import clampValue from "./clampValue";
import {
  overscrollBackAnim,
  stopOverscrollBackAnim,
} from "./overscrollBackAnim";

import CONST from "../constants";

type ClickedT = "thumb" | "slider" | "wrapp" | null;

type HandleMouseT = {
  scrollElement: HTMLDivElement | null;
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
  /** состояние указателя этого инстанса */
  runtime: PointerRuntime;
  /** менеджер задач этого инстанса */
  tasks: Tasks;
};

type HandleMoveT = Omit<
  HandleMouseT,
  "controller" | "scrollBarOnHover" | "scrollContentRef" | "mouseOnRefHandle"
> & {
  event: PointerEvent;
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
  runtime: PointerRuntime,
) => {
  if (!clicked) return;
  let elem: HTMLElement | null = null;

  // уточняем elem
  if (["thumb", "slider"].includes(clicked)) {
    if (clicked === "slider")
      elem = target?.closest(".ms-slider") as HTMLDivElement | null;
    else elem = target;
  } else if (clicked === "wrapp") elem = scrollElement;

  mouseOnEl(elem, mode, runtime);
};

const setScrollValue = (
  axis: "x" | "y",
  el: HTMLDivElement,
  args: HandleMoveT,
  value: number,
) => {
  if (axis === "x") {
    args.scrollStateRef.targetScrollX = value;
    if (el.scrollLeft !== value) el.scrollLeft = value;
  } else {
    args.scrollStateRef.targetScrollY = value;
    if (el.scrollTop !== value) el.scrollTop = value;
  }
};

const motionHandler = (
  axis: "x" | "y",
  thumbRatio: number,
  visualDiff: number[],
  args: HandleMoveT,
) => {
  const el = args.scrollElement as HTMLDivElement;
  if (!el) return;

  const rt = args.runtime;
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

  if (!rt.prevCoords) {
    rt.prevCoords = {
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

  const prev = rt.prevCoords;

  const delta = {
    x: point.x - prev.x.value,
    y: point.y - prev.y.value,
  };

  // если checkMove больше 2px (запас), то считаем, что это scroll, и захватываем указатель
  const stableCheckMove = Math.abs(rt.checkMove[axis]);
  if (stableCheckMove > 2) {
    args.isDraggingRef.current = true;
  } else if (stableCheckMove < 3) rt.checkMove[axis] += delta[axis];

  // логика для плавного скроллинга пальцем
  if (args.isTouched) {
    const now = performance.now();

    if (!rt.velocity.t) {
      rt.velocity.t = now;
    } else {
      const dt = Math.max(now - rt.velocity.t, 8);

      rt.velocity = {
        x: rt.velocity.x * 0.8 + (delta.x / dt) * 0.2,
        y: rt.velocity.y * 0.8 + (delta.y / dt) * 0.2,
        t: now,
        distX: rt.velocity.distX + Math.abs(delta.x),
        distY: rt.velocity.distY + Math.abs(delta.y),
      };
    }
  }

  const move =
    args.clickedObject.current === "wrapp" ? -delta[axis] : delta[axis];

  const topOrLeft = isX ? "scrollLeft" : "scrollTop";
  const wh = isX ? 0 : 1;

  const applyBoundedMovement = (
    scrollDelta: number,
    rawDelta: number,
    withVisualOverscroll: boolean,
  ) => {
    const state = rt.prevCoords![axis];
    const maxScrollSize = isX ? args.maxScrollSize[0] : args.maxScrollSize[1];

    if (!Number.isFinite(scrollDelta) || !Number.isFinite(rawDelta)) {
      // важно: сбрасываем состояние, иначе жест «залипнет»
      rt.prevCoords = null;
      return;
    }

    // Если указатель уже ушёл за край, сначала «съедаем» обратное
    // движение через raw. Для thumb это даёт браузерное поведение:
    // бегунок остаётся на краю и не начинает двигаться, пока указатель
    // не вернулся из накопленного overscroll-участка.
    if (state.raw !== 0) {
      const prevRaw = state.raw;
      state.raw += rawDelta * CONST.MICRO_DAMPENING;

      if (withVisualOverscroll) {
        args.overscrollRef.current[axis] = applyRubberBand(state.raw, axis);
        args.triggerUpdate();
      }

      // если пересекли 0 — полностью выходим в нормальный режим
      if (Math.sign(state.raw) !== Math.sign(prevRaw)) {
        state.raw = 0;
        if (withVisualOverscroll) {
          args.overscrollRef.current[axis] = 0;
          args.triggerUpdate();
        }
        return;
      }

      return;
    }

    if (maxScrollSize <= 0) {
      setScrollValue(axis, el, args, 0);
      return;
    }

    const currentScroll = el[topOrLeft];
    const isAtStart = currentScroll <= 0;
    const isAtEnd = currentScroll >= maxScrollSize;
    const isMovingBeforeStart = scrollDelta < 0;
    const isMovingAfterEnd = scrollDelta > 0;
    const shouldStartOverscroll =
      (isAtStart && isMovingBeforeStart) || (isAtEnd && isMovingAfterEnd);

    // Важно: если движение из середины списка просто перелетело за край,
    // сначала только доводим scroll до границы. Резиновость начинается
    // только следующим движением, когда scroll уже стоит на start/end.
    if (shouldStartOverscroll) {
      state.raw += rawDelta;

      if (withVisualOverscroll) {
        args.overscrollRef.current[axis] = applyRubberBand(state.raw, axis);
        args.triggerUpdate();
      }

      return;
    }

    const nextScroll = el[topOrLeft] + scrollDelta;
    const clampedScroll = clampValue(nextScroll, 0, maxScrollSize);
    setScrollValue(axis, el, args, clampedScroll);
  };

  // --- логика для thumb ---
  if (args.clickedObject.current === "thumb" && args.type !== "slider") {
    const fullDelta = move * thumbRatio + prev[axis].rest;
    const intDelta = Math.trunc(fullDelta);
    prev[axis].rest = fullDelta - intDelta;

    applyBoundedMovement(intDelta, move, false);
    return;
  }

  // обновление предыдущих координат для ! wrapp при slider
  if (args.type === "slider") rt.checkSliderThumbSize[axis] += move;

  // --- логика для wrapp ---
  if (args.clickedObject.current === "wrapp") {
    const diff = visualDiff[wh];
    applyBoundedMovement(move / diff, delta[axis], true);
    return;
  }

  //  --- логика для slider ---
  const scroll = el[topOrLeft];

  // проверка если checkSliderThumbSize меньше размера элемента thumb слайдера
  if (
    args.sliderElSize &&
    Math.abs(rt.checkSliderThumbSize[axis]) < args.sliderElSize[isX ? 0 : 1]
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

  rt.checkSliderThumbSize[axis] = 0; // обязательно сбрасываем

  // быстрое движение для слайдера по thumb длящееся 10мс
  args.smoothScroll(nextScroll, axis, 10);
};

function handleMouseOrTouch(args: HandleMouseT) {
  const rt = args.runtime;

  // останавливаем overscroll анимацию назад, если она есть
  stopOverscrollBackAnim(rt.overscrollLoop);

  // удаляем RAF и задачу слайдера
  (["x", "y"] as const).forEach((axis) => {
    args.rafScrollAnim.cancel();
    args.tasks.cancelTask(`smoothScrollBlock${axis}`); // обязательно убираем анимацию
  });

  // обновление targetScroll заранее
  const el = args.scrollElement;
  if (!el) return;

  args.scrollStateRef.targetScrollX = el.scrollLeft;
  args.scrollStateRef.targetScrollY = el.scrollTop;

  // reset inertia state for new gesture
  rt.resetGesture();

  // получение некоторых данных заранее при клике
  const wrapElWH = [el.scrollWidth, el.scrollHeight];
  const visualDiff = ["scroll", "slider"].includes(args.type!)
    ? getVisualToLayoutScale(el)
    : [];
  // --------------------------------------------

  // получаем thumbRatio
  let thumbRatio = 1;
  if (args.clickedObject.current === "thumb" && args.axisFromAtr) {
    const wh = args.axisFromAtr === "x" ? 0 : 1;
    const maxThumbPos =
      (args.sizeLocal[wh] - args.scrollBarEdge[wh] - args.thumbSize) *
      visualDiff[wh];

    thumbRatio = args.maxScrollSize[wh] / maxThumbPos;
    // защита
    if (!Number.isFinite(thumbRatio) || thumbRatio <= 0) thumbRatio = 1;
  }

  // меняем курсор и класс
  cursorClassChange(args.clickedObject.current, args.target, el, "start", rt);

  // слушатели для движения и отжатия
  rt.controller?.abort(); // отменяем предыдущий жест этого же скролла
  const controller = new AbortController();
  rt.controller = controller;
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
  const { prevCoords } = args.runtime;
  if (prevCoords) {
    prevCoords.x.value = point.x;
    prevCoords.y.value = point.y;
  }
}

function handleUp(args: HandleUpT) {
  const rt = args.runtime;
  rt.controller?.abort(); // удаляем слушатели
  rt.controller = undefined;

  const el = args.scrollElement as HTMLDivElement;
  if (!el) return;

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, el, "end", rt);

  // логика для слайдера
  if (args.type === "slider" && args.clickedObject.current !== "thumb") {
    const acc = rt.checkSliderThumbSize; // размеры передвижения

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
      const vel = rt.velocity[axis] * args.thumbRatio;
      const dist = axis === "x" ? rt.velocity.distX : rt.velocity.distY;

      const now = performance.now();
      const dtFromLastMove = now - rt.velocity.t; // убираем скроллинг при резком отпускании пальца

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
  const backAnim = (axis: "x" | "y") =>
    overscrollBackAnim(
      rt.overscrollLoop,
      args.overscrollRef,
      axis,
      args.triggerUpdate,
    );

  if (args.overscrollRef.current.x !== 0) backAnim("x");
  if (args.overscrollRef.current.y !== 0) backAnim("y");

  args.clickedObject.current = null;
  rt.resetGesture();

  // обновляем
  return args.triggerUpdate();
}

export default handleMouseOrTouch;

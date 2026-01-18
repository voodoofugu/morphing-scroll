import { MorphScrollT } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { mouseOnEl } from "../functions/mouseOn";
import { cancelTask } from "../helpers/taskManager";
import startInertiaScroll from "../helpers/startInertiaScroll";
import { clampValue } from "./addFunctions";

import CONST from "../../src/constants";

type ClickedT = "thumb" | "slider" | "wrapp" | null;

type HandleMouseT = {
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  target: HTMLElement | null;
  clickedObject: React.MutableRefObject<ClickedT>;
  scrollContentRef: HTMLDivElement | null;
  type: MorphScrollT["type"];
  direction: MorphScrollT["direction"];
  scrollStateRef: ScrollStateRefT;
  sizeLocal: number[];
  smoothScroll: (
    targetScrollTop: number | null,
    direction: "y" | "x",
    duration: number,
    callback?: () => void
  ) => Promise<string | null | undefined> | null;
  triggerUpdate: () => void;
  numForSliderRef: React.MutableRefObject<number>;
  prevCoordsRef: React.MutableRefObject<{
    x: number;
    y: number;
    leftover: number;
  } | null>;
  thumbSize: number;
  axisFromAtr: "x" | "y" | null;
  duration: number;
  scrollBarEdge: number[];
  rafID: React.MutableRefObject<{
    x: number;
    y: number;
  }>;
  controllerRef: React.MutableRefObject<AbortController | null>;
  isTouched: boolean;
  pointerId: number;
  velocityRef: React.MutableRefObject<{
    x: number;
    y: number;
    t: number;
    distX: number;
    distY: number;
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
  mode: "start" | "end" = "start"
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
  prev: { leftover: number },
  thumbRatio: number
) => {
  if (!args.scrollElementRef || !args.objectsWrapperRef) return;

  const scrollEl = args.scrollElementRef;
  const fullDelta = move * thumbRatio + prev.leftover;
  const intDelta = Math.trunc(fullDelta);

  if (args.prevCoordsRef.current) {
    args.prevCoordsRef.current.leftover = fullDelta - intDelta;
  }

  if (axis === "x") {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollX === "number"
        ? args.scrollStateRef.targetScrollX
        : scrollEl.scrollLeft;

    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
    args.scrollStateRef.targetScrollX = clampValue(
      prevTarget + intDelta,
      0,
      maxScroll
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
      maxScroll
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
  args: HandleMoveT
) => {
  const el = args.scrollElementRef as HTMLDivElement;
  if (!el) return;

  // --- получение координат ---
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (!point) return;

  // --- инициализация предыдущей точки ---
  if (!args.prevCoordsRef.current) {
    args.prevCoordsRef.current = {
      x: point.x,
      y: point.y,
      leftover: 0,
    };
    return;
  }

  const prev = args.prevCoordsRef.current;

  const delta = {
    x: point.x - prev.x,
    y: point.y - prev.y,
  };

  // логика для плавного скроллинга пальцем
  if (args.isTouched) {
    const now = performance.now();

    if (!args.velocityRef.current.t) {
      args.velocityRef.current.t = now;
    } else {
      const dt = Math.max(now - args.velocityRef.current.t, 8);

      args.velocityRef.current = {
        x: args.velocityRef.current.x * 0.8 + (delta.x / dt) * 0.2,
        y: args.velocityRef.current.y * 0.8 + (delta.y / dt) * 0.2,
        t: now,
        distX: (args.velocityRef.current.distX ?? 0) + Math.abs(delta.x),
        distY: (args.velocityRef.current.distY ?? 0) + Math.abs(delta.y),
      };
    }
  }

  const move =
    args.clickedObject.current === "wrapp" ? -delta[axis] : delta[axis];

  const topOrLeft = axis === "y" ? "scrollTop" : "scrollLeft";
  const wh = axis === "x" ? 0 : 1;

  // --- логика для thumb ---
  if (args.clickedObject.current === "thumb") {
    applyThumb(axis, args, move, prev, thumbRatio);
    return;
  }

  // --- slider: накопление движения ---
  if (args.type === "slider") {
    args.numForSliderRef.current += move;
  }

  // --- логика для wrapp ---
  if (args.clickedObject.current === "wrapp") {
    const diff = visualDiff[wh];

    if (!Number.isFinite(diff) || diff === 0) {
      // важно: сбрасываем состояние, иначе жест «залипнет»
      args.prevCoordsRef.current = null;
      return;
    }

    el[topOrLeft] += move / diff;
    return;
  }

  // --- логика для sliderThumb ---
  const scroll = el[topOrLeft];

  const sliderElSize = Math.round(
    el
      .closest(".ms-content")
      ?.querySelector(".ms-slider-element.active")
      ?.getBoundingClientRect()[axis === "x" ? "width" : "height"] || 1
  );

  if (Math.abs(args.numForSliderRef.current) < sliderElSize) return;

  const nextScroll =
    move > 0 && scroll + args.sizeLocal[wh] < args.wrapElWH[wh]
      ? scroll + args.sizeLocal[wh]
      : move < 0 && scroll > 0
      ? scroll - args.sizeLocal[wh]
      : null;

  args.numForSliderRef.current = 0;

  args.smoothScroll(nextScroll, axis, 10);
};

function handleMouseOrTouch(args: HandleMouseT) {
  // удаляем RAF и задачу слайдера
  (["x", "y"] as const).forEach((axis) => {
    const id = args.rafID.current[axis];
    if (id) {
      cancelAnimationFrame(id);
      args.rafID.current[axis] = 0;
    }
  });
  cancelTask("smoothScrollBlock");

  // обновление targetScroll заранее
  const scrollElement = args.scrollElementRef;
  if (scrollElement) {
    scrollElement.setPointerCapture(args.pointerId);

    args.scrollStateRef.targetScrollX = scrollElement.scrollLeft;
    args.scrollStateRef.targetScrollY = scrollElement.scrollTop;
  }

  // reset inertia state for new gesture
  args.velocityRef.current = {
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
    scrollElementWH = [scrollElement!.clientWidth, scrollElement!.clientHeight];

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
    visualDiff = getVisualToLayoutScale(scrollElement!);
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

  const onMove = (e: PointerEvent) => {
    handleMove({
      ...args,
      event: e,
      fullMargin,
      scrollElementWH,
      objectsWrapperWH,
      wrapElWH,
      visualDiff,
      thumbRatio,
    });
  };

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, scrollElement);

  // слушатели для движения и отжатия
  args.controllerRef.current?.abort(); // отменяем предыдущие слушатели
  const controller = new AbortController();
  args.controllerRef.current = controller;
  const { signal } = controller;

  scrollElement?.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerId !== args.pointerId) return;
      onMove(e);
    },
    { signal }
  );

  const endHandler = (e: PointerEvent) => {
    if (e.pointerId !== args.pointerId) return;

    scrollElement?.releasePointerCapture(args.pointerId);
    handleUp({
      ...args,
      event: e as any,
      thumbRatio,
    });
  };

  scrollElement?.addEventListener("pointerup", endHandler, { signal });
  scrollElement?.addEventListener("pointercancel", endHandler, { signal });
}

function handleMove(args: HandleMoveT) {
  const dir = args.direction || "y";

  if (dir === "hybrid") {
    if (["wrapp", "slider"].includes(args.clickedObject.current!)) {
      (["x", "y"] as const).forEach((axis) =>
        motionHandler(axis, args.thumbRatio, args.visualDiff, args)
      );
    } else {
      args.axisFromAtr &&
        motionHandler(args.axisFromAtr, args.thumbRatio, args.visualDiff, args);
    }
  } else {
    motionHandler(
      args.axisFromAtr ? args.axisFromAtr : dir,
      args.thumbRatio,
      args.visualDiff,
      args
    );
  }

  // единое обновление prevCoordsRef
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (args.prevCoordsRef.current) {
    args.prevCoordsRef.current = {
      x: point.x,
      y: point.y,
      leftover: args.prevCoordsRef.current.leftover,
    };
  }
}

function handleUp(args: HandleUpT) {
  args.controllerRef.current?.abort(); // удаляем слушатели

  // меняем курсор и классы
  cursorClassChange(
    args.clickedObject.current,
    args.target,
    args.scrollElementRef,
    "end"
  );

  // логика для слайдера
  if (args.type === "slider") {
    const el = args.scrollElementRef as HTMLDivElement;
    if (!el) return;

    const acc = args.numForSliderRef.current;
    const topOrLeft = args.direction === "y" ? "scrollTop" : "scrollLeft";
    const heightOrWidth =
      args.direction === "y" ? el.clientHeight : el.clientWidth;

    const getNextScroll = (math: "ceil" | "floor") => {
      return heightOrWidth * Math[math](el[topOrLeft] / heightOrWidth);
    };

    if (Math.abs(acc) > 20) {
      const nextScroll =
        acc > 0 ? getNextScroll("ceil") : getNextScroll("floor");

      args.smoothScroll(
        nextScroll,
        args.direction === "y" ? "y" : "x",
        args.duration
      );
    }
    // возврат если < 20
    else {
      const nextScroll =
        acc > 0 ? getNextScroll("floor") : getNextScroll("ceil");

      args.smoothScroll(
        nextScroll,
        args.direction === "y" ? "y" : "x",
        args.duration
      );
    }

    // сбрасываем
    args.numForSliderRef.current = 0;
  }

  // --- inertia scroll for touch ---
  if (
    args.isTouched &&
    args.type === "scroll" &&
    args.clickedObject.current !== "slider"
  ) {
    const el = args.scrollElementRef;
    if (!el) return;

    const inertLogic = (axis: "x" | "y") => {
      // умножаем velocity на thumbRatio для правильного передвижение по thumb
      const vel = args.velocityRef.current[axis] * args.thumbRatio;
      const dist =
        axis === "x"
          ? args.velocityRef.current.distX
          : args.velocityRef.current.distY;

      const now = performance.now();
      const dtFromLastMove = now - args.velocityRef.current.t; // убираем скроллинг при резком отпускании пальца

      if (
        dtFromLastMove < CONST.INERTIA_RELEASE_TIMEOUT &&
        Math.abs(vel) > CONST.MIN_VELOCITY &&
        dist > CONST.MIN_DISTANCE
      ) {
        startInertiaScroll({
          el,
          axis,
          velocity:
            (args.clickedObject.current === "thumb" ? vel : -vel) *
            CONST.INERTIA_FRAME_SCALE, // переводим в px/frame
          rafID: args.rafID,
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
  args.prevCoordsRef.current = null;
  args.clickedObject.current = null;
  args.velocityRef.current = {
    x: 0,
    y: 0,
    t: 0,
    distX: 0,
    distY: 0,
  };
  // обновляем
  args.triggerUpdate();
}

export default handleMouseOrTouch;

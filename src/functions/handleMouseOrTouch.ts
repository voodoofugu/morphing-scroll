import { MorphScrollT } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { mouseOnEl } from "../functions/mouseOn";
import { cancelTask } from "../helpers/taskManager";
import startInertiaScroll from "../helpers/startInertiaScroll";
import { clampValue } from "./addFunctions";

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
  isTouched: boolean; // !!! не используется
  pointerId: number;
  velocityRef: React.MutableRefObject<{
    x: number;
    y: number;
    t: number;
  }>;
};

type HandleMoveT = Omit<
  HandleMouseT,
  "controller" | "scrollBarOnHover" | "scrollContentRef" | "mouseOnRefHandle"
> & {
  event: PointerEvent;
  fullMarginX: number;
  fullMarginY: number;
  scrollElementWH: number[];
  objectsWrapperWH: number[];
  wrapElWH: number[];
  visualDiff: number[];
};

type HandleUpT = Omit<HandleMouseT, "scrollStateRef" | "sizeLocal"> & {
  event: PointerEvent;
};

function getVisualToLayoutScale(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return [rect.width / el.clientWidth, rect.height / el.clientHeight];
}

const cursorClassChange = (
  clicked: ClickedT,
  target: HTMLElement | null,
  scrollElementRef: HTMLDivElement | null
) => {
  if (!clicked) return;

  if (["thumb", "slider"].includes(clicked)) {
    // уточняем кликнутый объект для slider
    if (clicked === "slider") {
      mouseOnEl(target?.closest(".ms-slider") as HTMLDivElement | null);
    } else mouseOnEl(target);
  } else if (clicked === "wrapp") {
    mouseOnEl(scrollElementRef);
  }
};

const applyThumb = (
  axis: "x" | "y",
  args: HandleMoveT,
  move: number,
  prev: { leftover: number },
  visualDiff: number[]
) => {
  if (!args.scrollElementRef || !args.objectsWrapperRef) return;

  const scrollEl = args.scrollElementRef;
  const wh = axis === "x" ? 0 : 1;
  if (!Number.isFinite(visualDiff[wh])) return;

  // не забываем прибавить margin
  const objectsWrapperSize =
    args.objectsWrapperWH[wh] +
    args[axis === "x" ? "fullMarginX" : "fullMarginY"];

  const maxThumbPos =
    (args.scrollElementWH[wh] - args.scrollBarEdge[wh] - args.thumbSize) *
    visualDiff[wh];
  const scrollableSize = objectsWrapperSize - args.scrollElementWH[wh];

  if (maxThumbPos <= 0 || scrollableSize <= 0) return;

  const scrollRatio = scrollableSize / maxThumbPos;
  const fullDelta = move * scrollRatio + prev.leftover;
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
    const dt = Math.max(now - args.velocityRef.current.t, 8); // защита от 0

    args.velocityRef.current = {
      x: (point.x - prev.x) / dt,
      y: (point.y - prev.y) / dt,
      t: now,
    };
  }

  args.prevCoordsRef.current = {
    x: point.x,
    y: point.y,
    leftover: prev.leftover,
  };

  const move =
    args.clickedObject.current === "wrapp" ? -delta[axis] : delta[axis];

  const topOrLeft = axis === "y" ? "scrollTop" : "scrollLeft";
  const wh = axis === "x" ? 0 : 1;

  // --- логика для thumb ---
  if (args.clickedObject.current === "thumb") {
    applyThumb(axis, args, move, prev, visualDiff);
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

  // получение некоторых данных заранее при клике
  let fullMarginX: number = 0,
    fullMarginY: number = 0,
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

    fullMarginX = getMrg("x");
    fullMarginY = getMrg("y");

    scrollElementWH = [
      args.scrollElementRef!.clientWidth,
      args.scrollElementRef!.clientHeight,
    ];

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
    visualDiff = getVisualToLayoutScale(args.scrollElementRef!);
  // --------------------------------------------

  const onMove = (e: PointerEvent) => {
    handleMove({
      ...args,
      event: e,
      fullMarginX,
      fullMarginY,
      scrollElementWH,
      objectsWrapperWH,
      wrapElWH,
      visualDiff,
    });
  };

  // меняем курсор и классы
  cursorClassChange(
    args.clickedObject.current,
    args.target,
    args.scrollElementRef
  );

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

    args.scrollElementRef?.releasePointerCapture(args.pointerId);
    handleUp({ ...args, event: e as any });
  };

  scrollElement?.addEventListener("pointerup", endHandler, { signal });
  scrollElement?.addEventListener("pointercancel", endHandler, { signal });
}

function handleMove(args: HandleMoveT) {
  const dir = args.direction || "y";

  if (dir === "hybrid" && args.clickedObject.current === "wrapp") {
    ["x", "y"].forEach(
      (axis) => axis && motionHandler(axis as "x" | "y", args.visualDiff, args)
    );
  } else {
    args.axisFromAtr && motionHandler(args.axisFromAtr, args.visualDiff, args);
  }
}

function handleUp(args: HandleUpT) {
  args.controllerRef.current?.abort(); // удаляем слушатели

  // меняем курсор и классы
  cursorClassChange(
    args.clickedObject.current,
    args.target,
    args.scrollElementRef
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
  if (args.isTouched && args.type === "scroll") {
    const el = args.scrollElementRef;
    if (!el) return;

    const MIN_VELOCITY = 0.02; // px/ms
    const inertLogic = (axis: "x" | "y") => {
      const vel = args.velocityRef.current[axis];

      if (Math.abs(vel) > MIN_VELOCITY) {
        startInertiaScroll({
          el,
          axis,
          velocity: (args.clickedObject.current === "thumb" ? vel : -vel) * 16, // переводим в px/frame
          rafID: args.rafID,
        });
      }
    };

    if (args.direction === "hybrid" && args.clickedObject.current === "wrapp") {
      ["x", "y"].forEach((el) => {
        inertLogic(el as "x" | "y");
      });
    } else args.axisFromAtr && inertLogic(args.axisFromAtr);
  }

  args.prevCoordsRef.current = null;
  args.triggerUpdate(); // for update ref only
  args.clickedObject.current = null;
}

export default handleMouseOrTouch;

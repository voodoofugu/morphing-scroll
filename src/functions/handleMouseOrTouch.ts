import { MorphScrollT } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { mouseOnEl } from "../functions/mouseOn";
import { cancelTask } from "../helpers/taskManager";
import { clampValue } from "./addFunctions";

type ClickedT = "thumb" | "slider" | "wrapp" | "none";

type HandleMouseT = {
  eventType: string;
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  scrollBar: HTMLDivElement | null;
  clickedObject: React.RefObject<ClickedT>;
  scrollBarOnHover: boolean;
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
  mouseOnRefHandle: (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.TouchEvent<HTMLDivElement>
      | MouseEvent
      | TouchEvent
  ) => void;
  triggerUpdate: () => void;
  scrollElemIndex?: number;
  numForSliderRef: React.RefObject<number>;
  prevCoordsRef: React.RefObject<{
    x: number;
    y: number;
    leftover: number;
  } | null>;
  thumbSize: number;
  axisFromAtr: "x" | "y" | null;
  duration: number;
  scrollBarEdge: number[];
  rafID: React.RefObject<number>;
};

type HandleMouseDownT = HandleMouseT & {
  clicked: ClickedT;
};

type HandleMoveT = Omit<
  HandleMouseT,
  "controller" | "scrollBarOnHover" | "scrollContentRef" | "mouseOnRefHandle"
> & {
  mouseEvent: MouseEvent | TouchEvent;
  clicked: ClickedT;
  fullMarginObjectsWrapperX: number;
  fullMarginObjectsWrapperY: number;
  scrollElementWH: number[];
  objectsWrapperWH: number[];
  wrapElWH: number[];
};

type HandleUpT = Omit<HandleMouseT, "scrollStateRef" | "sizeLocal"> & {
  mouseEvent: MouseEvent | TouchEvent;
  controller: AbortController;
  clicked: ClickedT;
};

const cursorClassChange = (
  eventType: string,
  clicked: ClickedT,
  scrollBar: HTMLDivElement | null,
  objectsWrapperRef: HTMLDivElement | null
) => {
  const eventTypeLocal = eventType as "mousedown" | "touchstart";
  if (["thumb", "slider"].includes(clicked)) {
    // уточняем кликнутый объект для slider
    if (clicked === "slider") {
      mouseOnEl(
        scrollBar?.closest(".ms-slider") as HTMLDivElement | null,
        eventTypeLocal
      );
    } else mouseOnEl(scrollBar, eventTypeLocal);
  } else if (clicked === "wrapp") {
    mouseOnEl(objectsWrapperRef, eventTypeLocal);
  }
};

const round4 = (n: number) => (Math.abs(n) < 0.0001 ? 0 : +n.toFixed(4));

const applyThumb = (
  axis: "x" | "y",
  args: HandleMoveT,
  move: number,
  prev: { leftover: number }
) => {
  console.log("applyThumb");
  if (!args.scrollElementRef || !args.objectsWrapperRef) return;

  const scrollElement = args.scrollElementRef;

  // параметр для небольшого уравнивания движение если scroll > window
  const docSize = axis === "x" ? window.innerWidth : window.innerHeight;

  const visibleSize =
    axis === "x" ? args.scrollElementWH[0] : args.scrollElementWH[1];

  // для плавности перемещения бегунка при scrollBarEdge
  const wh = axis === "x" ? 0 : 1;
  const visibleSizeWithLimit = clampValue(
    args.scrollElementWH[wh] - args.scrollBarEdge[wh],
    0,
    docSize
  );

  // не забываем прибавить margin
  const objectsWrapperSize =
    args.objectsWrapperWH[wh] +
    args[
      axis === "x" ? "fullMarginObjectsWrapperX" : "fullMarginObjectsWrapperY"
    ];

  const maxThumbPos = visibleSizeWithLimit - args.thumbSize;
  const scrollableSize = objectsWrapperSize - visibleSize;

  if (maxThumbPos <= 0 || scrollableSize <= 0) return;

  const scrollRatio = scrollableSize / maxThumbPos;
  const fullDelta = move * scrollRatio + prev.leftover;

  const intDelta = Math.trunc(fullDelta);

  if (args.prevCoordsRef.current) {
    args.prevCoordsRef.current.leftover = round4(fullDelta - intDelta);
  }

  if (axis === "x") {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollX === "number"
        ? args.scrollStateRef.targetScrollX
        : scrollElement.scrollLeft;

    const maxScroll = scrollElement.scrollWidth - scrollElement.clientWidth;

    args.scrollStateRef.targetScrollX = Math.max(
      0,
      Math.min(prevTarget + intDelta, maxScroll)
    );
  } else {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollY === "number"
        ? args.scrollStateRef.targetScrollY
        : scrollElement.scrollTop;

    const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;

    args.scrollStateRef.targetScrollY = Math.max(
      0,
      Math.min(prevTarget + intDelta, maxScroll)
    );
  }

  // для перетягивания
  scrollElement.scrollLeft = args.scrollStateRef.targetScrollX;
  scrollElement.scrollTop = args.scrollStateRef.targetScrollY;
};

const motionHandler = (axis: "x" | "y", args: HandleMoveT) => {
  const el = args.scrollElementRef as HTMLDivElement;
  if (!el) return;

  const curr = {
    x:
      "touches" in args.mouseEvent
        ? args.mouseEvent.touches[0].clientX
        : args.mouseEvent.clientX,
    y:
      "touches" in args.mouseEvent
        ? args.mouseEvent.touches[0].clientY
        : args.mouseEvent.clientY,
    leftover: args.prevCoordsRef.current?.leftover ?? 0,
  };

  const prev = args.prevCoordsRef.current ?? curr;
  const delta = {
    x: curr.x - prev.x,
    y: curr.y - prev.y,
  };

  args.prevCoordsRef.current = curr;

  const move = args.clicked === "wrapp" ? -delta[axis] : delta[axis];
  const topOrLeft = axis === "y" ? "scrollTop" : "scrollLeft";

  // --- логика для thumb ---
  if (args.clicked === "thumb") {
    applyThumb(axis, args, move, prev);
    return;
  }

  args.type === "slider" && (args.numForSliderRef.current += move); // накапливаем значение

  // --- логика для wrapp ---
  if (args.clicked === "wrapp") {
    el[topOrLeft] += move;
    return;
  }

  // --- логика для sliderThumb ---
  const wh = axis === "x" ? 0 : 1;
  const scroll = el[topOrLeft];

  // основа для передвижения размер элемента slider
  const sliderElSize = Math.round(
    el
      .closest(".ms-content")
      ?.querySelector(".ms-slider-element.active")
      ?.getBoundingClientRect()[axis === "x" ? "width" : "height"] || 1
  );
  // getBoundingClientRect помогает избежать проблем с масштабированием используя видимый размер

  // запуск smoothScroll
  if (Math.abs(args.numForSliderRef.current) >= sliderElSize) {
    const nextScroll =
      move > 0 && scroll + args.sizeLocal[wh] < args.wrapElWH[wh]
        ? scroll + args.sizeLocal[wh]
        : move < 0 && scroll > 0
        ? scroll - args.sizeLocal[wh]
        : null; // если передать 0 будет loop

    args.numForSliderRef.current = 0; // сбрасываем
    args.smoothScroll(nextScroll, axis, 10);
  }
};

function handleMouseOrTouch(args: HandleMouseDownT) {
  // удаляем RAF и задачу слайдера
  if (args.rafID.current) {
    cancelAnimationFrame(args.rafID.current);
    args.rafID.current = NaN;
    cancelTask("smoothScrollBlock");
  }

  // обновление targetScroll заранее
  const scrollElement = args.scrollElementRef;
  if (scrollElement) {
    args.scrollStateRef.targetScrollX = scrollElement.scrollLeft;
    args.scrollStateRef.targetScrollY = scrollElement.scrollTop;
  }

  // получение некоторых данных заранее при клике
  let fullMarginObjectsWrapperX: number = 0,
    fullMarginObjectsWrapperY: number = 0,
    scrollElementWH: number[] = [],
    objectsWrapperWH: number[] = [],
    wrapElWH: number[] = [];

  if (args.clicked === "thumb") {
    const styles = getComputedStyle(args.objectsWrapperRef!);
    fullMarginObjectsWrapperX =
      parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
    fullMarginObjectsWrapperY =
      parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);

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
  // --------------------------------------------

  const controller = new AbortController();
  const { signal } = controller;

  args.clickedObject.current = args.clicked;
  args.triggerUpdate();

  const onMove = (e: TouchEvent | MouseEvent) => {
    if ("touches" in e) {
      e.preventDefault();
    }

    handleMove({
      ...args,
      mouseEvent: e,
      fullMarginObjectsWrapperX,
      fullMarginObjectsWrapperY,
      scrollElementWH,
      objectsWrapperWH,
      wrapElWH,
    });
  };

  // меняем курсор и классы
  cursorClassChange(
    args.eventType,
    args.clicked,
    args.scrollBar,
    args.objectsWrapperRef
  );

  // слушатели
  if (args.eventType === "mousedown") {
    document.addEventListener("mousemove", (mouseEvent) => onMove(mouseEvent), {
      passive: false,
      signal,
    });

    document.addEventListener(
      "mouseup",
      (mouseEvent) => handleUp({ ...args, mouseEvent, controller }),
      { signal }
    );
  } else if (args.eventType === "touchstart") {
    // слушатели для тапа
    document.addEventListener("touchmove", (touchEvent) => onMove(touchEvent), {
      passive: false,
      signal,
    });

    document.addEventListener(
      "touchend",
      (touchEvent) => handleUp({ ...args, mouseEvent: touchEvent, controller }),
      { signal }
    );
  }
}

function handleMove(args: HandleMoveT) {
  const dir = args.direction || "y";

  if (dir === "hybrid") {
    const targetAxes =
      args.clicked === "wrapp" ? ["x", "y"] : [args.axisFromAtr];
    targetAxes.forEach(
      (axis) => axis && motionHandler(axis as "x" | "y", args)
    );
  } else {
    motionHandler(dir, args);
  }
}

function handleUp(args: HandleUpT) {
  // Отменяем все слушатели событий
  args.controller.abort();

  // меняем курсор и классы
  cursorClassChange(
    args.eventType,
    args.clicked,
    args.scrollBar,
    args.objectsWrapperRef
  );

  args.clickedObject.current = "none";

  if (args.scrollBarOnHover) {
    let target = args.mouseEvent.target as HTMLElement | null;
    let isChildOfScrollContent = false;

    while (target && target !== document.body) {
      if (target === args.scrollContentRef) {
        isChildOfScrollContent = true;
        break;
      }
      target = target.parentNode as HTMLElement | null;
    }

    if (!isChildOfScrollContent) {
      args.mouseOnRefHandle(args.mouseEvent);
    }
  }

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

    args.numForSliderRef.current = 0; // сбрасываем
  }

  args.prevCoordsRef.current = null;
  args.triggerUpdate(); // for update ref only
}

export default handleMouseOrTouch;

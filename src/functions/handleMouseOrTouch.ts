import { MorphScrollT } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { setManagedTask } from "../helpers/taskManager";
import { mouseOnEl } from "../functions/mouseOn";

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
    targetScrollTop: number,
    direction: "y" | "x",
    duration: number,
    callback?: () => void
  ) => void;
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
  marginObjectsWrapperLR: number[];
  marginObjectsWrapperTB: number[];
  scrollElementWH: number[];
  objectsWrapperWH: number[];
  wrapElWH: number[];
};

type HandleUpT = Omit<
  HandleMouseT,
  | "scrollElementRef"
  | "scrollStateRef"
  | "direction"
  | "smoothScroll"
  | "sizeLocal"
> & {
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

const scheduleFlushScroll = (args: HandleMoveT) => {
  setManagedTask(
    () => {
      const el = args.scrollElementRef;
      if (!el) return;

      // применяем target / текущие значения (если ещё не установлены)
      el.scrollLeft = args.scrollStateRef.targetScrollX;
      el.scrollTop = args.scrollStateRef.targetScrollY;
    },
    "requestFrame",
    "syncScroll" // единый id — перезапишет предыдущие, батчит
  );
};

const applyThumbOrWrap = (
  axis: "x" | "y",
  args: HandleMoveT,
  delta: { x: number; y: number },
  prev: { leftover: number }
) => {
  if (!args.scrollElementRef || !args.objectsWrapperRef) return;
  let deltaScroll = 0;

  const move = axis === "x" ? delta.x : delta.y;

  const scrollElement = args.scrollElementRef;

  if (args.clicked === "thumb") {
    const visibleSize =
      axis === "x" ? args.scrollElementWH[0] : args.scrollElementWH[1];

    // для плавности перемещения бегунка при scrollBarEdge
    const visibleSizeWithLimit =
      axis === "x"
        ? args.scrollElementWH[0] - args.scrollBarEdge[0]
        : args.scrollElementWH[1] - args.scrollBarEdge[1];

    // не забываем прибавить margin
    const objectsWrapperSize =
      axis === "x"
        ? args.objectsWrapperWH[0] +
          args.marginObjectsWrapperLR[0] +
          args.marginObjectsWrapperLR[1]
        : args.objectsWrapperWH[1] +
          args.marginObjectsWrapperTB[0] +
          args.marginObjectsWrapperTB[1];

    const maxThumbPos = visibleSizeWithLimit - args.thumbSize;
    const scrollableSize = objectsWrapperSize - visibleSize;

    if (maxThumbPos <= 0 || scrollableSize <= 0) return;

    const scrollRatio = scrollableSize / maxThumbPos;
    const fullDelta = move * scrollRatio + prev.leftover;

    const intDelta = Math.trunc(fullDelta);
    let newLeftover = fullDelta - intDelta;

    newLeftover = +newLeftover.toFixed(4);

    if (args.prevCoordsRef.current) {
      args.prevCoordsRef.current.leftover = round4(fullDelta - intDelta);
    }
    deltaScroll = intDelta;
  } else {
    deltaScroll = -move;
  }

  // лайфхак для масштабирования экрана!!!
  // при изменённых масштабах для правельного передвижения scroll
  // console.log("scrollElement", scrollElement.clientWidth);
  // console.log("document", document.documentElement.clientWidth);

  if (axis === "x") {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollX === "number"
        ? args.scrollStateRef.targetScrollX
        : scrollElement.scrollLeft;

    const maxScroll = scrollElement.scrollWidth - scrollElement.clientWidth;

    args.scrollStateRef.targetScrollX = Math.max(
      0,
      Math.min(prevTarget + deltaScroll, maxScroll)
    );
  } else {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollY === "number"
        ? args.scrollStateRef.targetScrollY
        : scrollElement.scrollTop;

    const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;

    args.scrollStateRef.targetScrollY = Math.max(
      0,
      Math.min(prevTarget + deltaScroll, maxScroll)
    );
  }
};

const applySlider = (
  axis: "x" | "y",
  args: HandleMoveT,
  delta: { x: number; y: number }
) => {
  if (!args.objectsWrapperRef) return;

  const reverce = args.type === "slider" && args.clicked === "wrapp" ? -1 : 1;
  const move = delta[axis] * reverce;

  const pixelsForSwipe = 20;
  const size = axis === "x" ? args.sizeLocal[0] : args.sizeLocal[1];
  const extent = axis === "x" ? args.wrapElWH[0] : args.wrapElWH[1];
  const scroll =
    axis === "x"
      ? args.scrollElementRef!.scrollLeft
      : args.scrollElementRef!.scrollTop;

  args.numForSliderRef.current += Math.abs(move); // накапливаем значение передвижения

  if (args.numForSliderRef.current > pixelsForSwipe) {
    const nextScroll =
      move > 0 && scroll + size < extent
        ? scroll + size
        : move < 0 && scroll > 0
        ? scroll - size
        : 0;

    args.smoothScroll(nextScroll, axis, args.duration);
    args.numForSliderRef.current = 0;
  }
};

function handleMove(args: HandleMoveT) {
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

  const handleAxis = (axis: "x" | "y") => {
    if (args.clicked === "thumb") {
      applyThumbOrWrap(axis, args, delta, prev);
    } else if (args.clicked === "wrapp") {
      if (args.type === "slider") {
        applySlider(axis, args, delta);
      } else {
        applyThumbOrWrap(axis, args, delta, prev);
      }
    } else if (args.clicked === "slider") {
      applySlider(axis, args, delta);
    }
  };

  const dir = args.direction || "y";

  if (dir === "hybrid") {
    const targetAxes =
      args.clicked === "wrapp" ? ["x", "y"] : [args.axisFromAtr];
    targetAxes.forEach((axis) => axis && handleAxis(axis as "x" | "y"));
  } else {
    handleAxis(dir as "x" | "y");
  }

  scheduleFlushScroll(args);
}

function handleMouseOrTouch(args: HandleMouseDownT) {
  // обновление targetScroll заранее
  const scrollElement = args.scrollElementRef;
  if (scrollElement) {
    args.scrollStateRef.targetScrollX = scrollElement.scrollLeft;
    args.scrollStateRef.targetScrollY = scrollElement.scrollTop;
  }

  // получение некоторых данных заранее при клике
  let marginObjectsWrapperLR: number[] = [],
    marginObjectsWrapperTB: number[] = [],
    scrollElementWH: number[] = [],
    objectsWrapperWH: number[] = [],
    wrapElWH: number[] = [];

  if (args.clicked === "thumb") {
    const styles = getComputedStyle(args.objectsWrapperRef!);
    marginObjectsWrapperLR = [
      parseFloat(styles.marginLeft),
      parseFloat(styles.marginRight),
    ];
    marginObjectsWrapperTB = [
      parseFloat(styles.marginTop),
      parseFloat(styles.marginBottom),
    ];

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
      marginObjectsWrapperLR,
      marginObjectsWrapperTB,
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

  args.prevCoordsRef.current = null;
  args.triggerUpdate(); // for update ref only
}

export default handleMouseOrTouch;

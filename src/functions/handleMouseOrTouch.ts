import { MorphScrollT } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

type ClickedT = "thumb" | "slider" | "wrapp" | "none";

type HandleMouseT = {
  eventType: string;
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  scrollBar: HTMLDivElement | null;
  clickedObject: React.MutableRefObject<ClickedT>;
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
  mouseOnEl: (el: HTMLDivElement | null) => void;
  mouseOnRefHandle: (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.TouchEvent<HTMLDivElement>
      | MouseEvent
      | TouchEvent
  ) => void;
  triggerUpdate: () => void;
  scrollElemIndex?: number;
  numForSliderRef: React.MutableRefObject<number>;
  isScrollingRef: React.RefObject<boolean>;
  prevCoordsRef: React.MutableRefObject<{
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
  | "controller"
  | "scrollBarOnHover"
  | "scrollContentRef"
  | "mouseOnEl"
  | "mouseOnRefHandle"
> & { mouseEvent: MouseEvent | TouchEvent; clicked: ClickedT };

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

function handleMouseOrTouch(args: HandleMouseDownT) {
  const controller = new AbortController();
  const { signal } = controller;

  args.clickedObject.current = args.clicked;
  args.triggerUpdate();

  if (args.eventType === "mousedown") {
    // меняем курсор
    if (["thumb", "slider"].includes(args.clicked)) {
      args.mouseOnEl(args.scrollBar);
    }
    if (args.clicked === "wrapp") {
      args.mouseOnEl(args.objectsWrapperRef);
    }

    document.addEventListener(
      "mousemove",
      (mouseEvent) => handleMove({ ...args, mouseEvent }),
      { signal }
    );

    document.addEventListener(
      "mouseup",
      (mouseEvent) => handleUp({ ...args, mouseEvent, controller }),
      { signal }
    );
  } else if (args.eventType === "touchstart") {
    // слушатели для мобилок
    document.addEventListener(
      "touchmove",
      (touchEvent) => {
        touchEvent.preventDefault();
        handleMove({ ...args, mouseEvent: touchEvent });
      },
      {
        signal,
        passive: false, // обязательно!
      }
    );

    document.addEventListener(
      "touchend",
      (touchEvent) => handleUp({ ...args, mouseEvent: touchEvent, controller }),
      { signal }
    );
  }

  document.body.style.cursor = "grabbing";
}

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

  const applyThumbOrWrap = (axis: "x" | "y") => {
    if (!args.scrollElementRef || !args.objectsWrapperRef) return;
    let deltaScroll = 0;

    const move = (() => {
      if (axis === "x") {
        if ("movementX" in args.mouseEvent) return args.mouseEvent.movementX;
        return delta.x;
      } else {
        if ("movementY" in args.mouseEvent) return args.mouseEvent.movementY;
        return delta.y;
      }
    })();

    const scrollElement = args.scrollElementRef;

    if (args.clicked === "thumb") {
      const objectsWrapper = args.objectsWrapperRef;
      const styles = getComputedStyle(objectsWrapper);

      const visibleSize =
        axis === "x" ? scrollElement.clientWidth : scrollElement.clientHeight;

      // для плавности перемещения бегунка при scrollBarEdge
      const visibleSizeWithLimit =
        axis === "x"
          ? scrollElement.clientWidth - args.scrollBarEdge[0]
          : scrollElement.clientHeight - args.scrollBarEdge[1];

      // не забываем прибавить margin
      const objectsWrapperSize =
        axis === "x"
          ? objectsWrapper.clientWidth +
            parseFloat(styles.marginLeft) +
            parseFloat(styles.marginRight)
          : objectsWrapper.clientHeight +
            parseFloat(styles.marginTop) +
            parseFloat(styles.marginBottom);

      const maxThumbPos = visibleSizeWithLimit - args.thumbSize;
      const scrollableSize = objectsWrapperSize - visibleSize;

      if (maxThumbPos <= 0 || scrollableSize <= 0) return;

      const scrollRatio = scrollableSize / maxThumbPos;
      const prevLeftover = prev.leftover;
      const fullDelta = move * scrollRatio + prevLeftover;
      const intDelta = Math.trunc(fullDelta);
      const newLeftover = fullDelta - intDelta;

      args.prevCoordsRef.current!.leftover = newLeftover;
      deltaScroll = intDelta;
    } else {
      deltaScroll = -move;
    }

    if (axis === "x") {
      scrollElement.scrollLeft += deltaScroll;
      args.scrollStateRef.targetScrollX = scrollElement.scrollLeft;
    } else {
      scrollElement.scrollTop += deltaScroll;
      args.scrollStateRef.targetScrollY = scrollElement.scrollTop;
    }
  };

  const applySlider = (axis: "x" | "y") => {
    const wrapEl = args.objectsWrapperRef;
    if (!wrapEl) return;

    const reverce = args.type === "slider" && args.clicked === "wrapp" ? -1 : 1;
    const move = delta[axis] * reverce;
    const pixelsForSwipe = 6;
    const size = axis === "x" ? args.sizeLocal[0] : args.sizeLocal[1];
    const extent = axis === "x" ? wrapEl.offsetWidth : wrapEl.offsetHeight;
    const scroll =
      axis === "x"
        ? args.scrollElementRef!.scrollLeft
        : args.scrollElementRef!.scrollTop;

    args.numForSliderRef.current += Math.abs(move);

    if (
      args.numForSliderRef.current > pixelsForSwipe &&
      !args.isScrollingRef.current
    ) {
      if (move > 0 && scroll + size < extent) {
        args.smoothScroll(scroll + size, axis, args.duration);
      } else if (move < 0 && scroll > 0) {
        args.smoothScroll(scroll - size, axis, args.duration);
      }

      args.numForSliderRef.current = 0;
    }
  };

  const handleAxis = (axis: "x" | "y") => {
    if (args.clicked === "thumb") {
      applyThumbOrWrap(axis);
    } else if (args.clicked === "wrapp") {
      if (args.type === "slider") {
        applySlider(axis);
      } else {
        applyThumbOrWrap(axis);
      }
    } else if (args.clicked === "slider") {
      applySlider(axis);
    }
  };

  if (args.direction! === "hybrid") {
    if (args.clicked === "wrapp") {
      handleAxis("x");
      handleAxis("y");
    } else if (args.axisFromAtr) {
      handleAxis(args.axisFromAtr);
    }
  } else {
    handleAxis((args.direction || "y") as "x" | "y");
  }
}

function handleUp(args: HandleUpT) {
  // Отменяем все слушатели событий
  args.controller.abort();

  document.body.style.removeProperty("cursor");
  if (["thumb", "slider"].includes(args.clicked)) {
    args.mouseOnEl(args.scrollBar);
  }
  if (args.clicked === "wrapp") {
    args.mouseOnEl(args.objectsWrapperRef);
  }

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

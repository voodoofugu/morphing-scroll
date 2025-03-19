import { MorphScrollT } from "./types";
import { ScrollStateRefT } from "./handleWheel";

type HandleMouseT = {
  scrollEl: HTMLDivElement;
  mouseUpEvent: MouseEvent;
  controller: AbortController;
  objectsWrapperRef: HTMLDivElement;
  scrollBarsRef: HTMLDivElement;
  clickedObject: "none" | "slider" | "thumb" | "wrapp";
  progressVisibility: "hover" | "visible" | "hidden";
  scrollContentlRef: HTMLDivElement;
  type: MorphScrollT["type"];
  direction: MorphScrollT["direction"];
  scrollStateRef: ScrollStateRefT;
  numForSlider: number;
  sizeLocal: number[];
  smoothScroll: (
    targetScrollTop: number,
    callback?: () => void
  ) => (() => void) | null;
  sizeLocalToObjectsWrapperXY: (max?: boolean) => number;
  mouseOnEl: (el: HTMLDivElement | null, type: "down" | "up") => void;
  mouseOnRefLeave: (el: HTMLDivElement | null, childClass: string) => void;
  triggerUpdate: () => void;
};

type HandleMouseDownT = HandleMouseT & {
  clicked: HandleMouseT["clickedObject"];
};

type HandleMouseMoveT = Omit<
  HandleMouseT,
  | "clicked"
  | "controller"
  | "scrollBarsRef"
  | "progressVisibility"
  | "scrollContentlRef"
  | "type"
  | "mouseOnEl"
  | "mouseOnRefLeave"
  | ""
>;

type HandleMouseUpT = Omit<
  HandleMouseT,
  | "scrollEl"
  | "sizeLocalToObjectsWrapperXY"
  | "scrollStateRef"
  | "direction"
  | "smoothScroll"
  | "numForSlider"
  | "sizeLocal"
>;

export function handleMouseDown({
  scrollEl,
  clicked,
  objectsWrapperRef,
  scrollBarsRef,
  clickedObject,
  progressVisibility,
  scrollContentlRef,
  type,
  mouseOnEl,
  mouseOnRefLeave,
  triggerUpdate,
  sizeLocalToObjectsWrapperXY,
  scrollStateRef,
  direction,
  smoothScroll,
  numForSlider,
  sizeLocal,
}: HandleMouseDownT) {
  const controller = new AbortController();
  const { signal } = controller;

  clickedObject = clicked;
  triggerUpdate(); // for update ref only

  window.addEventListener(
    "mousemove",
    (mouseUpEvent) =>
      handleMouseMove({
        scrollEl,
        mouseUpEvent,
        objectsWrapperRef,
        clickedObject,
        triggerUpdate,
        sizeLocalToObjectsWrapperXY,
        scrollStateRef,
        direction,
        smoothScroll,
        numForSlider,
        sizeLocal,
      }),
    { signal }
  );
  window.addEventListener(
    "mouseup",
    (mouseUpEvent) =>
      handleMouseUp({
        mouseUpEvent,
        controller,
        objectsWrapperRef,
        scrollBarsRef,
        clickedObject,
        progressVisibility,
        scrollContentlRef,
        type,
        mouseOnEl,
        mouseOnRefLeave,
        triggerUpdate,
      }),
    {
      signal,
    }
  );
  document.body.style.cursor = "grabbing";
}

export function handleMouseMove({
  scrollEl,
  mouseUpEvent,
  objectsWrapperRef,
  clickedObject,
  triggerUpdate,
  sizeLocalToObjectsWrapperXY,
  scrollStateRef,
  direction,
  smoothScroll,
  numForSlider,
  sizeLocal,
}: HandleMouseMoveT) {
  const pixelsForSwipe = 1;
  const length = sizeLocalToObjectsWrapperXY();
  if (!scrollEl || !length) return;

  if (["thumb", "wrapp"].includes(clickedObject)) {
    const plusMinus = clickedObject === "thumb" ? 1 : -1;
    const addBoost = clickedObject === "thumb" ? length : 1;

    if (direction === "x") {
      scrollEl.scrollLeft += mouseUpEvent.movementX * addBoost * plusMinus;
      scrollStateRef.targetScrollX = scrollEl.scrollLeft; // обновляем target
    }
    if (direction === "y") {
      scrollEl.scrollTop += mouseUpEvent.movementY * addBoost * plusMinus;
      // scrollStateRef.targetScrollY = scrollEl.scrollTop;
    }
  }

  if (clickedObject === "slider") {
    const wrapEl = objectsWrapperRef;
    if (!wrapEl) return;

    const height = wrapEl.clientHeight;
    const scrollTo = (position: number) =>
      smoothScroll(position, () => {
        numForSlider = 0;
        triggerUpdate();
      });

    const updateScroll = (delta: number) => {
      const targetScrollTop = scrollEl.scrollTop + delta * sizeLocal[1];

      if (delta > 0) {
        scrollTo(Math.min(targetScrollTop, height - sizeLocal[1]));
      } else {
        scrollTo(Math.max(targetScrollTop, 0));
      }
    };

    if (mouseUpEvent.movementY > 0 && numForSlider < pixelsForSwipe) {
      numForSlider += mouseUpEvent.movementY;
      if (
        numForSlider >= pixelsForSwipe &&
        scrollEl.scrollTop + sizeLocal[1] != height
      )
        updateScroll(1);
    } else if (mouseUpEvent.movementY < 0 && numForSlider > -pixelsForSwipe) {
      numForSlider -= Math.abs(mouseUpEvent.movementY);
      if (numForSlider <= -pixelsForSwipe && scrollEl.scrollTop != 0)
        updateScroll(-1);
    }
  }
}

export function handleMouseUp({
  mouseUpEvent,
  controller,
  objectsWrapperRef,
  scrollBarsRef,
  clickedObject,
  progressVisibility,
  scrollContentlRef,
  type,
  mouseOnEl,
  mouseOnRefLeave,
  triggerUpdate,
}: HandleMouseUpT) {
  // Отменяем все слушатели событий
  controller.abort();

  document.body.style.removeProperty("cursor");
  mouseOnEl(objectsWrapperRef, "up");
  mouseOnEl(scrollBarsRef, "up");

  clickedObject = "none";

  if (progressVisibility === "hover") {
    let target = mouseUpEvent.target as HTMLElement | null;
    let isChildOfScrollContent = false;

    while (target && target !== document.body) {
      if (target === scrollContentlRef) {
        isChildOfScrollContent = true;
        break;
      }
      target = target.parentNode as HTMLElement | null;
    }

    if (!isChildOfScrollContent) {
      mouseOnRefLeave(
        scrollContentlRef,
        type === "scroll" ? "scrollBar" : "sliderBar"
      );
    }
  }

  triggerUpdate(); // for update ref only
}

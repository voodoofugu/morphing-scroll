import { MorphScrollT } from "./types";
import { ScrollStateRefT } from "./handleWheel";

type HandleMouseT = {
  scrollElementRef: HTMLDivElement | null;
  mouseEvent: MouseEvent;
  objectsWrapperRef: HTMLDivElement | null;
  scrollBarsRef: HTMLDivElement;
  clickedObject: "none" | "slider" | "thumb" | "wrapp";
  progressVisibility: "hover" | "visible" | "hidden";
  scrollContentlRef: HTMLDivElement | null;
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
  | "scrollElementRef"
  | "sizeLocalToObjectsWrapperXY"
  | "scrollStateRef"
  | "direction"
  | "smoothScroll"
  | "numForSlider"
  | "sizeLocal"
> & { controller: AbortController };

function handleMouseDown(args: HandleMouseDownT) {
  console.log("args", args);
  if (
    !args.scrollElementRef ||
    !args.objectsWrapperRef ||
    !args.scrollContentlRef
  )
    return;

  const controller = new AbortController();
  const { signal } = controller;

  args.clickedObject = args.clicked;
  args.triggerUpdate(); // for update ref only

  window.addEventListener(
    "mousemove",
    (mouseEvent) => handleMouseMove({ ...args, mouseEvent }),
    { signal }
  );

  window.addEventListener(
    "mouseup",
    (mouseEvent) => handleMouseUp({ ...args, mouseEvent, controller }),
    { signal }
  );

  document.body.style.cursor = "grabbing";
}

function handleMouseMove(args: HandleMouseMoveT) {
  const pixelsForSwipe = 1;
  const length = args.sizeLocalToObjectsWrapperXY();
  if (!args.scrollElementRef || !length) return;

  if (["thumb", "wrapp"].includes(args.clickedObject)) {
    const plusMinus = args.clickedObject === "thumb" ? 1 : -1;
    const addBoost = args.clickedObject === "thumb" ? length : 1;

    if (args.direction === "x") {
      args.scrollElementRef.scrollLeft +=
        args.mouseEvent.movementX * addBoost * plusMinus;
      args.scrollStateRef.targetScrollX = args.scrollElementRef.scrollLeft; // обновляем target
    }
    if (args.direction === "y") {
      args.scrollElementRef.scrollTop +=
        args.mouseEvent.movementY * addBoost * plusMinus;
      // scrollStateRef.targetScrollY = scrollElementRef.scrollTop;
    }
  }

  if (args.clickedObject === "slider") {
    const wrapEl = args.objectsWrapperRef;
    if (!wrapEl) return;

    const height = wrapEl.clientHeight;
    const scrollTo = (position: number) =>
      args.smoothScroll(position, () => {
        args.numForSlider = 0;
        args.triggerUpdate();
      });

    const updateScroll = (delta: number) => {
      if (!args.scrollElementRef) return;

      const targetScrollTop =
        args.scrollElementRef.scrollTop + delta * args.sizeLocal[1];

      if (delta > 0) {
        scrollTo(Math.min(targetScrollTop, height - args.sizeLocal[1]));
      } else {
        scrollTo(Math.max(targetScrollTop, 0));
      }
    };

    if (args.mouseEvent.movementY > 0 && args.numForSlider < pixelsForSwipe) {
      args.numForSlider += args.mouseEvent.movementY;
      if (
        args.numForSlider >= pixelsForSwipe &&
        args.scrollElementRef.scrollTop + args.sizeLocal[1] != height
      )
        updateScroll(1);
    } else if (
      args.mouseEvent.movementY < 0 &&
      args.numForSlider > -pixelsForSwipe
    ) {
      args.numForSlider -= Math.abs(args.mouseEvent.movementY);
      if (
        args.numForSlider <= -pixelsForSwipe &&
        args.scrollElementRef.scrollTop != 0
      )
        updateScroll(-1);
    }
  }
}

function handleMouseUp(args: HandleMouseUpT) {
  // Отменяем все слушатели событий
  args.controller.abort();

  document.body.style.removeProperty("cursor");
  args.mouseOnEl(args.objectsWrapperRef, "up");
  args.mouseOnEl(args.scrollBarsRef, "up");

  args.clickedObject = "none";

  if (args.progressVisibility === "hover") {
    let target = args.mouseEvent.target as HTMLElement | null;
    let isChildOfScrollContent = false;

    while (target && target !== document.body) {
      if (target === args.scrollContentlRef) {
        isChildOfScrollContent = true;
        break;
      }
      target = target.parentNode as HTMLElement | null;
    }

    if (!isChildOfScrollContent) {
      args.mouseOnRefLeave(
        args.scrollContentlRef,
        args.type === "scroll" ? "scrollBar" : "sliderBar"
      );
    }
  }

  args.triggerUpdate(); // for update ref only
}

export default handleMouseDown;

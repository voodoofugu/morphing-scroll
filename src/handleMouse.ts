import { MorphScrollT } from "./types";
import { ScrollStateRefT } from "./handleWheel";
import { clampValue } from "./addFunctions";

type HandleMouseT = {
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  scrollBarsRef: NodeListOf<Element> | null;
  clickedObject: React.RefObject<"thumb" | "slider" | "wrapp" | "none">;
  progressVisibility: "hover" | "visible" | "hidden";
  scrollContentlRef: HTMLDivElement | null;
  type: MorphScrollT["type"];
  direction: MorphScrollT["direction"];
  scrollStateRef: ScrollStateRefT;
  numForSlider: number;
  sizeLocal: number[];
  objLengthPerSize: number[];
  smoothScroll: (
    targetScrollTop: number,
    direction: "y" | "x",
    callback?: () => void
  ) => void;
  mouseOnEl: (el: HTMLDivElement | null) => void;
  mouseOnRefHandle: (event: MouseEvent | React.MouseEvent) => void;
  triggerUpdate: () => void;
  scrollElemIndex?: number;
};

type HandleMouseDownT = HandleMouseT & {
  clicked: "thumb" | "slider" | "wrapp" | "none";
};

type HandleMouseMoveT = Omit<
  HandleMouseT,
  | "clicked"
  | "controller"
  | "progressVisibility"
  | "scrollContentlRef"
  | "type"
  | "mouseOnEl"
  | "mouseOnRefHandle"
> & { mouseEvent: MouseEvent };

type HandleMouseUpT = Omit<
  HandleMouseT,
  | "scrollElementRef"
  | "objLengthPerSize"
  | "scrollStateRef"
  | "direction"
  | "smoothScroll"
  | "numForSlider"
  | "sizeLocal"
> & { mouseEvent: MouseEvent; controller: AbortController; clicked: string };

function handleMouseDown(args: HandleMouseDownT) {
  if (
    !args.scrollElementRef ||
    !args.objectsWrapperRef ||
    !args.scrollContentlRef
  )
    return;

  // меняем курсор
  if (args.clicked === "thumb") {
    // если первого бегунка нет (из-за размеров) а нужен второй то ставим индекс 0
    args.mouseOnEl(
      (args.scrollBarsRef?.[args.scrollElemIndex ?? 0] ||
        args.scrollBarsRef?.[0]) as HTMLDivElement
    );
  }
  if (args.clicked === "wrapp") {
    args.mouseOnEl(args.objectsWrapperRef);
  }

  const controller = new AbortController();
  const { signal } = controller;

  args.clickedObject.current = args.clicked;
  args.triggerUpdate();

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
  if (!args.scrollElementRef) return;

  if (["thumb", "wrapp"].includes(args.clickedObject.current)) {
    const isThumb = args.clickedObject.current === "thumb";
    const applyScroll = (axis: "x" | "y") => {
      if (!args.scrollElementRef) return;

      const length =
        axis === "x" ? args.objLengthPerSize[0] : args.objLengthPerSize[1];

      const moveDirection =
        axis === "x" ? args.mouseEvent.movementX : args.mouseEvent.movementY;
      const plusMinus = isThumb ? 1 : -1;
      const addBoost = isThumb ? length : 1;
      const movement = moveDirection * addBoost * plusMinus;

      if (axis === "x") {
        args.scrollElementRef.scrollLeft += movement;
        args.scrollStateRef.targetScrollX = args.scrollElementRef.scrollLeft;
      } else {
        args.scrollElementRef.scrollTop += movement;
        args.scrollStateRef.targetScrollY = args.scrollElementRef.scrollTop;
      }
    };

    if (args.direction === "hybrid") {
      if (args.clickedObject.current === "wrapp") {
        applyScroll("x");
        applyScroll("y");

        return;
      }

      const scrollBars = Array.from(
        args.scrollBarsRef || []
      ) as HTMLDivElement[];

      for (const scrollBar of scrollBars) {
        const directionType =
          scrollBar.attributes.getNamedItem("direction-type")?.value;

        if (scrollBar.style.cursor === "grabbing") {
          applyScroll(directionType as "x" | "y");
          break;
        }
      }
    } else {
      applyScroll(args.direction || "y");
    }

    return;
  }

  const pixelsForSwipe = 1;
  if (args.clickedObject.current === "slider") {
    const wrapEl = args.objectsWrapperRef;
    if (!wrapEl) return;

    const height = wrapEl.clientHeight;
    const scrollTo = (position: number) =>
      args.smoothScroll(position, "y", () => {
        args.numForSlider = 0;
        args.triggerUpdate();
      });

    const updateScroll = (delta: number) => {
      if (!args.scrollElementRef) return;

      scrollTo(
        clampValue(
          args.scrollElementRef.scrollTop + delta * args.sizeLocal[1],
          0,
          height - args.sizeLocal[1]
        )
      );
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
  if (args.clicked === "thumb") {
    args.mouseOnEl(
      (args.scrollBarsRef?.[args.scrollElemIndex ?? 0] ||
        args.scrollBarsRef?.[0]) as HTMLDivElement
    );
  }
  if (args.clicked === "wrapp") {
    args.mouseOnEl(args.objectsWrapperRef);
  }

  args.clickedObject.current = "none";

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
      args.mouseOnRefHandle(args.mouseEvent);
    }
  }

  args.triggerUpdate(); // for update ref only
}

export default handleMouseDown;

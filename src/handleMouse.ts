import { MorphScrollT } from "./types";
import { ScrollStateRefT } from "./handleWheel";

type ClickedT = "thumb" | "slider" | "wrapp" | "none";

type HandleMouseT = {
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  scrollBarsRef: NodeListOf<Element> | [];
  clickedObject: React.RefObject<ClickedT>;
  progressVisibility: "hover" | "visible" | "hidden";
  scrollContentRef: HTMLDivElement | null;
  type: MorphScrollT["type"];
  direction: MorphScrollT["direction"];
  scrollStateRef: ScrollStateRefT;
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
  numForSliderRef: React.RefObject<number>;
  isScrollingRef: React.RefObject<boolean>;
};

type HandleMouseDownT = HandleMouseT & {
  clicked: ClickedT;
};

type HandleMouseMoveT = Omit<
  HandleMouseT,
  | "controller"
  | "progressVisibility"
  | "scrollContentRef"
  | "mouseOnEl"
  | "mouseOnRefHandle"
> & { mouseEvent: MouseEvent; clicked: ClickedT };

type HandleMouseUpT = Omit<
  HandleMouseT,
  | "scrollElementRef"
  | "objLengthPerSize"
  | "scrollStateRef"
  | "direction"
  | "smoothScroll"
  | "sizeLocal"
> & { mouseEvent: MouseEvent; controller: AbortController; clicked: ClickedT };

function handleMouseDown(args: HandleMouseDownT) {
  if (
    !args.scrollElementRef ||
    !args.objectsWrapperRef ||
    !args.scrollContentRef
  )
    return;

  // меняем курсор
  if (["thumb", "slider"].includes(args.clicked)) {
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

  document.addEventListener(
    "mousemove",
    (mouseEvent) => handleMouseMove({ ...args, mouseEvent }),
    { signal }
  );

  document.addEventListener(
    "mouseup",
    (mouseEvent) => handleMouseUp({ ...args, mouseEvent, controller }),
    { signal }
  );

  document.body.style.cursor = "grabbing";
}

function handleMouseMove(args: HandleMouseMoveT) {
  const scrollBars = Array.from(args.scrollBarsRef) as HTMLDivElement[];

  const getMove = (axis: "x" | "y") =>
    axis === "x" ? args.mouseEvent.movementX : args.mouseEvent.movementY;

  const applyThumbOrWrap = (axis: "x" | "y") => {
    if (!args.scrollElementRef) return;

    const move = getMove(axis);
    const isThumb = args.clicked === "thumb";
    const length =
      axis === "x" ? args.objLengthPerSize[0] : args.objLengthPerSize[1];
    const delta = move * (isThumb ? length : -1);

    if (axis === "x") {
      args.scrollElementRef!.scrollLeft += delta;
      args.scrollStateRef.targetScrollX = args.scrollElementRef.scrollLeft;
    } else {
      args.scrollElementRef!.scrollTop += delta;
      args.scrollStateRef.targetScrollY = args.scrollElementRef.scrollTop;
    }
  };

  const applySlider = (axis: "x" | "y") => {
    const wrapEl = args.objectsWrapperRef;
    if (!wrapEl) return;

    const reverce = args.type === "slider" && args.clicked === "wrapp" ? -1 : 1;
    const move = getMove(axis) * reverce;
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
        args.smoothScroll(scroll + size, axis);
      } else if (move < 0 && scroll > 0) {
        args.smoothScroll(scroll - size, axis);
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

  const getDirectionTypeFromScrollBars = (): ("x" | "y") | null => {
    for (const bar of scrollBars) {
      if (bar.style.cursor === "grabbing") {
        return bar.getAttribute("direction-type") as "x" | "y";
      }
    }
    return null;
  };

  if (["hybridX", "hybridY"].includes(args.direction!)) {
    if (args.clicked === "wrapp") {
      handleAxis("x");
      handleAxis("y");
    } else {
      const dir = getDirectionTypeFromScrollBars();
      if (dir) handleAxis(dir);
    }
  } else {
    handleAxis((args.direction || "y") as "x" | "y");
  }
}

function handleMouseUp(args: HandleMouseUpT) {
  // Отменяем все слушатели событий
  args.controller.abort();

  document.body.style.removeProperty("cursor");
  if (["thumb", "slider"].includes(args.clicked)) {
    args.mouseOnEl(
      (args.scrollBarsRef[args.scrollElemIndex ?? 0] ||
        args.scrollBarsRef[0]) as HTMLDivElement
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

  args.triggerUpdate(); // for update ref only
}

export default handleMouseDown;

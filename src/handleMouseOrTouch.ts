import { MorphScrollT } from "./types";
import { ScrollStateRefT } from "./handleWheel";

type ClickedT = "thumb" | "slider" | "wrapp" | "none";

type HandleMouseT = {
  eventType: string;
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  scrollBarsRef: NodeListOf<Element> | [];
  clickedObject: React.MutableRefObject<ClickedT>;
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
  prevCoordsRef: React.MutableRefObject<number | null>;
};

type HandleMouseDownT = HandleMouseT & {
  clicked: ClickedT;
};

type HandleMoveT = Omit<
  HandleMouseT,
  | "controller"
  | "progressVisibility"
  | "scrollContentRef"
  | "mouseOnEl"
  | "mouseOnRefHandle"
> & { mouseEvent: MouseEvent | TouchEvent; clicked: ClickedT };

type HandleUpT = Omit<
  HandleMouseT,
  | "scrollElementRef"
  | "objLengthPerSize"
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

  if (args.eventType === "mousedown") {
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
      (touchEvent) => handleMove({ ...args, mouseEvent: touchEvent }),
      {
        signal,
        // passive: false // если используется preventDefault()
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
  // args.mouseEvent.preventDefault();
  const scrollBars = Array.from(args.scrollBarsRef) as HTMLDivElement[];

  const getMove = (axis: "x" | "y") => {
    const curr =
      "touches" in args.mouseEvent
        ? axis === "x"
          ? args.mouseEvent.touches[0].clientX
          : args.mouseEvent.touches[0].clientY
        : axis === "x"
        ? args.mouseEvent.clientX
        : args.mouseEvent.clientY;

    const prev = args.prevCoordsRef.current;
    const delta = prev == null ? 0 : curr - prev;

    // сохраняем текущие координаты для следующего кадра
    args.prevCoordsRef.current = curr;

    return delta;
  };

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

function handleUp(args: HandleUpT) {
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

  args.prevCoordsRef.current = null;
  args.triggerUpdate(); // for update ref only
}

export default handleMouseOrTouch;

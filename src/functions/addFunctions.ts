import { MorphScrollT } from "../types/types";

function objectsPerSize(availableSize: number, objectSize: number): number {
  if (availableSize <= objectSize) return 1;
  const objects = Math.floor(availableSize / objectSize);

  return objects;
}

function clampValue(value: number, min = 0, max = Infinity): number {
  return Math.max(min, Math.min(Math.round(value), max));
}

function smoothScroll(
  direction: "x" | "y" | undefined,
  scrollElement: Element,
  duration: number = 200,
  targetScroll: number,
  callback?: () => void
) {
  let frameId: number;
  if (!scrollElement) return null;

  const startTime = performance.now();

  const startScrollTop = scrollElement.scrollTop;
  const startScrollLeft = scrollElement.scrollLeft;

  const animate = (currentTime: number) => {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    if (direction === "y") {
      scrollElement.scrollTop =
        startScrollTop + (targetScroll - startScrollTop) * progress;
    } else if (direction === "x") {
      scrollElement.scrollLeft =
        startScrollLeft + (targetScroll - startScrollLeft) * progress;
    }

    if (progress < 1) {
      frameId = requestAnimationFrame(animate);
    } else {
      callback?.();
    }
  };

  frameId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(frameId);
}

const getAllScrollBars = (
  type: "scroll" | "slider",
  customScrollRef: HTMLDivElement | null,
  scrollBarsRef: React.MutableRefObject<[] | NodeListOf<Element>>
) => {
  if (!customScrollRef) return;

  const bars = customScrollRef.querySelectorAll(
    `.${type === "scroll" ? "scrollBarThumb" : "sliderBar"}`
  );

  if (bars.length > 0) {
    scrollBarsRef.current = bars;
  }
};

const sliderCheck = (
  scrollEl: HTMLDivElement,
  scrollBars: NodeListOf<Element>,
  sizeLocal: number[],
  direction: "x" | "y" | "hybridX" | "hybridY"
) => {
  function getActiveElem() {
    const elementsFirst = scrollBars[0]?.querySelectorAll(".sliderElem") ?? [];
    const elementsSecond = scrollBars[1]?.querySelectorAll(".sliderElem") ?? [];

    function checkActive(
      elementsArray: NodeListOf<Element>,
      size: number,
      scroll: HTMLDivElement,
      direction: "x" | "y" | "hybridX" | "hybridY"
    ) {
      const scrollPosition =
        direction === "x" ? scroll.scrollLeft : scroll.scrollTop;

      elementsArray.forEach((element, index) => {
        const isActive =
          scrollPosition >= size * index && scrollPosition < size * (index + 1);
        element.classList.toggle("active", isActive);
      });
    }

    if (elementsFirst.length > 0) {
      checkActive(elementsFirst, sizeLocal[1], scrollEl, direction);
    }

    if (elementsSecond.length > 0) {
      checkActive(elementsSecond, sizeLocal[0], scrollEl, "x");
    }
  }

  getActiveElem();
};

function getWrapperMinSizeStyle(
  wrapperMinSize: number | "full" | (number | "full")[],
  direction: "x" | "y" | "hybridX" | "hybridY",
  sizeLocal: number[],
  mLocalX: number,
  mLocalY: number
): React.CSSProperties {
  const resolveSize = (value: number | "full", axis: "x" | "y"): number =>
    value === "full"
      ? (axis === "x" ? sizeLocal[0] : sizeLocal[1]) -
        (axis === "x" ? mLocalX : mLocalY)
      : value;

  if (
    direction !== "hybridX" &&
    direction !== "hybridY" &&
    !Array.isArray(wrapperMinSize)
  ) {
    const minSize = `${resolveSize(wrapperMinSize, direction)}px`;
    return direction === "x" ? { minWidth: minSize } : { minHeight: minSize };
  }

  // direction is hybrid
  let x: number | "full", y: number | "full";

  if (Array.isArray(wrapperMinSize)) {
    [x, y] = wrapperMinSize;
  } else {
    x = y = wrapperMinSize;
  }

  const minWidth = `${resolveSize(x, "x")}px`;
  const minHeight = `${resolveSize(y, "y")}px`;

  return { minWidth, minHeight };
}

function getWrapperAlignStyle(
  wrapperAlign: "start" | "center" | "end" | ("start" | "center" | "end")[],
  sizeLocal: number[],
  objectsWrapperWidthFull: number,
  objectsWrapperHeightFull: number
): React.CSSProperties {
  const [verticalAlign, horizontalAlign = "start"] =
    typeof wrapperAlign === "string"
      ? [wrapperAlign, wrapperAlign]
      : wrapperAlign;
  const getStyle = (algin: "start" | "center" | "end") =>
    algin === "start"
      ? "flex-start"
      : algin === "center"
      ? "center"
      : "flex-end";

  const alignStyles: React.CSSProperties = { display: "flex" };

  if (sizeLocal[0] > objectsWrapperWidthFull)
    alignStyles.justifyContent = getStyle(verticalAlign);

  if (sizeLocal[1] > objectsWrapperHeightFull) {
    alignStyles.alignItems = getStyle(horizontalAlign);
  }

  return alignStyles;
}

function createResizeHandler(
  dataRef: React.MutableRefObject<{ width: number; height: number }>,
  triggerUpdate: () => void,
  offsetX = 0,
  offsetY = 0
) {
  return (rect: Partial<DOMRectReadOnly>) => {
    const newSize = {
      width: (rect.width ?? 0) - offsetX,
      height: (rect.height ?? 0) - offsetY,
    };

    if (
      dataRef.current?.width !== newSize.width ||
      dataRef.current?.height !== newSize.height
    ) {
      dataRef.current = newSize;
      triggerUpdate();
    }
  };
}

export {
  objectsPerSize,
  clampValue,
  smoothScroll,
  getAllScrollBars,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
};

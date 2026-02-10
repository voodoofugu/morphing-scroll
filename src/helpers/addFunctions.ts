import React from "react";

import { setTask } from "./taskManager";

import { MorphScrollT } from "../types/types";

function objectsPerSize(availableSize: number, objectSize: number): number {
  if (availableSize <= objectSize) return 1;
  const objects = Math.floor(availableSize / objectSize);

  return objects;
}

async function checkScrollReady(el: Element) {
  while (
    el.scrollHeight <= el.clientHeight &&
    el.scrollWidth <= el.clientWidth
  ) {
    await new Promise((r) => requestAnimationFrame(r));
  }
}

async function smoothScroll(
  direction: "x" | "y",
  scrollEl: Element,
  duration: number | null,
  targetScroll: number,
  rafScrollAnim: (fn: () => void) => void,
) {
  if (!scrollEl || targetScroll === undefined || targetScroll === null)
    return null;

  const topOrLeft = direction === "y" ? "scrollTop" : "scrollLeft";
  const startTopOrLeft = scrollEl[topOrLeft];
  if (startTopOrLeft === targetScroll) return;

  // первый рендер duration 0 для мгновенного запуска
  if (duration === null) {
    await checkScrollReady(scrollEl);
    scrollEl[topOrLeft] = targetScroll;

    return;
  }

  setTask(
    () => {
      const startTime = performance.now();

      const animate = () => {
        const currentTime = performance.now();
        const timeElapsed = currentTime - startTime;
        const progress = duration ? Math.min(timeElapsed / duration, 1) : 1;

        scrollEl[topOrLeft] =
          startTopOrLeft + (targetScroll - startTopOrLeft) * progress;

        if (progress < 1) rafScrollAnim(animate);
      };

      animate(); // запускаем
    },
    duration,
    `smoothScrollBlock${direction}`,
    "exclusive",
  );
}

const getAllScrollBars = (
  type: Exclude<MorphScrollT["type"], undefined>,
  customScrollRef: HTMLDivElement | null,
  scrollBarsRef: React.MutableRefObject<[] | NodeListOf<Element>>,
) => {
  if (!customScrollRef) return;

  const bars = customScrollRef.querySelectorAll(
    `.${type === "scroll" ? "ms-thumb" : "ms-slider"}`,
  );

  if (bars.length > 0) {
    scrollBarsRef.current = bars;
  }
};

const sliderCheck = (
  scrollEl: HTMLDivElement,
  scrollBars: NodeListOf<Element>,
  sizeLocal: number[],
  direction: Exclude<MorphScrollT["direction"], undefined>,
) => {
  const elementsFirst =
    scrollBars[0]?.querySelectorAll(".ms-slider-element") ?? [];
  const elementsSecond =
    scrollBars[1]?.querySelectorAll(".ms-slider-element") ?? [];

  function checkActive(
    elementsArray: NodeListOf<Element>,
    size: number[],
    scroll: HTMLDivElement,
    direction: Exclude<MorphScrollT["direction"], undefined>,
  ) {
    const scrollPosition =
      direction === "x" ? scroll.scrollLeft : scroll.scrollTop;

    elementsArray.forEach((element, index) => {
      const neededSize = direction === "x" ? size[0] : size[1];
      const isActive =
        scrollPosition >= neededSize * index &&
        scrollPosition < neededSize * (index + 1);

      if (isActive) {
        element.classList.add("active");
      } else {
        element.classList.remove("active");
      }
    });
  }

  if (elementsFirst.length > 0) {
    checkActive(elementsFirst, sizeLocal, scrollEl, direction);
  }

  // при "hybrid" direction
  if (elementsSecond.length > 0) {
    checkActive(elementsSecond, sizeLocal, scrollEl, "x");
  }
};

function getWrapperMinSizeStyle(
  wrapperMinSize: number | "full" | (number | "full")[],
  direction: Exclude<MorphScrollT["direction"], undefined>,
  sizeLocal: number[],
  mLocalX: number,
  mLocalY: number,
): React.CSSProperties {
  const resolveSize = (value: number | "full", axis: "x" | "y"): number =>
    value === "full"
      ? (axis === "x" ? sizeLocal[0] : sizeLocal[1]) -
        (axis === "x" ? mLocalX : mLocalY)
      : value;

  if (direction !== "hybrid" && !Array.isArray(wrapperMinSize)) {
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

const getStyleAlign = (algin: "start" | "center" | "end" | undefined) =>
  algin
    ? algin === "start"
      ? "flex-start"
      : algin === "center"
        ? "center"
        : "flex-end"
    : undefined;

function getWrapperAlignStyle(
  wrapperAlign: Exclude<MorphScrollT["wrapperAlign"], undefined>,
  sizeLocal: number[],
  objectsWrapperWidthFull: number,
  objectsWrapperHeightFull: number,
): React.CSSProperties {
  const [verticalAlign, horizontalAlign = "start"] =
    typeof wrapperAlign === "string"
      ? [wrapperAlign, wrapperAlign]
      : wrapperAlign;

  const alignStyles: React.CSSProperties = { display: "flex" };

  if (sizeLocal[0] > objectsWrapperWidthFull)
    alignStyles.justifyContent = getStyleAlign(verticalAlign);

  if (sizeLocal[1] > objectsWrapperHeightFull) {
    alignStyles.alignItems = getStyleAlign(horizontalAlign);
  }

  return alignStyles;
}

function createResizeHandler(
  dataRef: React.MutableRefObject<{ width: number; height: number }>,
  triggerUpdate: () => void,
  offsetX = 0,
  offsetY = 0,
) {
  return (rect: Partial<DOMRectReadOnly>) => {
    let firstZero = false;

    const newSize = {
      width: (rect.width ?? 0) - offsetX,
      height: (rect.height ?? 0) - offsetY,
    };

    const zero = newSize.width === 0 && newSize.height === 0;
    if (zero && !firstZero) {
      firstZero = true;
    }

    if (
      (dataRef.current?.width === newSize.width &&
        dataRef.current?.height === newSize.height) ||
      (zero && firstZero)
    )
      return;

    dataRef.current = newSize;
    triggerUpdate();
  };
}

function stabilizeObject(obj: unknown): string {
  const result: string[] = [];

  const traverse = (value: unknown): void => {
    if (
      value === null ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      result.push(String(value));
    } else if (typeof value === "string") {
      result.push(value);
    } else if (typeof value === "function") {
      result.push("<function>");
    } else if (React.isValidElement(value)) {
      result.push("<react-node>");
    } else if (Array.isArray(value)) {
      value.forEach(traverse);
    } else if (typeof value === "object") {
      const entries = Object.entries(value as object).sort(([a], [b]) =>
        a.localeCompare(b),
      );
      for (const [, val] of entries) {
        traverse(val);
      }
    } else if (typeof value === "undefined") {
      result.push("<undefined>");
    }
  };

  traverse(obj);
  return result.join("/");
}
function stabilizeMany(...args: unknown[]): string[] {
  return args.map(stabilizeObject);
}

const isTouchDevice = () => {
  return typeof window !== "undefined"
    ? (window.matchMedia?.("(pointer: coarse)").matches ?? false)
    : false;
};

export {
  objectsPerSize,
  smoothScroll,
  getAllScrollBars,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
  stabilizeMany,
  getStyleAlign,
  isTouchDevice,
};

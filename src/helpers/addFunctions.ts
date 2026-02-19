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

const sliderCheck = (
  scrollEl: HTMLDivElement,
  scrollBars: Set<HTMLElement>,
  sizeLocal: number[],
  direction: Exclude<MorphScrollT["direction"], undefined>,
) => {
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

  Array.from(scrollBars).forEach((els, i) => {
    const allObj = els?.querySelectorAll(".ms-slider-element") ?? [];
    if (!allObj.length) return;

    // "hybrid" direction при i === 1
    const dir = i === 0 ? direction : "x";

    checkActive(allObj, sizeLocal, scrollEl, dir);
  });
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

const isTouchDevice = () => {
  return typeof window !== "undefined"
    ? (window.matchMedia?.("(pointer: coarse)").matches ?? false)
    : false;
};

export {
  objectsPerSize,
  smoothScroll,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
  getStyleAlign,
  isTouchDevice,
};

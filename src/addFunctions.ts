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
  id: string,
  scrollBarsRef: React.RefObject<[] | NodeListOf<Element>>
) => {
  const bars = document.querySelectorAll(
    `.${type === "scroll" ? "scrollBarThumb" : "sliderBar"}.${id}`
  );

  if (bars.length > 0) {
    scrollBarsRef.current = bars;
  }
};

const sliderCheck = (
  scrollEl: HTMLDivElement,
  scrollBars: NodeListOf<Element>,
  sizeLocal: number[],
  direction: "x" | "y" | "hybrid"
) => {
  function getActiveElem() {
    const elementsFirst = scrollBars[0]?.querySelectorAll(".sliderElem") ?? [];
    const elementsSecond = scrollBars[1]?.querySelectorAll(".sliderElem") ?? [];

    function checkActive(
      elementsArray: NodeListOf<Element>,
      size: number,
      scroll: HTMLDivElement,
      direction: "x" | "y" | "hybrid"
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

export {
  objectsPerSize,
  clampValue,
  smoothScroll,
  getAllScrollBars,
  sliderCheck,
};

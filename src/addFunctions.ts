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

export { objectsPerSize, clampValue, smoothScroll };

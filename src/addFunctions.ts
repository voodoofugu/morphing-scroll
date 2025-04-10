function objectsPerSize(availableSize: number, objectSize: number): number {
  if (availableSize <= objectSize) return 1;
  const objects = Math.floor(availableSize / objectSize);

  return objects;
}

function clampValue(value: number, min = 0, max = Infinity): number {
  return Math.max(min, Math.min(Math.abs(Math.round(value)), max));
}

function smoothScroll(
  scrollElement: Element,
  duration: number = 200,
  targetScrollTop: number,
  callback?: () => void
) {
  let frameId: number;
  if (!scrollElement) return null;

  const startScrollTop = scrollElement.scrollTop;
  let startTime: number | null = null;

  const scrollStep = (currentTime: number) => {
    if (startTime === null) startTime = currentTime; // Фиксируем начальное время в первом кадре

    const timeElapsed = Math.round(currentTime - startTime);
    const progress = Math.min(timeElapsed / duration, 1) || 0;

    scrollElement.scrollTop =
      startScrollTop + (targetScrollTop - startScrollTop) * progress;

    if (timeElapsed <= duration) {
      frameId = requestAnimationFrame(scrollStep);
    } else {
      callback?.();
    }
  };

  frameId = requestAnimationFrame(scrollStep); // Первый кадр фиксирует startTime

  // Возвращаем функцию для отмены анимации
  return () => cancelAnimationFrame(frameId);
}

export { objectsPerSize, clampValue, smoothScroll };

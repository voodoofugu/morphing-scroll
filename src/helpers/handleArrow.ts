type handleArrowT = {
  arrowType: "left" | "right" | "top" | "bottom";
  scrollElement: Element;
  wrapSize: number[];
  scrollSize: number[];
  smoothScroll: (
    targetScroll: number,
    direction: "y" | "x",
    duration: number,
  ) => void;
  duration: number;
  loop: boolean;
  gap: number[];
};

const handleArrow = ({
  arrowType,
  scrollElement,
  wrapSize,
  scrollSize,
  smoothScroll,
  duration,
  loop,
  gap,
}: handleArrowT) => {
  // - vars -
  const width = wrapSize[0];
  const height = wrapSize[1];

  const top = scrollElement.scrollTop;
  const left = scrollElement.scrollLeft;

  // - funcs -
  const getMaxValue = (dir: "x" | "y", delta: 1 | -1) => {
    return dir === "x" ? (delta > 0 ? 0 : width) : delta > 0 ? 0 : height;
  };

  const getNewPosition = (dir: "x" | "y", delta: 1 | -1) => {
    const isX = dir === "x";

    const position = isX ? left : top;
    const gapPerDir = isX ? gap[0] : gap[1];
    const clientSize = scrollElement[isX ? "clientWidth" : "clientHeight"];

    const step = clientSize + gapPerDir;

    const page = Math.floor(Math.max(0, position) / step);
    const nextPage = page + delta;

    return step * nextPage;
  };

  const scrollTo = (dir: "x" | "y", delta: 1 | -1, loop?: boolean) => {
    const value = loop ? getMaxValue(dir, delta) : getNewPosition(dir, delta);

    smoothScroll(value, dir, duration);
  };

  // - logic -
  switch (arrowType) {
    case "top":
      if (top > 0) scrollTo("y", -1);
      else if (loop) scrollTo("y", -1, true);
      break;

    case "left":
      if (left > 0) scrollTo("x", -1);
      else if (loop) scrollTo("x", -1, true);
      break;

    case "right":
      if (left + scrollSize[0] < width) scrollTo("x", 1);
      else if (loop) scrollTo("x", 1, true);
      break;

    case "bottom":
      if (top + scrollSize[1] < height) scrollTo("y", 1);
      else if (loop) scrollTo("y", 1, true);
      break;
  }
};

export default handleArrow;
export type { handleArrowT };

import pageAt from "./pageAt";

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

  const pageOn = (dir: "x" | "y", value: number) => {
    const isX = dir === "x";

    return pageAt(
      value,
      scrollElement[isX ? "clientWidth" : "clientHeight"],
      isX ? gap[0] : gap[1],
    );
  };

  const scrollTo = (dir: "x" | "y", delta: 1 | -1, loop?: boolean) => {
    const value = loop ? getMaxValue(dir, delta) : getNewPosition(dir, delta);

    smoothScroll(value, dir, duration);

    // наружу отдаём сам переход — из него собирается onNavigate
    return {
      axis: dir,
      from: pageOn(dir, dir === "x" ? left : top),
      to: pageOn(dir, value),
    };
  };

  // - logic -
  switch (arrowType) {
    case "top":
      if (top > 0) return scrollTo("y", -1);
      if (loop) return scrollTo("y", -1, true);
      break;

    case "left":
      if (left > 0) return scrollTo("x", -1);
      if (loop) return scrollTo("x", -1, true);
      break;

    case "right":
      if (left + scrollSize[0] < width) return scrollTo("x", 1);
      if (loop) return scrollTo("x", 1, true);
      break;

    case "bottom":
      if (top + scrollSize[1] < height) return scrollTo("y", 1);
      if (loop) return scrollTo("y", 1, true);
      break;
  }

  return null; // упёрлись в край без loop — никуда не поехали
};

export default handleArrow;
export type { handleArrowT };

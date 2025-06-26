import { clampValue } from "./addFunctions";

export type handleArrowT = {
  arrowType: "left" | "right" | "top" | "bottom";
  scrollElement: Element;
  wrapSize: number[];
  scrollSize: number[];
  smoothScroll: (
    targetScroll: number,
    direction: "y" | "x",
    duration: number
  ) => void;
  duration: number;
};

const handleArrow = ({
  arrowType,
  scrollElement,
  wrapSize,
  scrollSize,
  smoothScroll,
  duration,
}: handleArrowT) => {
  const width = wrapSize[0];
  const height = wrapSize[1];

  const top = scrollElement.scrollTop;
  const left = scrollElement.scrollLeft;
  const maxValue = ["top", "bottom"].includes(arrowType) ? height : width;

  const scrollTo = (position: number, direction: "y" | "x") =>
    smoothScroll(clampValue(position, 0, maxValue), direction, duration);

  if (arrowType === "top" && top > 0) {
    scrollTo(top - scrollSize[1], "y");
  } else if (arrowType === "left" && left > 0) {
    scrollTo(left - scrollSize[0], "x");
  }

  if (arrowType === "bottom" && top + scrollSize[1] !== height) {
    scrollTo(top + scrollSize[1], "y");
  } else if (arrowType === "right" && left + scrollSize[0] !== width) {
    scrollTo(left + scrollSize[0], "x");
  }
};

export default handleArrow;

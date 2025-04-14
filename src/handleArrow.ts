import { clampValue } from "./addFunctions";

export type handleArrowT = {
  arrowType: "left" | "right" | "top" | "bottom";
  scrollElement: Element | null;
  wrapElement: Element | null;
  scrollSize: number[];
  smoothScroll: (targetScroll: number, direction: "y" | "x") => void;
};

const handleArrow = ({
  arrowType,
  scrollElement,
  wrapElement,
  scrollSize,
  smoothScroll,
}: handleArrowT) => {
  if (!scrollElement || !wrapElement) return;

  const height = wrapElement.clientHeight;
  const width = wrapElement.clientWidth;
  const top = scrollElement.scrollTop;
  const left = scrollElement.scrollLeft;
  const maxValue = ["top", "bottom"].includes(arrowType) ? height : width;

  const scrollTo = (position: number, direction: "y" | "x") =>
    smoothScroll(clampValue(position, 0, maxValue), direction);

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

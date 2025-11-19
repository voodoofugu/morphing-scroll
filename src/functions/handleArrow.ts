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
  loop: boolean;
};

const handleArrow = ({
  arrowType,
  scrollElement,
  wrapSize,
  scrollSize,
  smoothScroll,
  duration,
  loop,
}: handleArrowT) => {
  const width = wrapSize[0];
  const height = wrapSize[1];
  const maxValue = ["top", "bottom"].includes(arrowType) ? height : width;

  const top = scrollElement.scrollTop;
  const left = scrollElement.scrollLeft;

  const scrollTo = (value: number) => {
    const dir = ["top", "bottom"].includes(arrowType) ? "y" : "x";
    smoothScroll(value, dir, duration);
  };

  switch (arrowType) {
    case "top":
      if (top > 0) scrollTo(top - scrollSize[1]);
      else if (loop) scrollTo(maxValue);
      break;

    case "left":
      if (left > 0) scrollTo(left - scrollSize[0]);
      else if (loop) scrollTo(maxValue);
      break;

    case "right":
      if (left + scrollSize[0] < width) scrollTo(left + scrollSize[0]);
      else if (loop) scrollTo(0);
      break;

    case "bottom":
      if (top + scrollSize[1] < height) scrollTo(top + scrollSize[1]);
      else if (loop) scrollTo(0);
      break;
  }
};

export default handleArrow;

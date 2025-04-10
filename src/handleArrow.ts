export type handleArrowT = {
  arrowType: "left" | "right" | "top" | "bottom";
  scrollElement: Element | null;
  wrapElement: Element | null;
  scrollSize: number[];
  objectsLength: number;
  smoothScroll: (targetScrollTop: number) => void;
};

const handleArrow = ({
  arrowType,
  scrollElement,
  wrapElement,
  scrollSize,
  objectsLength,
  smoothScroll,
}: handleArrowT) => {
  if (!scrollElement || !wrapElement) return;

  const height = wrapElement.clientHeight;

  const scrollTo = (position: number) => smoothScroll(position);

  if (arrowType === "top" && scrollElement.scrollTop > 0) {
    scrollTo(
      scrollElement.scrollTop <= scrollSize[1]
        ? 0
        : scrollElement.scrollTop - scrollSize[1]
    );
  }

  if (
    arrowType === "bottom" &&
    objectsLength &&
    scrollElement.scrollTop + scrollSize[1] !== height
  ) {
    scrollTo(
      scrollElement.scrollTop + scrollSize[1] >= scrollSize[1] * objectsLength
        ? height
        : scrollElement.scrollTop + scrollSize[1]
    );
  }
};

export default handleArrow;

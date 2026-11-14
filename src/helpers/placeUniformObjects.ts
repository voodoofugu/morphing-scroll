import type { ObjectBox } from "./createPageModel";

type Args = {
  total: number;
  direction: "x" | "y" | "hybrid";
  order: "row" | "column";
  align: "start" | "center" | "end";
  perDirection: [number, number];
  size: [number, number];
  /** CSS gap order: row first, column second */
  gap: [number, number];
};

/** Place a uniform grid without reading the DOM. */
const placeUniformObjects = ({
  total,
  direction,
  order,
  align,
  perDirection,
  size,
  gap,
}: Args): ObjectBox[] => {
  if (!total) return [];

  const isX = direction === "x";
  const isRow = order === "row";
  const isRowInDir = (isX && !isRow) || (!isX && isRow);
  const stepX = size[0] + gap[1];
  const stepY = size[1] + gap[0];
  const itemsPerLine = isRowInDir ? perDirection[0] : perDirection[1];
  const alignedSize = size[isRow ? 0 : 1];
  const alignedGap = gap[isRow ? 1 : 0];
  const safePerLine = Math.max(1, itemsPerLine);
  const lastLineStart =
    Math.floor((total - 1) / safePerLine) * safePerLine;
  const itemsInLastLine = total - lastLineStart;
  const emptySlots = Math.max(0, safePerLine - itemsInLastLine);
  const emptySpace = (alignedSize + alignedGap) * emptySlots;
  const alignSpace =
    align === "center"
      ? Math.round(emptySpace / 2)
      : align === "end"
        ? emptySpace
        : 0;

  return Array.from({ length: total }, (_, childIndex) => {
    const groupIndex = isRowInDir
      ? childIndex % perDirection[0]
      : Math.floor(childIndex / perDirection[1]);
    const subIndex = isRowInDir
      ? Math.floor(childIndex / perDirection[0])
      : childIndex % perDirection[1];

    let leftIndex: number;
    let topIndex: number;
    if (direction === "x") {
      leftIndex = subIndex;
      topIndex = groupIndex;
    } else if (direction === "y") {
      leftIndex = groupIndex;
      topIndex = subIndex;
    } else {
      leftIndex = groupIndex;
      topIndex = subIndex;
    }

    const isLastLine = childIndex >= lastLineStart;
    const top = (isLastLine && !isRow ? alignSpace : 0) + stepY * topIndex;
    const left = (isLastLine && isRow ? alignSpace : 0) + stepX * leftIndex;

    return {
      top,
      left,
      bottom: top + size[1],
      right: left + size[0],
    };
  });
};

export default placeUniformObjects;

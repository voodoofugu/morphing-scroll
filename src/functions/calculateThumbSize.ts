import { clampValue } from "./addFunctions";

function calculateThumbSize(
  size: number,
  objWrapperSize: number,
  thumbMinSize: number
) {
  if (!objWrapperSize) return 0;

  const thumbSize = Math.round((size / objWrapperSize) * size);

  return clampValue(thumbSize, thumbMinSize, size);
}

function calculateThumbSpace(
  scrollSpace: number,
  objWrapperSize: number,
  size: number,
  thumbSize: number
) {
  if (!objWrapperSize) return 0;
  return clampValue(
    (scrollSpace / objWrapperSize) * (size - thumbSize),
    0,
    size - thumbSize
  );
}

export { calculateThumbSize, calculateThumbSpace };

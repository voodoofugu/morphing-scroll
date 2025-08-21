function calculateThumbSize(
  numerator: number,
  denominator: number,
  base: number,
  thumbMinSize: number
) {
  if (!denominator) return 0;

  const value = Math.round((numerator / denominator) * base);

  if (!Number.isFinite(value) || value < thumbMinSize) {
    return thumbMinSize;
  }

  return value;
}

export default calculateThumbSize;

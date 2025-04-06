const objectsPerSize = (availableSize: number, objectSize: number) => {
  if (availableSize <= objectSize) return 1;
  const objects = Math.floor(availableSize / objectSize);

  return objects;
};

function clampValue(value: number, min = 0, max = Infinity): number {
  return Math.max(min, Math.min(Math.abs(Math.round(value)), max));
}

export { objectsPerSize, clampValue };

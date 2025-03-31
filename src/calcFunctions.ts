const objectsPerSize = (availableSize: number, objectSize: number) => {
  if (objectSize <= availableSize) return 1;
  const objects = Math.floor(availableSize / objectSize);

  return objects;
};

export { objectsPerSize };

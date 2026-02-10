function clampValue(value: number, min = 0, max = Infinity): number {
  return Math.max(min, Math.min(Math.round(value), max));
}

export default clampValue;

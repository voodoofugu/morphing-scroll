function clampValue(
  value: number,
  min = 0,
  max = Infinity,
  round: boolean = true,
): number {
  return Math.max(min, Math.min(round ? Math.round(value) : value, max));
}

export default clampValue;

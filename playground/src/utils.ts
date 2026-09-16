export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function numberOrUndefined(value: number) {
  return value > 0 ? value : undefined;
}

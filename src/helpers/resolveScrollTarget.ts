import type { ScrollTarget } from "../types/types";

/**
 * Приводит любую форму цели прокрутки к паре [x, y].
 *
 * Одна и та же запись понимается и в декларативном `scrollPosition`, и в
 * команде `scrollTo`, поэтому разбор общий.
 */
const resolveScrollTarget = (
  target: ScrollTarget,
): (number | "end" | null)[] => {
  if (typeof target === "number" || target === "end") return [target, target];
  if (Array.isArray(target)) return target;

  return [null, null];
};

export default resolveScrollTarget;

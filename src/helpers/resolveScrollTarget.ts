import type { Pair, ScrollTarget } from "../types/types";

/**
 * Brings any shape of a scroll target down to a pair of [x, y].
 *
 * The same notation is understood by the declarative `scrollPosition` and by
 * the `scrollTo` command, so they read it through one place.
 */
const resolveScrollTarget = (
  target: ScrollTarget,
): Pair<number | "end" | null> => {
  if (typeof target === "number" || target === "end") return [target, target];
  if (Array.isArray(target)) return [target[0] ?? null, target[1] ?? null];

  return [null, null];
};

export default resolveScrollTarget;

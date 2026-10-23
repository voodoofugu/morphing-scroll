export const PULL_RELOAD_THRESHOLD = 40;

type Overscroll = { x: number; y: number };
type EdgeName = "top" | "right" | "bottom" | "left";
export type EdgePull = Record<EdgeName, number>;

/** Distance beyond each visual edge, normalized to the reload threshold. */
export const edgePullProgress = ({ x, y }: Overscroll): EdgePull => ({
  top: Math.min(Math.max(y, 0) / PULL_RELOAD_THRESHOLD, 1),
  right: Math.min(Math.max(-x, 0) / PULL_RELOAD_THRESHOLD, 1),
  bottom: Math.min(Math.max(-y, 0) / PULL_RELOAD_THRESHOLD, 1),
  left: Math.min(Math.max(x, 0) / PULL_RELOAD_THRESHOLD, 1),
});

/** The edge currently being pulled and its unnormalized distance in pixels. */
export const activeEdgePull = ({ x, y }: Overscroll) => {
  const candidates: Array<{ edge: EdgeName; distance: number }> = [
    { edge: "top", distance: Math.max(y, 0) },
    { edge: "right", distance: Math.max(-x, 0) },
    { edge: "bottom", distance: Math.max(-y, 0) },
    { edge: "left", distance: Math.max(x, 0) },
  ];
  const active = candidates.reduce((largest, next) =>
    next.distance > largest.distance ? next : largest,
  );

  return active.distance > 0 ? active : null;
};

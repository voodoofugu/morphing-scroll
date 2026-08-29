/**
 * The page a position stands on, along one axis.
 *
 * One formula for everyone: an arrow decides where to turn by it, and
 * `onNavigate` decides whether the page changed by it. It would otherwise be
 * two similar, slightly different calculations.
 */
const pageAt = (position: number, viewport: number, gap: number) => {
  const step = viewport + gap;

  return step > 0 ? Math.max(0, Math.round(position / step)) : 0;
};

export default pageAt;

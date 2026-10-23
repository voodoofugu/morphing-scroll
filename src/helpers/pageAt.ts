/**
 * The page a position stands on, along one axis.
 *
 * One formula for everyone: an arrow decides where to turn by it, and
 * `onNavigate` decides whether the page changed by it. It would otherwise be
 * two similar, slightly different calculations.
 */
type PageBounds = { end: number; count: number };

/** Number of viewport pages needed to expose the whole content span. */
const pageCount = (content: number, viewport: number, gap: number) => {
  const step = viewport + gap;

  if (!(step > 0) || !(content > 0)) return 1;

  /*
   * Content has no trailing gap, while every page after the first starts one
   * gap later. Closing the span with that missing gap makes exact pages stay
   * exact and gives any real tail its own page.
   */
  const pages = Math.ceil((content + gap) / step);

  return Number.isFinite(pages) ? Math.max(1, pages) : 1;
};

const pageAt = (
  position: number,
  viewport: number,
  gap: number,
  bounds?: PageBounds,
) => {
  const step = viewport + gap;

  if (!(step > 0)) return 0;

  const page = Math.max(0, Math.round(position / step));
  if (!bounds || bounds.count < 1) return page;

  const last = bounds.count - 1;

  /* The last partial page lives at the clamped end, not at a full step. */
  if (bounds.end > 0 && position >= bounds.end - 1) return last;

  return Math.min(page, last);
};

export default pageAt;
export { pageCount };

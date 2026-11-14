type SliderWindowArgs = {
  active: number;
  previous: number;
  start: number;
  total: number;
  limit: number;
  loop: boolean;
};

const modulo = (value: number, total: number) =>
  ((value % total) + total) % total;

/** An integer cap of at least two, or no window when every page already fits. */
const sliderWindowLimit = (asked: number | undefined, total: number) => {
  if (!Number.isFinite(asked) || asked === undefined) return total;

  return Math.min(total, Math.max(2, Math.floor(asked)));
};

/** Keep the active marker closer to the centre when the window has room. */
const sliderWindowBuffer = (limit: number) => (limit >= 5 ? 2 : 1);

/**
 * Move a page window when the active page enters its directional buffer. Small
 * windows keep one marker ahead; windows of five or more keep two.
 */
const shiftSliderWindow = ({
  active,
  previous,
  start,
  total,
  limit,
  loop,
}: SliderWindowArgs) => {
  if (total <= 0 || limit >= total) return 0;

  const buffer = sliderWindowBuffer(limit);

  if (!loop) {
    const maxStart = total - limit;

    if (active > previous && active >= start + limit - buffer)
      return Math.min(active - (limit - buffer - 1), maxStart);
    if (active < previous && active <= start + buffer - 1)
      return Math.max(active - buffer, 0);
    if (active < start) return Math.max(active - buffer, 0);
    if (active >= start + limit)
      return Math.min(active - (limit - buffer - 1), maxStart);

    return Math.min(Math.max(start, 0), maxStart);
  }

  const normalizedStart = modulo(start, total);
  const offset = modulo(active - normalizedStart, total);
  const forward = modulo(active - previous, total);
  const backward = modulo(previous - active, total);

  if (offset < limit) {
    if (forward <= backward && offset >= limit - buffer)
      return modulo(active - (limit - buffer - 1), total);
    if (backward < forward && offset < buffer)
      return modulo(active - buffer, total);

    return normalizedStart;
  }

  return forward <= backward
    ? modulo(active - (limit - buffer - 1), total)
    : modulo(active - buffer, total);
};

const sliderWindowPages = (
  start: number,
  total: number,
  limit: number,
  loop: boolean,
) =>
  Array.from({ length: limit }, (_, index) =>
    loop ? modulo(start + index, total) : start + index,
  );

export { shiftSliderWindow, sliderWindowLimit, sliderWindowPages };

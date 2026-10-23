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

/** A positive integer cap, or no window when every page already fits. */
const sliderWindowLimit = (asked: number | undefined, total: number) => {
  if (!Number.isFinite(asked) || asked === undefined) return total;

  return Math.min(total, Math.max(1, Math.floor(asked)));
};

/**
 * Move a page window only when the active page reaches the edge it travelled
 * towards. A direct jump lands with one page left ahead in that direction.
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
  if (limit === 1) return loop ? modulo(active, total) : active;

  if (!loop) {
    const maxStart = total - limit;

    if (active > previous && active >= start + limit - 1)
      return Math.min(active - (limit - 2), maxStart);
    if (active < previous && active <= start)
      return Math.max(active - 1, 0);
    if (active < start) return Math.max(active - 1, 0);
    if (active >= start + limit)
      return Math.min(active - (limit - 2), maxStart);

    return Math.min(Math.max(start, 0), maxStart);
  }

  const normalizedStart = modulo(start, total);
  const offset = modulo(active - normalizedStart, total);
  const forward = modulo(active - previous, total);
  const backward = modulo(previous - active, total);

  if (offset < limit) {
    if (forward <= backward && offset === limit - 1)
      return modulo(normalizedStart + 1, total);
    if (backward < forward && offset === 0)
      return modulo(normalizedStart - 1, total);

    return normalizedStart;
  }

  return forward <= backward
    ? modulo(active - (limit - 2), total)
    : modulo(active - 1, total);
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

import clampValue from "./clampValue";
import { loopPageAt, loopPages } from "./loopWindow";
import pageAt, { pageCount } from "./pageAt";

type Axis = 0 | 1;
type Align = "start" | "center" | "end";

type ObjectBox = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  measured?: boolean;
};

type PageStop = {
  /** target in list coordinates, before loop copies are chosen */
  position: number;
  /** objects that resolve to this exact scroll position */
  objects: number[];
};

type PageModel = {
  basis: "viewport" | "object";
  count: number;
  stops: PageStop[];
  period: number;
  pageAt: (position: number, toward?: -1 | 0 | 1) => number;
  targetAt: (page: number, current?: number) => number;
  next: (page: number, delta: -1 | 1) => number;
};

type PageLayout = {
  model: PageModel;
  /** extra scrollable room needed to honour first/last object alignment */
  inset: [before: number, after: number];
};

const SAME_STOP_TOLERANCE = 0.5;

const mod = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

const nearestIndex = (values: number[], value: number) => {
  if (values.length < 2) return 0;

  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (values[middle] < value) low = middle + 1;
    else high = middle;
  }

  if (low === 0) return 0;
  if (low === values.length) return values.length - 1;

  return value - values[low - 1] <= values[low] - value ? low - 1 : low;
};

const groupStops = (
  asked: { position: number; object: number }[],
): PageStop[] => {
  const sorted = asked
    .filter(({ position }) => Number.isFinite(position))
    .sort((a, b) => a.position - b.position || a.object - b.object);
  const out: PageStop[] = [];

  for (const item of sorted) {
    const previous = out[out.length - 1];
    if (
      previous &&
      Math.abs(previous.position - item.position) <= SAME_STOP_TOLERANCE
    ) {
      previous.objects.push(item.object);
      continue;
    }

    out.push({ position: item.position, objects: [item.object] });
  }

  return out;
};

const mergeStops = (stops: PageStop[]): PageStop[] => {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const out: PageStop[] = [];

  for (const stop of sorted) {
    const previous = out[out.length - 1];
    if (
      previous &&
      Math.abs(previous.position - stop.position) <= SAME_STOP_TOLERANCE
    ) {
      previous.objects.push(...stop.objects);
      continue;
    }

    out.push({ position: stop.position, objects: [...stop.objects] });
  }

  return out;
};

const emptyModel = (basis: PageModel["basis"]): PageModel => ({
  basis,
  count: 0,
  stops: [],
  period: 0,
  pageAt: () => 0,
  targetAt: () => 0,
  next: () => 0,
});

const createModel = (
  basis: PageModel["basis"],
  stops: PageStop[],
  period = 0,
): PageModel => {
  if (!stops.length) return emptyModel(basis);

  const positions = stops.map(({ position }) => position);

  const pageAtLocal = (position: number, toward: -1 | 0 | 1 = 0) => {
    if (!period) return nearestIndex(positions, position);

    /*
     * Keep the ordered stop list intact and compare inside one turn. The
     * first stop is the phase: object-centred stops may start before zero,
     * but their distances through a turn are still monotonic.
     */
    const phase = positions[0];
    const offsets = positions.map((point) => point - phase);
    const inside = mod(position - phase, period);
    const direct = nearestIndex(offsets, inside);

    const firstDistance = Math.min(inside, period - inside);
    const lastInside = offsets[offsets.length - 1] ?? 0;
    const lastDistance = Math.min(
      Math.abs(inside - lastInside),
      period - Math.abs(inside - lastInside),
    );
    const directDistance = Math.abs(inside - offsets[direct]);
    const edgeDistance = Math.min(firstDistance, lastDistance);

    /*
     * Direction only breaks a real tie at the loop seam. It must not outrank
     * an exact interior stop merely because first and last happen to be
     * equally far away (the middle stop of an odd-sized carousel).
     */
    if (
      toward &&
      Math.abs(firstDistance - lastDistance) <= SAME_STOP_TOLERANCE &&
      edgeDistance <= directDistance + SAME_STOP_TOLERANCE
    )
      return toward > 0 ? 0 : stops.length - 1;
    if (firstDistance < directDistance) return 0;
    if (lastDistance < directDistance) return stops.length - 1;

    return direct;
  };

  const targetAt = (page: number, current = 0) => {
    const index = clampValue(Math.round(page), 0, stops.length - 1);
    const target = positions[index];
    if (!period) return target;

    return target + Math.round((current - target) / period) * period;
  };

  return {
    basis,
    count: stops.length,
    stops,
    period,
    pageAt: pageAtLocal,
    targetAt,
    next: (page, delta) => {
      if (period) return mod(page + delta, stops.length);
      return clampValue(page + delta, 0, stops.length - 1);
    },
  };
};

const createViewportPageModel = ({
  content,
  viewport,
  gap,
  end,
  period = 0,
}: {
  content: number;
  viewport: number;
  gap: number;
  end: number;
  period?: number;
}): PageModel => {
  if (!(viewport > 0)) return emptyModel("viewport");

  if (period) {
    const { pages, step } = loopPages(period, viewport, gap);
    return {
      basis: "viewport",
      count: pages,
      // Viewport pages are arithmetic; never allocate one record per page.
      stops: [],
      period,
      pageAt: (position, toward = 0) => {
        const page = loopPageAt(position, step, toward);
        return pages ? mod(page, pages) : 0;
      },
      targetAt: (page, current = 0) => {
        if (!pages) return 0;
        const index = mod(Math.round(page), pages);
        const target = index * step;
        return target + Math.round((current - target) / period) * period;
      },
      next: (page, delta) => (pages ? mod(page + delta, pages) : 0),
    };
  }

  const count = pageCount(content, viewport, gap);
  const step = viewport + gap;

  return {
    basis: "viewport",
    count,
    stops: [],
    period: 0,
    pageAt: (position) => pageAt(position, viewport, gap, { end, count }),
    targetAt: (page) => {
      const index = clampValue(Math.round(page), 0, count - 1);
      return index === count - 1 ? Math.min(index * step, end) : index * step;
    },
    next: (page, delta) => clampValue(page + delta, 0, count - 1),
  };
};

const createObjectPageLayout = ({
  boxes,
  axis,
  viewport,
  content,
  before,
  after,
  align,
  period = 0,
}: {
  boxes: ObjectBox[];
  axis: Axis;
  viewport: number;
  content: number;
  before: number;
  after: number;
  align: Align;
  period?: number;
}): PageLayout => {
  const factor = align === "center" ? 0.5 : align === "end" ? 1 : 0;
  const asked = boxes.flatMap((box, object) => {
    if (box.measured === false) return [];

    const start = axis === 0 ? box.left : box.top;
    const end = axis === 0 ? box.right : box.bottom;
    const size = end - start;
    if (!(size >= 0) || !Number.isFinite(size)) return [];

    return [
      {
        position: before + start + size * factor - viewport * factor,
        object,
      },
    ];
  });

  if (!asked.length)
    return { model: emptyModel("object"), inset: [0, 0] };

  let stops = groupStops(asked);

  if (period)
    return {
      model: createModel("object", stops, period),
      inset: [0, 0],
    };

  const first = stops[0].position;
  const insetBefore = Math.max(0, -first);
  if (insetBefore)
    stops = stops.map((stop) => ({
      ...stop,
      position: stop.position + insetBefore,
    }));

  const naturalEnd = before + insetBefore + content + after - viewport;
  const insetAfter = Math.max(
    0,
    (stops[stops.length - 1]?.position ?? 0) - naturalEnd,
  );
  const max = Math.max(
    0,
    before + insetBefore + content + after + insetAfter - viewport,
  );

  /* Fractional layout can leave an otherwise equal stop just outside range. */
  stops = mergeStops(
    stops.map((stop) => ({
      position: clampValue(stop.position, 0, max),
      objects: stop.objects,
    })),
  );

  return {
    model: createModel("object", stops),
    inset: [insetBefore, insetAfter],
  };
};

export { createObjectPageLayout, createViewportPageModel };
export type { ObjectBox, PageLayout, PageModel, PageStop };

const VELOCITY_WINDOW = 80;

type Point = { x: number; y: number; time: number };

type PointerVelocity = {
  x: number;
  y: number;
  t: number;
  distX: number;
  distY: number;
  points: Point[];
  lastPoint: Point | null;
};

const emptyPointerVelocity = (): PointerVelocity => ({
  x: 0,
  y: 0,
  t: 0,
  distX: 0,
  distY: 0,
  points: [],
  lastPoint: null,
});

const eventPoints = (event: PointerEvent) => {
  const coalesced = event.getCoalescedEvents?.() ?? [];
  const events = coalesced.length ? coalesced : [event];

  /* Some engines omit the parent event from the coalesced list. */
  const last = events[events.length - 1];
  if (
    last &&
    (last.clientX !== event.clientX || last.clientY !== event.clientY)
  )
    events.push(event);

  return events;
};

/**
 * Calculate release velocity over a short time window instead of per event.
 * The result stays stable when a browser delivers the same gesture as many
 * coalesced samples or as a few regular pointermoves.
 */
const recordPointerVelocity = (
  velocity: PointerVelocity,
  event: PointerEvent,
  receivedAt = performance.now(),
) => {
  for (const sample of eventPoints(event)) {
    const time = Number.isFinite(sample.timeStamp)
      ? sample.timeStamp
      : receivedAt;
    const point = { x: sample.clientX, y: sample.clientY, time };
    const previous = velocity.lastPoint;

    if (
      previous &&
      previous.x === point.x &&
      previous.y === point.y &&
      previous.time === point.time
    )
      continue;

    if (previous) {
      velocity.distX += Math.abs(point.x - previous.x);
      velocity.distY += Math.abs(point.y - previous.y);
    }

    velocity.points.push(point);
    velocity.lastPoint = point;
  }

  const latest = velocity.points[velocity.points.length - 1];
  if (!latest) return;

  while (
    velocity.points.length > 2 &&
    velocity.points[0].time < latest.time - VELOCITY_WINDOW
  )
    velocity.points.shift();

  const first = velocity.points[0];
  const elapsed = latest.time - first.time;

  if (elapsed > 0) {
    velocity.x = (latest.x - first.x) / elapsed;
    velocity.y = (latest.y - first.y) / elapsed;
  }

  /* Release timeout uses the clock of the handler, not event timestamp origin. */
  velocity.t = receivedAt;
};

export { emptyPointerVelocity, recordPointerVelocity };
export type { PointerVelocity };

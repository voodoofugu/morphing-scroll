/**
 * jsdom has no layout engine: every element reports 0 for clientWidth /
 * scrollHeight / getBoundingClientRect. The drag code divides by those
 * numbers, so without stubs every gesture collapses into NaN and bails out.
 *
 * Stubbing them makes pointer gestures behave deterministically in jsdom,
 * which is what lets the isolation tests drive two instances at once.
 * Real-layout physics still belongs in the Playwright suite.
 */
type Metrics = {
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
  /** viewport offset of the element, defaults to 0/0 */
  top?: number;
  left?: number;
};

const stubLayout = (el: HTMLElement, m: Metrics) => {
  const top = m.top ?? 0;
  const left = m.left ?? 0;

  for (const key of [
    "clientWidth",
    "clientHeight",
    "scrollWidth",
    "scrollHeight",
  ] as const)
    Object.defineProperty(el, key, { value: m[key], configurable: true });

  el.getBoundingClientRect = () =>
    ({
      width: m.clientWidth,
      height: m.clientHeight,
      top,
      left,
      right: left + m.clientWidth,
      bottom: top + m.clientHeight,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
};

/**
 * jsdom ships no PointerEvent constructor, and the library listens for
 * pointerdown/pointermove/pointerup. A MouseEvent with a pointerId carries
 * everything the handlers actually read.
 */
const pointer = (
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  x: number,
  y: number,
  target: EventTarget,
  pointerId = 1,
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  target.dispatchEvent(event);
  return event;
};

/** drag a pointer along a path, starting on `target` */
const drag = (
  target: HTMLElement,
  path: [x: number, y: number][],
  pointerId = 1,
) => {
  const [start, ...rest] = path;
  pointer("pointerdown", start[0], start[1], target, pointerId);
  for (const [x, y] of rest) pointer("pointermove", x, y, document, pointerId);
};

const cursorLock = () => document.getElementById("ms-cursor-lock");

export { stubLayout, pointer, drag, cursorLock };
export type { Metrics };

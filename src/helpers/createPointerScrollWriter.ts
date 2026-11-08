type Axis = "x" | "y";

/**
 * Keep pointer input synchronous, but write its final scroll position once per
 * paint. Pointer events can arrive faster than the screen refreshes; writing
 * every intermediate offset makes the main thread do work that can never be
 * displayed.
 */
function createPointerScrollWriter() {
  let frame: number | null = null;
  let element: HTMLDivElement | null = null;
  let x: number | null = null;
  let y: number | null = null;

  const apply = () => {
    const target = element;

    frame = null;
    element = null;

    if (!target) return;

    if (x !== null && target.scrollLeft !== x) target.scrollLeft = x;
    if (y !== null && target.scrollTop !== y) target.scrollTop = y;

    x = null;
    y = null;
  };

  const schedule = (target: HTMLDivElement, axis: Axis, value: number) => {
    /* One runtime belongs to one viewport. Flush defensively if that changes. */
    if (element && element !== target) flush();

    element = target;
    if (axis === "x") x = value;
    else y = value;

    if (frame === null) frame = requestAnimationFrame(apply);
  };

  const flush = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    apply();
  };

  const cancel = () => {
    if (frame !== null) cancelAnimationFrame(frame);

    frame = null;
    element = null;
    x = null;
    y = null;
  };

  return { schedule, flush, cancel };
}

export default createPointerScrollWriter;

type Side = "top" | "right" | "bottom" | "left";

/** how much free space there is around the objects — by axis, and at the edges */
type Spacing = {
  gap: [x: number, y: number];
  margin: [top: number, right: number, bottom: number, left: number];
};

const NO_SPACING: Spacing = { gap: [0, 0], margin: [0, 0, 0, 0] };

const boxesOf = (wrapper: HTMLElement) =>
  Array.from(wrapper.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.classList.contains("ms-object-box"),
  );

const boxWithFocus = (boxes: HTMLElement[]) => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;

  return boxes.find((box) => box === active || box.contains(active)) ?? null;
};

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aEnd > bStart && aStart < bEnd;

const firstInView = (boxes: HTMLElement[], view: DOMRect) =>
  boxes.find((box) => {
    const r = box.getBoundingClientRect();

    return (
      overlaps(r.top, r.bottom, view.top, view.bottom) &&
      overlaps(r.left, r.right, view.left, view.right)
    );
  }) ??
  boxes[0] ??
  null;

/**
 * The neighbour on a given side — picked by geometry rather than by index, so
 * a grid, objects of different sizes and both axes are all counted the same
 * way, and the order in the DOM does not matter.
 *
 * The row comes first: among the objects overlapping across the other axis,
 * the nearest one is the answer. Once the row runs out, the best score of
 * "far ahead plus far aside" wins, so a step down from the end of a row lands
 * at the start of the next one instead of flying off diagonally.
 */
const pickNeighbour = (
  boxes: HTMLElement[],
  current: HTMLElement,
  side: Side,
) => {
  const isX = side === "left" || side === "right";
  const forward = side === "right" || side === "bottom" ? 1 : -1;
  const from = current.getBoundingClientRect();

  let inRow: { box: HTMLElement; main: number } | null = null;
  let anywhere: { box: HTMLElement; score: number } | null = null;

  for (const box of boxes) {
    if (box === current) continue;

    const to = box.getBoundingClientRect();

    const main =
      (isX
        ? to.left + to.width / 2 - (from.left + from.width / 2)
        : to.top + to.height / 2 - (from.top + from.height / 2)) * forward;

    if (main <= 0) continue; // не в ту сторону

    const cross = Math.abs(
      isX
        ? to.top + to.height / 2 - (from.top + from.height / 2)
        : to.left + to.width / 2 - (from.left + from.width / 2),
    );

    const sameRow = isX
      ? overlaps(to.top, to.bottom, from.top, from.bottom)
      : overlaps(to.left, to.right, from.left, from.right);

    if (sameRow && (!inRow || main < inRow.main)) inRow = { box, main };

    const score = main + cross * 2;
    if (!anywhere || score < anywhere.score) anywhere = { box, score };
  }

  return inRow?.box ?? anywhere?.box ?? null;
};

/** whether any object lies beyond this one along the axis */
const boxBeyond = (
  boxes: HTMLElement[],
  box: DOMRect,
  axis: "x" | "y",
  forward: boolean,
) =>
  boxes.some((other) => {
    const o = other.getBoundingClientRect();

    if (axis === "x") return forward ? o.left >= box.right : o.right <= box.left;

    return forward ? o.top >= box.bottom : o.bottom <= box.top;
  });

/**
 * The space an object keeps between itself and the edge of the view. It comes
 * from whatever is actually in that place: between objects it is the gap, and
 * past the outermost one there is no gap left — there it is the wrapper's
 * margin.
 */
const padsAround = (
  boxes: HTMLElement[],
  box: DOMRect,
  { gap: [gapX, gapY], margin: [mT, mR, mB, mL] }: Spacing,
) => ({
  x: {
    start: boxBeyond(boxes, box, "x", false) ? gapX : mL,
    end: boxBeyond(boxes, box, "x", true) ? gapX : mR,
  },
  y: {
    start: boxBeyond(boxes, box, "y", false) ? gapY : mT,
    end: boxBeyond(boxes, box, "y", true) ? gapY : mB,
  },
});

type Pads = ReturnType<typeof padsAround>;

/** how far to move the scroll for the object to fit in the view whole */
const intoViewDelta = (view: DOMRect, box: DOMRect, pads: Pads) => {
  const along = (
    boxStart: number,
    boxEnd: number,
    viewStart: number,
    viewEnd: number,
    pad: Pads["x"],
  ) => {
    /*
     * Доехать «ровно до края» мало: объект встаёт вплотную к нему, хотя место
     * рядом есть. Тянемся на отступ дальше — прокрутка всё равно упрётся в
     * свой конец, если его там не хватает.
     */
    const lead = boxStart - viewStart - pad.start;

    if (boxStart < viewStart) return lead;
    /*
     * `lead` держит крупный объект: он встаёт началом к краю, а не концом.
     * Но отступ больше самого расстояния делает его отрицательным, и шаг
     * вперёд уехал бы назад — до нуля и не дальше.
     */
    if (boxEnd > viewEnd)
      return Math.max(0, Math.min(boxEnd - viewEnd + pad.end, lead));

    return 0;
  };

  return {
    x: along(box.left, box.right, view.left, view.right, pads.x),
    y: along(box.top, box.bottom, view.top, view.bottom, pads.y),
  };
};

/**
 * Moves focus to the neighbouring object and says how far the scroll should
 * follow it. The scrolling itself belongs to the component and its own
 * animation, which is why the browser is not allowed to do it here.
 */
function focusStep(
  wrapper: HTMLElement | null,
  scrollEl: HTMLElement | null,
  side: Side,
  spacing: Spacing = NO_SPACING,
) {
  if (!wrapper || !scrollEl) return null;

  const boxes = boxesOf(wrapper);
  if (!boxes.length) return null;

  const view = scrollEl.getBoundingClientRect();
  const current = boxWithFocus(boxes);

  // первая стрелка ничего не листает: она берёт то, на что человек смотрит
  const next = current ? pickNeighbour(boxes, current, side) : firstInView(boxes, view);
  if (!next) return null;

  /*
   * Фокус получает сам объект, а не то, что внутри него: подсветка идёт по
   * карточке целиком, и приложению есть что стилизовать — `.ms-object-box`.
   * Фокусируемым он становится в этот момент, а не в разметке всем подряд.
   */
  if (!next.hasAttribute("tabindex")) next.tabIndex = -1;

  next.focus({ preventScroll: true });

  const rect = next.getBoundingClientRect();

  return {
    box: next,
    delta: intoViewDelta(view, rect, padsAround(boxes, rect, spacing)),
  };
}

export default focusStep;
export type { Side, Spacing };

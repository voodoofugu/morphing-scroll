type Side = "top" | "right" | "bottom" | "left";

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
 * Сосед в заданную сторону — по геометрии, а не по индексу: сетка, разные
 * размеры объектов и обе оси считаются одинаково, и порядок в DOM ни на что
 * не влияет.
 *
 * Сначала ищем в своём ряду — те, кто перекрывается по поперечной оси; там
 * ближайший и есть ответ. Если ряд кончился, берём лучший по сумме "далеко
 * вперёд + вбок", что бы шаг вниз из конца ряда попадал в начало следующего,
 * а не улетал по диагонали.
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

/** насколько подвинуть прокрутку, что бы объект оказался в окне целиком */
const intoViewDelta = (view: DOMRect, box: DOMRect) => {
  const along = (
    boxStart: number,
    boxEnd: number,
    viewStart: number,
    viewEnd: number,
  ) => {
    if (boxStart < viewStart) return boxStart - viewStart;
    if (boxEnd > viewEnd) return Math.min(boxEnd - viewEnd, boxStart - viewStart);

    return 0;
  };

  return {
    x: along(box.left, box.right, view.left, view.right),
    y: along(box.top, box.bottom, view.top, view.bottom),
  };
};

/**
 * Переносит фокус на соседний объект и говорит, насколько за ним подвинуть
 * прокрутку. Саму прокрутку ведёт компонент — своей анимацией, поэтому
 * браузеру она тут запрещена.
 */
function focusStep(
  wrapper: HTMLElement | null,
  scrollEl: HTMLElement | null,
  side: Side,
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

  return {
    box: next,
    delta: intoViewDelta(view, next.getBoundingClientRect()),
  };
}

export default focusStep;
export type { Side };

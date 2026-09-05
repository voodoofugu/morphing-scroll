import clampValue from "./clampValue";
import type { MorphScroll, Vec2 } from "../types/types";
import CONST from "../constants";

export type ScrollStateRefT = {
  targetScrollY: number;
  targetScrollX: number;
  animating: boolean;
  animationFrameId: number | null;
};

/*
 * Колесо докладывает сдвиг в трёх разных единицах, и какую выберет браузер —
 * его дело. Chrome и Safari шлют пиксели, Firefox на десктопе — строки: щелчок
 * там приходит как `deltaY: 3`, и без пересчёта прокрутка получала три пикселя
 * вместо сотни. Страницами меряют режимы чтения и часть драйверов.
 *
 * Строка в сорок пикселей — та же величина, которой пользуется нативная
 * прокрутка: щелчок в три строки даёт 120, рядом с сотней у Chrome.
 */
const LINE_HEIGHT = 40;

const deltaOf = (e: WheelEvent, scrollEl: HTMLElement): Vec2 => {
  const scale =
    e.deltaMode === 1
      ? LINE_HEIGHT
      : e.deltaMode === 2
        ? // страница — это окно, и по каждой оси она своя
          Math.max(scrollEl.clientHeight, scrollEl.clientWidth) || LINE_HEIGHT
        : 1;

  return [e.deltaX * scale, e.deltaY * scale];
};

export default function handleWheel(
  e: WheelEvent,
  scrollEl: HTMLElement,
  maxScrollSize: Vec2,
  stateRef: ScrollStateRefT,
  direction: MorphScroll["direction"],
) {
  /*
   * Фокус нужен для клавиатурной навигации (changeDirectionBtn слушается на
   * самом элементе прокрутки). Но забирать его у поля, в котором пользователь
   * печатает, нельзя: прокрутка колесом над списком выбивала каретку из
   * инпута.
   */
  const active = document.activeElement;
  const isTyping =
    !!active &&
    (active.matches("input, textarea, select") ||
      !!active.closest("[contenteditable]"));

  if (!isTyping && !scrollEl.matches(":focus")) scrollEl.focus();

  const [deltaX, deltaY] = deltaOf(e, scrollEl);

  // Устанавливаем начальные значения
  if (!stateRef.animating) {
    stateRef.targetScrollX = clampValue(
      scrollEl.scrollLeft,
      0,
      maxScrollSize[0],
    );
    stateRef.targetScrollY = clampValue(
      scrollEl.scrollTop,
      0,
      maxScrollSize[1],
    );
  }

  /*
   * Какая ось от какого сдвига едет.
   *
   * Горизонтальный список — единственное место, где колесо подменяет ось: у
   * мыши поперечного сдвига нет вовсе, и без подмены такой список ей не
   * прокрутить. Но у трекпада он есть, и тогда едем от него: жест, которым
   * список и листают, раньше не делал ничего.
   *
   * При `hybrid` обе оси свои: мышь двигает вертикаль (её `deltaX` равен
   * нулю), трекпад — обе сразу, а `changeDirection` и удержание клавиши
   * по-прежнему сводят всё на одну ось.
   */
  const moveX =
    direction === "x" ? deltaX || deltaY : direction === "hybrid" ? deltaX : 0;
  const moveY = direction === "x" ? 0 : deltaY;

  /*
   * Съел ли этот скролл движение.
   *
   * Упёршись в край, он его не съедает — и тогда колесо обязано достаться
   * тому, кто снаружи. Иначе список внутри страницы работает ловушкой:
   * докрутил до конца, и дальше не едет ни он, ни страница под ним. Ровно так
   * ведёт себя нативная прокрутка, пока её не попросят об обратном.
   */
  const before = [stateRef.targetScrollX, stateRef.targetScrollY];

  if (moveX)
    stateRef.targetScrollX = clampValue(
      stateRef.targetScrollX + moveX,
      0,
      maxScrollSize[0],
    );

  if (moveY)
    stateRef.targetScrollY = clampValue(
      stateRef.targetScrollY + moveY,
      0,
      maxScrollSize[1],
    );

  const consumed =
    stateRef.targetScrollX !== before[0] || stateRef.targetScrollY !== before[1];

  if (!consumed) return false;

  // Запускаем анимацию, если она ещё не запущена
  if (!stateRef.animating) {
    stateRef.animating = true;
    stateRef.animationFrameId = requestAnimationFrame(animateScroll);
  }

  function animateScroll() {
    /*
     * Обе оси считаются одинаково, поэтому и код на них один. `hybrid` на
     * трекпаде едет по обеим сразу, и остановиться анимация должна, когда
     * доехали обе.
     */
    const stepAxis = (axis: 0 | 1) => {
      const isX = axis === 0;
      const prop = isX ? "scrollLeft" : "scrollTop";
      const target = isX ? stateRef.targetScrollX : stateRef.targetScrollY;

      const next = clampValue(
        scrollEl[prop] + (target - scrollEl[prop]) * CONST.LERP_FACTOR,
        0,
        maxScrollSize[axis],
      );

      scrollEl[prop] = next;

      return Math.abs(next - target);
    };

    const axes: (0 | 1)[] =
      direction === "x" ? [0] : direction === "hybrid" ? [0, 1] : [1];

    const diff = Math.max(...axes.map(stepAxis));

    // остановка анимации, если разница в позициях мала
    if (diff > CONST.DIFF_THRESHOLD) {
      stateRef.animationFrameId = requestAnimationFrame(animateScroll);
      return;
    }

    // доводим до цели
    for (const axis of axes) {
      const isX = axis === 0;
      scrollEl[isX ? "scrollLeft" : "scrollTop"] = clampValue(
        isX ? stateRef.targetScrollX : stateRef.targetScrollY,
        0,
        maxScrollSize[axis],
      );
    }

    stateRef.animating = false;
    stateRef.animationFrameId = null;
  }

  return true;
}

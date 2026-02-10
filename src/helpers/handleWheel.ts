import clampValue from "./clampValue";
import type { MorphScrollT } from "../types/types";
import CONST from "../constants";

export type ScrollStateRefT = {
  targetScrollY: number;
  targetScrollX: number;
  animating: boolean;
  animationFrameId: number | null;
};

export default function handleWheel(
  e: WheelEvent,
  scrollEl: HTMLElement,
  stateRef: ScrollStateRefT,
  direction: MorphScrollT["direction"],
) {
  if (!scrollEl.matches(":focus")) scrollEl.focus(); // фокусируем элемент прокрутки для корректной работы клавиатурной навигации

  // Устанавливаем начальные значения
  if (!stateRef.animating) {
    stateRef.targetScrollX = scrollEl.scrollLeft;
    stateRef.targetScrollY = scrollEl.scrollTop;
  }

  // Вычисляем новое целевое значение прокрутки
  if (direction === "x") {
    // ограничиваем значение
    stateRef.targetScrollX = clampValue(
      stateRef.targetScrollX + e.deltaY, // используем deltaY вместо deltaX, так как на deltaX не срабатывает onScroll
      0,
      scrollEl.scrollWidth - scrollEl.clientWidth + CONST.SCROLL_OFFSET,
    );
  } else {
    // ограничиваем значение
    stateRef.targetScrollY = clampValue(
      stateRef.targetScrollY + e.deltaY,
      0,
      scrollEl.scrollHeight - scrollEl.clientHeight + CONST.SCROLL_OFFSET,
    );
  }

  // Запускаем анимацию, если она ещё не запущена
  if (!stateRef.animating) {
    stateRef.animating = true;
    stateRef.animationFrameId = requestAnimationFrame(animateScroll);
  }

  function animateScroll() {
    let diff = 0;

    if (direction === "x") {
      scrollEl.scrollLeft +=
        (stateRef.targetScrollX - scrollEl.scrollLeft) * CONST.LERP_FACTOR;

      diff = Math.abs(scrollEl.scrollLeft - stateRef.targetScrollX);
    } else {
      scrollEl.scrollTop +=
        (stateRef.targetScrollY - scrollEl.scrollTop) * CONST.LERP_FACTOR;

      diff = Math.abs(scrollEl.scrollTop - stateRef.targetScrollY);
    }

    // Остановка анимации, если разница в позициях мала
    // осторожнее с diff иначе будет зацикливаться
    if (diff > CONST.DIFF_THRESHOLD) {
      stateRef.animationFrameId = requestAnimationFrame(animateScroll);
    } else {
      // Устанавливаем точное целевое значение
      if (direction === "x") {
        scrollEl.scrollLeft = stateRef.targetScrollX;
      } else {
        scrollEl.scrollTop = stateRef.targetScrollY;
      }

      stateRef.animating = false;
      if (stateRef.animationFrameId !== null) {
        cancelAnimationFrame(stateRef.animationFrameId);
        stateRef.animationFrameId = null;
      }
    }
  }
}

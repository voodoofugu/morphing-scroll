import clampValue from "./clampValue";
import type { MorphScrollT, Vec2 } from "../types/types";
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
  maxScrollSize: Vec2,
  stateRef: ScrollStateRefT,
  direction: MorphScrollT["direction"],
) {
  // фокусируем элемент прокрутки для корректной работы клавиатурной навигации
  if (!scrollEl.matches(":focus")) scrollEl.focus();

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

  // Вычисляем новое значение прокрутки
  if (direction === "x") {
    stateRef.targetScrollX = clampValue(
      stateRef.targetScrollX + e.deltaY,
      0,
      maxScrollSize[0],
    );
  } else {
    stateRef.targetScrollY = clampValue(
      stateRef.targetScrollY + e.deltaY,
      0,
      maxScrollSize[1],
    );
  }

  // Запускаем анимацию, если она ещё не запущена
  if (!stateRef.animating) {
    stateRef.animating = true;
    stateRef.animationFrameId = requestAnimationFrame(animateScroll);
  }

  function animateScroll() {
    let diff: number;

    // обновляем
    if (direction === "x") {
      const nextScrollX = clampValue(
        scrollEl.scrollLeft +
          (stateRef.targetScrollX - scrollEl.scrollLeft) * CONST.LERP_FACTOR,
        0,
        maxScrollSize[0],
      );

      scrollEl.scrollLeft = nextScrollX;
      diff = Math.abs(nextScrollX - stateRef.targetScrollX);
    } else {
      const nextScrollY = clampValue(
        scrollEl.scrollTop +
          (stateRef.targetScrollY - scrollEl.scrollTop) * CONST.LERP_FACTOR,
        0,
        maxScrollSize[1],
      );

      scrollEl.scrollTop = nextScrollY;
      diff = Math.abs(nextScrollY - stateRef.targetScrollY);
    }

    // остановка анимации, если разница в позициях мала
    if (diff > CONST.DIFF_THRESHOLD) {
      stateRef.animationFrameId = requestAnimationFrame(animateScroll);
    } else {
      // обновляем
      if (direction === "x") {
        scrollEl.scrollLeft = clampValue(
          stateRef.targetScrollX,
          0,
          maxScrollSize[0],
        );
      } else {
        scrollEl.scrollTop = clampValue(
          stateRef.targetScrollY,
          0,
          maxScrollSize[1],
        );
      }

      stateRef.animating = false;
      stateRef.animationFrameId = null;
    }
  }
}

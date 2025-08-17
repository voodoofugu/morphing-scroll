import { clampValue } from "./addFunctions";
import type { MorphScrollT } from "../types/types";

export type ScrollStateRefT = {
  targetScrollY: number;
  targetScrollX: number;
  animating: boolean;
  animationFrameId: number | null;
};

export default function handleWheel(
  e: WheelEvent,
  stateRef: ScrollStateRefT,
  direction: MorphScrollT["direction"]
) {
  const currentObject = e.target as HTMLElement;
  const scrollEl = currentObject.closest(".ms-element") as HTMLDivElement;
  if (!scrollEl.matches(":focus")) scrollEl.focus();

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
      scrollEl.scrollWidth - scrollEl.clientWidth + 2 // почему-то нужно прибавить 2
    );
  } else {
    // ограничиваем значение
    stateRef.targetScrollY = clampValue(
      stateRef.targetScrollY + e.deltaY,
      0,
      scrollEl.scrollHeight - scrollEl.clientHeight + 2 // почему-то нужно прибавить 2
    );
  }

  // Запускаем анимацию, если она ещё не запущена
  if (!stateRef.animating) {
    stateRef.animating = true;
    stateRef.animationFrameId = requestAnimationFrame(animateScroll);
  }

  function animateScroll() {
    const lerpFactor = 0.4;
    let diff = 0;

    if (direction === "x") {
      scrollEl.scrollLeft +=
        (stateRef.targetScrollX - scrollEl.scrollLeft) * lerpFactor;

      diff = Math.abs(scrollEl.scrollLeft - stateRef.targetScrollX);
    } else {
      scrollEl.scrollTop +=
        (stateRef.targetScrollY - scrollEl.scrollTop) * lerpFactor;

      diff = Math.abs(scrollEl.scrollTop - stateRef.targetScrollY);
    }

    // Остановка анимации, если разница в позициях мала
    // осторожнее с diff иначе будет зацикливаться
    if (diff > 2.5) {
      stateRef.animationFrameId = requestAnimationFrame(animateScroll);
    } else {
      stateRef.animating = false;
      if (stateRef.animationFrameId !== null) {
        cancelAnimationFrame(stateRef.animationFrameId);
        stateRef.animationFrameId = null;
      }
    }
  }
}

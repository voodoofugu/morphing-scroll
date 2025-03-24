import { MorphScrollT } from "./types";

export type ScrollStateRefT = {
  targetScrollY: number;
  targetScrollX: number;
  animating: boolean;
  animationFrameId: number | null;
};

export default function handleWheel(
  e: WheelEvent,
  scrollEl: HTMLDivElement,
  stateRef: ScrollStateRefT,
  direction: MorphScrollT["direction"]
) {
  e.preventDefault();

  if (!stateRef.animating) {
    stateRef.targetScrollX = scrollEl.scrollLeft;
    stateRef.targetScrollY = scrollEl.scrollTop;
  }

  // Вычисляем новое целевое значение прокрутки
  if (direction === "x") {
    stateRef.targetScrollX = Math.max(
      0,
      Math.min(
        stateRef.targetScrollX + e.deltaY, // используем вместо deltaX, так как на deltaX него не срабатывает onScroll
        scrollEl.scrollWidth - scrollEl.clientWidth
      )
    );
  } else {
    stateRef.targetScrollY = Math.max(
      0,
      Math.min(
        stateRef.targetScrollY + e.deltaY,
        scrollEl.scrollHeight - scrollEl.clientHeight
      )
    );
  }

  // Запускаем анимацию, если она ещё не запущена
  if (!stateRef.animating) {
    stateRef.animating = true;
    stateRef.animationFrameId = requestAnimationFrame(animateScroll);
  }

  function animateScroll() {
    const lerpFactor = 0.4;
    const diffX = Math.abs(scrollEl.scrollLeft - stateRef.targetScrollX);
    const diffY = Math.abs(scrollEl.scrollTop - stateRef.targetScrollY);

    if (direction === "x") {
      scrollEl.scrollLeft +=
        (stateRef.targetScrollX - scrollEl.scrollLeft) * lerpFactor;
    } else {
      scrollEl.scrollTop +=
        (stateRef.targetScrollY - scrollEl.scrollTop) * lerpFactor;
    }

    // Остановка анимации, если разница в позициях мала
    if (
      (direction === "x" && diffX > 1.5) ||
      (direction === "y" && diffY > 1.5)
    ) {
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

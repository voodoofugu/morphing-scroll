export type ScrollStateRefT = {
  targetScrollY: number;
  targetScrollX: number;
  animating: boolean;
  animationFrameId: number;
};

export default function handleWheel(
  e: WheelEvent,
  scrollEl: HTMLDivElement,
  stateRef: ScrollStateRefT
) {
  e.preventDefault();
  if (!stateRef.animating) {
    stateRef.targetScrollX = scrollEl.scrollLeft;
  }

  // Вычисляем новое целевое значение прокрутки
  const newTarget = stateRef.targetScrollX + e.deltaY;

  // Ограничиваем targetScroll так, чтобы оно не выходило за допустимые границы
  const firstChild = scrollEl.children[0] as HTMLDivElement;
  const maxScroll = firstChild.offsetWidth - scrollEl.offsetWidth;
  const boundedTarget = Math.max(0, Math.min(newTarget, maxScroll));

  stateRef.targetScrollX = boundedTarget;

  // Запускаем анимацию, если она ещё не запущена
  if (!stateRef.animating) {
    stateRef.animating = true;
    stateRef.animationFrameId = requestAnimationFrame(animateScroll);
  }

  function animateScroll() {
    const lerpFactor = 0.4;

    // Обновляем scrollLeft с учётом плавности
    scrollEl.scrollLeft +=
      (stateRef.targetScrollX - scrollEl.scrollLeft) * lerpFactor;

    // Если разница меньше 1.5 пикселя, останавливаем анимацию
    if (Math.abs(scrollEl.scrollLeft - stateRef.targetScrollX) > 1.5) {
      stateRef.animationFrameId = requestAnimationFrame(animateScroll);
    } else {
      stateRef.animating = false;
    }
  }
}

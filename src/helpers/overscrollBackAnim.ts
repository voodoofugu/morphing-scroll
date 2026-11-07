import type createRafLoop from "./createRafLoop";

import CONST from "../constants";

type RafLoop = ReturnType<typeof createRafLoop>;

/**
 * The loop lives in the instance runtime rather than in the module: a shared
 * `rafLoop` meant that a return from the rubber band in one scroll killed the
 * same animation in all the others.
 */
const overscrollBackAnim = (
  loop: RafLoop,
  axis: "x" | "y",
  startValue: number,
  update: (value: number) => void,
) => {
  const startTime = performance.now();

  loop.start(() => {
    const now = performance.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / CONST.OVERSCROLL_BACK_DURATION, 1);

    if (progress >= 1) {
      update(0);
      return false; // остановить анимацию
    }

    /*
     * Нативная резинка не возвращается с постоянной скоростью: сначала она
     * заметно снимает натяжение, затем мягко укладывается на границу. Остаток
     * ease-out cubic даёт ту же форму без перелёта через ноль.
     */
    const remaining = 1 - progress;
    update(startValue * remaining ** 3);
    return true; // продолжить
  }, `overscroll-${axis}`); // ключ по оси, что бы повторный запуск заменял предыдущий
};

const stopOverscrollBackAnim = (loop: RafLoop) => {
  loop.stop();
};

export { overscrollBackAnim, stopOverscrollBackAnim };
export type { RafLoop };

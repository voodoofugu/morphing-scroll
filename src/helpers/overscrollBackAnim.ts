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
  overscroll: React.MutableRefObject<{
    x: number;
    y: number;
  }>,
  axis: "x" | "y",
  updater: () => void,
) => {
  const startValue = overscroll.current[axis];
  const startTime = performance.now();

  loop.start(() => {
    const now = performance.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / CONST.OVERSCROLL_BACK_DURATION, 1);

    if (progress >= 1) {
      overscroll.current[axis] = 0;
      updater();
      return false; // остановить анимацию
    }

    overscroll.current[axis] = startValue * (1 - progress);
    updater();
    return true; // продолжить
  }, `overscroll-${axis}`); // ключ по оси, что бы повторный запуск заменял предыдущий
};

const stopOverscrollBackAnim = (loop: RafLoop) => {
  loop.stop();
};

export { overscrollBackAnim, stopOverscrollBackAnim };
export type { RafLoop };

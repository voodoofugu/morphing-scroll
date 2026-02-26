import createRafLoop from "./createRafLoop";

import CONST from "../constants";

const rafLoop = createRafLoop();

const overscrollBackAnim = (
  overscroll: React.MutableRefObject<{
    x: number;
    y: number;
  }>,
  axis: "x" | "y",
  updater: () => void,
) => {
  const startValue = overscroll.current[axis];
  const startTime = performance.now();

  rafLoop.stop();
  rafLoop.start(() => {
    const now = performance.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / CONST.OVERSCROLL_BACK_DURATION, 1);

    overscroll.current[axis] = startValue * (1 - progress);
    updater();

    if (progress >= 1) {
      overscroll.current[axis] = 0;
      updater();
      return false; // остановить loop
    }

    return true; // продолжить
  });
};

export { overscrollBackAnim, rafLoop as stopOverscrollBackAnim };

import type createRafLoop from "./createRafLoop";

import CONST from "../constants";

type RafLoop = ReturnType<typeof createRafLoop>;

const overscrollLimit = (viewportSize: number) =>
  Math.max(
    CONST.BOUNCE_MIN_OVERSCROLL,
    Math.min(
      CONST.BOUNCE_MAX_OVERSCROLL,
      viewportSize * CONST.BOUNCE_OVERSCROLL_RATIO,
    ),
  );

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

/*
 * Когда touch-инерция встречает край, движение не должно исчезать в clamp.
 * Остаток скорости становится коротким растяжением и возвращается той же
 * пружиной. Внутренняя позиция физическая, наружу идёт ограниченный visual
 * overscroll; цикл заканчивается при первом возвращении к нулю, без дрожания
 * по обе стороны границы.
 */
const overscrollMomentumAnim = (
  loop: RafLoop,
  axis: "x" | "y",
  startValue: number,
  velocity: number,
  limit: number,
  update: (value: number) => void,
) => {
  let position = startValue;
  let speed = velocity * 1000; // px/ms → px/s
  let lastTime = performance.now();
  const initialSign = Math.sign(position || speed);

  const visual = (value: number) =>
    Math.max(-limit, Math.min(limit, value));

  if (position !== 0) update(visual(position));

  loop.start(() => {
    const now = performance.now();
    const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.032);
    lastTime = now;

    const acceleration =
      -CONST.OVERSCROLL_MOMENTUM_SPRING * position -
      CONST.OVERSCROLL_MOMENTUM_DAMPING * speed;

    speed += acceleration * delta;
    const next = position + speed * delta;

    if (
      (initialSign !== 0 && Math.sign(next) !== initialSign) ||
      (Math.abs(next) < 0.1 && Math.abs(speed) < 5)
    ) {
      update(0);
      return false;
    }

    position = next;
    update(visual(position));
    return true;
  }, `overscroll-${axis}`);
};

const stopOverscrollBackAnim = (loop: RafLoop) => {
  loop.stop();
};

export {
  overscrollBackAnim,
  overscrollMomentumAnim,
  overscrollLimit,
  stopOverscrollBackAnim,
};
export type { RafLoop };

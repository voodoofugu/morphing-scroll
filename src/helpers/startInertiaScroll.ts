import CONST from "../../src/constants";

type InertiaArgs = {
  el: HTMLDivElement;
  axis: "x" | "y";
  velocity: number;
  rafSchedule: (fn: () => void) => void;
};

function startInertiaScroll({ el, axis, velocity, rafSchedule }: InertiaArgs) {
  // --- нормализация и усиление начальной скорости ---
  const sign = Math.sign(velocity);
  let v0 = Math.abs(velocity);

  // нелинейное усиление (ощущение массы)
  v0 = Math.pow(v0, CONST.INERTIA_BOOST_EXP);

  // минимальный старт (чтобы мелкие жесты не тухли сразу)
  if (v0 < CONST.INERTIA_MIN_START) {
    v0 = CONST.INERTIA_MIN_START;
  }

  // жёсткий clamp сверху
  v0 = Math.min(v0, CONST.INERTIA_MAX_SPEED);

  velocity = v0 * sign;

  const prop = axis === "y" ? "scrollTop" : "scrollLeft";

  const max =
    axis === "y"
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth;

  let lastTime = performance.now();

  const step = () => {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    // --- экспоненциальное затухание по времени ---
    velocity *= Math.exp(-CONST.INERTIA_FRICTION * delta);

    if (Math.abs(velocity) < CONST.INERTIA_MIN_VELOCITY) {
      return;
    }

    let next = el[prop] + velocity;

    // --- мягкое ограничение по границам (без жёсткого стопа) ---
    if (next < 0 || next > max) {
      velocity *= CONST.INERTIA_EDGE_DAMPING;
      next = Math.max(0, Math.min(max, next));
    }

    el[prop] = next;
    rafSchedule(step);
  };

  rafSchedule(step);
}

export default startInertiaScroll;

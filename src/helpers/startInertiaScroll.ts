import CONST from "../../src/constants";
import clampValue from "../helpers/clampValue";

type InertiaArgs = {
  el: HTMLDivElement;
  axis: "x" | "y";
  velocity: number;
  rafSchedule: (fn: () => void) => void;
};

function startInertiaScroll({ el, axis, velocity, rafSchedule }: InertiaArgs) {
  const sign = Math.sign(velocity);
  let v0 = Math.abs(velocity);

  // нелинейное усиление
  v0 = Math.pow(v0, CONST.INERTIA_BOOST_EXP);

  // минимальный старт
  if (v0 < CONST.INERTIA_MIN_START) {
    v0 = CONST.INERTIA_MIN_START;
  }

  velocity = v0 * sign;

  const prop = axis === "y" ? "scrollTop" : "scrollLeft";

  const max =
    axis === "y"
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth;

  let lastTime = performance.now();

  const step = () => {
    const now = performance.now();
    const delta = now - lastTime; // ms
    lastTime = now;

    // экспоненциальное затухание
    velocity *= Math.exp(-CONST.INERTIA_FRICTION * delta);

    if (Math.abs(velocity) < CONST.INERTIA_MIN_VELOCITY) {
      return;
    }

    // ВАЖНО: движение теперь time-based
    let next = el[prop] + velocity * delta;

    // границы хотя браузер и сам делает clump
    if (next < 0 || next > max) {
      velocity *= CONST.INERTIA_EDGE_DAMPING;
      next = clampValue(next, 0, max);
    }

    el[prop] = next;

    rafSchedule(step);
  };

  rafSchedule(step);
}

export default startInertiaScroll;

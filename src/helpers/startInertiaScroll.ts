import CONST from "../../src/constants";
import clampValue from "../helpers/clampValue";

type InertiaArgs = {
  el: HTMLDivElement;
  axis: "x" | "y";
  velocity: number;
  rafSchedule: (kay: string, fn: () => void) => void;
  onEdge?: (collision: {
    edge: "start" | "end";
    velocity: number;
    overflow: number;
  }) => void;
};

function startInertiaScroll({
  el,
  axis,
  velocity,
  rafSchedule,
  onEdge,
}: InertiaArgs) {
  const sign = Math.sign(velocity);
  let v0 = Math.abs(velocity);

  // нелинейное усиление
  v0 = Math.pow(v0, CONST.INERTIA_BOOST_EXP);

  velocity = v0 * sign;

  const prop = axis === "y" ? "scrollTop" : "scrollLeft";

  const max =
    axis === "y"
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth;

  /*
   * Ключ по оси: очередь кадров держит по одной работе на ключ, и при общем
   * ключе диагональный бросок терял горизонталь — вторая ось затирала первую.
   */
  const key = `inertia-${axis}`;

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

    // Граница останавливает layout-scroll, но у touch остаток скорости может
    // продолжиться визуальной пружиной. Остальным источникам оставляем
    // прежнее демпфирование без rubber-band.
    if (next < 0 || next > max) {
      const clamped = clampValue(next, 0, max);

      el[prop] = clamped;

      if (onEdge) {
        onEdge({
          edge: next < 0 ? "start" : "end",
          velocity,
          overflow: next - clamped,
        });
        return;
      }

      velocity *= CONST.INERTIA_EDGE_DAMPING;
      next = clamped;
    }

    el[prop] = next;

    rafSchedule(key, step);
  };

  rafSchedule(key, step);
}

export default startInertiaScroll;

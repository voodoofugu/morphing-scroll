type InertiaArgs = {
  el: HTMLDivElement;
  axis: "x" | "y";
  velocity: number;
  rafID: React.MutableRefObject<{
    x: number;
    y: number;
  }>;
};

function startInertiaScroll({ el, axis, velocity, rafID }: InertiaArgs) {
  const FRICTION = 0.95;
  const MIN = 0.5;

  const prop = axis === "y" ? "scrollTop" : "scrollLeft";
  const max =
    axis === "y"
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth;

  const step = () => {
    velocity *= FRICTION;
    if (Math.abs(velocity) < MIN) return;

    let next = el[prop] + velocity;

    if (next < 0 || next > max) return; // можно потом добавить bounce

    el[prop] = next;
    rafID.current[axis] = requestAnimationFrame(step);
  };

  rafID.current[axis] = requestAnimationFrame(step);
}

export default startInertiaScroll;

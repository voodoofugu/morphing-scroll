/*
 * Передача жеста наружу посреди движения.
 *
 * Наружу уже пропускает тот, кому прокручивать нечего вовсе: он не берёт
 * жест, и его берёт внешний. Но упереться в край можно и на ходу, и там
 * прежде начиналась резинка — палец продолжает вести, а не едет никто.
 * Нативный тач в этом месте отдаёт внешнему, и отдавать надо так же: вместе
 * со скоростью, чтобы бросок докатился у того, кто его подхватил.
 *
 * Свести это можно только через общий список: внешний скролл о внутреннем не
 * знает, а событие к моменту передачи уже перехвачено. Ключом служит корневой
 * узел — по нему же ищется ближайший внешний.
 */
type Taker = {
  /** whether this axis still has room the way the finger is going */
  room: (axis: "x" | "y", toward: 1 | -1) => boolean;
  /** pick the gesture up from this point, at this speed */
  take: (event: PointerEvent, velocity: { x: number; y: number }) => void;
};

const takers = new WeakMap<Element, Taker>();

const registerTaker = (element: Element, taker: Taker) => {
  takers.set(element, taker);

  return () => {
    takers.delete(element);
  };
};

/*
 * Ближайший снаружи, кому есть куда ехать. Идём именно вверх по предкам, а не
 * к первому попавшемуся: жест отдают наружу, а не в сторону.
 */
const findTaker = (from: Element | null, axis: "x" | "y", toward: 1 | -1) => {
  let node = from?.parentElement?.closest("[morph-scroll]") ?? null;

  while (node) {
    const taker = takers.get(node);

    if (taker?.room(axis, toward)) return taker;

    node = node.parentElement?.closest("[morph-scroll]") ?? null;
  }

  return null;
};

export { registerTaker, findTaker };
export type { Taker };

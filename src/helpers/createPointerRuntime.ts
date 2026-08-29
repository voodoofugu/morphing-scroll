import createRafLoop from "./createRafLoop";
import { unlockCursor } from "./mouseOn";
import type { CursorHolder } from "./mouseOn";

type PrevCoord = {
  value: number;
  rest: number;
  raw: number;
};

type Velocity = {
  x: number;
  y: number;
  t: number;
  distX: number; // дистанция для границы запуска конца touch анимации
  distY: number;
};

/**
 * Everything one MorphScroll instance knows about its pointer.
 *
 * These fields used to live in the module, which made them shared by every
 * scroll on the page: the `controller` of one gesture removed the listeners of
 * another, and the `prevCoords` of the first scroll reached the second — which
 * then travelled the wrong distance.
 */
type PointerRuntime = CursorHolder & {
  /** travel so far — what tells a tap from a scroll */
  checkMove: { x: number; y: number };
  /** travel so far, for a slider step */
  checkSliderThumbSize: { x: number; y: number };
  /** the bar element the current gesture aims at — one per axis */
  sliderAim: { x: number | null; y: number | null };
  velocity: Velocity;
  prevCoords: { x: PrevCoord; y: PrevCoord } | null;
  /** the listeners of the current gesture */
  controller: AbortController | undefined;
  /** the loop that returns from a stretch at the edge */
  overscrollLoop: ReturnType<typeof createRafLoop>;
  cursorLocked: boolean;
  /** the reset between gestures */
  resetGesture: () => void;
  /** the full stop on unmount */
  destroy: () => void;
};

const emptyVelocity = (): Velocity => ({
  x: 0,
  y: 0,
  t: 0,
  distX: 0,
  distY: 0,
});

function createPointerRuntime(): PointerRuntime {
  const runtime: PointerRuntime = {
    checkMove: { x: 0, y: 0 },
    checkSliderThumbSize: { x: 0, y: 0 },
    sliderAim: { x: null, y: null },
    velocity: emptyVelocity(),
    prevCoords: null,
    controller: undefined,
    overscrollLoop: createRafLoop(),
    cursorLocked: false,

    resetGesture() {
      runtime.prevCoords = null;
      runtime.velocity = emptyVelocity();
      runtime.checkMove = { x: 0, y: 0 };
      runtime.checkSliderThumbSize = { x: 0, y: 0 };
      runtime.sliderAim = { x: null, y: null };
    },

    destroy() {
      runtime.controller?.abort();
      runtime.controller = undefined;
      runtime.overscrollLoop.stop();
      runtime.resetGesture();

      // жест мог оборваться размонтированием — курсорный замок надо вернуть
      if (runtime.cursorLocked) {
        unlockCursor();
        runtime.cursorLocked = false;
      }
    },
  };

  return runtime;
}

export default createPointerRuntime;
export type { PointerRuntime, Velocity };

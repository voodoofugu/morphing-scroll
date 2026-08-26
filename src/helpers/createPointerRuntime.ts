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
 * Всё состояние указателя одного инстанса MorphScroll.
 *
 * Раньше эти поля лежали в модуле, то есть были общими на все скроллы
 * страницы: `controller` одного жеста снимал слушатели другого, а `prevCoords`
 * первого скролла доставались второму — второй уезжал не на ту дистанцию.
 */
type PointerRuntime = CursorHolder & {
  /** накопленный сдвиг — отличает тап от прокрутки */
  checkMove: { x: number; y: number };
  /** накопленный сдвиг для шага слайдера */
  checkSliderThumbSize: { x: number; y: number };
  velocity: Velocity;
  prevCoords: { x: PrevCoord; y: PrevCoord } | null;
  /** слушатели текущего жеста */
  controller: AbortController | undefined;
  /** петля возврата после растяжения у края */
  overscrollLoop: ReturnType<typeof createRafLoop>;
  cursorLocked: boolean;
  /** сброс между жестами */
  resetGesture: () => void;
  /** полная остановка при размонтировании */
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

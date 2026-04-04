import createSchedulerRAF from "./createSchedulerRAF";
import clampValue from "./clampValue";

// types
type ScrollContainer = {
  parent: HTMLElement;
  element: HTMLElement;
  direction: "x" | "y" | "hybrid";
};

// vars
const DRAG_THRESHOLD = 10; // запас на срабатывание сдвига
const EDGE = 40; // before and after
const SPEED = 20;
const DRAG_ATR = "ms-under-drag";

let abortController: AbortController | undefined;
let dragController: AbortController | null = null;
let listening = false;
let startPoint = {
  x: 0,
  y: 0,
};
let pointer = {
  x: 0,
  y: 0,
};
let dragging = false;
let currentContainer: ScrollContainer | null = null;
let attrValue = "";

let targetEl: HTMLElement | null = null; // для проверки element
let targetParent: HTMLElement | null = null; // для проверки parent
let prevAttr: string | null = null;
let isButtonDown = false;

const raf = createSchedulerRAF();

// funcs
const reset = () => {
  if (targetParent) targetParent.removeAttribute(DRAG_ATR);
  currentContainer = null;
  targetParent = null;
  targetEl = null;
  attrValue = "";
  prevAttr = null;
};

function getEdge(
  pos: number,
  start: number,
  end: number,
  scroll: number,
  client: number,
  scrollSize: number,
) {
  const before = pos - start;
  const after = end - pos;

  if (before < EDGE) {
    if (scroll > 0) return { dir: -1, distance: before };
  } else if (after < EDGE) {
    if (scroll + client < scrollSize) return { dir: 1, distance: after };
  }

  return null;
}

function calcSpeed(distance: number) {
  const ratio = clampValue((EDGE - Math.abs(distance)) / EDGE, 0, 1, false);
  const accel = ratio * ratio;

  return (SPEED * accel) | 0;
}

function autoScrollLoop() {
  if (!currentContainer) return;

  const { parent, element, direction } = currentContainer;
  const rect = element.getBoundingClientRect();

  const x = pointer.x;
  const y = pointer.y;

  // курсор покинул контейнер
  if (
    x < rect.left - EDGE ||
    x > rect.right + EDGE ||
    y < rect.top - EDGE ||
    y > rect.bottom + EDGE
  ) {
    reset();
    return; // ранний выход
  }

  let dirY: "top" | "bottom" | null = null;
  let dirX: "left" | "right" | null = null;

  let scrollByX = 0;
  let scrollByY = 0;

  // ---------- Y SCROLL ----------
  const yEdge =
    direction !== "x"
      ? getEdge(
          y,
          rect.top,
          rect.bottom,
          element.scrollTop,
          element.clientHeight,
          element.scrollHeight,
        )
      : null;

  if (yEdge) {
    dirY = yEdge.dir === -1 ? "top" : "bottom";
    scrollByY = calcSpeed(yEdge.distance) * yEdge.dir;
  }

  // ---------- X SCROLL ----------
  const xEdge =
    direction !== "y"
      ? getEdge(
          x,
          rect.left,
          rect.right,
          element.scrollLeft,
          element.clientWidth,
          element.scrollWidth,
        )
      : null;

  if (xEdge) {
    dirX = xEdge.dir === -1 ? "left" : "right";
    scrollByX = calcSpeed(xEdge.distance) * xEdge.dir;
  }

  // собираем значение атрибута
  attrValue = [dirY, dirX].filter(Boolean).join(" ");

  // обновление значения атрибута
  if (attrValue !== prevAttr) {
    parent.setAttribute(DRAG_ATR, attrValue);
    prevAttr = attrValue;
  }

  if (scrollByX || scrollByY) element.scrollBy(scrollByX, scrollByY); // обновляем scroll

  // продолжаем loop
  raf.schedule("autoScrollLoop", autoScrollLoop);
}

function onMove(e: PointerEvent | DragEvent) {
  // ранний выход
  if (e instanceof DragEvent && e.buttons === 0) {
    removeOnMove();
    return;
  }
  if (pointer.x === e.clientX && pointer.y === e.clientY) return;

  pointer.x = e.clientX;
  pointer.y = e.clientY;

  raf.schedule("onMove", () => {
    // проверка начала drag
    if (!dragging) {
      const dx = pointer.x - startPoint.x;
      const dy = pointer.y - startPoint.y;

      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

      dragging = true;
    }

    const elementUnderCursor = document.elementFromPoint(
      pointer.x,
      pointer.y,
    ) as HTMLElement | null;
    // небольшая защита если elementUnderCursor вернул не DOM
    if (!elementUnderCursor) return;

    const parent = elementUnderCursor.closest("[morph-scroll]") as HTMLElement;
    if (!parent && !currentContainer) {
      reset();
      return; // выход
    } // если уже есть активный контейнер — продолжаем работать с ним

    const container = containerMap.get(parent);
    if (!container) return;
    currentContainer = container;

    if (targetEl !== container.element) {
      if (targetParent && targetParent !== container.parent)
        targetParent.removeAttribute(DRAG_ATR);

      // обновления только после смены элемента
      targetEl = container.element;
      targetParent = container.parent;
      targetParent.setAttribute(DRAG_ATR, attrValue);
      prevAttr = attrValue;

      autoScrollLoop(); // синхронный вызов
    }
  });
}

function removeOnMove() {
  dragController?.abort();
  dragController = null;
  dragging = false;
  raf.cancel();

  reset();
}

function startDrag(e: PointerEvent | DragEvent) {
  const isPointer = e instanceof PointerEvent;

  // если PointerEvent, то проверяем атрибут ms-custom-drag
  if (isPointer) {
    const target = e.target as HTMLElement;
    const draggable = target.closest("[ms-custom-drag]");
    if (!draggable) return; // реагируем только на нужный атрибут
  }

  startPoint.x = e.clientX;
  startPoint.y = e.clientY;

  dragController?.abort();

  const controller = new AbortController();
  dragController = controller;
  const { signal } = controller;

  if (isPointer) {
    document.addEventListener("pointermove", onMove, { signal });
    document.addEventListener("pointerup", removeOnMove, { signal });
  } else {
    document.addEventListener("dragover", onMove, { signal });

    document.addEventListener("dragend", removeOnMove, { signal });
    document.addEventListener("drop", removeOnMove, { signal });
    document.addEventListener("pointerdown", removeOnMove, { signal }); // может помочь сбросить drag
    window.addEventListener("blur", removeOnMove, { signal });
  }
}

function attachListeners() {
  if (listening) return;

  abortController = new AbortController();
  const { signal } = abortController;

  document.addEventListener("pointerdown", startDrag, { signal });
  document.addEventListener("dragstart", startDrag, { signal });

  listening = true;
}

function detachListeners() {
  if (!listening) return;

  abortController?.abort();
  dragController?.abort();

  listening = false;
}

// API
const containerMap = new Map<HTMLElement, ScrollContainer>();

function registerContainer(container: ScrollContainer) {
  containerMap.set(container.parent, container);

  if (containerMap.size === 1) {
    attachListeners();
  }
}

function unregisterContainer(container: ScrollContainer) {
  containerMap.delete(container.parent);

  if (containerMap.size === 0) {
    detachListeners();
  }
}

function getContainers() {
  return containerMap;
}

export { registerContainer, unregisterContainer, getContainers };

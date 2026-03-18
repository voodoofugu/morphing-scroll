import createSchedulerRAF from "./createSchedulerRAF";
import clampValue from "./clampValue";

// types
type ScrollContainer = {
  parent: HTMLElement;
  element: HTMLElement;
  direction: "x" | "y" | "hybrid";
};

// vars
const DRAG_THRESHOLD = 10;
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
let targetRect: DOMRect | null = null;
let currentContainer: ScrollContainer | null = null;
let attrValue = "";

let targetEl: HTMLElement | null = null; // для проверки element
let targetParent: HTMLElement | null = null; // для проверки parent
let prevAttr: string | null = null;

const raf = createSchedulerRAF();

// funcs
function calcSpeed(distance: number) {
  const d = distance < 0 ? -distance : distance;
  const ratio = clampValue((EDGE - d) / EDGE, 0, 1, false);
  const accel = ratio * ratio;

  return (SPEED * accel) | 0;
}

function autoScrollLoop() {
  const x = pointer.x;
  const y = pointer.y;
  const rect = targetRect;

  if (!currentContainer || !rect) return;
  const { parent, element, direction } = currentContainer;

  // курсор покинул контейнер
  if (
    x < rect.left - EDGE ||
    x > rect.right + EDGE ||
    y < rect.top - EDGE ||
    y > rect.bottom + EDGE
  ) {
    targetRect = null;
    if (currentContainer) {
      parent.removeAttribute(DRAG_ATR);
      currentContainer = null;
    }
    targetParent = null;
    targetEl = null;
    attrValue = "";

    return; // ранний выход
  }

  let dirY: "top" | "bottom" | null = null;
  let dirX: "left" | "right" | null = null;

  let scrollByX = 0;
  let scrollByY = 0;

  // ---------- Y SCROLL ----------
  if (direction === "y" || direction === "hybrid") {
    const topEdge = y - rect.top;
    const bottomEdge = rect.bottom - y;

    if (topEdge < EDGE) {
      const distance = topEdge;

      dirY = "top";

      if (element.scrollTop > 0) scrollByY -= calcSpeed(distance);
    } else if (bottomEdge < EDGE) {
      const distance = bottomEdge;

      dirY = "bottom";

      if (element.scrollTop + element.clientHeight < element.scrollHeight)
        scrollByY += calcSpeed(distance);
    }
  }

  // ---------- X SCROLL ----------
  if (direction === "x" || direction === "hybrid") {
    const leftEdge = x - rect.left;
    const rightEdge = rect.right - x;

    if (leftEdge < EDGE) {
      const distance = leftEdge;

      dirX = "left";

      if (element.scrollLeft > 0) scrollByX -= calcSpeed(distance);
    } else if (rightEdge < EDGE) {
      const distance = rightEdge;

      dirX = "right";

      if (element.scrollLeft + element.clientWidth < element.scrollWidth)
        scrollByX += calcSpeed(distance);
    }
  }

  const parts = [];
  if (dirY) parts.push(dirY);
  if (dirX) parts.push(dirX);
  attrValue = parts.join(" ");

  // обновление значения атрибута
  if (attrValue !== prevAttr) {
    parent.setAttribute(DRAG_ATR, attrValue);
    prevAttr = attrValue;
  }

  if (scrollByX || scrollByY) {
    element.scrollBy(scrollByX, scrollByY); // обновляем scroll
    targetRect = element.getBoundingClientRect(); // ещё раз для точности обновляем напоследок rect
  }

  // продолжаем loop
  raf.schedule(autoScrollLoop);
}

function onMove(e: PointerEvent | DragEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;

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

  let el = elementUnderCursor as HTMLElement | null;

  while (el) {
    const container = containerMap.get(el);

    if (container) {
      currentContainer = container;

      if (targetEl !== currentContainer.element) {
        if (targetParent && targetParent !== currentContainer.parent)
          targetParent.removeAttribute(DRAG_ATR);

        // обновления только после смены элемента
        targetEl = currentContainer.element;
        targetParent = currentContainer.parent;
        targetParent.setAttribute(DRAG_ATR, "");
        targetRect = currentContainer.element.getBoundingClientRect();
      }

      break;
    }

    el = el.parentElement;
  }

  raf.schedule(autoScrollLoop);
}

function removeOnMove() {
  dragController?.abort();
  dragController = null;
  dragging = false;
  raf.cancel();

  targetRect = null;
  if (currentContainer) {
    currentContainer.parent.removeAttribute(DRAG_ATR);
    currentContainer = null;
  }
  targetParent = null;
  targetEl = null;
  attrValue = "";
}

function startDrag(e: PointerEvent | DragEvent) {
  if (e instanceof PointerEvent) {
    const target = e.target as HTMLElement;
    const draggable = target.closest("[data-custom-drag]");
    if (!draggable) return; // реагируем только на нужный атрибут
  } else if (e instanceof DragEvent && e.buttons === 0) return; // помогает убрать лишние вызовы

  startPoint.x = e.clientX;
  startPoint.y = e.clientY;

  dragController?.abort();

  const controller = new AbortController();
  dragController = controller;
  const { signal } = controller;

  // для pointer
  document.addEventListener("pointermove", onMove, { signal });
  document.addEventListener("pointerup", removeOnMove, { signal });
  // для drag
  document.addEventListener("dragover", onMove, { signal });
  document.addEventListener("dragend", removeOnMove, { signal });
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
  containerMap.set(container.element, container);

  if (containerMap.size === 1) {
    attachListeners();
  }
}

function unregisterContainer(container: ScrollContainer) {
  containerMap.delete(container.element);

  if (containerMap.size === 0) {
    detachListeners();
  }
}

function getContainers() {
  return containerMap;
}

export { registerContainer, unregisterContainer, getContainers };

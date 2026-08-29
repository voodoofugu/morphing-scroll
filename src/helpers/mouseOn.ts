import type { Tasks } from "./createTasks";
import CONST from "../constants";

/**
 * The cursor lock — one style tag per document, which is why the counter here
 * really is a shared one. It counts holders: while at least one scroll is
 * dragging its content, the style has to stay. The first instance to let go
 * used to strip the style from all the others, and unmounting mid-drag left
 * `cursor: grabbing !important` on the page forever.
 */
const CURSOR_LOCK_ID = "ms-cursor-lock";
let cursorLocks = 0;

const isTouched = () =>
  typeof window !== "undefined"
    ? (window.matchMedia?.("(pointer: coarse)").matches ?? false)
    : false;

const lockCursor = () => {
  if (cursorLocks++ > 0) return;
  if (document.getElementById(CURSOR_LOCK_ID)) return;

  const style = document.createElement("style");
  style.id = CURSOR_LOCK_ID;
  // устанавливаем курсор и блокируем выделение текста
  style.textContent = `
      * {
        cursor: grabbing !important;
        user-select: none;
      }
    `;
  document.head.appendChild(style);
};

const unlockCursor = () => {
  if (cursorLocks === 0) return;
  if (--cursorLocks > 0) return;

  document.getElementById(CURSOR_LOCK_ID)?.remove();
};

type CursorHolder = { cursorLocked: boolean };

// функция смены курсора
const mouseOnEl = (
  el: HTMLElement | null,
  mode: "start" | "end",
  holder: CursorHolder,
) => {
  if (!el) return;

  if (mode === "start") {
    if (!isTouched() && !holder.cursorLocked) {
      lockCursor();
      holder.cursorLocked = true;
    }

    el.style.cursor = "grabbing";
    el.classList.add("ms-grabbing"); // что бы был контроль на phones
  } else {
    if (holder.cursorLocked) {
      unlockCursor();
      holder.cursorLocked = false;
    }

    el.style.cursor = "grab";
    el.classList.remove("ms-grabbing"); // что бы был контроль на phones
  }
};

type HoverHandlerT = {
  el: HTMLElement | HTMLElement[];
  event: PointerEvent | MouseEvent;
  tasks: Tasks;
  isScrolling?: React.MutableRefObject<boolean>;
};

/*
 * Библиотека сообщает состояние, а оформляет его пользователь: раньше здесь
 * жёстко выставлялся `opacity`, то есть за пользователя решали, каким
 * свойством показывать бегунок. Переменная открывает и transform, и scale,
 * и что угодно ещё.
 */
const setBarVisibility = (scrollBar: HTMLElement, visible: boolean) =>
  scrollBar.style.setProperty(CONST.BAR_VISIBILITY_VAR, visible ? "1" : "0");

const removeHover = (scrollBar: HTMLElement, tasks: Tasks) => {
  const dir = scrollBar.getAttribute(CONST.BAR_AXIS_ATR); // важно для cancelTask различать scrolls

  setBarVisibility(scrollBar, false);
  scrollBar.classList.remove("ms-hover");
  scrollBar.classList.add("ms-leave");

  tasks.cancelTask(`remove${dir}`);
  tasks.setTask(
    () => scrollBar.classList.remove("ms-leave"),
    200,
    `remove${dir}`,
  );
};

const addHover = (scrollBar: HTMLElement, tasks: Tasks) => {
  const dir = scrollBar.getAttribute(CONST.BAR_AXIS_ATR);

  tasks.cancelTask(`remove${dir}`);

  setBarVisibility(scrollBar, true);
  scrollBar.classList.remove("ms-leave");
  scrollBar.classList.add("ms-hover");
};

// функция видимости для бегунка при hover
const hoverHandler = ({ el, event, tasks, isScrolling }: HoverHandlerT) => {
  const logic = (el: HTMLElement) => {
    // - исчезновение -
    if (
      ["mouseleave", "mouseup", "pointerup", "pointercancel"].includes(
        event.type,
      )
    ) {
      el.removeAttribute("ms-manual-hover"); // обязательно выполняем

      // проверка для отмены если анимация прокрутки ещё продолжается
      if (isScrolling?.current) return;

      removeHover(el, tasks);
      return;
    }

    // - появление -
    el.setAttribute("ms-manual-hover", ""); // для removeHover в MorphScroll (надо добавлять тут а не в addHover)
    addHover(el, tasks);
  };

  if (Array.isArray(el)) {
    el.forEach((el) => logic(el));
  } else logic(el);
};

export { mouseOnEl, hoverHandler, removeHover, addHover, unlockCursor };
export type { CursorHolder };

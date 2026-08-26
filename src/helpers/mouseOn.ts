import type { Tasks } from "./createTasks";
import CONST from "../constants";

/**
 * Курсорный «замок» — один тег стиля на документ, поэтому счётчик здесь
 * действительно общий. Считаем захваты: пока хотя бы один скролл тащит
 * контент, стиль обязан жить. Раньше первый отпустивший инстанс снимал
 * стиль у всех остальных, а размонтирование посреди драга оставляло
 * `cursor: grabbing !important` на странице навсегда.
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
  const dir = scrollBar.getAttribute("data-direction"); // важно для cancelTask различать scrolls

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
  const dir = scrollBar.getAttribute("data-direction");

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

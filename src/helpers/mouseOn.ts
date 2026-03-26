import { setTask, cancelTask } from "./taskManager";

// функция смены курсора
const mouseOnEl = (el: HTMLElement | null, content: "start" | "end") => {
  if (!el) return;
  const isTouched = window.matchMedia("(pointer: coarse)").matches;

  if (content === "start") {
    if (!isTouched) {
      let style = document.getElementById("ms-cursor-lock");

      // лучше создать тег стиля для курсора
      if (!style) {
        style = document.createElement("style");
        style.id = "ms-cursor-lock";
        style.textContent = `
      * {
        cursor: grabbing !important;
      }
    `;
        document.head.appendChild(style);
      }
    }

    el.style.cursor = "grabbing";
    el.classList.add("active"); // что бы был контроль на phones
  } else {
    if (!isTouched) {
      const style = document.getElementById("ms-cursor-lock");
      if (style) style.remove();
    }

    el.style.cursor = "grab";
    el.classList.remove("active"); // что бы был контроль на phones
  }
};

type HoverHandlerT = {
  el: HTMLElement | HTMLElement[];
  event: PointerEvent | MouseEvent;
  isScrolling?: React.MutableRefObject<boolean>;
};

const removeHover = (scrollbar: HTMLElement) => {
  if (scrollbar.hasAttribute("data-mouse-hover")) return;

  const dir = scrollbar.getAttribute("ms-direction"); // важно для cancelTask различать scrolls

  scrollbar.style.opacity = "0";
  scrollbar.classList.remove("ms-hover");
  scrollbar.classList.add("ms-leave");

  cancelTask(`remove${dir}`);
  setTask(() => scrollbar.classList.remove("ms-leave"), 200, `remove${dir}`);
};

const addHover = (scrollbar: HTMLElement) => {
  scrollbar.style.opacity = "1";
  scrollbar.classList.add("ms-hover");
};

// функция видимости для бегунка при hover
const hoverHandler = ({ el, event, isScrolling }: HoverHandlerT) => {
  const logic = (el: HTMLElement) => {
    // - исчезновение -
    if (
      ["mouseleave", "mouseup", "pointerup", "pointercancel"].includes(
        event.type,
      )
    ) {
      // if (event.type === "mouseleave") el.removeAttribute("data-mouse-hover"); // скрытия/появления при прокрутки

      // проверка для отмены если анимация прокрутки ещё продолжается
      if (isScrolling?.current) return;

      removeHover(el);
      return;
    }

    // - появление -
    // if (event.type === "mouseenter") el.setAttribute("data-mouse-hover", ""); // скрытия/появления при прокрутки
    addHover(el);
  };

  if (Array.isArray(el)) {
    el.map((el) => logic(el));
  } else logic(el);
};

export { mouseOnEl, hoverHandler, removeHover, addHover };

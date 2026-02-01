import { setTask, cancelTask } from "../helpers/taskManager";

// функция смены курсора
const mouseOnEl = (el: HTMLElement | null, mode: "start" | "end") => {
  if (!el) return;
  const isTouched = window.matchMedia("(pointer: coarse)").matches;

  if (mode === "start") {
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
  el: HTMLDivElement | null;
  event?: PointerEvent | MouseEvent;
  isScrolling?: React.MutableRefObject<boolean>;
};

const removeLOgic = (scrollBar: HTMLElement) => {
  const direction = scrollBar.getAttribute("data-direction"); // важно для cancelTask различать scrolls

  scrollBar.style.opacity = "0";
  scrollBar.classList.remove("hover");
  scrollBar.classList.add("leave");

  cancelTask(`removeLOgic${direction}`);
  setTask(
    () => scrollBar.classList.remove("leave"),
    200,
    `removeLOgic${direction}`,
  );
};

// функция видимости для бегунка при hover
const hoverHandler = ({ el, event, isScrolling }: HoverHandlerT) => {
  if (!el) return;

  const childs = el.querySelectorAll(".ms-bar");

  // отмена для removeOnly
  if (!event) {
    childs.forEach((child) => {
      removeLOgic(child as HTMLElement);
    });
    return;
  }

  // forEach потому-что scrollBar может быть не один
  childs.forEach((child) => {
    const scrollBar = child as HTMLElement;

    // - исчезновение -
    if (
      ["mouseleave", "mouseup", "pointerup", "pointercancel"].includes(
        event.type,
      )
    ) {
      if (event.type === "mouseleave")
        // логика для скрытия/появления при прокрутки
        scrollBar.removeAttribute("data-mouse-hover");

      // проверка для отмены если анимация прокрутки ещё продолжается
      if (isScrolling?.current) return;

      removeLOgic(scrollBar);
      return;
    }

    // - появление -
    if (event.type === "mouseenter")
      // логика для скрытия/появления при прокрутки
      scrollBar.setAttribute("data-mouse-hover", "");
    cancelTask("checkLoop");
    scrollBar.style.opacity = "1";
    scrollBar.classList.add("hover");
  });
};

export { mouseOnEl, hoverHandler };

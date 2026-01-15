import { setTask } from "../helpers/taskManager";

// функция смены курсора
const mouseOnEl = (el: HTMLElement | null) => {
  if (!el) return;
  const isTouched = window.matchMedia("(pointer: coarse)").matches;

  if (el.style.cursor === "grab") {
    if (!isTouched) {
      // лучше создать тег стиля для курсора
      const style = document.createElement("style");
      style.id = "ms-cursor-lock";
      style.innerHTML = `* {
        cursor: grabbing !important;
      }`;
      document.head.appendChild(style);
    }

    el.style.cursor = "grabbing";
    el.classList.add("active"); // что бы был контроль на phones
  } else if (el.style.cursor === "grabbing") {
    if (!isTouched) {
      const style = document.getElementById("ms-cursor-lock");
      if (style) style.remove();
    }

    el.style.cursor = "grab";
    el.classList.remove("active"); // что бы был контроль на phones
  }
};

// функция видимости для бегунка при hover
const mouseOnRef = (
  el: HTMLDivElement | null,
  childClass: string,
  event: PointerEvent | MouseEvent
) => {
  if (!el) return;
  const childs = el.querySelectorAll(`.${childClass}`);

  childs.forEach((child) => {
    const scrollBar = child as HTMLElement;

    if (["mouseleave", "pointerup", "pointercancel"].includes(event.type)) {
      scrollBar.style.opacity = "0";
      scrollBar.classList.remove("hover");
      scrollBar.classList.add("leave");

      setTask(() => scrollBar.classList.remove("leave"), 200);
    } else {
      scrollBar.style.opacity = "1";
      scrollBar.classList.add("hover");
    }
  });
};

export { mouseOnEl, mouseOnRef };

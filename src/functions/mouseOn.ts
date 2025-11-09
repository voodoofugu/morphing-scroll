import { setManagedTask } from "../helpers/taskManager";

// функция смены курсора
const mouseOnEl = (
  el: HTMLDivElement | null,
  eventType: "mousedown" | "touchstart"
) => {
  if (!el) return;

  if (el.style.cursor === "grab") {
    if (eventType === "mousedown") {
      // document.body.style.cursor = "grabbing";

      // лучше создать стиль для курсора
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
    if (eventType === "mousedown") {
      // document.body.style.removeProperty("cursor");

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
  event:
    | React.MouseEvent<HTMLDivElement>
    | React.TouchEvent<HTMLDivElement>
    | MouseEvent
    | TouchEvent
) => {
  if (!el) return;
  const childs = el.querySelectorAll(`.${childClass}`);

  childs.forEach((child, i) => {
    const target = child as HTMLElement;

    if (["mouseleave", "mouseup", "touchend"].includes(event.type)) {
      target.style.opacity = "0";
      target.classList.remove("hover");
      target.classList.add("leave");

      setManagedTask(() => target.classList.remove("leave"), 200);
    } else {
      target.style.opacity = "1";
      target.classList.add("hover");
    }
  });
};

export { mouseOnEl, mouseOnRef };

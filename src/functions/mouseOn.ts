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

// функция видимости для бегунка при hover
const mouseOnRef = (
  el: HTMLDivElement | null,
  childClass: string,
  event: PointerEvent | MouseEvent,
  isScrolling?: React.MutableRefObject<boolean>, // через Ref ну такое, но работает
) => {
  if (!el) return;
  const childs = el.querySelectorAll(`.${childClass}`);

  childs.forEach((child) => {
    const scrollBar = child as HTMLElement;

    if (
      ["mouseleave", "mouseup", "pointerup", "pointercancel"].includes(
        event.type,
      )
    ) {
      const removeLOgic = () => {
        scrollBar.style.opacity = "0";
        scrollBar.classList.remove("hover");
        scrollBar.classList.add("leave");

        cancelTask("removeLOgic");
        setTask(() => scrollBar.classList.remove("leave"), 200, "removeLOgic");
      };

      // проверка для отмены если анимация прокрутки ещё продолжается
      if (isScrolling?.current) {
        // петля для проверки не закончилась ли анимация скроллинга
        let loopCounter = 0; // для защиты
        const checkLoop = () => {
          const cancel = () => {
            removeLOgic();
            cancelTask("checkLoop");
          };

          if (loopCounter > 100) {
            cancel();
            return;
          }

          loopCounter += 1;

          if (!isScrolling.current) {
            cancel();
            return;
          }

          setTask(() => checkLoop(), 200, "checkLoop");
        };

        cancelTask("checkLoop");
        checkLoop();
        return;
      }

      removeLOgic();
    } else {
      cancelTask("checkLoop");
      scrollBar.style.opacity = "1";
      scrollBar.classList.add("hover");
    }
  });
};

export { mouseOnEl, mouseOnRef };

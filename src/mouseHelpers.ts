// функция смены курсора
const mouseOnEl = (el: HTMLDivElement | null) => {
  if (!el) return;

  if (el.style.cursor === "grab") {
    el.style.cursor = "grabbing";
    el.classList.add("active"); // что бы был контроль на мобилках
  } else if (el.style.cursor === "grabbing") {
    el.style.cursor = "grab";
    el.classList.remove("active"); // что бы был контроль на мобилках
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

  childs.forEach((child) => {
    const target = child as HTMLElement;

    if (["mouseleave", "mouseup", "touchend"].includes(event.type)) {
      target.style.opacity = "0";
    } else {
      target.style.opacity = "1";
    }
  });
};

export { mouseOnEl, mouseOnRef };

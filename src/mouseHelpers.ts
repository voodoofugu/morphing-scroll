// функция смены курсора
const mouseOnEl = (el: HTMLDivElement | null) => {
  if (el) {
    if (el.style.cursor === "grab") {
      el.style.cursor = "grabbing";
    } else if (el.style.cursor === "grabbing") {
      el.style.cursor = "grab";
    }
  }
};

// функция видимости для бегунка при hover
const mouseOnRef = (
  el: HTMLDivElement | null,
  childClass: string,
  event: MouseEvent | React.MouseEvent
) => {
  if (!el) return;
  const childs = el.querySelectorAll(`.${childClass}`);

  childs.forEach((child) => {
    const target = child as HTMLElement;
    target.style.opacity =
      event.type === "mouseleave" || event.type === "mouseup" ? "0" : "1";
  });
};

export { mouseOnEl, mouseOnRef };

// функция смены курсора
const mouseOnEl = (
  elOrEls: HTMLDivElement | NodeListOf<Element> | null,
  type: "down" | "up"
) => {
  if (!elOrEls) return;

  const elements: HTMLElement[] =
    elOrEls instanceof NodeList
      ? Array.from(elOrEls).filter(
          (el): el is HTMLElement => el instanceof HTMLElement
        )
      : [elOrEls];

  elements.forEach((el) => {
    if (type === "down") {
      el.style.cursor = "grabbing";
    } else if (el.style.cursor === "grabbing") {
      el.style.cursor = "grab";
    }
  });
};

// функция видимости для бегунка при hover
const mouseOnRef = (
  el: HTMLDivElement | null,
  childClass: string,
  event: MouseEvent | React.MouseEvent
) => {
  if (!el) return;

  const child = el.querySelector(`.${childClass}`) as HTMLDivElement;
  if (child) {
    child.style.opacity =
      event.type === "mouseleave" || event.type === "mouseup" ? "0" : "1";
  }
};

export { mouseOnEl, mouseOnRef };

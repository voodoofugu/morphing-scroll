const mouseOnEl = (el: HTMLDivElement | null, type: "down" | "up") => {
  if (el) {
    if (type === "down") {
      el.style.cursor = "grabbing";
    } else {
      if (el && el.style.cursor === "grabbing") {
        el.style.cursor = "grab";
      }
    }
  }
};

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

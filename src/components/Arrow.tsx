import React from "react";
import { handleArrowT } from "../helpers/handleArrow";

type ArrowT = {
  visibility: boolean;
  arrows: { size: number; element?: React.ReactNode };
  arrowType: handleArrowT["arrowType"];
  handleArrow: (arrowType: handleArrowT["arrowType"]) => void;
};

/*
 * Слот и ориентация разведены.
 *
 * `.ms-arrow-box` — только место: полоса вдоль своей стороны, без единой
 * трансформации, поэтому её положение предсказуемо и стилизуется напрямую.
 * Отсчитывается от корня скролла — у того стоит `position: relative`, так что
 * промежуточная обёртка не нужна.
 * `.ms-arrow` внутри — только разворот, чтобы одна переданная иконка работала
 * на всех четырёх сторонах и не приходилось готовить четыре.
 *
 * Каноничное направление иконки — вправо.
 */
const ORIENTATION: Record<handleArrowT["arrowType"], string | undefined> = {
  right: undefined,
  left: "scaleX(-1)",
  bottom: "rotate(90deg)",
  top: "rotate(-90deg)",
};

const Arrow = ({ visibility, arrows, arrowType, handleArrow }: ArrowT) => {
  // - refs -
  const arrowRef = React.useRef<HTMLDivElement | null>(null);

  const isHorizontal = arrowType === "left" || arrowType === "right";

  /*
   * Класс вешаем на тупик, а не на возможность: так `ms-arrow-box` можно
   * оформить один раз, а недоступное состояние дописать. В круге тупика не
   * бывает: там всегда есть куда ехать, и стрелка не гаснет сама собой.
   */
  const isDisabled = !visibility;

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    [arrowType]: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    // у тупика нечего нажимать — курсор не обещаем
    ...(isDisabled ? {} : { cursor: "pointer" }),

    ...(isHorizontal
      ? { top: 0, height: "100%", width: `${arrows.size}px` }
      : { left: 0, width: "100%", height: `${arrows.size}px` }),
  };

  /*
   * Обёртка нужна только под разворот: `.ms-arrow-box` — кликабельная полоса
   * во всю сторону, и повернуть её нельзя, не выкинув с места. Размеры здесь
   * не задаём — обёртка сжимается по иконке, её величину решает сам элемент.
   */
  const arrowStyle: React.CSSProperties = {
    display: "flex",
    transform: ORIENTATION[arrowType],
  };

  // - effects -
  React.useEffect(() => {
    const el = arrowRef.current;
    if (!el) return;

    const handlerClick = () => handleArrow(arrowType);

    el.addEventListener("click", handlerClick);

    return () => {
      el.removeEventListener("click", handlerClick);
    };
  }, [handleArrow, arrowType]);

  // - render -
  return (
    <div
      className={`ms-arrow-box ms-${arrowType}${isDisabled ? " ms-disabled" : ""}`}
      ref={arrowRef}
      style={boxStyle}
    >
      <div className="ms-arrow" style={arrowStyle}>
        {arrows.element}
      </div>
    </div>
  );
};

Arrow.displayName = "Arrow";
export default React.memo(Arrow);

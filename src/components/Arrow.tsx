import React from "react";
import { handleArrowT } from "../helpers/handleArrow";

type ArrowT = {
  visibility: boolean;
  arrows: { size: number; element?: React.ReactNode; loop?: boolean };
  arrowType: handleArrowT["arrowType"];
  handleArrow: (arrowType: handleArrowT["arrowType"]) => void;
};

/*
 * Слот и ориентация разведены.
 *
 * `.ms-arrow-box` — только место: полоса вдоль своей стороны, без единой
 * трансформации, поэтому её положение предсказуемо и стилизуется напрямую.
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

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    [arrowType]: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    pointerEvents: "auto", // родитель их не принимает

    ...(isHorizontal
      ? { top: 0, height: "100%", width: `${arrows.size}px` }
      : { left: 0, width: "100%", height: `${arrows.size}px` }),
  };

  const arrowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: `${arrows.size}px`,
    height: `${arrows.size}px`,
    transform: ORIENTATION[arrowType],
  };

  /*
   * Класс вешаем на тупик, а не на возможность: так `ms-arrow-box` можно
   * оформить один раз, а недоступное состояние дописать. При `loop` тупиков
   * нет — стрелка всегда перекидывает на другой край.
   */
  const isDisabled = !visibility && !arrows.loop;

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

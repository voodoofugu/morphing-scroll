import React from "react";
import { handleArrowT } from "../helpers/handleArrow";

type ArrowT = {
  visibility: boolean;
  arrows: { size: number; element?: React.ReactNode; loop?: boolean };
  arrowType: handleArrowT["arrowType"];
  handleArrow: (arrowType: handleArrowT["arrowType"]) => void;
  size: number;
};

const Arrow = ({
  visibility,
  arrows,
  arrowType,
  handleArrow,
  size,
}: ArrowT) => {
  // - refs -
  const arrowRef = React.useRef<HTMLDivElement | null>(null);

  // - constants -
  const arrowsStyle: React.CSSProperties = {
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    width: `${arrows.size}px`,

    ...(arrowType ? { [arrowType]: 0 } : {}),

    ...(arrowType === "top" && {
      transform: "rotate(-90deg) translateX(-100%)",
      transformOrigin: "left top",
    }),

    ...(arrowType === "bottom" && {
      transform: "rotate(90deg) translateX(-100%)",
      transformOrigin: "left bottom",
    }),

    ...(arrowType === "left" && {
      transform: "scaleX(-1)",
    }),

    ...(["top", "bottom"].includes(arrowType)
      ? {
          height: `${size}px`,
        }
      : {
          height: "100%",
          top: 0,
        }),
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

  /*
   * Класс вешаем на тупик, а не на возможность: так `ms-arrow-box` можно
   * оформить один раз, а недоступное состояние дописать. При `loop` тупиков
   * нет — стрелка всегда перекидывает на другой край.
   */
  const isDisabled = !visibility && !arrows.loop;

  // - render -
  return (
    <div
      className={`ms-arrow-box ${arrowType}${isDisabled ? " ms-disabled" : ""}`}
      ref={arrowRef}
      style={arrowsStyle}
    >
      {arrows.element}
    </div>
  );
};

Arrow.displayName = "Arrow";
export default React.memo(Arrow);

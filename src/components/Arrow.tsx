import React from "react";
import { handleArrowT } from "../helpers/handleArrow";

type ArrowT = {
  visibility: boolean;
  arrows: { size: number; element?: React.ReactNode };
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

  // - render -
  return (
    <div
      className={`ms-arrow-box ${arrowType}${visibility ? " active" : ""}`}
      ref={arrowRef}
      style={arrowsStyle}
    >
      {arrows.element}
    </div>
  );
};

Arrow.displayName = "Arrow";
export default React.memo(Arrow);

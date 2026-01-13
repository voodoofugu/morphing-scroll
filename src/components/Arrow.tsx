import React from "react";
import { handleArrowT } from "../functions/handleArrow";

type ArrowT = {
  activity: boolean;
  arrows: { size: number; element?: React.ReactNode };
  arrowType: handleArrowT["arrowType"];
  handleArrow: (arrowType: handleArrowT["arrowType"]) => void;
  size: number;
};

const Arrow = ({ activity, arrows, arrowType, handleArrow, size }: ArrowT) => {
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

  return (
    <div
      className={`ms-arrow-box ${arrowType}${activity ? " active" : ""}`}
      style={{
        ...arrowsStyle,
      }}
      onClick={() => handleArrow(arrowType)}
      // onPointerUp={}
    >
      {arrows.element}
    </div>
  );
};

Arrow.displayName = "Arrow";
export default React.memo(Arrow);

import React from "react";
import { MorphScrollT } from "./types";
import { handleArrowT } from "./handleArrow";

type ArrowT = {
  activity: boolean;
  arrows: { size: number; element?: React.ReactNode };
  arrowType: handleArrowT["arrowType"];
  handleArrow: (arrowType: handleArrowT["arrowType"]) => void;
};

const Arrow = ({ activity, arrows, arrowType, handleArrow }: ArrowT) => {
  const arrowsStyle: React.CSSProperties = {
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    width: `${arrows.size}px`,
    height: "100%",

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
      top: 0,
      transform: "scaleX(-1)",
    }),

    ...(arrowType === "right" && {
      top: 0,
    }),
  };

  return (
    <div
      className={`arrowBox ${arrowType}${activity ? " active" : ""}`}
      style={{
        ...arrowsStyle,
      }}
      onClick={() => handleArrow(arrowType)}
    >
      {arrows.element}
    </div>
  );
};

export default React.memo(Arrow);

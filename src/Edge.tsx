import React from "react";
import { MorphScrollT } from "./types";

type EdgeT = {
  direction: MorphScrollT["direction"];
  edgeGradient: MorphScrollT["edgeGradient"];
  visibility: boolean;
  edgeType: "left" | "right" | "top" | "bottom";
};

const Edge = ({ direction, edgeGradient, visibility, edgeType }: EdgeT) => {
  if (!edgeGradient) return null;

  const edgeGradientDefault = { color: null, size: 40 };
  const edgeGradientLocal =
    typeof edgeGradient === "object"
      ? { ...edgeGradientDefault, ...edgeGradient }
      : edgeGradientDefault;

  const edgeStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    transition: "opacity 0.1s ease-in-out",

    ...(edgeGradientLocal.color && {
      background:
        edgeGradientLocal.color &&
        `linear-gradient(${
          edgeType === "right" || edgeType === "left" ? "90deg, " : ""
        }${edgeGradientLocal.color}, transparent)`,
    }),

    ...(edgeType === "right" || edgeType === "left"
      ? {
          height: "100%",
          width: `${edgeGradientLocal.size}px`,
          top: 0,
        }
      : {
          width: "100%",
          height: `${edgeGradientLocal.size}px`,
          left: 0,
        }),

    ...(edgeType ? { [edgeType]: 0 } : {}),

    // scale second edge
    ...(edgeType === "right"
      ? {
          transform: "scaleX(-1)",
        }
      : edgeType === "bottom"
      ? { transform: "scaleY(-1)" }
      : {}),
  };

  return (
    <div
      className={`edge${edgeType ? ` ${edgeType}` : ""}`}
      style={{
        ...edgeStyle,
        opacity: visibility ? 1 : 0,
      }}
    ></div>
  );
};

export default React.memo(Edge);

import React from "react";

type EdgeT = {
  edgeGradient: {
    color: string | null;
    size: number;
  };
  visibility: boolean;
  edgeType: "left" | "right" | "top" | "bottom";
};

const Edge = ({ edgeGradient, visibility, edgeType }: EdgeT) => {
  if (!edgeGradient) return null;

  const edgeStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    transition: "opacity 0.1s ease-in-out",

    ...(edgeGradient.color && {
      background:
        edgeGradient.color &&
        `linear-gradient(${
          edgeType === "right" || edgeType === "left" ? "270deg, " : ""
        }${edgeGradient.color}, transparent)`,
    }),

    ...(edgeType === "right" || edgeType === "left"
      ? {
          height: "100%",
          width: `${edgeGradient.size}px`,
          top: 0,
        }
      : {
          width: "100%",
          height: `${edgeGradient.size}px`,
          left: 0,
        }),

    ...(edgeType ? { [edgeType]: 0 } : {}),

    // scale second ms-edge
    ...(edgeType === "left"
      ? {
          transform: "scaleX(-1)",
        }
      : edgeType === "bottom"
      ? { transform: "scaleY(-1)" }
      : {}),
  };

  return (
    <div
      className={`ms-edge${edgeType ? ` ${edgeType}` : ""}`}
      style={{
        ...edgeStyle,
        opacity: visibility ? 1 : 0,
      }}
    ></div>
  );
};

Edge.displayName = "Edge";
export default React.memo(Edge);

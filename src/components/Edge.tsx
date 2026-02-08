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
    [edgeType]: 0,
    pointerEvents: "none",
    transition: "opacity 0.2s ease-in-out",

    ...(edgeGradient.color && {
      background:
        edgeGradient.color &&
        `linear-gradient(${
          ["left", "right"].includes(edgeType) ? "270deg, " : ""
        }${edgeGradient.color}, transparent)`,
    }),
    // TODO заменить
    // ...(edgeGradient.color && {
    //   background:
    //     edgeGradient.color &&
    //     `linear-gradient(${
    //       edgeType === "top"
    //         ? ""
    //         : edgeType === "right"
    //           ? "270deg, "
    //           : edgeType === "bottom"
    //             ? "360deg, "
    //             : edgeType === "left"
    //               ? "90deg, "
    //               : ""
    //     }${edgeGradient.color}, transparent)`,
    // }),

    ...(["left", "right"].includes(edgeType)
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

    // TODO удалить
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

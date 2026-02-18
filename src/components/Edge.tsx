import React from "react";

type EdgeT = {
  edgeGradient: {
    color: string | null;
    size: number;
  };
  visibility: boolean;
  edgeType: "left" | "right" | "top" | "bottom";
  size: number[];
};

const Edge = ({ edgeGradient, visibility, edgeType, size }: EdgeT) => {
  const edgeStyle: React.CSSProperties = {
    position: "absolute",
    [edgeType]: 0,
    pointerEvents: "none",
    transition: "opacity 0.2s ease-in-out",

    ["--edge-visibility" as any]: visibility ? 1 : 0,
    opacity: "var(--edge-visibility)",

    ...(edgeGradient.color && {
      background:
        edgeGradient.color &&
        `linear-gradient(${
          ["left", "right"].includes(edgeType) ? "270deg, " : ""
        }${edgeGradient.color}, transparent)`,
    }),

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

    ...(edgeType === "left"
      ? {
          transform: "scaleX(-1)",
        }
      : edgeType === "bottom"
        ? { transform: "scaleY(-1)" }
        : {}),
  };

  // - styles -
  // const edgeStyle: React.CSSProperties = {
  //   position: "absolute",
  //   [edgeType]: 0,
  //   height: `${edgeGradient.size}px`,
  //   pointerEvents: "none",
  //   transition: "opacity 0.2s ease-in-out",

  //   ["--edge-visibility" as any]: visibility ? 1 : 0,
  //   opacity: "var(--edge-visibility)",

  //   ...(edgeGradient.color && {
  //     background:
  //       edgeGradient.color &&
  //       `linear-gradient(${edgeGradient.color}, transparent)`,
  //   }),

  //   ...(["left", "right"].includes(edgeType)
  //     ? {
  //         width: size[1],
  //         transform: "rotate(90deg) scaleY(-1)",
  //         transformOrigin: "left top",
  //         top: 0,
  //       }
  //     : {
  //         width: size[0],
  //       }),

  //   ...(edgeType === "right"
  //     ? {
  //         transform: "rotate(90deg) scaleX(-1)",
  //         transformOrigin: "right top",
  //       }
  //     : edgeType === "bottom"
  //       ? { transform: "scaleY(-1)" }
  //       : {}),
  // };

  // - classes -
  const edgeClasses = `ms-edge ${edgeType}${!visibility ? " ms-disabled" : ""}`;

  // - render -
  return <div className={edgeClasses} style={edgeStyle}></div>;
};

Edge.displayName = "Edge";
export default React.memo(Edge);

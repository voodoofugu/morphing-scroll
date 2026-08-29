import React from "react";

import CONST from "../constants";

type EdgeT = {
  /** custom node rendered inside the edge slot */
  element?: React.ReactNode;
  visibility: boolean;
  edgeType: "left" | "right" | "top" | "bottom";
};

/*
 * Край — это слот и сигнал, а не готовый градиент.
 *
 * Раньше здесь собирался linear-gradient из цвета и размера, то есть
 * библиотека решала за пользователя, чем именно обозначается обрезанный
 * контент. Теперь она размечает место и сообщает состояние переменной
 * `--ms-edge-visibility`, а как это выглядит — дело CSS или переданного узла.
 */
const Edge = ({ element, visibility, edgeType }: EdgeT) => {
  const isHorizontal = edgeType === "left" || edgeType === "right";

  const edgeStyle: React.CSSProperties = {
    position: "absolute",
    [edgeType]: 0,
    pointerEvents: "none",

    // тянем поперёк, вдоль размер задаёт CSS или сам узел
    ...(isHorizontal ? { top: 0, height: "100%" } : { left: 0, width: "100%" }),

    [CONST.EDGE_VISIBILITY_VAR]: visibility ? 1 : 0,
  };

  /*
   * Отражение живёт на внутреннем элементе, а не на слоте: слот отвечает за
   * положение и размер, и трансформация на нём дралась бы с пользовательским
   * CSS. Смысл отражения прежний — один градиент обслуживает обе стороны оси,
   * чтобы не готовить четыре.
   */
  const innerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    ...(edgeType === "left" && { transform: "scaleX(-1)" }),
    ...(edgeType === "bottom" && { transform: "scaleY(-1)" }),
  };

  const edgeClasses = `ms-edge ms-${edgeType}${!visibility ? " ms-disabled" : ""}`;

  return (
    <div className={edgeClasses} style={edgeStyle}>
      <div className="ms-edge-inner" style={innerStyle}>
        {element}
      </div>
    </div>
  );
};

Edge.displayName = "Edge";
export default React.memo(Edge);

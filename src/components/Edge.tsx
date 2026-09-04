import React from "react";

import CONST from "../constants";

type EdgeT = {
  /** custom node rendered inside the edge slot */
  element?: React.ReactNode;
  /** thickness of the `.ms-edge` strip; without it CSS decides */
  size?: number;
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
const Edge = ({ element, size, visibility, edgeType }: EdgeT) => {
  const isHorizontal = edgeType === "left" || edgeType === "right";

  const edgeStyle: React.CSSProperties = {
    position: "absolute",
    [edgeType]: 0,
    pointerEvents: "none",

    // тянем поперёк, вдоль — либо названный размер, либо CSS пользователя
    ...(isHorizontal
      ? { top: 0, height: "100%", ...(size && { width: `${size}px` }) }
      : { left: 0, width: "100%", ...(size && { height: `${size}px` }) }),

    /*
     * Внутренний узел меряется слотом, а не собой: боковой стороне он нужен
     * повёрнутым, а значит с обменянными сторонами — высоту слота в ширину и
     * наоборот. Отсюда единицы контейнера, отсюда и объявление.
     */
    containerType: "size",

    [CONST.EDGE_VISIBILITY_VAR]: visibility ? 1 : 0,
  };

  /*
   * Узел пишется один раз — так, как он выглядит сверху, — а по остальным
   * сторонам его разворачивает библиотека. Тот же уговор, что у стрелок: одну
   * иконку рисуют смотрящей вправо, а не рисуют четыре.
   *
   * Сверху разворачивать нечего, снизу хватает полуоборота. Боковым нужен
   * четвертной, и вот там мало повернуть: полоса слота узкая и высокая, а узел
   * до поворота — широкий и низкий. Поэтому стороны ему выдаём обменянными,
   * а поворот делаем вокруг угла и доводим сдвигом на собственную сторону —
   * так повёрнутый узел ложится ровно в слот.
   */
  const innerStyle: React.CSSProperties = isHorizontal
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100cqh",
        height: "100cqw",
        transformOrigin: "0 0",
        transform:
          edgeType === "right"
            ? "rotate(90deg) translateY(-100%)"
            : "rotate(270deg) translateX(-100%)",
      }
    : {
        width: "100%",
        height: "100%",
        ...(edgeType === "bottom" && { transform: "rotate(180deg)" }),
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

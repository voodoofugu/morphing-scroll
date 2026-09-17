import React from "react";

import { ResizeTracker } from "@morphing-scroll/src";

/** какую долю ширины занимает остриё — на этом держится форма */
const TIP_RATIO = 0.5;

/** чтобы в пути не было хвостов из дробей */
const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Бегунок, нарисованный одним контуром.
 *
 * Высоту бегунку задаёт библиотека, ширину — оформление полосы, поэтому
 * форму строим по измеренной коробке: `viewBox` совпадает с ней пиксель в
 * пиксель, и остриё не растягивается ни при какой длине. Горизонтальную
 * полосу библиотека разворачивает целиком, так что второй фигуры не нужно.
 */
function ScrollThumb() {
  const [box, setBox] = React.useState({ width: 0, height: 0 });

  const onResize = React.useCallback((rect: Partial<DOMRectReadOnly>) => {
    const width = round(rect.width ?? 0);
    const height = round(rect.height ?? 0);

    setBox((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { height, width },
    );
  }, []);

  const { height, width } = box;
  // бегунок короче двух остриёв сложился бы сам в себя
  const tip = round(Math.min(width * TIP_RATIO, height / 2));
  const middle = round(width / 2);

  return (
    <span aria-hidden="true" className="scroll-thumb">
      <ResizeTracker
        className="scroll-thumb-frame"
        measure="outer"
        onResize={onResize}
      >
        {width > 0 && height > 0 && (
          <svg
            className="scroll-thumb-shape"
            focusable="false"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            <path
              d={`M${middle} 0 ${width} ${tip}V${round(height - tip)}L${middle} ${height} 0 ${round(height - tip)}V${tip}Z`}
              fill="currentColor"
            />
          </svg>
        )}
      </ResizeTracker>
    </span>
  );
}

export default ScrollThumb;

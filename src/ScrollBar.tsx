import React from "react";
import { MorphScrollT } from "./types";

type ModifiedProps = Partial<MorphScrollT> & {
  sizeHeight: number;
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
  thumbSize: number;
  topThumb: number;
  sizeLocalToObjectsWrapperXY: (max?: boolean) => number;
  id: string;
};

const ScrollBar = ({
  type,
  direction,
  progressReverse,
  sizeHeight,
  progressTrigger,
  progressVisibility,
  onMouseDown,
  thumbSize,
  topThumb,
  sizeLocalToObjectsWrapperXY,
  id,
}: ModifiedProps) => {
  return (
    <React.Fragment>
      {type !== "slider" ? (
        <div
          className="scrollBar"
          style={{
            position: "absolute",
            width: "fit-content",
            ...(direction === "x"
              ? {
                  transformOrigin: "left top",
                  height: `${sizeHeight}px`,
                  ...(progressReverse
                    ? {
                        top: 0,
                        transform: "rotate(-90deg) translateX(-100%)",
                      }
                    : { transform: "rotate(-90deg)" }),
                }
              : {
                  top: 0,
                  height: "100%",
                  ...(progressReverse ? { left: 0 } : { right: 0 }),
                }),
            ...(!progressTrigger?.progressElement !== false && {
              pointerEvents: "none",
            }),
            ...(progressVisibility === "hover" && {
              opacity: 0,
              transition: "opacity 0.1s ease-in-out",
            }),
          }}
        >
          <div
            className={`scrollBarThumb ${id}`}
            onMouseDown={onMouseDown}
            style={{
              height: `${thumbSize}px`,
              willChange: "transform", // свойство убирает артефакты во время анимации
              transform: `translateY(${topThumb}px)`,
              ...(progressTrigger?.progressElement && {
                cursor: "grab",
              }),
            }}
          >
            {progressTrigger?.progressElement}
          </div>
        </div>
      ) : (
        <div
          className={`sliderBar ${id}`}
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            ...(progressReverse ? { left: 0 } : { right: 0 }),
            ...(!progressTrigger?.progressElement && {
              pointerEvents: "none",
            }),
            ...(progressVisibility === "hover" && {
              opacity: 0,
              transition: "opacity 0.1s ease-in-out",
            }),
          }}
          onMouseDown={onMouseDown}
        >
          {Array.from(
            { length: sizeLocalToObjectsWrapperXY() || 0 },
            (_, index) => (
              <div
                key={index}
                className="sliderElem"
                style={{ width: "fit-content" }}
              >
                {progressTrigger?.progressElement}
              </div>
            )
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default ScrollBar;

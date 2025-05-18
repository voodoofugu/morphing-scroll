/* eslint-disable react/no-unknown-property */
import React from "react";
import { MorphScrollT } from "../types/types";

type ModifiedProps = Partial<MorphScrollT> & {
  sizeHeight: number;
  onMouseDownOrTouchStart:
    | React.MouseEventHandler<HTMLDivElement>
    | React.TouchEventHandler<HTMLDivElement>;
  thumbSize: number;
  thumbSpace: number;
  objLengthPerSize: number;
};

const ScrollBar = ({
  type,
  direction,
  progressReverse,
  sizeHeight,
  progressTrigger,
  progressVisibility,
  onMouseDownOrTouchStart,
  thumbSize,
  thumbSpace,
  objLengthPerSize,
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
            className="scrollBarThumb"
            direction-type={
              ["hybridY", "y"].includes(direction!) ? "y" : direction
            }
            onMouseDown={
              onMouseDownOrTouchStart as React.MouseEventHandler<HTMLDivElement>
            }
            onTouchStart={
              onMouseDownOrTouchStart as React.TouchEventHandler<HTMLDivElement>
            }
            style={{
              height: `${thumbSize}px`,
              willChange: "transform", // свойство убирает артефакты во время анимации
              transform: `translateY(${thumbSpace}px)`,
              ...(progressTrigger?.progressElement && {
                cursor: "grab",
              }),
            }}
          >
            {progressTrigger?.progressElement}
          </div>
        </div>
      ) : (
        objLengthPerSize > 1 && (
          <div
            className="sliderBar"
            direction-type={
              ["hybridY", "y"].includes(direction!) ? "y" : direction
            }
            onMouseDown={
              onMouseDownOrTouchStart as React.MouseEventHandler<HTMLDivElement>
            }
            onTouchStart={
              onMouseDownOrTouchStart as React.TouchEventHandler<HTMLDivElement>
            }
            style={{
              position: "absolute",
              cursor: "grab",
              ...(!progressTrigger?.progressElement && {
                pointerEvents: "none",
              }),
              ...(progressVisibility === "hover" && {
                opacity: 0,
                transition: "opacity 0.1s ease-in-out",
              }),
              ...(direction === "x"
                ? {
                    transformOrigin: "left top",
                    left: "50%",
                    ...(progressReverse
                      ? {
                          transform: "rotate(-90deg) translate(-100%, -50%)",
                          ...(progressReverse ? { top: 0 } : { bottom: 0 }),
                        }
                      : {
                          transform: "rotate(-90deg) translateY(-50%)",
                        }),
                  }
                : {
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(progressReverse ? { left: 0 } : { right: 0 }),
                  }),
            }}
          >
            {Array.from({ length: objLengthPerSize }, (_, index) => (
              <div
                key={index}
                className="sliderElem"
                style={{ width: "fit-content" }}
              >
                {progressTrigger?.progressElement}
              </div>
            ))}
          </div>
        )
      )}
    </React.Fragment>
  );
};

export default React.memo(ScrollBar);

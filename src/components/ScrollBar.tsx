/* eslint-disable react/no-unknown-property */
import React from "react";
import { MorphScrollT } from "../types/types";

type OnCustomScrollFn = (
  targetScrollTop: number,
  direction: "y" | "x",
  duration: number,
  callback?: () => void
) => void;

type ModifiedProps = Partial<MorphScrollT> & {
  size: number[];
  scrollBarEvent:
    | React.MouseEventHandler<HTMLDivElement>
    | React.TouchEventHandler<HTMLDivElement>
    | OnCustomScrollFn;
  thumbSize: number;
  thumbSpace: number;
  objLengthPerSize: number;
  sliderCheckLocal: () => void;
  duration: number;
};

const ScrollBar = ({
  type,
  direction,
  progressReverse,
  size,
  progressTrigger,
  scrollBarOnHover,
  scrollBarEvent,
  thumbSize,
  thumbSpace,
  objLengthPerSize,
  sliderCheckLocal,
  duration,
}: ModifiedProps) => {
  const eventProps =
    type !== "sliderMenu"
      ? {
          onMouseDown:
            scrollBarEvent as React.MouseEventHandler<HTMLDivElement>,
          onTouchStart:
            scrollBarEvent as React.TouchEventHandler<HTMLDivElement>,
        }
      : {};

  const sliderContent = React.useMemo(() => {
    if (type === "scroll" || !direction) return;

    const axis = ["hybrid", "y"].includes(direction) ? "y" : "x";
    const neededSize = axis === "x" ? size[0] : size[1];

    return Array.from({ length: objLengthPerSize }, (_, index) => (
      <div
        key={index}
        className="sliderElem"
        style={{
          ...(type === "sliderMenu" && {
            cursor: "pointer",
          }),
        }}
        onClick={
          type === "sliderMenu"
            ? () => {
                (scrollBarEvent as OnCustomScrollFn)(
                  neededSize * index,
                  axis,
                  duration,
                  sliderCheckLocal
                );
              }
            : undefined
        }
      >
        {Array.isArray(progressTrigger?.progressElement)
          ? progressTrigger.progressElement[index]
          : progressTrigger?.progressElement}
      </div>
    ));
  }, [
    objLengthPerSize,
    direction,
    size,
    type,
    scrollBarEvent,
    progressTrigger?.progressElement,
  ]);

  return (
    <React.Fragment>
      {type === "scroll" ? (
        <div
          className="ms-bar"
          style={{
            position: "absolute",
            width: "fit-content",
            ...(direction === "x"
              ? {
                  transformOrigin: "left top",
                  height: `${size[0]}px`,
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
            ...(scrollBarOnHover && {
              opacity: 0,
              transition: "opacity 0.1s ease-in-out",
            }),
          }}
        >
          <div
            className="ms-thumb"
            data-direction={
              ["hybrid", "y"].includes(direction!) ? "y" : direction
            }
            {...eventProps}
            style={{
              height: `${thumbSize}px`,
              willChange: "transform, height", // свойство убирает артефакты во время анимации
              transform: `translateY(${thumbSpace}px)`,
              ...(progressTrigger?.progressElement && {
                cursor: "grab",
              }),
              transition: "height 0.05s ease-in-out", // небольшая анимация для плавности при resize
            }}
          >
            {progressTrigger?.progressElement}
          </div>
        </div>
      ) : (
        objLengthPerSize > 1 &&
        progressTrigger?.progressElement && (
          <div
            className="ms-slider"
            data-direction={
              ["hybrid", "y"].includes(direction!) ? "y" : direction
            }
            {...eventProps}
            style={{
              position: "absolute",
              display: "flex",
              ...(type === "slider" && {
                cursor: "grab",
              }),
              ...(scrollBarOnHover && {
                opacity: 0,
                transition: "opacity 0.1s ease-in-out",
              }),
              ...(direction === "x"
                ? {
                    transformOrigin: "left top",
                    left: "50%",
                    transform: "translateX(-50%)",
                    ...(progressReverse ? { top: 0 } : { bottom: 0 }),
                  }
                : {
                    flexDirection: "column",
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(progressReverse ? { left: 0 } : { right: 0 }),
                  }),
            }}
          >
            {sliderContent}
          </div>
        )
      )}
    </React.Fragment>
  );
};

ScrollBar.displayName = "ScrollBar";
export default React.memo(ScrollBar);

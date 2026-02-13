import React from "react";
import { MorphScrollT } from "../types/types";

import handleWheel, { ScrollStateRefT } from "../helpers/handleWheel";

type OnCustomScrollFn = (
  targetScrollTop: number,
  direction: "y" | "x",
  duration: number,
  callback?: () => void,
) => void;

type ModifiedProps = Partial<MorphScrollT> & {
  size: number[];
  scrollBarEvent: ((event: PointerEvent) => void) | OnCustomScrollFn;
  thumbSize: number;
  thumbSpace: number;
  objLengthPerSize: number;
  sliderCheckLocal: () => void;
  duration: number;
  isTouched: boolean;
  scrollStateRef: React.RefObject<ScrollStateRefT>;
  scrollEl: React.RefObject<HTMLDivElement | null>;
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
  isTouched,
  scrollStateRef,
  scrollEl,
}: ModifiedProps) => {
  // - refs -
  const scrollBarRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);

  // - vars -
  const sliderContent = React.useMemo(() => {
    if (type === "scroll" || !direction) return;

    const axis = ["hybrid", "y"].includes(direction) ? "y" : "x";
    const neededSize = axis === "x" ? size[0] : size[1];

    return Array.from({ length: objLengthPerSize }, (_, index) => (
      <div
        key={index}
        className="ms-slider-element"
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
                  sliderCheckLocal,
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
    duration,
    sliderCheckLocal,
  ]);

  const dataDirection = React.useMemo(() => {
    return ["hybrid", "y"].includes(direction!) ? "y" : "x";
  }, [direction]);

  // - effects -
  React.useEffect(() => {
    // добавление прокрутки по колесом по thumb
    if (isTouched || !progressTrigger?.wheel) return; // при touch устроиствах прокрутку не используем

    const el = scrollBarRef.current;
    if (!el) return;

    let prev = el.previousElementSibling as HTMLElement | null;
    while (prev && !prev.classList.contains("ms-element")) {
      prev = prev.previousElementSibling as HTMLElement | null;
    }

    const onWheel = (e: WheelEvent) => {
      handleWheel(e, scrollEl.current!, scrollStateRef.current, dataDirection);
    };

    el.addEventListener("wheel", onWheel);
    return () => el.removeEventListener("wheel", onWheel);
  }, [dataDirection]);

  React.useEffect(() => {
    const el = thumbRef.current;
    if (!el || type === "sliderMenu") return;

    const handleStart = (e: PointerEvent) => {
      (scrollBarEvent as (e: PointerEvent) => void)(e);
    };

    el.addEventListener("pointerdown", handleStart);

    return () => {
      el.removeEventListener("pointerdown", handleStart);
    };
  }, [scrollBarEvent]);

  const commonStyles: React.CSSProperties = {
    position: "absolute",
    ...(scrollBarOnHover && {
      opacity: 0,
      transition: "opacity 0.2s ease-in-out",
    }),
  };

  const axisSize = dataDirection === "x" ? size[0] : size[1];

  const thumbFlex =
    type !== "scroll"
      ? ""
      : thumbSize + thumbSpace * 2 > axisSize
        ? "flex-end"
        : "flex-start";

  // - render -
  const content = (
    <React.Fragment>
      {type === "scroll" ? (
        <div
          className={`ms-bar ms-${dataDirection}`}
          ref={scrollBarRef}
          data-direction={dataDirection} // доп логика
          style={{
            ...commonStyles,
            width: "fit-content",
            height: `${axisSize}px`,
            ...(direction === "x"
              ? {
                  transformOrigin: "left top",
                  left: "50%",
                  ...(progressReverse
                    ? {
                        top: 0,
                        transform: "rotate(-90deg) translate(-100%, -50%)",
                      }
                    : { transform: "rotate(-90deg) translateY(-50%)" }),
                }
              : {
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...(progressReverse ? { left: 0 } : { right: 0 }),
                }),
          }}
        >
          <div
            className="ms-thumb"
            ref={thumbRef}
            style={{
              height: `${thumbSize}px`,
              // willChange: "transform, height", // свойство убирает артефакты во время анимации
              transform: `translateY(${thumbSpace}px)`,
              ...(progressTrigger?.progressElement && {
                cursor: "grab",
              }),
              // стили помогающие выровнять thumb что бы он не вылетал за края (если добавлена анимация)
              display: "flex",
              alignItems: thumbFlex,
            }}
          >
            {progressTrigger?.progressElement}
          </div>
        </div>
      ) : (
        objLengthPerSize > 1 &&
        progressTrigger?.progressElement && (
          <div
            className={`ms-slider ms-${dataDirection}`}
            ref={thumbRef}
            data-direction={dataDirection} // доп логика
            style={{
              ...commonStyles,
              display: "flex",
              ...(type === "slider" && {
                cursor: "grab",
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

  return content;
};

ScrollBar.displayName = "ScrollBar";
export default React.memo(ScrollBar);

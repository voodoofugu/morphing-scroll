import React from "react";
import { MorphScrollT } from "../types/types";

import handleWheel, { ScrollStateRefT } from "../helpers/handleWheel";

type OnCustomScrollFn = (
  targetScrollTop: number,
  direction: "y" | "x",
  duration: number,
  callback?: () => void,
) => void;

type ModifiedProps = Pick<
  MorphScrollT,
  "type" | "progressReverse" | "scrollBarOnHover" // выбираю нужное
> & {
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
  scrollBarsRef: React.RefObject<Set<HTMLElement>>;
  triggerUpdate: () => void;
  overscroll: React.MutableRefObject<{
    x: number;
    y: number;
  }>;
  direction: "x" | "y" | "hybrid";
  progressTrigger: [MorphScrollT["progressTrigger"], number];
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
  scrollBarsRef,
  triggerUpdate,
  overscroll,
}: ModifiedProps) => {
  // - refs -
  const scrollBarRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);

  // - vars -
  const axis = ["hybrid", "y"].includes(direction!) ? "y" : "x";
  const dampeningOverscroll =
    Math.abs(overscroll.current[axis]) * (thumbSize / 200);
  const thumbSizeLocal = thumbSize - dampeningOverscroll;
  const thumbSpaceLocal =
    overscroll.current[axis] < 0
      ? thumbSpace + dampeningOverscroll
      : thumbSpace;

  // высчитываем элементы заранее
  const sliderContent = React.useMemo(() => {
    if (type === "scroll") return;

    const neededSize = size[axis === "x" ? 0 : 1];

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
        {Array.isArray(progressTrigger[0].progressElement)
          ? progressTrigger[0].progressElement[index]
          : progressTrigger[0].progressElement}
      </div>
    ));
  }, [
    objLengthPerSize,
    type,
    progressTrigger[1], // только для memo
    duration,
    sliderCheckLocal,
    size[0],
    size[1],
    scrollBarEvent,
  ]);

  const dataDirection = React.useMemo(() => {
    return direction !== "x" ? "y" : "x";
  }, [direction]);

  const axisSize = size[dataDirection === "x" ? 0 : 1];

  // для позиционирования пользовательского бегунка (стабилизирует анимацию на height)
  const thumbFlex =
    type !== "scroll"
      ? ""
      : thumbSize + thumbSpace * 2 > axisSize
        ? "flex-end"
        : "flex-start";

  // - effects -
  React.useEffect(() => {
    // добавление прокрутки по колесом по thumb
    if (isTouched || !progressTrigger[0].wheel) return; // при touch устроиствах прокрутку не используем

    const el = scrollBarRef.current;
    if (!el) return;

    let prev = el.previousElementSibling as HTMLElement | null;
    while (prev && !prev.classList.contains("ms-element"))
      prev = prev.previousElementSibling as HTMLElement | null;

    const onWheel = (e: WheelEvent) =>
      handleWheel(e, scrollEl.current!, scrollStateRef.current!, dataDirection);

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [dataDirection]);

  React.useEffect(() => {
    // добавление клика на scrollBar или thumb
    const el = type === "slider" ? scrollBarRef.current : thumbRef.current;
    if (!el || type === "sliderMenu") return;

    const handleStart = (e: PointerEvent) =>
      (scrollBarEvent as (e: PointerEvent) => void)(e);

    el.addEventListener("pointerdown", handleStart);

    return () => el.removeEventListener("pointerdown", handleStart);
  }, [scrollBarEvent, type]);

  React.useEffect(() => {
    // добавление элементов в ref
    const el = scrollBarRef.current;
    if (!el) return;

    scrollBarsRef.current!.add(el);
    triggerUpdate();

    return () => {
      scrollBarsRef.current!.delete(el);
    };
  }, [thumbSize]);

  const commonStyles: React.CSSProperties = {
    position: "absolute",
    ...(scrollBarOnHover && {
      opacity: 0,
      transition: "opacity 0.2s ease-in-out",
    }),
  };

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
              height: `${thumbSizeLocal}px`,
              // willChange: "transform, height", // свойство убирает артефакты во время анимации
              transform: `translateY(${thumbSpaceLocal}px)`,
              ...(progressTrigger[0].progressElement && {
                cursor: "grab",
              }),
              // стили помогающие выровнять thumb что бы он не вылетал за края (если добавлена анимация)
              display: "flex",
              alignItems: thumbFlex,
            }}
          >
            {progressTrigger[0].progressElement}
          </div>
        </div>
      ) : (
        objLengthPerSize > 1 && // что бы не показывать один бегунок при size: 1
        progressTrigger[0].progressElement && (
          <div
            className={`ms-slider ms-${dataDirection}`}
            ref={scrollBarRef}
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
export default ScrollBar;

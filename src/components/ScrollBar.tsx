import React from "react";
import type {
  MorphScroll,
  ProgressElementConfig,
  ProgressTriggerConfig,
  Vec2,
} from "../types/types";

import handleWheel, { ScrollStateRefT } from "../helpers/handleWheel";
import CONST from "../constants";

type OnCustomScrollFn = (
  targetScrollTop: number,
  direction: "y" | "x",
  duration: number,
  callback?: () => void,
) => void;

type ModifiedProps = Pick<
  MorphScroll,
  "mode" | "progressReverse" | "scrollBarOnHover" // выбираю нужное
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
  progressTrigger: [ProgressTriggerConfig, number];
  maxScrollSize: Vec2;
};

/*
 * `progressElement` принимает и голый узел, и объект с настройками — так же,
 * как `arrows`. Разбираем один раз.
 */
const isElementConfig = (
  value: ProgressTriggerConfig["progressElement"],
): value is ProgressElementConfig =>
  !!value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !React.isValidElement(value) &&
  "element" in value;

const readProgressElement = (value: ProgressTriggerConfig["progressElement"]) =>
  isElementConfig(value)
    ? { element: value.element, edgeGap: value.edgeGap }
    : {
        element: value as React.ReactNode | React.ReactNode[],
        edgeGap: undefined as ProgressElementConfig["edgeGap"],
      };

const ScrollBar = ({
  mode,
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
  maxScrollSize,
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

  const { element: progressElement, edgeGap } = React.useMemo(
    () => readProgressElement(progressTrigger[0].progressElement),
    [progressTrigger[1]],
  );

  /** зазор до своей стороны: [для бара оси x, для бара оси y] */
  const edgeGapLocal = React.useMemo<[number, number]>(() => {
    if (typeof edgeGap === "number") return [edgeGap, edgeGap];
    if (Array.isArray(edgeGap))
      return [edgeGap[0] ?? 0, edgeGap[1] ?? edgeGap[0] ?? 0];

    return [0, 0];
  }, [edgeGap]);

  // высчитываем элементы заранее
  const sliderContent = React.useMemo(() => {
    if (mode === "scroll") return;

    const neededSize = size[axis === "x" ? 0 : 1];

    return Array.from({ length: objLengthPerSize }, (_, index) => (
      <div
        key={index}
        className="ms-slider-element"
        style={{
          ...(mode === "sliderMenu" && {
            cursor: "pointer",
          }),
        }}
        onClick={
          mode === "sliderMenu"
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
        {Array.isArray(progressElement)
          ? progressElement[index]
          : progressElement}
      </div>
    ));
  }, [
    objLengthPerSize,
    mode,
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
    mode !== "scroll"
      ? ""
      : thumbSize + thumbSpace * 2 > axisSize
        ? "flex-end"
        : "flex-start";

  /*
   * Диапазон прокрутки меняется вместе с контентом, а слушатель колеса
   * вешается один раз — держим актуальное значение в ref, иначе колесо над
   * баром считает по размеру, который был на момент монтирования.
   */
  const maxScrollSizeRef = React.useRef(maxScrollSize);
  maxScrollSizeRef.current = maxScrollSize;

  // - effects -
  React.useEffect(() => {
    // добавление прокрутки по колесом по thumb
    if (isTouched || !progressTrigger[0].wheel) return; // при touch устроиствах прокрутку не используем

    const el = scrollBarRef.current;
    const scrollElem = scrollEl.current;
    if (!el || !scrollElem) return;

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation(); // бар лежит внутри контента — колесо наружу не отдаём

      handleWheel(
        e,
        scrollElem,
        maxScrollSizeRef.current,
        scrollStateRef.current!,
        dataDirection,
      );
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [dataDirection, isTouched, progressTrigger[1]]);

  React.useEffect(() => {
    // добавление клика на scrollBar или thumb
    const el = mode === "slider" ? scrollBarRef.current : thumbRef.current;
    if (!el || mode === "sliderMenu") return;

    const handleStart = (e: PointerEvent) =>
      (scrollBarEvent as (e: PointerEvent) => void)(e);

    el.addEventListener("pointerdown", handleStart);

    return () => el.removeEventListener("pointerdown", handleStart);
  }, [scrollBarEvent, mode]);

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
    // стартовое состояние; дальше его двигают addHover/removeHover
    ...(scrollBarOnHover && { [CONST.BAR_VISIBILITY_VAR]: 0 }),
  };

  // - render -
  const content = (
    <React.Fragment>
      {mode === "scroll" ? (
        <div
          className={`ms-bar ms-${dataDirection}`}
          ref={scrollBarRef}
          data-direction={dataDirection} // доп логика
          style={{
            ...commonStyles,
            width: "fit-content",
            height: `${axisSize}px`,
            /*
             * `edgeGap` отодвигает бар от той стороны, на которой он стоит;
             * отрицательное значение уводит его за край. Раньше сторона
             * задавалась нулём, а у горизонтального бара — и вовсе не
             * задавалась, из-за чего он вставал куда придётся.
             */
            ...(direction === "x"
              ? {
                  transformOrigin: "left top",
                  left: "50%",
                  ...(progressReverse
                    ? {
                        top: `${edgeGapLocal[0]}px`,
                        transform: "rotate(-90deg) translate(-100%, -50%)",
                      }
                    : {
                        bottom: `${edgeGapLocal[0]}px`,
                        transform: "rotate(-90deg) translateY(-50%)",
                      }),
                }
              : {
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...(progressReverse
                    ? { left: `${edgeGapLocal[1]}px` }
                    : { right: `${edgeGapLocal[1]}px` }),
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
              ...(progressElement && {
                cursor: "grab",
              }),
              // стили помогающие выровнять thumb что бы он не вылетал за края (если добавлена анимация)
              display: "flex",
              alignItems: thumbFlex,
            }}
          >
            {progressElement}
          </div>
        </div>
      ) : (
        objLengthPerSize > 1 && // что бы не показывать один бегунок при size: 1
        progressElement && (
          <div
            className={`ms-slider ms-${dataDirection}`}
            ref={scrollBarRef}
            data-direction={dataDirection} // доп логика
            style={{
              ...commonStyles,
              display: "flex",
              ...(mode === "slider" && {
                cursor: "grab",
              }),
              ...(direction === "x"
                ? {
                    transformOrigin: "left top",
                    left: "50%",
                    transform: "translateX(-50%)",
                    ...(progressReverse
                      ? { top: `${edgeGapLocal[0]}px` }
                      : { bottom: `${edgeGapLocal[0]}px` }),
                  }
                : {
                    flexDirection: "column",
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(progressReverse
                      ? { left: `${edgeGapLocal[1]}px` }
                      : { right: `${edgeGapLocal[1]}px` }),
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

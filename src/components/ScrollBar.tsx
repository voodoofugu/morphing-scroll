import React from "react";
import type {
  MorphScroll,
  NavigateReason,
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

type ModifiedProps = Pick<MorphScroll, "mode"> & {
  /** the bar configuration, already parsed, for one axis */
  element: React.ReactNode | React.ReactNode[];
  reverse: boolean;
  edgeGap: number;
  showOnHover: boolean;
  size: number[];
  scrollBarEvent: ((event: PointerEvent) => void) | OnCustomScrollFn;
  thumbSize: number;
  thumbSpace: number;
  objLengthPerSize: number;
  sliderCheckLocal: () => void;
  /** mark that the next move was started by the bar, not by the content */
  markNavigate: (reason: NavigateReason) => void;
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

const ScrollBar = ({
  mode,
  direction,
  element: progressElement,
  reverse: progressReverse,
  edgeGap,
  showOnHover: scrollBarOnHover,
  size,
  progressTrigger,
  scrollBarEvent,
  thumbSize,
  thumbSpace,
  objLengthPerSize,
  sliderCheckLocal,
  markNavigate,
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

  // высчитываем элементы заранее
  const sliderContent = React.useMemo(() => {
    if (mode === "scroll") return;

    const neededSize = size[axis === "x" ? 0 : 1];

    return Array.from({ length: objLengthPerSize }, (_, index) => (
      <div
        key={index}
        className="ms-slider-item"
        style={{
          ...(mode === "sliderMenu" && {
            cursor: "pointer",
          }),
        }}
        onClick={
          mode === "sliderMenu"
            ? () => {
                markNavigate("bar");
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
    markNavigate,
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
      /*
       * stopPropagation молчит только для чужих слушателей, а прокрутку по
       * умолчанию браузер всё равно отдаёт ближайшему прокручиваемому предку:
       * колесо над баром двигало и содержимое скролла, и страницу под ним.
       */
      e.stopPropagation();
      e.preventDefault();

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

    const handleStart = (e: PointerEvent) => {
      // страницу перелистнёт снап после отпускания, но начал её бар
      if (mode === "slider") markNavigate("bar");
      (scrollBarEvent as (e: PointerEvent) => void)(e);
    };

    el.addEventListener("pointerdown", handleStart);

    return () => el.removeEventListener("pointerdown", handleStart);
  }, [scrollBarEvent, mode, markNavigate]);

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
          {...{ [CONST.BAR_AXIS_ATR]: dataDirection }} // доп логика
          style={{
            ...commonStyles,
            width: "fit-content",
            height: `${axisSize}px`,
            /*
             * `edgeGap` отодвигает бар от той стороны, на которой он стоит;
             * отрицательное значение уводит его за край.
             *
             * По оси x бар лежит боком: до поворота это высокий столбик длиной
             * во всю ширину скролла, и привязывать его к низу через `bottom`
             * нельзя — `bottom` считает по неповёрнутой высоте, то есть по
             * длине бара, и уносит его на эту длину вверх. После поворота
             * вокруг левого верхнего угла бар висит НАД точкой привязки, так
             * что якорем должен быть его нижний край.
             */
            ...(direction === "x"
              ? {
                  transformOrigin: "left top",
                  left: "50%",
                  ...(progressReverse
                    ? {
                        top: `${edgeGap}px`,
                        transform: "rotate(-90deg) translate(-100%, -50%)",
                      }
                    : {
                        top: `calc(100% - ${edgeGap}px)`,
                        transform: "rotate(-90deg) translateY(-50%)",
                      }),
                }
              : {
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...(progressReverse
                    ? { left: `${edgeGap}px` }
                    : { right: `${edgeGap}px` }),
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
            {...{ [CONST.BAR_AXIS_ATR]: dataDirection }} // доп логика
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
                      ? { top: `${edgeGap}px` }
                      : { bottom: `${edgeGap}px` }),
                  }
                : {
                    flexDirection: "column",
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(progressReverse
                      ? { left: `${edgeGap}px` }
                      : { right: `${edgeGap}px` }),
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

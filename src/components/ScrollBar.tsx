import React from "react";
import type {
  MorphScroll,
  NavigateReason,
  ControlsConfig,
  Vec2,
} from "../types/types";

import handleWheel, { ScrollStateRefT } from "../helpers/handleWheel";
import CONST from "../constants";

type ModifiedProps = Pick<MorphScroll, "mode"> & {
  /** the bar configuration, already parsed, for one axis */
  element: React.ReactNode | React.ReactNode[];
  reverse: boolean;
  edgeGap: number;
  showOnHover: boolean;
  size: number[];
  scrollBarEvent: (event: PointerEvent) => void;
  /** turn to that page of the bar — the step everything else counts with */
  goToPage: (index: number, axis: "x" | "y") => void;
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
  /** the page's own reading direction — a vertical bar sits on its start side */
  pageDirection: "ltr" | "rtl";
  controls: [ControlsConfig, number];
  maxScrollSize: Vec2;
};

const ScrollBar = ({
  mode,
  direction,
  pageDirection,
  element: progressElement,
  reverse,
  edgeGap,
  showOnHover: scrollBarOnHover,
  size,
  controls,
  scrollBarEvent,
  goToPage,
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

  /*
   * Вертикальный бегунок стоит там же, где у страницы начало строки: справа
   * при обычном чтении, слева при чтении справа налево. Это то же место, куда
   * его ставит браузер для своей прокрутки. `reverse` по-прежнему переносит
   * его на другую сторону — от той, на которой он оказался.
   */
  const progressReverse =
    axis === "y" && pageDirection === "rtl" ? !reverse : reverse;
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

    return Array.from({ length: objLengthPerSize }, (_, index) => (
      <div
        key={index}
        className="ms-slider-item"
        /*
         * Нажатие на точку ведёт к её странице в обоих режимах слайдера.
         * Точки выглядят нажимаемыми и в `"slider"` — так выглядит всякая
         * карусель, — а отвечали только в `"sliderMenu"`; в первом жест
         * доводился протаскиванием, и клик просто возвращал на место.
         *
         * Протаскиванию это не мешает: браузер шлёт `click` общему предку
         * точек начала и конца, так что пронос по нескольким точкам сюда не
         * попадает, а жест, оставшийся в пределах одной, — это и есть нажатие.
         */
        style={{ cursor: "pointer" }}
        onClick={() => goToPage(index, axis)}
      >
        {Array.isArray(progressElement)
          ? progressElement[index]
          : progressElement}
      </div>
    ));
  }, [
    objLengthPerSize,
    mode,
    controls[1], // только для memo
    axis,
    goToPage,
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
    if (isTouched || !controls[0].wheel) return; // при touch устроиствах прокрутку не используем

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
  }, [dataDirection, isTouched, controls[1]]);

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
          /*
           * Своей роли у `div` нет, и для скринридера кастомный бегунок был
           * просто безымянной коробкой. Долю пути считаем по ходу бегунка, а
           * не по позиции: дорожка короче содержимого ровно на его величину.
           *
           * `aria-controls` сюда не ставим: он требует идентификатора на окне
           * прокрутки, а тот пришлось бы либо печатать в разметке — и ловить
           * несовпадение при гидрации, счётчик инстансов на сервере свой, —
           * либо занимать пользовательский `id`. Ориентация и доля пути
           * читаются и без него.
           */
          role="scrollbar"
          aria-orientation={
            dataDirection === "x" ? "horizontal" : "vertical"
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={
            axisSize > thumbSize
              ? Math.round((thumbSpace / (axisSize - thumbSize)) * 100)
              : 0
          }
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

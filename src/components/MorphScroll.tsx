import React from "react";

import type {
  BarConfig,
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
  NavigateReason,
  ControlsConfig,
  Vec2,
  Pair,
} from "../types/types";
import argsFormatter from "../helpers/argsFormatter";
import resolveScrollTarget from "../helpers/resolveScrollTarget";
import createTasks from "../helpers/createTasks";
import createPointerRuntime from "../helpers/createPointerRuntime";

import useIdent from "../hooks/useIdent";
import useUpdate from "../hooks/useUpdate";
import useConst from "../hooks/useConst";

import ResizeTracker from "./ResizeTracker";
import ScrollBar from "./ScrollBar";
import Edge from "./Edge";
import Arrow from "./Arrow";

import handleWheel, { ScrollStateRefT } from "../helpers/handleWheel";
import focusStep from "../helpers/focusStep";
import handleMouseOrTouch from "../helpers/handleMouseOrTouch";
import {
  objectsPerSize,
  smoothScroll,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
  getStyleAlign,
  isTouchDevice,
} from "../helpers/addFunctions";
import handleArrow, { handleArrowT } from "../helpers/handleArrow";
import createSizeStore from "../helpers/createSizeStore";
import packObjects from "../helpers/packObjects";
import type { PackLayout } from "../helpers/packObjects";
import {
  updateLoadedElementsKeys,
  updateEmptyKeysClick,
} from "../helpers/updateKeys";
import {
  calculateThumbSize,
  calculateThumbSpace,
} from "../helpers/calculateThumbSize";
import { hoverHandler, removeHover, addHover } from "../helpers/mouseOn";

import createSchedulerRAF from "../helpers/createSchedulerRAF";
import filterValidChildren from "../helpers/filterValidChildren";
import childKey from "../helpers/childKey";
import pageAt from "../helpers/pageAt";
import stabilize from "../helpers/stabilize";
import {
  getRenderedKeysFromWrapper,
  areKeysEqual,
} from "../helpers/getRenderedKeysFromWrapper";
import {
  registerContainer,
  unregisterContainer,
} from "../helpers/autoScrollRegistry";

import CONST from "../constants";

/** the side a key points at — the same one the arrow buttons use */
const ARROW_KEYS: Record<string, handleArrowT["arrowType"] | undefined> = {
  ArrowUp: "top",
  ArrowDown: "bottom",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** inside a text field the arrows move the caret, and must not be taken */
const isTextEntry = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***MorphScroll***:
 * the main component of the library, responsible for displaying your data.
 * ### Props:
 * ##### — GENERAL —
 * - `className`
 * - `children`
 *
 * ##### — SCROLL —
 * - `mode`
 * - `direction`
 * - `initialPosition`
 * - `stickToEnd`
 * - `duration`
 * - `ref`
 * - `autoScrollOnDrag`
 *
 * ##### — LAYOUT —
 * - `size` - ***REQUIRED***
 * - `objects`
 * - `wrapper`
 *
 * ##### — PROGRESS —
 * - `controls`
 * - `edge`
 *
 * ##### — OPTIMIZATION —
 * - `render`
 * - `suspending`
 * - `fallback`
 *
 * ##### — EVENTS —
 * - `onScrollPosition`
 * - `onScrollingChange`
 * - `onNavigate`
 * - `onRenderedKeysChange`
 * ### Links:
 * [MorphScroll Documentation](https://www.npmjs.com/package/morphing-scroll)
 */
const MorphScroll = React.forwardRef<MorphScrollHandle, MorphScrollProps>(
  function MorphScroll(
    {
      // General Settings
      className,
      children,

      // Scroll Settings
      mode = "scroll",
      direction = "y",
      initialPosition,
      stickToEnd = false,
      duration = 200,

      onScrollPosition,
      onScrollingChange,
      onNavigate,
      onRenderedKeysChange,

      // Visual Settings
      size,
      objects,
      wrapper,
      edge,

      // Progress Bar
      controls = { wheel: true },

      // Optimization
      render,
      suspending = false,
      fallback,

      // Additional
      autoScrollOnDrag,
    },
    ref,
  ) {
    // ♦ hooks
    const triggerUpdate = useUpdate();
    /*
     * Всё про сами объекты живёт в одной группе — размер, зазор, сколько их в
     * ряду, выравнивание, направление и что делать с пустыми. Внутри компонента
     * это по-прежнему отдельные значения.
     */
    const {
      size: objectsSize,
      gap,
      crossCount,
      align: objectsAlign,
      direction: objectsDirection = "row",
      empty: emptyObjects,
    } = objects ?? {};

    // const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");
    const id = useIdent();

    // ♦ helpers
    /*
     * Рантайм инстанса. Планировщики раньше создавались прямо в теле рендера,
     * то есть заново на каждый рендер: дедупликация по ключу переставала
     * работать между рендерами, а cleanup гасил только последний экземпляр —
     * анимации прошлых рендеров продолжали писать в scrollTop параллельно
     * новым. useConst создаёт их один раз на инстанс.
     */
    const raf = useConst(createSchedulerRAF);
    const rafScrollAnim = useConst(createSchedulerRAF);
    const tasks = useConst(createTasks);
    const pointerRuntime = useConst(createPointerRuntime);

    const triggerRAF = () => raf.schedule("triggerUpdate", triggerUpdate); // по-кадрово оптимизированный triggerUpdate

    // ♦ errors
    const errorTextEnd = `\n  morph-scroll ${id}`;
    const errorText = (propName: string) =>
      `prop "${propName}" is not provided${errorTextEnd}`;

    if (!size) throw new Error(errorText("size"));

    /*
     * Виртуальная и ленивая отрисовка расставляют объекты по счёту, а считать
     * можно только известный размер. `"none"` говорит «размер решает CSS», а
     * не переданный размер значит ровно то же самое — просто молча, и раньше
     * предупреждение ловило только первый случай.
     */
    const sizeUnknown = (value: typeof objectsSize) =>
      value == null ||
      value === "none" ||
      (Array.isArray(value) && (value[0] === "none" || value[1] === "none"));

    if (render && sizeUnknown(objectsSize))
      console.error(
        `"render" needs a known objects.size: "none" and no size at all leave nothing to place${errorTextEnd}`,
      );

    const hasEach = Array.isArray(objectsSize)
      ? objectsSize.some((axis) => axis === "each")
      : objectsSize === "each";

    if (hasEach) {
      if (mode !== "scroll")
        console.error(
          `objects.size: "each" gives objects their own size, and pages need one size for all — "${mode}" cannot turn them${errorTextEnd}`,
        );

      /*
       * Линию надо обо что-то оборвать, а при `hybrid` едут обе стороны:
       * упереться не во что, кроме `crossCount`. Без него линия не кончается
       * никогда — все объекты уходят в одну.
       */
      if (direction === "hybrid" && !crossCount)
        console.error(
          `objects.size: "each" with direction="hybrid" needs objects.crossCount: both ways scroll, so nothing else says where a line ends${errorTextEnd}`,
        );
    }

    // ♦ refs
    const customScrollRef = React.useRef<HTMLDivElement | null>(null);
    const scrollContentRef = React.useRef<HTMLDivElement | null>(null);
    const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
    const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);

    const scrollBarsRef = React.useRef<Set<HTMLElement>>(new Set());

    const isTouchedRef = React.useRef<boolean>(isTouchDevice());
    const firstRender = React.useRef<boolean>(true);
    const clickedObject = React.useRef<"thumb" | "wrapp" | "slider" | null>(
      null,
    );
    // ключи объектов, которые когда либо были загружены
    const objectsKeys = React.useRef<{
      loaded: Set<string>;
      empty: Set<string> | null;
    }>({
      loaded: new Set(),
      empty: new Set(),
    });

    const scrollStateRef = React.useRef<ScrollStateRefT>({
      targetScrollY: 0,
      targetScrollX: 0,
      animating: false,
      animationFrameId: 0,
    });
    const isScrollingRef = React.useRef<boolean>(false);
    const keyDownX = React.useRef<boolean>(false);
    /*
     * Липнет ли скролл к концу. `scrollPosition: "end"` означает «держись
     * низа», но вырывать пользователя из середины истории нельзя — а понять,
     * ушёл ли он оттуда, можно только по положению.
     */
    const atEndRef = React.useRef({ x: true, y: true });
    const lastScrollTargetRef = React.useRef<{
      x: number | null;
      y: number | null;
    }>({
      x: null,
      y: null,
    });
    const overscrollRef = React.useRef({
      x: 0,
      y: 0,
    });
    const isDraggingRef = React.useRef(false);
    const lastRenderedKeysRef = React.useRef<string[] | null>(null);
    const onRenderedKeysChangeRef = React.useRef(onRenderedKeysChange); // для стабилизации функцию

    function useSizeRef() {
      return React.useRef<{ width: number; height: number }>({
        width: 0,
        height: 0,
      });
    }
    const receivedScrollSizeRef = useSizeRef();
    const receivedWrapSizeRef = useSizeRef();
    const receivedChildSizeRef = useSizeRef();

    // ♦ stabilize
    const [
      stickToEndST,
      initialPositionST,
      renderST,
      sizeST,
      objectsSizeST,
      emptyObjectsST,
      wrapperST,
      gapST,
      controlsST,
      objectsKeysEmptyST,
      edgeST,
    ] = stabilize(
      stickToEnd,
      initialPosition,
      render,
      size,
      objectsSize,
      emptyObjects,
      wrapper,
      gap,
      controls,
      objectsKeys.current.empty,
      edge,
    );

    /*
     * Короткая форма приводится к объектной один раз: дальше по компоненту
     * `controlsLocal` всегда объект, и ветвлений на строку/массив нет.
     */
    const controlsLocal = React.useMemo(() => {
      if (typeof controls === "string")
        return { [controls]: true };

      if (Array.isArray(controls))
        return Object.fromEntries(controls.map((name) => [name, true]));

      return controls;
    }, [controlsST]) as ControlsConfig;

    if (Object.keys(controlsLocal).length === 0)
      console.error(errorText("controls"));

    /*
     * Прилипание задаётся на обе оси разом или на каждую отдельно: при
     * `hybrid` бывает нужно держаться низа, но не правого края.
     */
    const stickLocal = React.useMemo<Pair<boolean>>(
      () =>
        Array.isArray(stickToEnd)
          ? [!!stickToEnd[0], !!stickToEnd[1]]
          : [!!stickToEnd, !!stickToEnd],
      [stickToEndST],
    );

    // ♦ default
    const initialTarget = React.useMemo(
      () => (initialPosition == null ? null : resolveScrollTarget(initialPosition)),
      [initialPositionST],
    );

    /*
     * Заглушку раньше можно было задать тремя способами — голым узлом,
     * словом "fallback" плюс общий проп, и `mode: { fallback }`, — и разбор
     * этих форм расползался лесенкой тернарников по всему компоненту.
     * Форма теперь одна, разбирается здесь.
     */
    const emptyObjectsLocal = React.useMemo(() => {
      if (!emptyObjects) return null;

      if (typeof emptyObjects === "string")
        return { mode: emptyObjects, fallback: undefined, clickTrigger: undefined };

      return {
        mode: emptyObjects.mode,
        fallback: emptyObjects.fallback,
        clickTrigger: emptyObjects.clickTrigger,
      };
    }, [emptyObjectsST]);

    // ♦ variables
    const defaultSize = 40;

    // `true` — просто разметить края, узел — отрисовать его внутри каждого
    const edgeElement = React.useMemo(
      () => (React.isValidElement(edge) ? edge : undefined),
      [edgeST],
    );

    /*
     * Всё про бегунок собрано в одном месте — как `arrows`. Наружу отдаём
     * готовые значения, что бы ScrollBar не разбирал форму повторно.
     */
    const barLocal = React.useMemo(() => {
      const bar = controlsLocal.bar;

      const isConfig =
        !!bar &&
        typeof bar === "object" &&
        !Array.isArray(bar) &&
        !React.isValidElement(bar) &&
        !("type" in bar);

      const config = (isConfig ? bar : {}) as BarConfig;
      const element = isConfig
        ? config.element
        : (bar as React.ReactNode | React.ReactNode[]);

      const pair = <T,>(value: T | T[] | undefined, fallback: T): [T, T] => {
        if (Array.isArray(value))
          return [value[0] ?? fallback, value[1] ?? value[0] ?? fallback];

        return [value ?? fallback, value ?? fallback];
      };

      const [gapX, gapY] = pair(config.trackGap, 0);

      return {
        element,
        /** whether there is anything to show at all */
        present: !!bar,
        /** `true` — the browser's own scrollbar does the work */
        native: bar === true,
        edgeGap: pair(config.edgeGap, 0),
        // трек укорачивается с обоих концов, отсюда удвоение
        trackGap: [gapX * 2, gapY * 2] as [number, number],
        reverse: pair(config.reverse, false),
        showOnHover: config.showOnHover ?? false,
        thumbMinSize: config.thumbMinSize ?? 30,
      };
    }, [controlsST]);

    /*
     * По умолчанию клавиша делает то, что в этом режиме вообще имеет смысл:
     * в слайдере листает страницу, в обычном скролле просто подвигает контент.
     */
    const keysLocal = React.useMemo(() => {
      const keys = controlsLocal.keys;
      if (!keys) return null;

      const config = typeof keys === "object" ? keys : {};

      return {
        mode: config.mode ?? (mode === "scroll" ? "pan" : "step"),
        step: config.step ?? 40,
      };
    }, [controlsST, mode]);

    const arrowsLocal = React.useMemo(() => {
      const arrows = controlsLocal.arrows;
      /*
       * Стрелки лежат поверх содержимого, пока не попросили обратного: место
       * под них забирается по просьбе, а не отменяется отказом.
       */
      const base = { size: defaultSize, reserveSpace: false, loop: false };

      if (React.isValidElement(arrows)) return { ...base, element: arrows };

      if (typeof arrows === "object" && arrows !== null)
        return { ...base, ...arrows };

      return base;
    }, [controlsST]);

    const childrenArray = React.useMemo(
      () =>
        React.Children.toArray(children).flatMap(
          filterValidChildren,
        ) as React.ReactElement[],
      [children],
    );

    const validChildrenKeys = React.useMemo(() => {
      return childrenArray
        .map((child) => {
          if (React.isValidElement(child) && child.key) {
            return childKey(String(child.key));
          }
          return null;
        })
        .filter((key): key is string => key !== null)
        .filter((key) =>
          emptyObjectsLocal?.mode === "clear"
            ? !objectsKeys.current.empty?.has(key)
            : true,
        );
    }, [children, emptyObjectsST, objectsKeysEmptyST]);

    const [mT, mR, mB, mL] = wrapper?.margin
      ? argsFormatter(wrapper.margin)
      : [0, 0, 0, 0];
    const mLocalY = mT + mB;
    const mLocalX = mL + mR;

    const gapLocal = React.useMemo(() => {
      if (typeof gap === "number") {
        return [gap, gap];
      }
      if (Array.isArray(gap)) {
        return [gap[1] ?? 0, gap[0] ?? 0];
      }
      return [0, 0];
    }, [gap]);

    /*
     * `gapLocal` лежит в порядке CSS: сначала между рядами, потом между
     * колонками. Помощники же считают по осям — первым x, вторым y. Пока
     * зазор один на обе стороны, разница не видна; заданный парой, он уезжал
     * не на ту ось: шаг страницы по x брал вертикальный зазор.
     */
    const gapXY = React.useMemo<Vec2>(
      () => [gapLocal[1], gapLocal[0]],
      [gapLocal[0], gapLocal[1]],
    );

    const renderLocal = React.useMemo(() => {
      const base = {
        mode: undefined as "lazy" | "virtual" | undefined,
        rootMargin: 0 as number | number[],
        stopLoadOnScroll: false,
        trackVisibility: false,
      };

      if (typeof render === "string") {
        return { ...base, mode: render };
      }

      if (typeof render === "object" && render !== null) {
        const {
          mode,
          rootMargin = base.rootMargin,
          stopLoadOnScroll = base.stopLoadOnScroll,
          trackVisibility = base.trackVisibility,
        } = render;
        return { mode, rootMargin, stopLoadOnScroll, trackVisibility };
      }

      return base;
    }, [renderST]);

    const mRootLocal = React.useMemo(() => {
      return argsFormatter(renderLocal.rootMargin);
    }, [renderLocal.rootMargin, direction]);

    const sizeLocal = React.useMemo(() => {
      const [x, y] = Array.isArray(size)
        ? size
        : typeof size === "number"
          ? [size, size]
          : [
              receivedScrollSizeRef.current.width,
              receivedScrollSizeRef.current.height,
            ];

      if (
        !controlsLocal.arrows ||
        !arrowsLocal.size ||
        !arrowsLocal.reserveSpace
      ) {
        return [x, y, x, y];
      }

      const arrowFullSize = arrowsLocal.size * 2;
      let recountX = x;
      let recountY = y;

      if (direction === "x") {
        recountX = x - arrowFullSize;
      } else if (direction === "y") {
        recountY = y - arrowFullSize;
      } else if (direction === "hybrid") {
        recountX = x - arrowFullSize;
        recountY = y - arrowFullSize;
      }

      return [recountX, recountY, x, y]; // [2, 3] is only for customScrollRef
    }, [
      sizeST,
      controlsST,
      direction,
      arrowsLocal,
      receivedScrollSizeRef.current.height,
      receivedScrollSizeRef.current.width,
    ]);
    const xySize = direction === "x" ? sizeLocal[0] : sizeLocal[1];

    const sizeMinusEdge = React.useMemo(() => {
      const x = sizeLocal[0] - barLocal.trackGap[0];
      const y = sizeLocal[1] - barLocal.trackGap[1];

      return [x, y];
    }, [barLocal.trackGap.join(), sizeLocal[0], sizeLocal[1]]);

    /*
     * Пустая ось в паре — это `"none"`: размер этой стороны решает CSS.
     * Написать её словом можно, а не написать нельзя — в паре нет пустого
     * места, — так что `[100, undefined]` из вычисленного значения обязан
     * значить то же, что `[100, "none"]`. Без этого он терял и заданную ось.
     */
    const objectsSizing = React.useMemo(
      () =>
        objectsSize
          ? !Array.isArray(objectsSize)
            ? argsFormatter(objectsSize, true, 2)
            : objectsSize.map((axis) => axis ?? "none")
          : [null, null],

      [objectsSizeST],
    );

    /*
     * `"each"` — размер знает только сам объект, и от того, какая сторона ему
     * отдана, зависит правило укладки:
     *
     * — вдоль прокрутки: колонок известное число, каждый уходит в самую
     *   короткую — кладка;
     * — поперёк: объекты идут друг за другом, пока линия не кончится — поток;
     * — обе стороны за объектом: каждый встаёт в самое высокое место, куда
     *   влезает — заполнение. Дырок не остаётся, но и порядок построчным быть
     *   перестаёт: это и есть смысл `["each", "each"]`.
     *
     * Названный `crossCount` заполнение отменяет: «по столько-то в строке» и
     * «куда влезет» — разные просьбы, и explicit важнее.
     *
     * `hybrid` не даёт объектам самим выбрать ось — обе прокручиваются, и
     * «какая сторона отдана» здесь не отвечает на вопрос. Отвечает
     * `objects.direction`: «row» (по умолчанию) — линии идут строками, счёт
     * ограничивает ширину; «column» — линии идут столбцами, счёт ограничивает
     * высоту. Заполнением `hybrid` не подменяем: заполнению нужна граница
     * поперёк, а взять её там неоткуда, кроме окна, — и упереть объекты в
     * окно значило бы, что вторая сторона больше никуда не едет.
     */
    const isHybrid = direction === "hybrid";
    const hybridColumn = isHybrid && objectsDirection === "column";
    const mainAxis = hybridColumn || direction === "x" ? 0 : 1;
    const crossAxis = mainAxis === 0 ? 1 : 0;

    const eachOnMain = objectsSizing[mainAxis] === "each";
    const eachOnCross = objectsSizing[crossAxis] === "each";
    const isEach = eachOnMain || eachOnCross;

    /*
     * `objects.direction` называет линию, вдоль которой идут объекты. При x/y
     * ось прокрутки уже занята, и выбор из этого остаётся ровно один: линии
     * вдоль неё — кладка, поперёк — поток. Не названо — как и раньше решает
     * сторона, отданная объектам.
     */
    const wantedLine =
      objects && "direction" in objects ? objects.direction : undefined;
    const alongScroll = mainAxis === 0 ? "row" : "column";
    const wantsMasonry = !isHybrid && wantedLine === alongScroll;
    const wantsFlow =
      !isHybrid && wantedLine !== undefined && wantedLine !== alongScroll;

    /*
     * Линии вдоль прокрутки — это колонки, а колонке нужна ширина. Когда и
     * эта сторона отдана объектам, ширины нет и раскладывать их не по чему:
     * просьбу не выполняем и не молчим об этом.
     */
    if (isEach && wantsMasonry && eachOnCross)
      console.error(
        `objects.direction: "${wantedLine}" runs the objects along the scroll, and lines along it are columns — objects.size hands the side across it over too, so there is no column width${errorTextEnd}`,
      );

    /*
     * При `hybrid` кладка тоже возможна — но только по названному счёту:
     * колонок ровно столько, сколько сказали, и дырок под низкими соседями
     * они не оставляют, чего поток по тому же счёту не умеет.
     */
    const eachLayout: PackLayout = isHybrid
      ? eachOnMain && !eachOnCross && crossCount
        ? "masonry"
        : "flow"
      : wantsFlow || (eachOnCross && !eachOnMain)
        ? "flow"
        : !eachOnCross && (wantsMasonry || eachOnMain)
          ? "masonry"
          : crossCount
            ? "flow"
            : "fill";

    const objectsSizeLocal = React.useMemo(() => {
      const { height, width } = receivedChildSizeRef.current;

      const getSize = (
        val: number | "none" | "firstChild" | "full" | "each" | null,
        receivedSize: number,
        sizeLocal: number,
      ) =>
        receivedSize
          ? receivedSize
          : typeof val === "number"
            ? val
            : val === "full"
              ? sizeLocal
              : 0;

      return [
        getSize(objectsSizing[0], width, sizeLocal[0]),
        getSize(objectsSizing[1], height, sizeLocal[1]),
      ];
    }, [
      objectsSizing.join(),
      direction,
      receivedChildSizeRef.current.width,
      receivedChildSizeRef.current.height,
      sizeLocal.join(),
    ]);

    /* размер ячейки ещё не измерен, а взять его больше неоткуда */
    const needsFirstChildMeasure =
      (objectsSizing[0] === "firstChild" ||
        objectsSizing[1] === "firstChild") &&
      !receivedChildSizeRef.current.width &&
      !receivedChildSizeRef.current.height;

    const fallbackLocal = React.useMemo(() => {
      // делаем заглушку что бы не удалять всё подряд при emptyObjects
      if (render && emptyObjectsLocal && !fallback)
        return <div className="ms-empty-object"></div>;

      return fallback;
    }, [!!fallback, renderST, emptyObjectsST]);

    // ♦ calculations
    const objectsPerDirection = React.useMemo(() => {
      // защита при неизвестных размерах, пока это лучшее решение
      if (objectsSizing[0] === "none" || objectsSizing[1] === "none")
        return [1, validChildrenKeys.length];

      const isX = direction === "x" ? 1 : 0;
      const isRow = objectsDirection === "row";

      const localObjSize = sizeLocal[isX];
      const objectSize = objectsSizeLocal[isX]
        ? objectsSizeLocal[isX] + gapLocal[isX]
        : 0;

      const neededMaxSize =
        direction === "hybrid" && localObjSize
          ? objectSize * validChildrenKeys.length
          : localObjSize;

      const objectsPerLine = objectSize
        ? Math.floor(neededMaxSize / objectSize)
        : 1;

      // устанавливаем crossCount если он есть и если он меньше objects
      let rowObjects =
        crossCount && crossCount <= objectsPerLine
          ? direction === "hybrid"
            ? Math.ceil(objectsPerLine / crossCount)
            : crossCount
          : objectsPerLine;

      const columnObjects =
        rowObjects > 1 && rowObjects < validChildrenKeys.length
          ? Math.ceil(validChildrenKeys.length / rowObjects)
          : rowObjects >= validChildrenKeys.length
            ? 1
            : validChildrenKeys.length;

      // !доп. фиксируем rowObjects при column (помогает избежать пустых мест)
      if (!isRow)
        rowObjects = Math.ceil(validChildrenKeys.length / columnObjects);

      const useCrossCount = crossCount && crossCount < validChildrenKeys.length;

      const validated = (val: number): number =>
        Number.isFinite(val) && val > 0 ? val : 1;

      if (direction === "hybrid") {
        const row = useCrossCount
          ? isRow
            ? crossCount
            : rowObjects
          : isRow
            ? validChildrenKeys.length
            : 1;

        const column = useCrossCount
          ? !isRow
            ? crossCount
            : rowObjects
          : !isRow
            ? validChildrenKeys.length
            : 1;

        return [validated(row), validated(column)];
      }

      return [validated(rowObjects), validated(columnObjects)];
    }, [
      objectsDirection,
      gapLocal[0],
      gapLocal[1],
      objectsSizeLocal[0],
      objectsSizeLocal[1],
      validChildrenKeys.length,
      direction,
      sizeLocal.join(),
      crossCount,
    ]);

    /*
     * Кладка. Колонок столько, сколько влезает по известной поперечной
     * стороне; если и она отдана объектам, число колонок задаёт `crossCount`,
     * а ширина колонки делится из окна.
     */
    const sizes = useConst(() => createSizeStore(() => triggerRAF()));
    React.useEffect(() => () => sizes.destroy(), [sizes]);


    /*
     * Место поперёк — окно за вычетом полей обёртки: объекты живут внутри
     * них, и мерить перенос по всему окну значит выпускать их за край.
     */
    const crossRoom = Math.max(
      0,
      sizeLocal[crossAxis] - (crossAxis === 0 ? mLocalX : mLocalY),
    );

    const eachColumns = React.useMemo(() => {
      if (!isEach) return 1;
      /*
       * Поток считает сам, если счёт не назвали: ноль для него — «сколько
       * влезет». Для `hybrid` влезет сколько угодно, поэтому там счёт нужен.
       */
      if (eachLayout === "flow") return crossCount ?? (isHybrid ? 1 : 0);

      const cell = objectsSizeLocal[crossAxis];
      const gapCross = gapLocal[crossAxis === 0 ? 1 : 0];

      if (!cell) return Math.max(1, crossCount ?? 1);

      /*
       * Кладке при `hybrid` колонок ровно столько, сколько назвали: по этой
       * стороне тоже прокрутка, и «сколько влезет в окно» там ничего не
       * ограничивает.
       */
      if (isHybrid) return Math.max(1, crossCount ?? 1);

      const fit = Math.max(
        1,
        Math.floor((crossRoom + gapCross) / (cell + gapCross)),
      );

      return crossCount ? Math.min(crossCount, fit) : fit;
    }, [
      isEach,
      eachLayout,
      isHybrid,
      objectsSizeLocal[crossAxis],
      gapLocal.join(),
      crossRoom,
      crossCount,
      crossAxis,
    ]);

    /** ширина колонки в кладке: своя, или поделённая из окна */
    const eachCell = React.useMemo(() => {
      if (!isEach || eachLayout !== "masonry") return 0;

      const known = objectsSizeLocal[crossAxis];
      if (known) return known;

      const gapCross = gapLocal[crossAxis === 0 ? 1 : 0];

      return Math.max(
        0,
        (crossRoom - gapCross * (eachColumns - 1)) / eachColumns,
      );
    }, [
      isEach,
      eachLayout,
      objectsSizeLocal[crossAxis],
      crossRoom,
      gapLocal.join(),
      eachColumns,
      crossAxis,
    ]);

    /*
     * Стороны, которые объекты себе не выбирают. Кладка ставит поперечную из
     * `eachCell` — она могла достаться делением окна, а не числом в пропе.
     */
    const eachFixed = React.useMemo<Vec2>(() => {
      const px = (axis: 0 | 1) =>
        objectsSizing[axis] === "each" ? 0 : objectsSizeLocal[axis];

      const fixed: Vec2 = [px(0), px(1)];
      if (eachLayout === "masonry") fixed[crossAxis] = eachCell;

      return fixed;
    }, [
      objectsSizing.join(),
      objectsSizeLocal.join(),
      eachLayout,
      eachCell,
      crossAxis,
    ]);

    /*
     * Сторона, которую мы объектам задаём, стала другой — значит и та,
     * которую они выбирают сами, стала другой: текст перетёк, картинка
     * пересчиталась. Записанное больше не про эти объекты.
     *
     * От размера окна не зависим нарочно: в потоке он решает только, где
     * перенос, а не какими объекты выросли — иначе перетаскивание края окна
     * заставляло бы мерить всё заново на каждый кадр.
     */
    const impose = isEach ? eachFixed.join() : null;
    const imposed = React.useRef<string | null>(null);

    React.useEffect(() => {
      // на первом заходе стирать нечего, а снятое наблюдение никто не вернёт
      if (imposed.current !== null && imposed.current !== impose) sizes.clear();

      imposed.current = impose;
    }, [impose, sizes]);

    // ушедшие из списка уносят с собой и свой размер
    React.useEffect(() => {
      if (isEach) sizes.keep(new Set(validChildrenKeys));
    }, [isEach, validChildrenKeys.join(), sizes]);

    const packed = React.useMemo(() => {
      if (!isEach) return { items: [], width: 0, height: 0, measuredPrefix: 0 };

      return packObjects({
        keys: validChildrenKeys,
        sizes,
        layout: eachLayout,
        isX: mainAxis === 0,
        fixed: eachFixed,
        gap: gapXY,
        columns: eachColumns,
        crossLimit: crossRoom,
        align: objectsAlign ?? "start",
      });
    }, [
      isEach,
      eachLayout,
      validChildrenKeys.join(),
      eachColumns,
      eachFixed.join(),
      gapXY.join(),
      mainAxis,
      crossAxis,
      crossRoom,
      objectsAlign,
      sizes.version,
    ]);

    const objectsWrapperWidth = React.useMemo(() => {
      if (isEach) return packed.width;

      const childsGap =
        objectsPerDirection[0] < 1
          ? 1
          : objectsPerDirection[0] * gapLocal[1] - gapLocal[1];
      // если детей меньше чем neededObj, то считаем по ним так как crossCount в этом случае не имеет смысла
      const neededObj = objectsPerDirection[direction === "x" ? 1 : 0];
      const neededObjWithChildCount =
        validChildrenKeys.length < neededObj
          ? validChildrenKeys.length
          : neededObj;

      return objectsSizeLocal[0]
        ? (objectsSizeLocal[0] + gapLocal[1]) * neededObjWithChildCount -
            gapLocal[1]
        : !renderLocal.mode
          ? receivedWrapSizeRef.current.width
          : receivedChildSizeRef.current.width + childsGap;
    }, [
      direction,
      objectsSizeLocal[0],
      objectsPerDirection[0],
      objectsPerDirection[1],
      gapLocal[1],
      receivedWrapSizeRef.current.width,
      receivedChildSizeRef.current.width,
      renderLocal.mode,
      validChildrenKeys.length,
          isEach,
      packed,
    ]);

    const objectsWrapperHeight = React.useMemo(() => {
      if (isEach) return packed.height;

      const childsGap =
        objectsPerDirection[1] < 1
          ? 1
          : objectsPerDirection[1] * gapLocal[0] - gapLocal[0];

      return objectsSizeLocal[1]
        ? direction === "x"
          ? (objectsSizeLocal[1] + gapLocal[0]) * objectsPerDirection[0] -
            gapLocal[0]
          : (objectsSizeLocal[1] + gapLocal[0]) * objectsPerDirection[1] -
            gapLocal[0]
        : !renderLocal.mode
          ? receivedWrapSizeRef.current.height // on "fit-content"
          : receivedChildSizeRef.current.height + childsGap;
    }, [
      direction,
      objectsSizeLocal[1],
      objectsPerDirection[0],
      objectsPerDirection[1],
      gapLocal[0],
      receivedWrapSizeRef.current.height,
      receivedChildSizeRef.current.height,
      renderLocal.mode,
          isEach,
      packed,
    ]);

    const objectsWrapperHeightFull = React.useMemo(() => {
      return objectsWrapperHeight + mLocalY;
    }, [objectsWrapperHeight, mLocalY]);
    const objectsWrapperWidthFull = React.useMemo(() => {
      return objectsWrapperWidth + mLocalX;
    }, [objectsWrapperWidth, mLocalX]);
    const fullHeightOrWidth =
      direction === "x" ? objectsWrapperWidthFull : objectsWrapperHeightFull;

    const maxScrollSize = React.useMemo<Vec2>(() => {
      return [
        Math.max(0, objectsWrapperWidthFull - sizeLocal[0]),
        Math.max(0, objectsWrapperHeightFull - sizeLocal[1]),
      ];
    }, [sizeLocal.join(), objectsWrapperHeightFull, objectsWrapperWidthFull]);

    const scrollSpaceFromRef =
      direction === "x"
        ? scrollElementRef.current?.scrollLeft || 0
        : scrollElementRef.current?.scrollTop || 0;

    const isNotAtStart = scrollSpaceFromRef > 1;
    const isNotAtEnd =
      Math.round(scrollSpaceFromRef + xySize) < fullHeightOrWidth;

    let isNotAtStartX = false;
    let isNotAtEndX = false;
    if (direction === "hybrid") {
      isNotAtStartX = (scrollElementRef.current?.scrollLeft || 0) > 1;
      isNotAtEndX =
        Math.round((scrollElementRef.current?.scrollLeft || 0) + sizeLocal[0]) <
        objectsWrapperWidthFull;
    }

    const getThumbSize = React.useCallback(
      (dir: "x" | "y") => {
        if (!barLocal.present || !fullHeightOrWidth) return 0;

        if (dir === "x") {
          return calculateThumbSize(
            sizeLocal[0] - barLocal.trackGap[0],
            objectsWrapperWidthFull,
            barLocal.thumbMinSize,
          );
        } else
          return calculateThumbSize(
            sizeLocal[1] - barLocal.trackGap[1],
            objectsWrapperHeightFull,
            barLocal.thumbMinSize,
          );
      },
      [
        controlsST,
        fullHeightOrWidth,
        sizeLocal[0],
        sizeLocal[1],
        objectsWrapperWidthFull,
        barLocal.thumbMinSize,
        barLocal.trackGap.join(),
      ],
    );

    const thumbSizeMemo = React.useMemo(
      () => ({
        x: direction !== "y" ? getThumbSize("x") : 0,
        y: direction !== "x" ? getThumbSize("y") : 0,
      }),
      [getThumbSize, direction],
    );

    /*
     * Липнет ли скролл к концу — по положению, а не по направлению движения.
     * Направление стирается через SCROLL_END_DELAY, и при медленной прокрутке
     * пауза успевала стереть его раньше, чем дорастал контент: человека, уже
     * читающего историю, выбрасывало обратно вниз.
     */
    const updateAtEnd = (allow: (dir: "x" | "y") => boolean = () => true) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl || !(stickLocal[0] || stickLocal[1])) return;

      const near = (pos: number, end: number) =>
        pos >= end - CONST.END_STICK_THRESHOLD;

      if (allow("x"))
        atEndRef.current.x = near(scrollEl.scrollLeft, endRef.current.w);
      if (allow("y"))
        atEndRef.current.y = near(scrollEl.scrollTop, endRef.current.h);
    };

    const endObjectsWrapper = React.useMemo(
      () => ({
        w: !sizeLocal[0]
          ? objectsWrapperWidthFull
          : objectsWrapperWidthFull - sizeLocal[0],
        h: !sizeLocal[1]
          ? objectsWrapperHeightFull
          : objectsWrapperHeightFull - sizeLocal[1],
      }),
      [
        objectsWrapperWidthFull,
        objectsWrapperHeightFull,
        sizeLocal[0],
        sizeLocal[1],
      ],
    );

    // читается из обработчиков, поэтому держим свежим без пересоздания замыканий
    const endRef = React.useRef(endObjectsWrapper);
    endRef.current = endObjectsWrapper;

    // высчитываем сдвиг scroll и ограничиваем его
    const thumbSpace = {
      x:
        direction !== "y"
          ? calculateThumbSpace(
              scrollElementRef.current?.scrollLeft || 0,
              endObjectsWrapper.w,
              sizeMinusEdge[0],
              thumbSizeMemo.x,
            )
          : 0,
      y:
        direction !== "x"
          ? calculateThumbSpace(
              scrollElementRef.current?.scrollTop || 0,
              endObjectsWrapper.h,
              sizeMinusEdge[1],
              thumbSizeMemo.y,
            )
          : 0,
    };

    const memoizedChildrenData = React.useMemo(() => {
      // кладка считает координаты сама, и считает их всегда: по ним она и кладка
      if (isEach) return packed.items;

      if (!renderLocal.mode) return [{ top: 0, bottom: 0, left: 0, right: 0 }];

      let alignSpace: number = 0;

      const isX = direction === "x";
      const isRow = objectsDirection === "row";
      const isRowInDir = (isX && !isRow) || (!isX && isRow);

      const stepX = objectsSizeLocal[0] + gapLocal[1];
      const stepY = objectsSizeLocal[1] + gapLocal[0];

      const itemsInLastLine = new Set<number>();

      // -- находим последние индексы
      const itemsPerLine = isRowInDir
        ? objectsPerDirection[0]
        : objectsPerDirection[1];
      const size = objectsSizeLocal[isRow ? 0 : 1];
      const gap = gapLocal[isRow ? 1 : 0];

      // начало последней линии
      const lastLineStart =
        Math.floor((validChildrenKeys.length - 1) / itemsPerLine) *
        itemsPerLine;

      for (let i = lastLineStart; i < validChildrenKeys.length; i++)
        itemsInLastLine.add(i);

      // -- вычисляем отступ
      const emptySlots = itemsPerLine - itemsInLastLine.size;
      const offset = emptySlots > 0 ? (size + gap) * emptySlots : 0;

      if (objectsAlign === "center") alignSpace = Math.round(offset / 2);
      else if (objectsAlign === "end") alignSpace = offset;

      // -- получаем координаты
      return validChildrenKeys.map((_, childIndex) => {
        // вычисляем group и subIndex сразу
        const groupIndex = isRowInDir
          ? childIndex % objectsPerDirection[0]
          : Math.floor(childIndex / objectsPerDirection[1]);

        const subIndex = isRowInDir
          ? Math.floor(childIndex / objectsPerDirection[0])
          : childIndex % objectsPerDirection[1];

        let leftIndex: number;
        let topIndex: number;

        if (direction === "x") {
          leftIndex = subIndex;
          topIndex = groupIndex;
        } else if (direction === "y") {
          leftIndex = groupIndex;
          topIndex = subIndex;
        } else {
          // hybrid
          leftIndex = groupIndex;
          topIndex = subIndex;
        }

        const isLastEl =
          itemsInLastLine.size > 0 && itemsInLastLine.has(childIndex);

        const top = (isLastEl && !isRow ? alignSpace : 0) + stepY * topIndex;
        const left = (isLastEl && isRow ? alignSpace : 0) + stepX * leftIndex;

        return {
          top,
          left,
          bottom: top + objectsSizeLocal[1],
          right: left + objectsSizeLocal[0],
        };
      });
    }, [
      objectsSizeLocal[0],
      objectsSizeLocal[1],
      gapLocal[0],
      gapLocal[1],
      objectsAlign,
      validChildrenKeys.length,
      objectsPerDirection[0],
      objectsPerDirection[1],
      renderLocal.mode,
      objectsDirection,
      direction,
          isEach,
      packed,
    ]);

    const wrapperAlignLocal = React.useMemo(() => {
      if (!sizeLocal?.length || !wrapper?.align) return {};

      return getWrapperAlignStyle(
        wrapper.align,
        sizeLocal,
        objectsWrapperWidthFull,
        objectsWrapperHeightFull,
      );
    }, [
      wrapperST,
      sizeLocal.join(),
      objectsWrapperHeightFull,
      objectsWrapperWidthFull,
    ]);

    const objLengthPerSize = React.useMemo(() => {
      const x = objectsPerSize(objectsWrapperWidthFull, sizeLocal[0]);
      const y = objectsPerSize(objectsWrapperHeightFull, sizeLocal[1]);

      return [x, y];
    }, [objectsWrapperWidthFull, objectsWrapperHeightFull, sizeLocal.join()]);
    const objLengthPerSizeXY = React.useMemo(() => {
      return direction === "x" ? objLengthPerSize[0] : objLengthPerSize[1];
    }, [direction, objLengthPerSize[0], objLengthPerSize[1]]);

    // ♦ functions
    const scrollResize = React.useCallback(
      createResizeHandler(receivedScrollSizeRef, triggerRAF),
      [],
    );
    const wrapResize = React.useCallback(
      createResizeHandler(receivedWrapSizeRef, triggerRAF, mLocalX, mLocalY),
      [mLocalX, mLocalY],
    );
    const childResize = React.useCallback(
      createResizeHandler(receivedChildSizeRef, triggerRAF),
      [],
    );

    const smoothScrollLocal = React.useCallback(
      (targetScroll: number | null, direction: "y" | "x", duration: number) => {
        const scrollEl = scrollElementRef.current;
        if (!scrollEl || targetScroll === null) return null;

        return smoothScroll(
          direction,
          scrollEl,
          firstRender.current ? null : duration,
          targetScroll,
          rafScrollAnim.schedule,
          maxScrollSize,
          tasks,
        );
      },
      [maxScrollSize.join()],
    );

    const wrapperStyle = React.useMemo<React.CSSProperties>(() => {
      const common: React.CSSProperties = {
        margin: wrapper?.margin ? `${mT}px ${mR}px ${mB}px ${mL}px` : "",
        height:
          objectsSizing[1] && objectsSizing[1] !== "none"
            ? `${objectsWrapperHeight}px`
            : "fit-content",
        width:
          objectsSizing[0] && objectsSizing[0] !== "none"
            ? `${objectsWrapperWidth}px`
            : "fit-content",
        ...(gap &&
          !renderLocal.mode &&
          !isEach && { gap: `${gapLocal[0]}px ${gapLocal[1]}px` }),
        ...(wrapper?.minSize &&
          getWrapperMinSizeStyle(
            wrapper.minSize,
            direction,
            sizeLocal,
            mLocalX,
            mLocalY,
          )),
        ...((direction === "hybrid" || direction === "x") && { flexShrink: 0 }), // для горизонтального выравнивания при "hybrid"/"x"
      };

      // кладка размещает объекты абсолютно, значит обёртке нужен свой отсчёт
      if (renderLocal.mode || isEach) {
        return {
          ...common,
          position: "relative",
        };
      }

      const flexDirection =
        objectsPerDirection[0] === 1
          ? direction === "y"
            ? "column"
            : "row" // так как при objectsPerDirection[0] === 1, x/hybrid это row
          : objectsDirection;

      // выравнивание элементы в линию когда размер неизвестен при direction !== "y"
      const flexWrap =
        !objectsSizing[0] ||
        objectsSizing[0] === "none" ||
        !objectsSizing[1] ||
        objectsSizing[1] === "none"
          ? undefined
          : "wrap";

      return {
        ...common,
        display: "flex",
        flexDirection,
        flexWrap,
        justifyContent: getStyleAlign(objectsAlign),
      };
    }, [
      wrapperST,
      [mT, mR, mB, mL, mLocalX, mLocalY, gapLocal[0], gapLocal[1]].join(),
      sizeLocal.join(),
      gapST,
      objectsSizing[1],
      objectsWrapperHeight,
      objectsWrapperWidth,
      gapST,
      renderLocal.mode,
      direction,
      objectsPerDirection[0],
      objectsDirection,
      objectsAlign,
          isEach,
    ]);

    // ♦ events
    /*
     * Жест начинается раньше, чем объявлен отчёт о перелистывании, и живёт
     * дольше одного рендера. Ссылка развязывает это: в неё кладут свежий
     * `emitNavigate`, а жест читает её в момент, когда действительно нужен.
     */
    const emitNavigateRef = React.useRef<
      (reason: NavigateReason, axis: "x" | "y", from: number, to: number) => void
    >(() => {});

    const onMouseOrTouchDown = React.useCallback(
      (
        clicked: "thumb" | "slider" | "wrapp",
        event: PointerEvent,
        checkClickedBar?: boolean,
      ) => {
        isTouchedRef.current = isTouchDevice(); // уточняем девайс

        const target = event.target as HTMLElement;

        // свой drag у элемента и поля ввода — не наше дело ни на каком устройстве
        if (
          target.closest(
            `
          [ms-custom-drag], [draggable="true"], [contenteditable],
          input, textarea, select
        `,
          )
        )
          return;

        /*
         * Список, целиком собранный из ссылок или кнопок — меню, лента
         * карточек, — должен скроллиться с любой точки, как нативный: указатель
         * попадает по пункту, а не между ними. Тап от прокрутки отличает
         * расстояние, а не то, куда попали: до 2px это тап и click проходит,
         * дальше поднимается isDraggingRef, ms-objects-wrapper получает
         * pointer-events: none, и click уже не случится.
         *
         * Мышь раньше была исключением — ради выделения текста и нативного
         * переноса ссылки. Но выделение всё равно снимает курсорный замок на
         * всё время жеста, а нативный перенос гасится через dragstart, так что
         * от исключения оставалась только неработающая прокрутка по кнопкам.
         */

        let axisFromAtr: "x" | "y" | null = null;
        if (checkClickedBar) {
          axisFromAtr = target
            .closest(mode === "scroll" ? ".ms-bar" : ".ms-slider")
            ?.getAttribute(CONST.BAR_AXIS_ATR) as "x" | "y";
        }

        clickedObject.current = clicked;

        handleMouseOrTouch({
          scrollElement: scrollElementRef.current,
          target,
          clickedObject,
          scrollStateRef: scrollStateRef.current,
          mode,
          triggerUpdate: triggerRAF,
          direction,
          smoothScroll: smoothScrollLocal,
          sizeLocal: [sizeLocal[0], sizeLocal[1]],
          thumbSize: axisFromAtr === "x" ? thumbSizeMemo.x : thumbSizeMemo.y,
          axisFromAtr,
          duration: duration,
          scrollBarEdge: barLocal.trackGap,
          rafScrollAnim,
          isTouched: isTouchedRef.current,
          gap: gapXY,
          overscrollRef,
          objLengthPerSize,
          isDraggingRef,
          maxScrollSize,
          emitNavigate: (reason, axis, from, to) =>
            emitNavigateRef.current(reason, axis, from, to),
          pointerId: event.pointerId,
          runtime: pointerRuntime,
          tasks,
        });
      },

      [
        direction,
        mode,
        sizeLocal.join(),
        duration,
        smoothScrollLocal,
        barLocal.trackGap.join(),
        thumbSizeMemo.x,
        thumbSizeMemo.y,
        gapLocal.join(),
        objLengthPerSize,
        maxScrollSize.join(),
      ],
    );

    const onMoveScrollThumb = React.useCallback(
      (event: PointerEvent) => {
        onMouseOrTouchDown("thumb", event, true);
      },
      [onMouseOrTouchDown],
    );

    /*
     * Причину знает тот, кто начал переход, а сам переход виден только когда
     * скролл остановился. Между этими двумя моментами метка ждёт здесь.
     *
     * Отчитываемся именно по остановке, а не по каждой пройденной странице:
     * клик по точке слайдера пролетает мимо трёх страниц по дороге к четвёртой,
     * и три лишних события — это три лишних звука.
     */
    const pending = React.useRef<NavigateReason | null>(null);
    const pageRef = React.useRef<{ x: number | null; y: number | null }>({
      x: null,
      y: null,
    });

    const pageNow = React.useCallback(
      (axis: "x" | "y") => {
        const el = scrollElementRef.current;
        if (!el) return null;

        return axis === "x"
          ? pageAt(el.scrollLeft, el.clientWidth, gapXY[0])
          : pageAt(el.scrollTop, el.clientHeight, gapXY[1]);
      },
      [gapLocal[0], gapLocal[1]],
    );

    /*
     * Причина жеста, у которого страница определится только в конце: бар
     * нажали, а куда он приедет, решит снап после отпускания. Заодно
     * записываем страницу отправления, если её ещё не успели записать —
     * нажатие сразу после монтирования иначе потеряло бы первое событие.
     */
    const markNavigate = React.useCallback(
      (reason: NavigateReason) => {
        pending.current = reason;

        if (pageRef.current.x === null) pageRef.current.x = pageNow("x");
        if (pageRef.current.y === null) pageRef.current.y = pageNow("y");
      },
      [pageNow],
    );

    /*
     * Перелистнули по команде — про это известно всё и сразу: и откуда, и
     * куда. Ждать конца прокрутки незачем, а главное — нельзя: три быстрых
     * нажатия стрелки доезжают одним движением, и одно событие на всех
     * потеряло бы два перелистывания. Отчитывается каждое.
     */
    const emitNavigate = React.useCallback(
      (reason: NavigateReason, axis: "x" | "y", from: number, to: number) => {
        if (from === to) return;

        // страница записана вперёд: финал увидит её и не отчитается второй раз
        pageRef.current[axis] = to;
        pending.current = null;

        onNavigate?.({ reason, axis, from, to });
      },
      [onNavigate],
    );
    emitNavigateRef.current = emitNavigate;

    /** the scroll has stopped — compare the page with the one it left */
    const reportNavigate = React.useCallback(() => {
      const reason = pending.current;
      pending.current = null;

      for (const axis of ["x", "y"] as const) {
        const now = pageNow(axis);
        if (now === null) continue;

        const before = pageRef.current[axis];
        pageRef.current[axis] = now;

        if (before === null || before === now) continue;

        // в обычном скролле страниц нет — их листают только команды
        if (mode === "scroll") continue;

        onNavigate?.({ reason: reason ?? "scroll", axis, from: before, to: now });
      }
    }, [mode, onNavigate, pageNow]);

    const handleArrowLocal = React.useCallback(
      (
        arrowType: handleArrowT["arrowType"],
        // тот же шаг делают и кнопки-стрелки, и клавиши — меняется только след
        reason: NavigateReason = "arrows",
      ) => {
        if (!scrollElementRef.current) return;

        const moved = handleArrow({
          arrowType: arrowType,
          scrollElement: scrollElementRef.current,
          wrapSize: [objectsWrapperWidthFull, objectsWrapperHeightFull],
          scrollSize: sizeLocal,
          smoothScroll: smoothScrollLocal,
          duration: duration,
          loop: arrowsLocal.loop,
          gap: gapXY,
        });

        // упёрлись в край без loop — никуда не поехали, и отчитываться не о чем
        if (moved) emitNavigate(reason, moved.axis, moved.from, moved.to);
      },

      [
        sizeLocal.join(),
        objectsWrapperWidthFull,
        objectsWrapperHeightFull,
        duration,
        smoothScrollLocal,
        arrowsLocal.loop,
        gapLocal[0],
        gapLocal[1],
        emitNavigate,
      ],
    );

    const sliderCheckLocal = React.useCallback(() => {
      // защита от нулевых значений
      if (mode === "scroll" || !sizeLocal[0] || !sizeLocal[1]) return;

      if (
        !scrollContentRef.current ||
        !scrollElementRef.current ||
        !scrollBarsRef.current.size
      )
        return;

      sliderCheck(
        scrollElementRef.current,
        scrollBarsRef.current,
        direction,
        objLengthPerSize,
      );
    }, [sizeLocal.join(), direction, mode, objLengthPerSize.join()]);

    const onRenderedKeysChangeUpdate = React.useCallback(
      (callback: MorphScrollProps["onRenderedKeysChange"]) => {
        if (callback) {
          const renderedKeys = getRenderedKeysFromWrapper(
            objectsWrapperRef.current,
          );

          if (
            !lastRenderedKeysRef.current ||
            !areKeysEqual(lastRenderedKeysRef.current, renderedKeys)
          ) {
            lastRenderedKeysRef.current = renderedKeys;
            callback(renderedKeys);
          }
        }
      },
      [],
    );

    const updateLoadedElementsKeysLocal = React.useCallback(() => {
      if (!objectsWrapperRef.current) return;

      updateLoadedElementsKeys(
        objectsWrapperRef.current,
        objectsKeys,
        triggerRAF,
        renderLocal.mode,
      );
    }, [renderST]);

    // для обновления ключей при emptyObjects
    const updateEmptyKeysClickLocal = React.useCallback(
      (event: React.MouseEvent) => {
        if (emptyObjectsLocal?.clickTrigger !== undefined) {
          updateEmptyKeysClick(
            event,
            emptyObjectsLocal.clickTrigger,
            updateLoadedElementsKeysLocal,
            tasks,
          );
        }
      },

      [emptyObjectsST, updateLoadedElementsKeysLocal],
    );

    // для обработки onScrollPosition
    const handleScroll = React.useCallback(
      (event: React.UIEvent<HTMLDivElement>) => {
        tasks.cancelTask("removeHover"); // удаляем task

        const el = scrollContentRef.current;
        const mainEl = customScrollRef.current;
        const scrollEl = scrollElementRef.current;

        if (!el || !mainEl || !scrollEl) return;

        /*
         * Кадры собственной анимации к концу — не мнение пользователя о том,
         * где он хочет стоять. Пока библиотека сама везёт эту ось, отметку не
         * трогаем: иначе она успевала записать промежуточное положение как
         * «ушёл вниз» и следующая подгрузка уже никуда не ехала.
         */
        updateAtEnd((dir) => !tasks.hasTask(`smoothScrollBlock${dir}`));

        // уведомляем о прокрутке пропс
        onScrollPosition?.(scrollEl.scrollLeft, scrollEl.scrollTop);

        const scrollOrSlider = el.querySelectorAll<HTMLElement>(
          mode === "scroll" ? ".ms-bar" : ".ms-slider",
        );
        if (
          barLocal.showOnHover &&
          scrollOrSlider.length > 0 &&
          !isScrollingRef.current
        ) {
          // доп логика что-бы показать скрытый scrollBar
          scrollOrSlider.forEach((el) => {
            if (!el.classList.contains("ms-hover")) addHover(el, tasks);
          });
        }

        // только на переходе: событий scroll за один жест десятки,
        // а прокрутка началась один раз
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          // видно снаружи: по нему вложенные скроллы решают, брать ли колесо
          mainEl.setAttribute(CONST.SCROLLING_ATR, "");
          onScrollingChange?.(true);
        }

        // debounce для финала через setTask
        tasks.setTask(
          () => {
            isScrollingRef.current = false;
            mainEl.removeAttribute(CONST.SCROLLING_ATR);
            onScrollingChange?.(false);
            // всё доехало — отметка о конце тут точно про итоговое положение
            updateAtEnd();
            reportNavigate();
            renderLocal.mode && updateLoadedElementsKeysLocal();

            if (
              barLocal.showOnHover &&
              scrollOrSlider.length > 0 &&
              !clickedObject.current
            ) {
              // этот removeHover убирает scrollbar если он был сдвинуть но курсор мыши не был наведён
              scrollOrSlider.forEach((el) => {
                // добавил в setTask что бы была задержка перед исчезновением thumbs
                tasks.setTask(
                  () => {
                    if (el.hasAttribute("ms-manual-hover")) return; // выход если атрибут
                    removeHover(el, tasks);
                  },
                  1000,
                  "removeHover",
                );
              });
            }
          },
          CONST.SCROLL_END_DELAY,
          "isScrolling",
        );

        tasks.setTask(
          // логика обновления массива при прокрутке
          () => onRenderedKeysChangeUpdate(onRenderedKeysChangeRef.current),
          "raf",
          "onRenderedKeysChange",
        );

        // по-кадровое обновление
        raf.schedule("sliderCheckLocal", () => {
          if (mode !== "scroll") sliderCheckLocal();
          triggerUpdate(); // main updater
        });
      },
      [
        onScrollPosition,
        onScrollingChange,
        reportNavigate,
        mode,
        sliderCheckLocal,
        updateLoadedElementsKeysLocal,
        barLocal.showOnHover,
        renderLocal.mode,
        stickLocal.join(), // читается внутри для трекера конца
      ],
    );

    /*
     * Стрелки как Tab, только прицельно: фокус переходит на соседний объект,
     * а прокрутка догоняет его — ровно настолько, что бы он оказался в окне.
     */
    const moveFocusLocal = React.useCallback(
      (
        side: handleArrowT["arrowType"],
        reason: NavigateReason,
        duration: number,
      ) => {
        const scrollEl = scrollElementRef.current;
        const moved = focusStep(objectsWrapperRef.current, scrollEl, side, {
          gap: gapXY,
          margin: [mT, mR, mB, mL],
        });
        if (!moved || !scrollEl) return;

        const axes: ("x" | "y")[] =
          direction === "hybrid" ? ["x", "y"] : [direction];

        const shift = axes.filter((axis) => moved.delta[axis]);
        if (!shift.length) return; // объект и так в окне — двигать нечего

        markNavigate(reason);

        shift.forEach((axis) =>
          smoothScrollLocal(
            (axis === "x" ? scrollEl.scrollLeft : scrollEl.scrollTop) +
              moved.delta[axis],
            axis,
            duration,
          ),
        );
      },
      [
        direction,
        markNavigate,
        smoothScrollLocal,
        gapXY[0],
        gapXY[1],
        mT,
        mR,
        mB,
        mL,
      ],
    );

    const onKeyDown = React.useCallback(
      (e: KeyboardEvent) => {
        if (keyDownX.current) return; // ранний выход

        const keyName =
          typeof controlsLocal.wheel === "object" &&
          typeof controlsLocal.wheel.changeDirectionBtn === "string"
            ? controlsLocal.wheel.changeDirectionBtn
            : "KeyX";

        if (e.code === keyName && direction === "hybrid" && !keyDownX.current) {
          // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
          e.stopPropagation();
          keyDownX.current = true;
          triggerRAF();
          return;
        }

        if (!keysLocal) return;

        const side = ARROW_KEYS[e.key];
        if (!side) return;

        // в поле ввода стрелки принадлежат тексту, а не скроллу
        if (isTextEntry(e.target)) return;

        const isVertical = side === "top" || side === "bottom";

        /*
         * По оси прокрутки клавиши делятся только там, где стрелка её и
         * двигает. В режиме фокуса она ходит по сетке, а сетка живёт поперёк
         * оси тоже: в вертикальном списке в два столбца «вправо» — это шаг к
         * соседу, а не попытка прокрутить вбок.
         */
        if (keysLocal.mode !== "focus") {
          if (direction === "x" && isVertical) return;
          if (direction === "y" && !isVertical) return;
        }

        // забираем клавишу себе: иначе прокрутит ещё и браузер, и родитель
        e.preventDefault();
        e.stopPropagation();

        if (keysLocal.mode === "focus") {
          moveFocusLocal(side, "keys", duration);
          return;
        }

        if (keysLocal.mode === "step") {
          handleArrowLocal(side, "keys");
          return;
        }

        const scrollEl = scrollElementRef.current;
        if (!scrollEl) return;

        const axis = isVertical ? "y" : "x";
        const from = axis === "y" ? scrollEl.scrollTop : scrollEl.scrollLeft;
        const delta =
          side === "top" || side === "left" ? -keysLocal.step : keysLocal.step;

        /*
         * Метку не ставим: `pan` — это непрерывное движение, такое же как
         * колесо или перетаскивание. Если оно доедет до новой страницы
         * слайдера, это и есть "scroll".
         */
        smoothScrollLocal(from + delta, axis, duration);
      },

      [
        direction,
        controlsST,
        keysLocal,
        handleArrowLocal,
        moveFocusLocal,
        smoothScrollLocal,
        duration,
      ],
    );
    const onKeyUp = React.useCallback((e: KeyboardEvent) => {
      if (keyDownX.current) {
        // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
        e.stopPropagation();
        keyDownX.current = false;
        triggerRAF();
      }
    }, []);

    // ♦ effects
    React.useEffect(() => {
      // эффект заставляет сразу выключать или включать работу onRenderedKeysChange
      if (!onRenderedKeysChange) {
        onRenderedKeysChangeRef.current = undefined;
        lastRenderedKeysRef.current = null;
        return;
      }

      onRenderedKeysChangeRef.current = onRenderedKeysChange;
      lastRenderedKeysRef.current = null;

      onRenderedKeysChangeUpdate(onRenderedKeysChange);
    }, [onRenderedKeysChange, onRenderedKeysChangeUpdate]);

    React.useEffect(() => {
      if (!onRenderedKeysChangeRef.current) return;

      if (!sizeLocal[0] || !sizeLocal[1]) return;

      // логика получения массива ключей
      // (кейсы: первый рендер и при удалении с emptyObjects)
      onRenderedKeysChangeUpdate(onRenderedKeysChangeRef.current);
    }, [validChildrenKeys.join("|"), sizeLocal.join()]);

    React.useEffect(() => {
      // эффект для нажатия клавиш
      if (isTouchedRef.current) return;

      const wrapperEl = objectsWrapperRef.current;
      const scrollEl = scrollElementRef.current;
      if (!wrapperEl || !scrollEl) return;

      /*
       * `changeDirectionBtn` нужен только там, где есть между чем переключать:
       * hybrid, и контент вылезает по обеим осям. `keys` таких условий не
       * ставит — стрелки работают в любом направлении, поэтому слушатель
       * вешается, если нужен хоть кому-то из них.
       */
      const forChangeDirection =
        direction === "hybrid" &&
        wrapperEl.clientWidth! + mLocalX > scrollEl.clientWidth! &&
        wrapperEl.clientHeight! + mLocalY > scrollEl.clientHeight!;

      if (!forChangeDirection && !keysLocal) return;

      scrollEl.addEventListener("keydown", onKeyDown);
      scrollEl.addEventListener("keyup", onKeyUp);

      return () => {
        scrollEl.removeEventListener("keydown", onKeyDown);
        scrollEl.removeEventListener("keyup", onKeyUp);
      };
    }, [
      direction,
      controlsST,
      keysLocal,
      onKeyDown,
      // при изменении размеров
      sizeST,
      objectsSizeST,
      // при изменении количества детей
      validChildrenKeys.join(),
      mLocalX,
      mLocalY,
    ]);

    React.useEffect(() => {
      if (!emptyObjectsLocal || !renderLocal.mode) return; // ранний выход

      updateLoadedElementsKeysLocal(); // запуск проверки ключей
    }, [
      emptyObjectsST,
      renderLocal.mode,
      updateLoadedElementsKeysLocal,
      validChildrenKeys.length, // при изменении количества детей
    ]);

    React.useEffect(() => {
      if (isTouchedRef.current) return; // при touch устроиствах выключаем

      // wheel вешается вручную что бы выключить scroll e.preventDefault()!
      const scrollEl = scrollElementRef.current;
      const objectsWrapper = objectsWrapperRef.current;
      if (!scrollEl || !objectsWrapper) return;

      const directionWithPriority =
        direction === "hybrid" &&
        typeof controlsLocal.wheel === "object" &&
        controlsLocal.wheel.changeDirection
          ? "x"
          : direction;

      const preferredDirection =
        (direction === "hybrid" &&
          objectsWrapperHeight + mLocalY <= sizeLocal[1]) ||
        keyDownX.current
          ? // уточнение был ли применён changeDirection что бы клавиша меняла уже его направление
            ["hybrid", "y"].includes(directionWithPriority)
            ? "x"
            : "y"
          : directionWithPriority;

      /*
       * Приоритет остаётся приоритетом, но только пока по выбранной оси есть
       * что прокручивать. Иначе `changeDirection` уводил колесо на ось, где
       * контент никуда не выходит — например при hybrid и таком `crossCount`,
       * при котором ряд помещается целиком, — и скролл замирал совсем.
       */
      const roomOn = (axis: "x" | "y") =>
        maxScrollSize[axis === "x" ? 0 : 1] > 0;

      const other = preferredDirection === "x" ? "y" : "x";
      const directionForWheel =
        preferredDirection !== "hybrid" &&
        !roomOn(preferredDirection) &&
        roomOn(other)
          ? other
          : preferredDirection;

      const wheelHandler = (e: WheelEvent) => {
        /*
         * Событие всплывает, поэтому во вложенных скроллах его ловил и
         * внутренний, и внешний — контент уезжал в обоих сразу. Колесо должно
         * доставаться самому внутреннему.
         *
         * Исключение — внешний скролл прямо сейчас едет. Перехватывать у него
         * колесо посреди движения значит ловить пользователя списком, мимо
         * которого он пролетал; в этом случае пропускаем событие дальше
         * нетронутым.
         */
        if (
          customScrollRef.current?.parentElement?.closest(
            `[${CONST.SCROLLING_ATR}]`,
          )
        )
          return;

        e.stopPropagation();
        e.preventDefault();
        handleWheel(
          e,
          scrollEl,
          maxScrollSize,
          scrollStateRef.current,
          directionForWheel,
        );
      };

      controlsLocal.wheel &&
        scrollEl.addEventListener("wheel", wheelHandler, { passive: false });

      return () => {
        scrollEl.removeEventListener("wheel", wheelHandler);
      };
    }, [
      direction,
      controlsST,
      objectsWrapperHeight,
      sizeLocal[1],
      mLocalY,
      keyDownX.current,
      maxScrollSize.join(),
    ]);

    /*
     * Единственное место, откуда прокрутка уезжает в заданную позицию: сюда
     * приходит и эффект на `scrollPosition`, и команда `scrollTo`.
     *
     * Разница одна — `respectUserScroll`. Декларативный "end" не должен тащить
     * пользователя обратно вниз, если он сам ушёл вверх; явная команда обязана
     * сработать всегда.
     */
    const applyScrollPosition = React.useCallback(
      (
        target: (number | "end" | null)[],
        duration: number,
        respectUserScroll: boolean,
      ) => {
        // обязательно вызываем всё в одном raf
        raf.schedule("smoothScrollLocal", () => {
          const directions: ("x" | "y")[] =
            direction === "hybrid" ? ["x", "y"] : [direction];

          directions.forEach((dir) => {
            const value = target[dir === "x" ? 0 : 1];

            // "end"
            if (value === "end") {
              // пользователь ушёл от конца читать историю — не тянем обратно
              if (respectUserScroll && !atEndRef.current[dir]) return;

              smoothScrollLocal(
                dir === "x" ? endObjectsWrapper.w : endObjectsWrapper.h,
                dir,
                duration,
              );
            }

            // "number"
            else if (typeof value === "number") {
              lastScrollTargetRef.current[dir] = value;

              smoothScrollLocal(value, dir, duration);
            }
          });
        });
      },
      [direction, endObjectsWrapper.w, endObjectsWrapper.h, smoothScrollLocal],
    );

    /*
     * Число — цель разовая: проп говорит «встань сюда», и переприменять его на
     * каждое переизмерение контента нельзя. Раньше он приезжал в зависимости
     * эффекта целиком, вместе со своей ссылкой, и та менялась от роста списка —
     * прокрутка возвращалась на заданное место сама, отменяя всё, что человек
     * успел сделать после: колесо, стрелку, команду через `ref`.
     *
     * "end" — единственное стоячее правило: контент дорос, и мы едем за ним.
     * От ушедшего читать вверх его бережёт `respectUserScroll`.
     */
    const applyScrollPositionRef = React.useRef(applyScrollPosition);
    applyScrollPositionRef.current = applyScrollPosition;

    /*
     * Доставка задержана ровно до того момента, когда цель становится
     * достижимой. Измеряемые размеры приезжают не сразу — при `size="auto"`
     * или `objectsSize="firstChild"` диапазон прокрутки несколько кадров равен
     * нулю, и цель обрезается в ноль. Раньше это лечилось само собой: ссылка
     * применяющей функции менялась от каждого переизмерения и тянула за собой
     * эффект. Но тот же механизм возвращал прокрутку на заданное место и
     * позже, отменяя всё, что человек успел сделать, — колесо, стрелку,
     * команду через `ref`.
     *
     * Теперь повтор ограничен доставкой: ждём, пока диапазон вместит цель или
     * перестанет расти, ставим — и больше проп сам по себе не вмешивается.
     */
    /*
     * «Первый рендер» — это не первый кадр, а всё время, пока прокручивать
     * ещё нечего: до этого момента любая позиция ставится сразу, без анимации,
     * потому что ехать неоткуда. Кадр отсрочки нужен от двойного вызова в
     * StrictMode.
     */
    React.useEffect(() => {
      if (!firstRender.current) return;
      if (maxScrollSize[0] <= 0 && maxScrollSize[1] <= 0) return;

      const id = requestAnimationFrame(() => (firstRender.current = false));
      return () => cancelAnimationFrame(id);
    }, [maxScrollSize.join()]);

    /*
     * Позиция открытия — один раз за жизнь скролла, без анимации и без
     * повторов: `initialPosition` говорит, откуда начать, и ничего больше.
     * Дожидаться измерения не нужно, этим занят сам первый рендер.
     */
    React.useEffect(() => {
      if (!initialTarget) return;

      applyScrollPositionRef.current(initialTarget, 0, false);
    }, []); // именно на монтирование: значение позже не читается

    /*
     * А это правило, а не движение: контент дорос — едем за ним. От ушедшего
     * читать историю его бережёт `respectUserScroll`.
     */
    React.useEffect(() => {
      if (!stickLocal[0] && !stickLocal[1]) return;

      applyScrollPositionRef.current(
        [stickLocal[0] ? "end" : null, stickLocal[1] ? "end" : null],
        duration,
        true,
      );
    }, [
      stickLocal.join(),
      endObjectsWrapper.w,
      endObjectsWrapper.h,
      duration,
    ]);

    React.useImperativeHandle(
      ref,
      () => ({
        scrollTo: (target, options) =>
          applyScrollPosition(
            resolveScrollTarget(target),
            options?.duration ?? duration,
            false,
          ),

        /*
         * Те же два действия, что библиотека делает по своим триггерам, но
         * названные наружу. Опрашивать геймпад, слушать пульт или разбирать
         * свои горячие клавиши — не её дело: устройство знает приложение, а
         * `reason` довозит это знание до `onNavigate` нетронутым.
         */
        step: (side, options) =>
          handleArrowLocal(side, options?.reason ?? "arrows"),

        pan: (delta, options) => {
          const scrollEl = scrollElementRef.current;
          if (!scrollEl) return;

          if (options?.reason) markNavigate(options.reason);

          const moveDuration = options?.duration ?? duration;

          if (delta.x)
            smoothScrollLocal(scrollEl.scrollLeft + delta.x, "x", moveDuration);
          if (delta.y)
            smoothScrollLocal(scrollEl.scrollTop + delta.y, "y", moveDuration);
        },

        moveFocus: (side, options) =>
          moveFocusLocal(
            side,
            options?.reason ?? "keys",
            options?.duration ?? duration,
          ),
      }),
      [
        applyScrollPosition,
        duration,
        handleArrowLocal,
        moveFocusLocal,
        smoothScrollLocal,
        markNavigate,
      ],
    );

    // эффект запускается раз при старте
    React.useEffect(() => {
      const animationFrameId = scrollStateRef.current.animationFrameId;

      onScrollingChange?.(false); // стартовое состояние


      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (scrollStateRef.current.animationFrameId)
          cancelAnimationFrame(scrollStateRef.current.animationFrameId);

        raf.cancel();
        rafScrollAnim.cancel();

        /*
         * Раньше здесь нельзя было чистить задачи: менеджер был общий, и
         * `cancelTask()` убивал финал прокрутки у всех скроллов страницы.
         * Теперь менеджер свой, так что снимаем только собственные задачи —
         * вместе с оборванным жестом и курсорным замком.
         */
        tasks.clear();
        pointerRuntime.destroy();
      };
    }, []);

    // регистрация контейнера для auto drag scroll
    React.useEffect(() => {
      if (!autoScrollOnDrag) return;

      const parent = customScrollRef.current;
      const element = scrollElementRef.current;
      if (!parent || !element) return;

      const container = {
        parent,
        element,
        direction,
      };

      registerContainer(container);

      return () => {
        unregisterContainer(container);
      };
    }, [autoScrollOnDrag, direction]);

    // установка слушателя нажатия на обертку
    React.useEffect(() => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return;

      /*
       * С нативным скроллбаром (`progressElement: true`) сам бегунок остаётся
       * частью элемента прокрутки, и нажатие по нему не должно превращаться в
       * перенос контента. Раньше ради этого перенос отключали целиком — то
       * есть `drag: true` рядом с `progressElement: true` просто не работал.
       * Отсекаем только полосу: clientWidth/clientHeight её не включают.
       */
      const isOnNativeBar = (event: PointerEvent) => {
        if (!barLocal.native) return false;

        const rect = scrollEl.getBoundingClientRect();
        return (
          event.clientX > rect.left + scrollEl.clientWidth ||
          event.clientY > rect.top + scrollEl.clientHeight
        );
      };

      const handler = (event: PointerEvent) => {
        if (isOnNativeBar(event)) return;

        onMouseOrTouchDown("wrapp", event);
      };

      // сложное условие...
      if (
        controlsLocal.drag ||
        (!controlsLocal.drag &&
          isTouchedRef.current &&
          controlsLocal.wheel)
      )
        scrollEl.addEventListener("pointerdown", handler);

      return () => {
        scrollEl.removeEventListener("pointerdown", handler);
      };
    }, [controlsST, onMouseOrTouchDown]);

    // установка слушателя нажатия на scrollContentRef
    React.useEffect(() => {
      const el = scrollContentRef.current;
      if (!el || !barLocal.showOnHover) return;

      if (!scrollBarsRef.current.size) return;

      const handler = (event: PointerEvent | MouseEvent) => {
        // динамический mouseup в таком виде помог решить проблему с исчезновением и залипанием thumb
        if (event.type === "mouseenter")
          document.removeEventListener("mouseup", handler);
        if (event.type === "mouseleave" && clickedObject.current) {
          document.addEventListener("mouseup", handler);
          return;
        }

        Array.from(scrollBarsRef.current).forEach((el) => {
          hoverHandler({
            el,
            event,
            tasks,
            isScrolling: isScrollingRef,
          });
        });
      };

      const listenersHandler = (
        type: "addEventListener" | "removeEventListener",
        fn: (event: any) => void,
      ) => {
        if (isTouchedRef.current) {
          Array.from(scrollBarsRef.current).forEach((el) =>
            el[type]("pointerdown", fn),
          ); // на сам thumb
          document[type]("pointerup", fn);
          document[type]("pointercancel", fn);
        } else {
          el[type]("mouseenter", fn);
          el[type]("mouseleave", fn);
        }
      };

      listenersHandler("addEventListener", handler);

      return () => {
        listenersHandler("removeEventListener", handler);
      };
    }, [
      barLocal.showOnHover,
      mode,
      // почему-то при изменении direction отваливается ивент
      direction,
      scrollBarsRef.current.size,
    ]);

    // отделил потому что size может вычисляться позже при "auto"
    React.useEffect(() => {
      if (mode === "scroll") return;
      raf.schedule("sliderCheckLocal", sliderCheckLocal);
    }, [mode, sliderCheckLocal, sizeLocal.join()]);

    /*
     * Стартовую страницу надо запомнить до первого перехода, иначе первому
     * же нажатию стрелки не с чем будет сравниться и оно потеряется.
     */
    React.useEffect(() => {
      if (!onNavigate) return;

      raf.schedule("navigateStart", () => {
        pageRef.current = { x: pageNow("x"), y: pageNow("y") };
      });
    }, [!!onNavigate, pageNow, sizeLocal.join()]);

    // ♦ contents
    const scrollObjectWrapper = React.useCallback(
      (
        key: string,
        elementTop?: number,
        left?: number,
        children?: React.ReactNode,
        visibility?: number | null,
      ) => {
        /*
         * Сторону задаём только ту, которую объект себе не выбирает: за
         * остальным его и меряют. Разложено абсолютно — в потоке ни колонок
         * разной высоты, ни строк разной ширины не собрать.
         */
        const sidePx = (axis: 0 | 1) => {
          const px = isEach ? eachFixed[axis] : objectsSizeLocal[axis];

          return px ? `${px}px` : undefined;
        };

        const wrapStyle: React.CSSProperties = {
          width: sidePx(0),
          height: sidePx(1),
          ...((renderLocal.mode || isEach) && {
            position: "absolute",
            transform: `translate(${left}px, ${elementTop}px)`,
          }),
          ...(typeof visibility === "number" && {
            [CONST.CONTENT_VISIBILITY_VAR]: visibility,
          }),
        };

        const content = suspending ? (
          <React.Suspense fallback={fallbackLocal}>{children}</React.Suspense>
        ) : (
          children
        );

        return (
          <div
            key={key}
            {...(renderLocal.mode || emptyObjectsLocal
              ? {
                  [CONST.WRAP_ATR]: `${key}`,
                }
              : {})}
            ref={isEach ? sizes.refFor(key) : undefined}
            className="ms-object-box"
            style={wrapStyle}
            onClick={emptyObjectsLocal ? updateEmptyKeysClickLocal : undefined}
          >
            {content}
          </div>
        );
      },
      [
        suspending,
        !!fallbackLocal, // просто проверка на наличие, но не на изменение, думаю этого достаточно
        objectsSizeLocal[0],
        objectsSizeLocal[1],
        renderST,
        emptyObjectsST,
        objectsPerDirection[0],
        updateEmptyKeysClickLocal,
        renderLocal.mode,
        isEach,
        eachFixed.join(),
        sizes,
      ],
    );

    const childrenMap = React.useMemo(() => {
      const m = new Map<string, React.ReactElement>();
      childrenArray.forEach((ch) => {
        if (React.isValidElement(ch) && ch.key != null)
          m.set(childKey(String(ch.key)), ch);
      });
      return m;
    }, [childrenArray]);

    const renderChild = (
      key: string,
      index: number,
      scrollLeft: number,
      scrollTop: number,
    ) => {
      // ищем реальный child по ключу
      const child = childrenMap.get(key);

      // обработка детей когда их лучше не показывать
      const childRenderOnScroll =
        renderLocal.stopLoadOnScroll &&
        isScrollingRef.current &&
        !objectsKeys.current.loaded.has(key)
          ? fallbackLocal
          : objectsKeys.current.empty?.has(key)
            ? (emptyObjectsLocal?.fallback ?? fallbackLocal)
            : child;

      // доп обработка для ResizeTracker
      const childLocal =
        (objectsSizing[0] === "firstChild" ||
          objectsSizing[1] === "firstChild") &&
        index === 0 ? (
          // for first child
          <ResizeTracker onResize={childResize}>
            {childRenderOnScroll}
          </ResizeTracker>
        ) : (
          childRenderOnScroll
        );

      // ===== NO VIRTUAL =====
      if (!renderLocal.mode && !isEach)
        return scrollObjectWrapper(key, 0, 0, childLocal);

      /*
       * Курица и яйцо: при `objectsSize: "firstChild"` размер ячейки берётся
       * из первого ребёнка, а он завёрнут в ResizeTracker внутри этой же
       * функции. Пока размер неизвестен, все координаты нулевые, проверка
       * видимости даёт 0, и первый ребёнок не рендерится — значит и не
       * измеряется. Список так и оставался пустым.
       *
       * Поэтому первого ребёнка показываем безусловно, пока мерять нечего.
       */
      if (needsFirstChildMeasure && index === 0)
        return scrollObjectWrapper(key, 0, 0, childLocal);

      // обработка виртуализации
      const { top, bottom, left, right } = memoizedChildrenData[index];

      if (isEach) {
        /*
         * Неизмеренный объект надо нарисовать, иначе мерить нечего — но не
         * всех сразу: тысяча карточек в первом кадре и есть та задержка,
         * ради которой всё это делается. Рисуем очередную пачку за уже
         * измеренными, остальные ждут своей.
         */
        if (!packed.items[index]?.measured)
          return index < packed.measuredPrefix + CONST.MEASURE_BATCH
            ? scrollObjectWrapper(key, top, left, childLocal)
            : null;

        // размер известен: дальше или обычная отрисовка, или общая виртуализация
        if (!renderLocal.mode)
          return scrollObjectWrapper(key, top, left, childLocal);
      }

      // проверка видимости
      const getVisibilityRatio = (withRootMargin: boolean = true): number => {
        const rootMarginLocal = withRootMargin ? mRootLocal : [0, 0, 0, 0];

        const checkAxis = (dir: "x" | "y") => {
          const viewportStart = dir === "x" ? scrollLeft : scrollTop;
          const viewportEnd =
            viewportStart + (dir === "x" ? sizeLocal[0] : sizeLocal[1]);

          /*
           * rootMargin приходит в CSS-порядке [top, right, bottom, left], но
           * растягиваем мы бокс элемента, а не вьюпорт, поэтому стороны идут
           * крест-накрест: что бы дотянуться до того, что ниже/правее, надо
           * растянуть начало бокса — туда уходит bottom/right, а в конец
           * top/left. По оси x стороны были перепутаны местами.
           */
          const [marginBefore, marginAfter] =
            dir === "x"
              ? [rootMarginLocal[3], rootMarginLocal[1]]
              : [rootMarginLocal[0], rootMarginLocal[2]];

          const elStart = (dir === "x" ? left : top) - marginAfter;
          const elEnd = (dir === "x" ? right : bottom) + marginBefore;

          const elementSize = elEnd - elStart;
          if (elementSize <= 0) return 0;

          const visible =
            Math.min(elEnd, viewportEnd) - Math.max(elStart, viewportStart);

          if (visible <= 0) return 0;

          // округляем
          return Math.round(Math.min(1, visible / elementSize) * 10) / 10;
        };

        if (direction === "hybrid") {
          const x = checkAxis("x");
          const y = checkAxis("y");
          return Math.min(x, y);
        }

        return direction === "x" ? checkAxis("x") : checkAxis("y");
      };
      const visibilityRatio = getVisibilityRatio();
      const visibilityRatioWithoutMargin = renderLocal.trackVisibility
        ? getVisibilityRatio(false)
        : null;

      // - LAZY -
      if (renderLocal.mode === "lazy") {
        /*
         * Раньше только что ставший видимым элемент попадал в loaded, но этот
         * же проход всё равно возвращал null — элемент появлялся лишь на
         * следующем рендере. В приложении тик приходил быстро и это выглядело
         * морганием, а на первом кадре список был просто пустым.
         */
        if (!objectsKeys.current.loaded.has(key)) {
          if (!visibilityRatio) return null;

          // откладываем первую отрисовку пока идёт прокрутка
          if (isScrollingRef.current && renderLocal.stopLoadOnScroll)
            return null;

          objectsKeys.current.loaded.add(key);
        }

        return scrollObjectWrapper(
          key,
          top,
          left,
          childLocal,
          visibilityRatioWithoutMargin,
        );
      }

      // - VIRTUAL -
      if (!visibilityRatio) {
        objectsKeys.current.loaded.delete(key); // удаляем из loaded
        return null;
      }

      return scrollObjectWrapper(
        key,
        top,
        left,
        childLocal,
        visibilityRatioWithoutMargin,
      );
    };

    const getEdgeOrArrowData = React.useMemo(
      () => [
        {
          positionType: direction === "x" ? "left" : "top",
          visibility: isNotAtStart,
        },
        {
          positionType: direction === "x" ? "right" : "bottom",
          visibility: isNotAtEnd,
        },
        ...(direction === "hybrid"
          ? [
              { positionType: "left", visibility: isNotAtStartX },
              { positionType: "right", visibility: isNotAtEndX },
            ]
          : []),
      ],
      [isNotAtStart, isNotAtEnd, direction, isNotAtStartX, isNotAtEndX],
    );

    const containerStyle = React.useMemo(
      (): React.CSSProperties => ({
        // стрелки позиционируются внутри компонента — без этого они уезжали
        // к любому позиционированному предку выше по дереву
        position: "relative",
        width: `${sizeLocal[2]}px`,
        height: `${sizeLocal[3]}px`,
      }),
      [sizeLocal],
    );

    const overflowStyleValue = React.useMemo(() => {
      const map = {
        x: objectsWrapperWidthFull > sizeLocal[0] ? "scroll hidden" : "hidden",
        y: objectsWrapperHeightFull > sizeLocal[1] ? "hidden scroll" : "hidden",
        hybrid: `${
          objectsWrapperWidthFull > sizeLocal[0] ? "scroll" : "hidden"
        } ${objectsWrapperHeightFull > sizeLocal[1] ? "scroll" : "hidden"}`,
        hide: "hidden",
      };
      return (
        map[
          controlsLocal.wheel ||
          (controlsLocal.drag && mode === "scroll")
            ? direction
            : "hide"
        ] ?? "hidden"
      );
    }, [
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
      sizeLocal,
      controlsST,
      direction,
    ]);

    const edgesJSX = React.useMemo(() => {
      if (!edge) return null;

      return getEdgeOrArrowData.map(({ positionType, visibility }) => (
        <Edge
          key={`edge-${positionType}`}
          element={edgeElement}
          visibility={visibility}
          edgeType={positionType as "left" | "right" | "top" | "bottom"}
        />
      ));
    }, [edgeST, getEdgeOrArrowData, edgeElement, sizeST]);

    const arrowsJSX = React.useMemo(() => {
      if (!controlsLocal.arrows) return null;

      return getEdgeOrArrowData.map(({ positionType, visibility }) => (
        <Arrow
          key={`arrow-${positionType}`}
          visibility={visibility}
          arrows={arrowsLocal}
          arrowType={positionType as handleArrowT["arrowType"]}
          handleArrow={handleArrowLocal}
        />
      ));
    }, [controlsST, getEdgeOrArrowData, arrowsLocal, handleArrowLocal]);

    const scrollBarConfigs = () => {
      const isNotX = direction !== "x";

      const base: any[] = [
        {
          shouldRender: fullHeightOrWidth > sizeLocal[isNotX ? 1 : 0],
          direction,
          thumbSize: isNotX ? thumbSizeMemo.y : thumbSizeMemo.x,
          thumbSpace: isNotX ? thumbSpace.y : thumbSpace.x,
          objLengthPerSize: objLengthPerSizeXY,
          progressReverseIndex: 0,
        },
        {
          shouldRender:
            direction === "hybrid" && objectsWrapperWidthFull > sizeLocal[0],
          direction: "x" as const,
          thumbSize: thumbSizeMemo.x,
          thumbSpace: thumbSpace.x,
          objLengthPerSize: objLengthPerSize[0],
          progressReverseIndex: 1,
        },
      ];

      return base.filter(({ shouldRender }) => shouldRender);
    };

    const scrollBarsJSX = () => {
      // нативный скроллбар браузера рисует себя сам
      if (!barLocal.present || barLocal.native) return null;

      return scrollBarConfigs().map((args) => {
        /*
         * Половину пары выбирает ось самого бара, а не его место в списке:
         * первый бар бывает и горизонтальным — при `direction="x"`, — и тогда
         * по индексу ему доставались настройки вертикального.
         */
        const axis = args.direction === "x" ? 0 : 1;

        return (
          <ScrollBar
            key={args.direction}
            mode={mode}
            direction={args.direction}
            element={barLocal.element}
            reverse={barLocal.reverse[axis]}
            edgeGap={barLocal.edgeGap[axis]}
            showOnHover={barLocal.showOnHover}
            size={sizeMinusEdge}
            controls={[controlsLocal, controlsST]}
            scrollBarEvent={
              mode === "sliderMenu" ? smoothScrollLocal : onMoveScrollThumb
            }
            thumbSize={args.thumbSize}
            thumbSpace={args.thumbSpace}
            objLengthPerSize={args.objLengthPerSize}
            sliderCheckLocal={sliderCheckLocal}
            markNavigate={markNavigate}
            duration={duration}
            isTouched={isTouchedRef.current}
            scrollStateRef={scrollStateRef}
            scrollEl={scrollElementRef}
            scrollBarsRef={scrollBarsRef}
            triggerUpdate={triggerRAF}
            overscroll={overscrollRef}
            maxScrollSize={maxScrollSize}
          />
        );
      });
    };

    // objects wrapper - рендерим только видимые элементы при виртуализации
    const objectsWrapper = () => {
      const scrollLeft = scrollElementRef.current?.scrollLeft || 0;
      const scrollTop = scrollElementRef.current?.scrollTop || 0;

      return (
        <div
          className="ms-objects-wrapper"
          ref={objectsWrapperRef}
          style={{
            ...wrapperStyle,
            ...((overscrollRef.current.x || overscrollRef.current.y) && {
              transform: `translate(${overscrollRef.current.x}px, ${overscrollRef.current.y}px)`,
            }),
            ...(isDraggingRef.current && { pointerEvents: "none" }), // отключаем pointerEvents при перетаскивании что бы не было проблем с захватом thumb
          }}
        >
          {validChildrenKeys.map((key, i) =>
            renderChild(key, i, scrollLeft, scrollTop),
          )}
        </div>
      );
    };

    const contentBoxStyle = React.useMemo(() => {
      const base: any = {
        position: "relative",
        width: `${sizeLocal[0]}px`,
        height: `${sizeLocal[1]}px`,
      };

      if (
        controlsLocal.arrows &&
        arrowsLocal.reserveSpace &&
        arrowsLocal.size
      ) {
        if (direction === "x") base.left = `${arrowsLocal.size}px`;
        else if (direction === "y") base.top = `${arrowsLocal.size}px`;
        else {
          base.top = `${arrowsLocal.size}px`;
          base.left = `${arrowsLocal.size}px`;
        }
      }

      return base;
    }, [sizeLocal, controlsST, arrowsLocal, direction]);

    const content = (
      <div
        /*
         * Атрибут — маркер присутствия: autoScrollRegistry ищет ближайший
         * `[morph-scroll]`, значение никто не читает. Печатать сюда id нельзя —
         * он из модульного счётчика, на сервере и на клиенте счёт разный, и
         * гидрация ловила несовпадение атрибутов. id остаётся в текстах ошибок.
         */
        morph-scroll=""
        className={className}
        ref={customScrollRef}
        style={containerStyle}
      >
        <div
          className="ms-content"
          ref={scrollContentRef}
          style={{
            ...contentBoxStyle,
            transform: "translateZ(0)", // помогает оптимизировать отображение
            // блокируем touch оставляя только zoom (тут что бы захватить thumb)
            ...(isTouchedRef.current && {
              touchAction: "pinch-zoom",
            }),
          }}
        >
          <div
            className="ms-viewport"
            ref={scrollElementRef}
            onScroll={handleScroll}
            tabIndex={0} // ! для работы событий onKeyDown и onKeyUp
            style={{
              width: "100%",
              height: "100%",
              outline: "none",
              ...wrapperAlignLocal,
              ...(!barLocal.native
                ? {
                    scrollbarWidth: "none",
                    overflow: "hidden",
                  }
                : { overflow: overflowStyleValue }),
              ...(controlsLocal.drag && { cursor: "grab" }),
            }}
          >
            {objectsSizeLocal[0] && objectsSizeLocal[1] ? (
              objectsWrapper()
            ) : (
              <ResizeTracker onResize={wrapResize} style={wrapperAlignLocal}>
                {objectsWrapper()}
              </ResizeTracker>
            )}
          </div>

          {edgesJSX}
          {scrollBarsJSX()}
        </div>

        {arrowsJSX}
      </div>
    );

    if (size === "auto") {
      return (
        <ResizeTracker measure="outer" onResize={scrollResize}>
          {content}
        </ResizeTracker>
      );
    } else {
      return content;
    }
  },
);

MorphScroll.displayName = "MorphScroll";
export default MorphScroll;

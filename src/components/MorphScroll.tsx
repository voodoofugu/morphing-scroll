import React from "react";

import type {
  BarConfig,
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
  NavigateReason,
  ProgressTriggerConfig,
  Vec2,
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
import createScrollDirTracker from "../helpers/createScrollDirTracker";
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

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***MorphScroll***:
 * the main component of the library, responsible for displaying your data.
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
      scrollPosition,
      onScrollPosition,
      onScrollingChange,
      onNavigate,
      onRenderedKeysChange,

      // Visual Settings
      size,
      objectsSize,
      crossCount,
      gap,
      wrapper,
      objectsAlign,
      objectsDirection = "row",
      edge,

      // Progress Bar
      progressTrigger = { wheel: true },

      // Optimization
      render,
      emptyObjects,
      suspending = false,
      fallback,

      // Additional
      autoScrollOnDrag,
    },
    ref,
  ) {
    // ♦ hooks
    const triggerUpdate = useUpdate();
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
    if (
      (objectsSize === "none" ||
        (Array.isArray(objectsSize) &&
          (objectsSize[0] === "none" || objectsSize[1] === "none"))) &&
      render
    )
      console.error(
        `"render" prop is incompatible with objectsSize="none"${errorTextEnd}`,
      );

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
    const scrollDirTrackerRef = React.useRef(createScrollDirTracker()); // стабилизируем вызов
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
      scrollPositionST,
      renderST,
      sizeST,
      objectsSizeST,
      emptyObjectsST,
      wrapperST,
      gapST,
      progressTriggerST,
      objectsKeysEmptyST,
      edgeST,
    ] = stabilize(
      scrollPosition,
      render,
      size,
      objectsSize,
      emptyObjects,
      wrapper,
      gap,
      progressTrigger,
      objectsKeys.current.empty,
      edge,
    );

    /*
     * Короткая форма приводится к объектной один раз: дальше по компоненту
     * `progressTriggerLocal` всегда объект, и ветвлений на строку/массив нет.
     */
    const progressTriggerLocal = React.useMemo(() => {
      if (typeof progressTrigger === "string")
        return { [progressTrigger]: true };

      if (Array.isArray(progressTrigger))
        return Object.fromEntries(progressTrigger.map((name) => [name, true]));

      return progressTrigger;
    }, [progressTriggerST]) as ProgressTriggerConfig;

    if (Object.keys(progressTriggerLocal).length === 0)
      console.error(errorText("progressTrigger"));

    // ♦ default
    const scrollPositionLocal = React.useMemo(() => {
      let value: (number | "end" | null)[] = [null];
      let duration = 200;

      if (scrollPosition != null) {
        if (
          typeof scrollPosition === "object" &&
          !Array.isArray(scrollPosition)
        ) {
          value = resolveScrollTarget(scrollPosition.value);
          duration = scrollPosition.duration ?? 200;
        } else {
          value = resolveScrollTarget(scrollPosition);
        }
      }

      return { value, duration };
    }, [scrollPositionST]);

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
      const bar = progressTriggerLocal.bar;

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
        /** есть ли вообще что показывать */
        present: !!bar,
        /** `true` — отдаём работу нативному скроллбару браузера */
        native: bar === true,
        edgeGap: pair(config.edgeGap, 0),
        // трек укорачивается с обоих концов, отсюда удвоение
        trackGap: [gapX * 2, gapY * 2] as [number, number],
        reverse: pair(config.reverse, false),
        showOnHover: config.showOnHover ?? false,
        thumbMinSize: config.thumbMinSize ?? 30,
      };
    }, [progressTriggerST]);

    const arrowsLocal = React.useMemo(() => {
      const arrows = progressTriggerLocal.arrows;
      const base = { size: defaultSize, reserveSpace: true, loop: false };

      if (React.isValidElement(arrows)) return { ...base, element: arrows };

      if (typeof arrows === "object" && arrows !== null)
        return { ...base, ...arrows };

      return base;
    }, [progressTriggerST]);

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
        !progressTriggerLocal.arrows ||
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
      progressTriggerST,
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

    const objectsSizing = React.useMemo(
      () =>
        objectsSize
          ? !Array.isArray(objectsSize)
            ? argsFormatter(objectsSize, true, 2)
            : objectsSize
          : [null, null],

      [objectsSizeST],
    );

    const objectsSizeLocal = React.useMemo(() => {
      const { height, width } = receivedChildSizeRef.current;

      const getSize = (
        val: number | "none" | "firstChild" | "full" | null,
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

    const objectsWrapperWidth = React.useMemo(() => {
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
    ]);

    const objectsWrapperHeight = React.useMemo(() => {
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
        progressTriggerST,
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
          !renderLocal.mode && { gap: `${gapLocal[0]}px ${gapLocal[1]}px` }),
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

      if (renderLocal.mode) {
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
    ]);

    // ♦ events
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
         * Мышью по ссылке или кнопке не скроллим: там drag — это выделение текста
         * и нативный drag ссылки, а не прокрутка.
         *
         * Пальцем наоборот. Список, целиком собранный из ссылок или кнопок —
         * меню, лента карточек, — должен скроллиться с любой точки, как нативный:
         * палец попадает по пункту, а не между ними. Тап от скролла там отличает
         * расстояние, а не то, куда попали: до 2px это тап и click проходит,
         * дальше поднимается isDraggingRef, ms-objects-wrapper получает
         * pointer-events: none, и click уже не случится.
         */
        if (!isTouchedRef.current && target.closest("button, a")) return;

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
          duration: scrollPositionLocal.duration,
          scrollBarEdge: barLocal.trackGap,
          rafScrollAnim,
          isTouched: isTouchedRef.current,
          gap: gapLocal,
          overscrollRef,
          objLengthPerSize,
          isDraggingRef,
          maxScrollSize,
          pointerId: event.pointerId,
          runtime: pointerRuntime,
          tasks,
        });
      },

      [
        direction,
        mode,
        sizeLocal.join(),
        scrollPositionLocal.duration,
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
    const pending = React.useRef<{
      reason: NavigateReason;
      from: { x: number | null; y: number | null };
    } | null>(null);
    const pageRef = React.useRef<{ x: number | null; y: number | null }>({
      x: null,
      y: null,
    });

    const pageNow = React.useCallback(
      (axis: "x" | "y") => {
        const el = scrollElementRef.current;
        if (!el) return null;

        return axis === "x"
          ? pageAt(el.scrollLeft, el.clientWidth, gapLocal[0])
          : pageAt(el.scrollTop, el.clientHeight, gapLocal[1]);
      },
      [gapLocal[0], gapLocal[1]],
    );

    /*
     * Страницу отправления запоминаем прямо здесь, в момент нажатия: это и
     * есть то место, где пользователь ещё стоял. Полагаться на последнюю
     * записанную страницу нельзя — если нажать сразу после монтирования,
     * записать её ещё не успели, и первое же событие пропало бы.
     */
    const markNavigate = React.useCallback(
      (reason: NavigateReason) => {
        pending.current = {
          reason,
          from: { x: pageNow("x"), y: pageNow("y") },
        };
      },
      [pageNow],
    );

    /** скролл встал — сверяем страницу с той, с которой уехали */
    const reportNavigate = React.useCallback(() => {
      const tagged = pending.current;
      pending.current = null;

      for (const axis of ["x", "y"] as const) {
        const now = pageNow(axis);
        if (now === null) continue;

        const before = tagged ? tagged.from[axis] : pageRef.current[axis];
        pageRef.current[axis] = now;

        if (before === null || before === now) continue;

        // в обычном скролле страниц нет — их листают только стрелки
        if (mode === "scroll" && !tagged) continue;

        onNavigate?.({
          reason: tagged ? tagged.reason : "scroll",
          axis,
          from: before,
          to: now,
        });
      }
    }, [mode, onNavigate, pageNow]);

    const handleArrowLocal = React.useCallback(
      (arrowType: handleArrowT["arrowType"]) => {
        if (!scrollElementRef.current) return;

        const moved = handleArrow({
          arrowType: arrowType,
          scrollElement: scrollElementRef.current,
          wrapSize: [objectsWrapperWidthFull, objectsWrapperHeightFull],
          scrollSize: sizeLocal,
          smoothScroll: smoothScrollLocal,
          duration: scrollPositionLocal.duration,
          loop: arrowsLocal.loop,
          gap: gapLocal,
        });

        // упёрлись в край без loop — никуда не поехали, и метку ставить не за что
        if (moved) markNavigate("arrows");
      },

      [
        sizeLocal.join(),
        objectsWrapperWidthFull,
        objectsWrapperHeightFull,
        scrollPositionLocal.duration,
        smoothScrollLocal,
        arrowsLocal.loop,
        gapLocal[0],
        gapLocal[1],
        markNavigate,
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

        if (scrollPositionLocal.value.includes("end")) {
          // если есть "end" устанавливаем параметры scrollDirTrackerRef
          const { scrollLeft, scrollTop } = event.currentTarget;
          scrollDirTrackerRef.current.update(scrollLeft, scrollTop);
        }

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
            scrollDirTrackerRef.current.reset(); // сброс
            isScrollingRef.current = false;
            mainEl.removeAttribute(CONST.SCROLLING_ATR);
            onScrollingChange?.(false);
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
        scrollPositionLocal.value.join(), // читается внутри для трекера "end"
      ],
    );

    const onKeyDown = React.useCallback(
      (e: KeyboardEvent) => {
        if (keyDownX.current) return; // ранний выход

        const keyName =
          typeof progressTriggerLocal.wheel === "object" &&
          typeof progressTriggerLocal.wheel.changeDirectionBtn === "string"
            ? progressTriggerLocal.wheel.changeDirectionBtn
            : "KeyX";

        if (e.code === keyName && direction === "hybrid" && !keyDownX.current) {
          // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
          e.stopPropagation();
          keyDownX.current = true;
          triggerRAF();
        }
      },

      [direction, progressTriggerST],
    );
    const onKeyUp = React.useCallback((e: KeyboardEvent) => {
      if (keyDownX.current) {
        // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
        e.stopPropagation();
        keyDownX.current = false;
        triggerRAF();
      }
    }, []);

    // TODO
    // const onArrowKey = React.useCallback(
    //   (e: KeyboardEvent) => {
    //     raf.schedule(() => {
    //       const keyMap: Record<string, "top" | "bottom" | "left" | "right"> = {
    //         ArrowDown: "bottom",
    //         Down: "bottom",
    //         ArrowUp: "top",
    //         Up: "top",
    //         ArrowLeft: "left",
    //         Left: "left",
    //         ArrowRight: "right",
    //         Right: "right",
    //       };

    //       const dir = keyMap[e.key];
    //       if (!dir) return;

    //       if (direction === "x" && (dir === "top" || dir === "bottom")) return;
    //       if (direction === "y" && (dir === "left" || dir === "right")) return;

    //       handleArrowLocal(dir);
    //     });
    //   },
    //   [handleArrowLocal, direction],
    // );

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
      if (isTouchedRef.current || direction !== "hybrid") return;

      const wrapperEl = objectsWrapperRef.current;
      const scrollEl = scrollElementRef.current;
      if (!wrapperEl || !scrollEl) return;

      if (
        wrapperEl.clientWidth! + mLocalX > scrollEl.clientWidth! &&
        wrapperEl.clientHeight! + mLocalY > scrollEl.clientHeight!
      ) {
        scrollEl.addEventListener("keydown", onKeyDown);
        scrollEl.addEventListener("keyup", onKeyUp);
      }

      return () => {
        scrollEl.removeEventListener("keydown", onKeyDown);
        scrollEl.removeEventListener("keyup", onKeyUp);
      };
    }, [
      direction,
      progressTriggerST,
      // при изменении размеров
      sizeST,
      objectsSizeST,
      // при изменении количества детей
      validChildrenKeys.join(),
      mLocalX,
      mLocalY,
    ]);

    // TODO
    // React.useEffect(() => {
    //   // эффект для нажатия стрелок
    //   if (isTouchedRef.current) return;

    //   const scrollEl = scrollElementRef.current;
    //   if (!scrollEl) return;

    //   scrollEl.addEventListener("keydown", onArrowKey);

    //   return () => {
    //     scrollEl.removeEventListener("keydown", onArrowKey);
    //   };
    // }, [onArrowKey]);

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
        typeof progressTriggerLocal.wheel === "object" &&
        progressTriggerLocal.wheel.changeDirection
          ? "x"
          : direction;

      const directionForWheel =
        (direction === "hybrid" &&
          objectsWrapperHeight + mLocalY <= sizeLocal[1]) ||
        keyDownX.current
          ? // уточнение был ли применён changeDirection что бы клавиша меняла уже его направление
            ["hybrid", "y"].includes(directionWithPriority)
            ? "x"
            : "y"
          : directionWithPriority;

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

      progressTriggerLocal.wheel &&
        scrollEl.addEventListener("wheel", wheelHandler, { passive: false });

      return () => {
        scrollEl.removeEventListener("wheel", wheelHandler);
      };
    }, [
      direction,
      progressTriggerST,
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
              // если направление прокрутки было противоположным от "end" отменяем
              if (
                respectUserScroll &&
                scrollDirTrackerRef.current.get()[dir] ===
                  (dir === "x" ? "left" : "up")
              )
                return;

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

    // эффекты прокрутки
    React.useEffect(() => {
      applyScrollPosition(
        scrollPositionLocal.value,
        scrollPositionLocal.duration,
        true,
      );
    }, [
      applyScrollPosition,
      scrollPositionLocal.value.join(),
      scrollPositionLocal.duration,
    ]);

    React.useImperativeHandle(
      ref,
      () => ({
        scrollTo: (target, options) =>
          applyScrollPosition(
            resolveScrollTarget(target),
            options?.duration ?? scrollPositionLocal.duration,
            false,
          ),
      }),
      [applyScrollPosition, scrollPositionLocal.duration],
    );

    // эффект запускается раз при старте
    React.useEffect(() => {
      const animationFrameId = scrollStateRef.current.animationFrameId;

      onScrollingChange?.(false); // стартовое состояние

      // первый рендер
      requestAnimationFrame(() => (firstRender.current = false)); // RAF спасает от двойного вызова smoothScroll в StrictMode

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
       * есть `content: true` рядом с `progressElement: true` просто не работал.
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
        progressTriggerLocal.content ||
        (!progressTriggerLocal.content &&
          isTouchedRef.current &&
          progressTriggerLocal.wheel)
      )
        scrollEl.addEventListener("pointerdown", handler);

      return () => {
        scrollEl.removeEventListener("pointerdown", handler);
      };
    }, [progressTriggerST, onMouseOrTouchDown]);

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
        const wrapStyle: React.CSSProperties = {
          width: objectsSizeLocal[0] ? `${objectsSizeLocal[0]}px` : undefined,
          height: objectsSizeLocal[1] ? `${objectsSizeLocal[1]}px` : undefined,
          ...(renderLocal.mode && {
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
      if (!renderLocal.mode) return scrollObjectWrapper(key, 0, 0, childLocal);

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
          progressTriggerLocal.wheel ||
          (progressTriggerLocal.content && mode === "scroll")
            ? direction
            : "hide"
        ] ?? "hidden"
      );
    }, [
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
      sizeLocal,
      progressTriggerST,
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
      if (!progressTriggerLocal.arrows) return null;

      return getEdgeOrArrowData.map(({ positionType, visibility }) => (
        <Arrow
          key={`arrow-${positionType}`}
          visibility={visibility}
          arrows={arrowsLocal}
          arrowType={positionType as handleArrowT["arrowType"]}
          handleArrow={handleArrowLocal}
        />
      ));
    }, [progressTriggerST, getEdgeOrArrowData, arrowsLocal, handleArrowLocal]);

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
            progressTrigger={[progressTriggerLocal, progressTriggerST]}
            scrollBarEvent={
              mode === "sliderMenu" ? smoothScrollLocal : onMoveScrollThumb
            }
            thumbSize={args.thumbSize}
            thumbSpace={args.thumbSpace}
            objLengthPerSize={args.objLengthPerSize}
            sliderCheckLocal={sliderCheckLocal}
            markNavigate={markNavigate}
            duration={scrollPositionLocal.duration}
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
        progressTriggerLocal.arrows &&
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
    }, [sizeLocal, progressTriggerST, arrowsLocal, direction]);

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
              ...(progressTriggerLocal.content && { cursor: "grab" }),
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

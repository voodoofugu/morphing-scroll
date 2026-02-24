import React from "react";
import { MorphScrollT } from "../types/types";
import argsFormatter from "../helpers/argsFormatter";

import useIdent from "../hooks/useIdent";
import useUpdate from "../hooks/useUpdate";

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

import { setTask, cancelTask } from "../helpers/taskManager";
import createSchedulerRAF from "../helpers/createSchedulerRAF";
import createScrollDirTracker from "../helpers/createScrollDirTracker";
import filterValidChildren from "../helpers/filterValidChildren";
import stabilize from "../helpers/stabilize";

import CONST from "../constants";

const MorphScroll: React.FC<MorphScrollT> = ({
  // General Settings
  className,
  children,

  // Scroll Settings
  type = "scroll",
  direction = "y",
  scrollPosition,
  onScrollValue,
  isScrolling,

  // Visual Settings
  size,
  objectsSize,
  crossCount,
  gap,
  wrapperMargin,
  wrapperMinSize,
  wrapperAlign,
  elementsAlign,
  elementsDirection = "row",
  edgeGradient,

  // Progress Bar
  progressTrigger = { wheel: true },
  progressReverse = false,
  scrollBarOnHover = false,
  scrollBarEdge,
  thumbMinSize,

  // Optimization
  render,
  emptyElements,
  suspending = false,
  fallback,
}) => {
  // ♦ hooks
  const triggerUpdate = useUpdate();
  // const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");
  const id = useIdent();

  // ♦ helpers
  const raf = createSchedulerRAF();
  const triggerRAF = () => raf.schedule(triggerUpdate); // по-кадрово оптимизированный triggerUpdate
  const rafScrollAnim = createSchedulerRAF();

  // ♦ errors
  const errorText = (propName: string) =>
    `Prop "${propName}" is not provided\nmorph-scroll ${id}`;

  if (!size) throw new Error(errorText("size"));
  if (Object.keys(progressTrigger).length === 0)
    console.error(errorText("progressTrigger"));

  // ♦ refs
  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const scrollBarsRef = React.useRef<Set<HTMLElement>>(new Set());

  const isTouchedRef = React.useRef<boolean>(isTouchDevice());
  const firstRender = React.useRef<boolean>(true);
  const clickedObject = React.useRef<"thumb" | "wrapp" | "slider" | null>(null);
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
    emptyElementsST,
    wrapperMinSizeST,
    wrapperAlignST,
    gapST,
    progressTriggerST,
    objectsKeysEmptyST,
    scrollBarEdgeST,
  ] = stabilize(
    scrollPosition,
    render,
    size,
    objectsSize,
    emptyElements,
    wrapperMinSize,
    wrapperAlign,
    gap,
    progressTrigger,
    objectsKeys.current.empty,
    scrollBarEdge,
  );

  // ♦ default
  const scrollPositionLocal = React.useMemo(() => {
    let value: (number | "end" | null)[] = [null];
    let duration = 200;
    let updater: boolean | null = null;

    if (scrollPosition != null) {
      if (typeof scrollPosition === "number" || scrollPosition === "end") {
        value = [scrollPosition, scrollPosition];
      } else if (Array.isArray(scrollPosition)) {
        value = scrollPosition;
      } else if (typeof scrollPosition === "object") {
        const val = scrollPosition.value;
        if (typeof val === "number" || val === "end") value = [val, val];
        else if (Array.isArray(val)) value = val;

        duration = scrollPosition.duration ?? 200;
        updater = scrollPosition.updater ?? null;
      }
    }

    return { value, duration, updater };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollPositionST]);

  // ♦ variables
  const defaultSize = 40;
  const edgeGradientDefault = { color: null, size: defaultSize };
  const edgeGradientLocal = React.useMemo(() => {
    return typeof edgeGradient === "object"
      ? { ...edgeGradientDefault, ...edgeGradient }
      : typeof edgeGradient === "string"
        ? { color: edgeGradient, size: defaultSize }
        : edgeGradientDefault;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeGradient]);

  const arrowsLocal = React.useMemo(() => {
    const arrows = progressTrigger.arrows;
    const base = { size: defaultSize, contentReduce: true, loop: false };

    if (React.isValidElement(arrows)) return { ...base, element: arrows };

    if (typeof arrows === "object" && arrows !== null)
      return { ...base, ...arrows };

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          return String(child.key);
        }
        return null;
      })
      .filter((key): key is string => key !== null)
      .filter((key) => {
        if (emptyElements?.mode === "clear") {
          return !objectsKeys.current.empty?.has(key);
        }
        return true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, emptyElementsST, objectsKeysEmptyST]);

  const [mT, mR, mB, mL] = wrapperMargin
    ? argsFormatter(wrapperMargin)
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
      type: undefined as "lazy" | "virtual" | undefined,
      rootMargin: 0 as number | number[],
      stopLoadOnScroll: false,
      trackVisibility: false,
    };

    if (typeof render === "string") {
      return { ...base, type: render };
    }

    if (typeof render === "object" && render !== null) {
      const {
        type,
        rootMargin = base.rootMargin,
        stopLoadOnScroll = base.stopLoadOnScroll,
        trackVisibility = base.trackVisibility,
      } = render;
      return { type, rootMargin, stopLoadOnScroll, trackVisibility };
    }

    return base;
  }, [renderST]);

  const mRootLocal = React.useMemo(() => {
    return argsFormatter(renderLocal.rootMargin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      !progressTrigger.arrows ||
      !arrowsLocal.size ||
      !arrowsLocal.contentReduce
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sizeST,
    progressTriggerST,
    direction,
    arrowsLocal,
    receivedScrollSizeRef.current.height,
    receivedScrollSizeRef.current.width,
  ]);
  const xySize = direction === "x" ? sizeLocal[0] : sizeLocal[1];

  const scrollBarEdgeLocal = React.useMemo<[number, number]>(() => {
    if (!scrollBarEdge) return [0, 0];

    if (typeof scrollBarEdge === "number") {
      const val = scrollBarEdge * 2;
      return [val, val];
    }

    if (Array.isArray(scrollBarEdge)) {
      const [first = 0, second] = scrollBarEdge;
      return [first * 2, (second ?? first) * 2];
    }

    return [0, 0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollBarEdgeST]);

  const sizeMinusEdge = React.useMemo(() => {
    const x = sizeLocal[0] - scrollBarEdgeLocal[0];
    const y = sizeLocal[1] - scrollBarEdgeLocal[1];

    return [x, y];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollBarEdgeLocal.join(), sizeLocal[0], sizeLocal[1]]);

  const objectsSizing = React.useMemo(
    () =>
      objectsSize
        ? !Array.isArray(objectsSize)
          ? argsFormatter(objectsSize, true, 2)
          : objectsSize
        : [null, null],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objectsSizeST],
  );

  const objectsSizeLocal = React.useMemo(() => {
    const getSize = (
      val: number | "none" | "firstChild" | "size",
      receivedSize: number,
    ) =>
      typeof val === "number" ? val : val === "firstChild" ? receivedSize : 0;

    return [
      getSize(
        objectsSizing[0] &&
          objectsSizing[0] !== "none" &&
          objectsSizing[0] !== "size"
          ? objectsSizing[0]
          : (direction === "y" && objectsSizing[0] !== "none") ||
              objectsSizing[0] === "size"
            ? sizeLocal[0]
            : 0,
        receivedChildSizeRef.current.width,
      ),
      getSize(
        objectsSizing[1] &&
          objectsSizing[1] !== "none" &&
          objectsSizing[1] !== "size"
          ? objectsSizing[1]
          : (direction === "x" && objectsSizing[1] !== "none") ||
              objectsSizing[1] === "size"
            ? sizeLocal[1]
            : 0,
        receivedChildSizeRef.current.height,
      ),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    objectsSizing.join(),
    direction,
    receivedChildSizeRef.current.width,
    receivedChildSizeRef.current.height,
    sizeLocal.join(),
  ]);

  // ♦ calculations
  const objectsPerDirection = React.useMemo(() => {
    const isHorizontal = direction === "x";
    const isRow = elementsDirection === "row";
    const isColumn = elementsDirection === "column";

    const localObjSize = isHorizontal ? sizeLocal[1] : sizeLocal[0];
    const objectSize = isHorizontal
      ? objectsSizeLocal[1] + gapLocal[1]
      : objectsSizeLocal[0] + gapLocal[0];

    const neededMaxSize =
      direction === "hybrid"
        ? objectSize * (validChildrenKeys.length + 1) - objectSize
        : localObjSize;

    const objects = Math.floor(neededMaxSize / objectSize) || 1;
    // устанавливаем crossCount если он есть и если он меньше objects
    const objectsPerD =
      crossCount && crossCount <= objects
        ? direction === "hybrid"
          ? Math.ceil(objects / crossCount)
          : crossCount
        : objects;
    const childsLinePerD =
      objectsPerD > 1 && objectsPerD < validChildrenKeys.length
        ? Math.ceil(validChildrenKeys.length / objectsPerD)
        : objectsPerD > validChildrenKeys.length
          ? 1
          : validChildrenKeys.length;

    const useCrossCount = crossCount && crossCount < validChildrenKeys.length;

    const validated = (val: number): number =>
      Number.isFinite(val) && val > 0 ? val : 1;

    if (direction === "hybrid") {
      const x = useCrossCount
        ? isRow
          ? crossCount
          : objectsPerD
        : isRow
          ? validChildrenKeys.length
          : 1;

      const y = useCrossCount
        ? isColumn
          ? crossCount
          : objectsPerD
        : isColumn
          ? validChildrenKeys.length
          : 1;

      return [validated(x), validated(y)];
    }

    return [validated(objectsPerD), validated(childsLinePerD)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    elementsDirection,
    gapLocal[0],
    gapLocal[1],
    objectsSizeLocal.join(),
    validChildrenKeys.length,
    direction,
    sizeLocal.join(),
    crossCount,
  ]);

  const objectsWrapperWidth = React.useMemo(() => {
    const childsGap = !objectsPerDirection[0]
      ? 0
      : objectsPerDirection[0] * gapLocal[1] - gapLocal[1];
    // neededObj нужен для распределение объектов, точнее для crossCount
    const neededObj = objectsPerDirection[direction === "x" ? 1 : 0];
    // если детей меньше чем neededObj, то считаем по ним так как crossCount в этом случае не имеет смысла
    const neededObjWithChildCount =
      validChildrenKeys.length < neededObj
        ? validChildrenKeys.length
        : neededObj;

    return objectsSizeLocal[0]
      ? (objectsSizeLocal[0] + gapLocal[1]) * neededObjWithChildCount -
          gapLocal[1]
      : !renderLocal.type
        ? receivedWrapSizeRef.current.width
        : receivedChildSizeRef.current.width + childsGap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    objectsSizeLocal[0],
    objectsPerDirection.join(),
    gapLocal[1],
    receivedWrapSizeRef.current.width,
    receivedChildSizeRef.current.width,
    renderLocal.type,
    validChildrenKeys.length,
  ]);

  const objectsWrapperHeight = React.useMemo(() => {
    const childsGap =
      objectsPerDirection[1] < 1
        ? 1
        : objectsPerDirection[0] * gapLocal[0] - gapLocal[0];

    return objectsSizeLocal[1]
      ? direction === "x"
        ? (objectsSizeLocal[1] + gapLocal[0]) * objectsPerDirection[0] -
          gapLocal[0]
        : (objectsSizeLocal[1] + gapLocal[0]) * objectsPerDirection[1] -
          gapLocal[0]
      : !renderLocal.type
        ? receivedWrapSizeRef.current.height // on "fit-content"
        : receivedChildSizeRef.current.height + childsGap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    objectsSizeLocal[1],
    objectsPerDirection.join(),
    gapLocal[0],
    receivedWrapSizeRef.current.height,
    receivedChildSizeRef.current.height,
    renderLocal.type,
  ]);

  const objectsWrapperHeightFull = React.useMemo(() => {
    return objectsWrapperHeight + mLocalY;
  }, [objectsWrapperHeight, mLocalY]);
  const objectsWrapperWidthFull = React.useMemo(() => {
    return objectsWrapperWidth + mLocalX;
  }, [objectsWrapperWidth, mLocalX]);
  const fullHeightOrWidth =
    direction === "x" ? objectsWrapperWidthFull : objectsWrapperHeightFull;

  const scrollSpaceFromRef =
    direction === "x"
      ? scrollElementRef.current?.scrollLeft || 0
      : scrollElementRef.current?.scrollTop || 0;

  const isNotAtStart = scrollSpaceFromRef > 1 && true;
  const isNotAtEnd =
    Math.round(scrollSpaceFromRef + xySize) < fullHeightOrWidth;

  let isNotAtStartX = false;
  let isNotAtEndX = false;
  if (direction === "hybrid") {
    isNotAtStartX = (scrollElementRef.current?.scrollLeft || 0) > 1 && true;
    isNotAtEndX =
      Math.round((scrollElementRef.current?.scrollLeft || 0) + sizeLocal[0]) <
      objectsWrapperWidthFull;
  }

  const thumbMinSizeLocal = React.useMemo(
    () => thumbMinSize ?? 30,
    [thumbMinSize],
  );

  const getThumbSize = React.useCallback(
    (dir: "x" | "y") => {
      if (!progressTrigger.progressElement || !fullHeightOrWidth) return 0;

      if (dir === "x") {
        return calculateThumbSize(
          sizeLocal[0],
          objectsWrapperWidthFull,
          thumbMinSizeLocal,
        );
      } else
        return calculateThumbSize(
          sizeLocal[1],
          objectsWrapperHeightFull,
          thumbMinSizeLocal,
        );
    },
    [
      progressTriggerST,
      fullHeightOrWidth,
      sizeLocal[0],
      sizeLocal[1],
      objectsWrapperWidthFull,
      thumbMinSizeLocal,
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

  // делим на группы
  const splitIndices = React.useCallback(() => {
    if (!renderLocal.type || objectsPerDirection[0] <= 1) {
      return [];
    }

    // Создаём пустые массивы
    const result: number[][] = Array.from(
      { length: objectsPerDirection[0] },
      () => [],
    );

    const useMod =
      (direction === "x" && elementsDirection === "column") ||
      (direction !== "x" && elementsDirection === "row");

    // массив индексов детей
    Array.from({ length: validChildrenKeys.length }, (_, i) => i).forEach(
      (index) => {
        const groupIndex = useMod
          ? index % objectsPerDirection[0]
          : Math.floor(index / objectsPerDirection[1]);

        if (!result[groupIndex]) return;
        result[groupIndex].push(index);
      },
    );

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    validChildrenKeys.length,
    objectsPerDirection.join(),
    renderLocal.type,
    elementsDirection,
    direction,
  ]);

  const memoizedChildrenData = React.useMemo(() => {
    if (!renderLocal.type) return [{ top: 0, bottom: 0, left: 0, right: 0 }];

    let lastIndices: number[] = [];
    let alignSpaceLeft: number = 0;

    if (elementsAlign) {
      const indices = Array.from(
        { length: validChildrenKeys.length },
        (_, index) => index,
      );

      // находим индексы последних элементов
      const lastChildsInDirection =
        direction === "x"
          ? validChildrenKeys.length % objectsPerDirection[0]
          : validChildrenKeys.length %
            Math.ceil(validChildrenKeys.length / objectsPerDirection[0]);
      // находим индексы и отсекаем лишние
      lastIndices = !lastChildsInDirection
        ? []
        : indices.slice(-lastChildsInDirection);

      if (elementsAlign === "center") {
        alignSpaceLeft =
          ((objectsSizeLocal[0] + gapLocal[1]) *
            (objectsPerDirection[0] - lastChildsInDirection)) /
          2;
      } else if (elementsAlign === "end") {
        alignSpaceLeft =
          (objectsSizeLocal[0] + gapLocal[1]) *
          (objectsPerDirection[0] - lastChildsInDirection);
      }
    }

    const splitIndicesData = splitIndices(); // вызов заранее
    return validChildrenKeys.map((_, index) => {
      // разбиваем на группы left, top
      const indexAndSubIndex = (function (
        index: number,
        splitIndices: number[][],
      ) {
        for (
          let arrayIndex = 0;
          arrayIndex < splitIndices.length;
          arrayIndex++
        ) {
          const indexInArray = splitIndices[arrayIndex].indexOf(index);
          if (indexInArray !== -1) {
            const neededTopIndex = ["hybrid", "y"].includes(direction)
              ? indexInArray
              : arrayIndex;
            const neededLeftIndex =
              direction === "x" ? indexInArray : arrayIndex;

            return [neededLeftIndex, neededTopIndex];
          }
        }
        return [0, 0];
      })(index, splitIndicesData);

      const align =
        lastIndices.length > 0 && lastIndices.includes(index)
          ? alignSpaceLeft
          : 0;

      const top = (function (indexTop: number) {
        const alignLocal = direction === "x" ? align : 0;

        return indexTop > 0
          ? alignLocal + (objectsSizeLocal[1] + gapLocal[0]) * indexTop
          : alignLocal;
      })(
        objectsPerDirection[0] > 1 || ["hybrid", "x"].includes(direction)
          ? indexAndSubIndex[1]
          : index,
      );

      const bottom = (function () {
        return objectsSizeLocal[1] ? top + objectsSizeLocal[1] : top;
      })();

      const left = (function (indexLeft: number) {
        const alignLocal = direction === "x" ? 0 : align;

        return indexLeft > 0
          ? alignLocal + (objectsSizeLocal[0] + gapLocal[1]) * indexLeft
          : alignLocal;
      })(
        objectsPerDirection[0] === 1 && direction === "x"
          ? index
          : indexAndSubIndex[0],
      );

      const right = left + objectsSizeLocal[0];

      return { top, bottom, left, right };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    objectsPerDirection[0],
    objectsSizeLocal.join(),
    gapLocal[0],
    gapLocal[1],
    renderLocal.type,
    elementsDirection,
    elementsAlign,
    validChildrenKeys.join(),
  ]);

  const wrapperAlignLocal = React.useMemo(() => {
    if (!sizeLocal?.length || !wrapperAlign) return {};

    return getWrapperAlignStyle(
      wrapperAlign,
      sizeLocal,
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wrapperAlign,
    sizeLocal.join(),
    objectsWrapperHeightFull,
    objectsWrapperWidthFull,
  ]);

  const objLengthPerSize = React.useMemo(() => {
    const x = objectsPerSize(objectsWrapperWidthFull, sizeLocal[0]);
    const y = objectsPerSize(objectsWrapperHeightFull, sizeLocal[1]);

    return [x, y];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectsWrapperWidthFull, objectsWrapperHeightFull, sizeLocal.join()]);
  const objLengthPerSizeXY = React.useMemo(() => {
    return direction === "x" ? objLengthPerSize[0] : objLengthPerSize[1];
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      );
    },
    [],
  );

  const wrapperStyle = React.useMemo<React.CSSProperties>(() => {
    const common: React.CSSProperties = {
      margin: wrapperMargin ? `${mT}px ${mR}px ${mB}px ${mL}px` : "",
      height:
        objectsSizing[1] && objectsSizing[1] !== "none"
          ? `${objectsWrapperHeight}px`
          : "fit-content",
      width:
        objectsSizing[0] && objectsSizing[0] !== "none"
          ? `${objectsWrapperWidth}px`
          : "fit-content",
      ...(gap &&
        !renderLocal.type && { gap: `${gapLocal[0]}px ${gapLocal[1]}px` }),
      ...(wrapperMinSize &&
        getWrapperMinSizeStyle(
          wrapperMinSize,
          direction,
          sizeLocal,
          mLocalX,
          mLocalY,
        )),
      ...(wrapperAlign && { flexShrink: 0 }), // это решает проблему с уменьшением ширины при флексе на objectsWrapper
    };

    if (renderLocal.type) {
      return {
        ...common,
        position: "relative",
      };
    }

    const flexWrap = objectsSizing[1] ? "wrap" : undefined;
    const flexDirection =
      objectsPerDirection[0] === 1
        ? direction === "y"
          ? "column"
          : "row" // так как при objectsPerDirection[0] === 1, x/hybrid это row
        : elementsDirection;

    return {
      ...common,
      display: "flex",
      flexDirection,
      flexWrap,
      justifyContent: getStyleAlign(elementsAlign),
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wrapperMargin,
    wrapperAlignST,
    wrapperMinSizeST,
    [mT, mR, mB, mL, mLocalX, mLocalY, gapLocal[0], gapLocal[1]].join(),
    sizeLocal.join(),
    gapST,
    objectsSizing[1],
    objectsWrapperHeight,
    objectsWrapperWidth,
    progressTrigger.content,
    gapST,
    renderLocal.type,
    direction,
    objectsPerDirection[0],
    elementsDirection,
    elementsAlign,
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

      // проверка на интерактивные элементы на них не скроллим
      if (
        target.closest(
          `
          [data-no-scroll], [draggable="true"], [contenteditable],
          input, textarea, select, button, a
        `,
        )
      )
        return;

      let axisFromAtr: "x" | "y" | null = null;
      if (checkClickedBar) {
        axisFromAtr = target
          .closest(type === "scroll" ? ".ms-bar" : ".ms-slider")
          ?.getAttribute("data-direction") as "x" | "y";
      }

      clickedObject.current = clicked;

      handleMouseOrTouch({
        scrollElementRef: scrollElementRef.current,
        objectsWrapperRef: objectsWrapperRef.current,
        target,
        clickedObject,
        scrollContentRef: scrollContentRef.current,
        scrollStateRef: scrollStateRef.current,
        type,
        triggerUpdate: triggerRAF,
        direction,
        smoothScroll: smoothScrollLocal,
        sizeLocal: [sizeLocal[0], sizeLocal[1]],
        thumbSize: axisFromAtr === "x" ? thumbSizeMemo.x : thumbSizeMemo.y,
        axisFromAtr,
        duration: scrollPositionLocal.duration,
        scrollBarEdge: scrollBarEdgeLocal,
        rafScrollAnim,
        isTouched: isTouchedRef.current,
        pointerId: event.pointerId,
        gap: gapLocal,
        objectsWrapperSize: [objectsWrapperWidthFull, objectsWrapperHeightFull],
        overscrollRef,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      direction,
      type,
      sizeLocal.join(),
      scrollPositionLocal.duration,
      smoothScrollLocal,
      scrollBarEdgeLocal.join(),
      thumbSizeMemo.x,
      thumbSizeMemo.y,
      gapLocal.join(),
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
    ],
  );

  const onMoveScrollThumb = React.useCallback(
    (event: PointerEvent) => {
      onMouseOrTouchDown("thumb", event, true);
    },
    [onMouseOrTouchDown],
  );

  const handleArrowLocal = React.useCallback(
    (arrowType: handleArrowT["arrowType"]) => {
      if (!scrollElementRef.current) return;

      handleArrow({
        arrowType: arrowType,
        scrollElement: scrollElementRef.current,
        wrapSize: [objectsWrapperWidthFull, objectsWrapperHeightFull],
        scrollSize: sizeLocal,
        smoothScroll: smoothScrollLocal,
        duration: scrollPositionLocal.duration,
        loop: arrowsLocal.loop,
        gap: gapLocal,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sizeLocal.join(),
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
      scrollPositionLocal.duration,
      smoothScrollLocal,
      arrowsLocal.loop,
      gapLocal.join(),
    ],
  );

  const sliderCheckLocal = React.useCallback(() => {
    // защита от нулевых значений
    if (!sizeLocal[0] || !sizeLocal[1]) return;

    const scrollEl = scrollElementRef.current;
    if (!scrollContentRef.current || !scrollEl || !scrollBarsRef.current.size)
      return;

    // ограничение частоты вызова
    setTask(
      () => sliderCheck(scrollEl, scrollBarsRef.current, sizeLocal, direction),
      CONST.DEBOUNCE_DELAY,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeLocal.join(), direction, type]);

  const updateLoadedElementsKeysLocal = React.useCallback(() => {
    if (!objectsWrapperRef.current) return;

    updateLoadedElementsKeys(
      objectsWrapperRef.current,
      objectsKeys,
      triggerRAF,
      renderLocal.type,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderST]);

  // для обновления ключей при emptyElements
  const updateEmptyKeysClickLocal = React.useCallback(
    (event: React.MouseEvent) => {
      if (!emptyElements?.clickTrigger) return;

      updateEmptyKeysClick(
        event,
        emptyElements.clickTrigger,
        updateLoadedElementsKeysLocal,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emptyElementsST, updateLoadedElementsKeysLocal],
  );

  // для обработки onScrollValue
  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      cancelTask("removeHover"); // удаляем task

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
      onScrollValue?.(scrollEl.scrollLeft, scrollEl.scrollTop);

      const scrollOrSlider = el.querySelectorAll<HTMLElement>(
        type === "scroll" ? ".ms-bar" : ".ms-slider",
      );
      if (
        scrollBarOnHover &&
        scrollOrSlider.length > 0 &&
        !isScrollingRef.current
      ) {
        // доп логика что-бы показать скрытый scrollBar
        scrollOrSlider.forEach((el) => {
          if (!el.classList.contains("hover")) addHover(el);
        });
      }

      isScrollingRef.current = true;
      isScrolling?.(true);

      // debounce для финала через setTask
      setTask(
        () => {
          scrollDirTrackerRef.current.reset(); // сброс
          isScrollingRef.current = false;
          isScrolling?.(false);
          renderLocal.type && updateLoadedElementsKeysLocal();

          if (
            scrollBarOnHover &&
            scrollOrSlider.length > 0 &&
            !clickedObject.current
          ) {
            // добавил в setTask что бы была задержка перед исчезновением thumbs
            setTask(
              () => {
                scrollOrSlider.forEach((el) => {
                  removeHover(el);
                });
              },
              1000,
              "removeHover",
            );
          }
        },
        CONST.SCROLL_END_DELAY,
        "isScrolling",
      );

      // по-кадровое обновление
      raf.schedule(() => {
        if (type !== "scroll") sliderCheckLocal();
        triggerUpdate(); // main updater
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      onScrollValue,
      isScrolling,
      type,
      sliderCheckLocal,
      updateLoadedElementsKeysLocal,
      scrollBarOnHover,
      renderLocal.type,
    ],
  );

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (keyDownX.current) return; // ранний выход

      const keyName =
        typeof progressTrigger.wheel === "object" &&
        typeof progressTrigger.wheel.changeDirectionKey === "string"
          ? progressTrigger.wheel.changeDirectionKey
          : "KeyX";

      if (e.code === keyName && direction === "hybrid" && !keyDownX.current) {
        // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
        e.stopPropagation();
        keyDownX.current = true;
        triggerRAF();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, `${progressTrigger.wheel}`],
  );
  const onKeyUp = React.useCallback((e: KeyboardEvent) => {
    if (keyDownX.current) {
      // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
      e.stopPropagation();
      keyDownX.current = false;
      triggerRAF();
    }
  }, []);

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
    // эффект для нажатия клавиш
    if (isTouchedRef.current && direction === "hybrid" && progressTrigger.wheel)
      return;

    const wrapper = objectsWrapperRef.current;
    const scrollEl = scrollElementRef.current;
    if (!wrapper || !scrollEl) return;

    if (
      wrapper.clientWidth! > scrollEl.clientWidth! &&
      wrapper.clientHeight! > scrollEl.clientHeight!
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
    `${progressTrigger.wheel}`,
    // при изменении размеров
    sizeST,
    objectsSizeST,
    // при изменении количества детей
    validChildrenKeys.join(),
  ]);

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
    // запуск проверки ключей
    if (emptyElements || renderLocal.type) updateLoadedElementsKeysLocal();
  }, [emptyElementsST, renderLocal.type, updateLoadedElementsKeysLocal]);

  React.useEffect(() => {
    if (isTouchedRef.current) return; // при touch устроиствах выключаем

    // wheel вешается вручную что бы выключить scroll e.preventDefault()!
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    const directionWithPriority =
      direction === "hybrid" &&
      typeof progressTrigger.wheel === "object" &&
      progressTrigger.wheel.changeDirection
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
      e.preventDefault();
      handleWheel(e, scrollEl, scrollStateRef.current, directionForWheel);
    };

    progressTrigger.wheel &&
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
  ]);

  // эффекты прокрутки
  React.useEffect(() => {
    // обязательно вызываем всё в одном raf
    raf.schedule(() => {
      const directions: ("x" | "y")[] =
        direction === "hybrid" ? ["x", "y"] : [direction];
      directions.forEach((dir) => {
        const value = scrollPositionLocal.value[dir === "x" ? 0 : 1];

        // "end"
        if (value === "end") {
          // если направление прокрутки было противоположным от "end" отменяем
          if (
            scrollDirTrackerRef.current.get()[dir] ===
            (dir === "x" ? "left" : "up")
          )
            return;

          smoothScrollLocal(
            dir === "x" ? endObjectsWrapper.w : endObjectsWrapper.h,
            dir,
            scrollPositionLocal.duration,
          );
        }

        // "number"
        else if (typeof value === "number") {
          if (lastScrollTargetRef.current[dir] !== value) {
            lastScrollTargetRef.current[dir] = value;

            smoothScrollLocal(value, dir, scrollPositionLocal.duration);
          }
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    scrollPositionST,
    endObjectsWrapper.w,
    endObjectsWrapper.h,
    scrollPositionLocal.value.join(),
  ]);

  React.useEffect(() => {
    const animationFrameId = scrollStateRef.current.animationFrameId;

    if ((renderLocal.type || isScrolling) && isScrolling) isScrolling(false);

    // первый рендер
    requestAnimationFrame(() => (firstRender.current = false)); // RAF спасает от двойного вызова smoothScroll в StrictMode

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (scrollStateRef.current.animationFrameId)
        cancelAnimationFrame(scrollStateRef.current.animationFrameId);

      rafScrollAnim.cancel();

      // использование может убивает финал прокрутки
      // cancelTask(); // очищаем таски
    };
  }, []);

  // установка слушателя нажатия на обертку
  React.useEffect(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    const handler = (event: PointerEvent) => {
      onMouseOrTouchDown("wrapp", event);
    };

    // сложное условие...
    if (
      progressTrigger.content ||
      (!progressTrigger.content &&
        isTouchedRef.current &&
        progressTrigger.wheel)
    ) {
      if (progressTrigger.progressElement === true) return;

      scrollEl.addEventListener("pointerdown", handler);
    }

    return () => {
      scrollEl.removeEventListener("pointerdown", handler);
    };
  }, [progressTriggerST, onMouseOrTouchDown]);

  // установка слушателя нажатия на scrollContentRef
  React.useEffect(() => {
    const el = scrollContentRef.current;
    if (!el || !scrollBarOnHover) return;

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
          isScrolling: isScrollingRef,
        });
      });
    };

    const listenersHandler = (
      type: "addEventListener" | "removeEventListener",
      fn: (event: any) => void,
    ) => {
      if (isTouchedRef.current) {
        Array.from(scrollBarsRef.current).forEach((bar) =>
          bar[type]("pointerdown", fn),
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
    scrollBarOnHover,
    type,
    // почему-то при изменении direction отваливается ивент
    direction,
    scrollBarsRef.current.size,
  ]);

  // отделил потому что size может вычисляться позже при "auto"
  React.useEffect(() => {
    if (type === "scroll") return;
    sliderCheckLocal();
  }, [type, sliderCheckLocal, sizeLocal.join()]);

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
        ...(renderLocal.type && {
          position: "absolute",
          transform: `translate(${left}px, ${elementTop}px)`,
        }),
        ...(typeof visibility === "number" && {
          "--content-visibility": visibility,
        }),
      };

      const content = suspending ? (
        <React.Suspense fallback={fallback}>{children}</React.Suspense>
      ) : (
        children
      );

      return (
        <div
          key={key}
          {...(renderLocal.type || emptyElements
            ? {
                [CONST.WRAP_ATR]: `${key}`,
              }
            : {})}
          className="ms-object-box"
          style={wrapStyle}
          onClick={emptyElements ? updateEmptyKeysClickLocal : undefined}
        >
          {content}
        </div>
      );
    },
    // eslint-disable-next-line
    [
      suspending,
      !!fallback,
      objectsSizeLocal.join(),
      renderST,
      emptyElementsST,
      objectsPerDirection[0],
      updateEmptyKeysClickLocal,
      renderLocal.type,
    ],
  );

  const childrenMap = React.useMemo(() => {
    const m = new Map<string, React.ReactElement>();
    childrenArray.forEach((ch) => {
      if (React.isValidElement(ch) && ch.key != null) m.set(String(ch.key), ch);
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
        ? fallback
        : objectsKeys.current.empty?.has(key)
          ? typeof emptyElements?.mode === "object"
            ? emptyElements.mode.fallback
            : fallback
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
    if (!renderLocal.type) return scrollObjectWrapper(key, 0, 0, childLocal);

    // обработка виртуализации
    const { top, bottom, left, right } = memoizedChildrenData[index];

    // проверка видимости
    const getVisibilityRatio = (withRootMargin: boolean = true): number => {
      const rootMarginLocal = withRootMargin ? mRootLocal : [0, 0, 0, 0];

      const checkAxis = (dir: "x" | "y") => {
        const viewportStart = dir === "x" ? scrollLeft : scrollTop;
        const viewportEnd =
          viewportStart + (dir === "x" ? sizeLocal[0] : sizeLocal[1]);

        const elStart =
          dir === "x" ? left - rootMarginLocal[3] : top - rootMarginLocal[2];

        const elEnd =
          dir === "x"
            ? right + rootMarginLocal[1]
            : bottom + rootMarginLocal[0];

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
    if (renderLocal.type === "lazy") {
      const wasLoaded = objectsKeys.current.loaded.has(key);
      if (visibilityRatio && !wasLoaded) objectsKeys.current.loaded.add(key);
      if (!wasLoaded) return null;

      return scrollObjectWrapper(
        key,
        top,
        left,
        childLocal,
        visibilityRatioWithoutMargin,
      );
    }

    // - VIRTUAL -
    if (!visibilityRatio) return null;

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
        progressTrigger.wheel || (progressTrigger.content && type === "scroll")
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
    if (!edgeGradient) return null;

    return getEdgeOrArrowData.map(({ positionType, visibility }) => (
      <Edge
        key={`edge-${positionType}`}
        edgeGradient={edgeGradientLocal}
        visibility={visibility}
        edgeType={positionType as "left" | "right" | "top" | "bottom"}
        size={sizeLocal}
      />
    ));
  }, [edgeGradient, getEdgeOrArrowData, edgeGradientLocal, sizeST]);

  const arrowsJSX = React.useMemo(() => {
    if (!progressTrigger.arrows) return null;

    return getEdgeOrArrowData.map(({ positionType, visibility }) => (
      <Arrow
        key={`arrow-${positionType}`}
        visibility={visibility}
        arrows={arrowsLocal}
        arrowType={positionType as handleArrowT["arrowType"]}
        handleArrow={handleArrowLocal}
        size={sizeLocal[0]}
      />
    ));
  }, [
    progressTrigger.arrows,
    getEdgeOrArrowData,
    arrowsLocal,
    handleArrowLocal,
    sizeLocal[0],
  ]);

  const scrollBarConfigs = () => {
    const base: any[] = [
      {
        shouldRender:
          (direction !== "x"
            ? thumbSizeMemo.y - scrollBarEdgeLocal[1]
            : thumbSizeMemo.x - scrollBarEdgeLocal[0]) < xySize,
        direction,
        thumbSize: direction !== "x" ? thumbSizeMemo.y : thumbSizeMemo.x,
        thumbSpace: direction !== "x" ? thumbSpace.y : thumbSpace.x,
        objLengthPerSize: objLengthPerSizeXY,
        progressReverseIndex: 0,
      },
      {
        shouldRender:
          direction === "hybrid" &&
          thumbSizeMemo.x - scrollBarEdgeLocal[0] < sizeMinusEdge[0],
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
    if (
      !progressTrigger.progressElement ||
      progressTrigger.progressElement === true
    )
      return null;

    return scrollBarConfigs().map((args) => {
      const progressReverseValue =
        typeof progressReverse === "boolean"
          ? progressReverse
          : progressReverse[args.progressReverseIndex];

      return (
        <ScrollBar
          key={args.direction}
          type={type}
          direction={args.direction}
          progressReverse={progressReverseValue}
          size={sizeMinusEdge}
          progressTrigger={progressTrigger}
          scrollBarOnHover={scrollBarOnHover}
          scrollBarEvent={
            type === "sliderMenu" ? smoothScrollLocal : onMoveScrollThumb
          }
          thumbSize={args.thumbSize}
          thumbSpace={args.thumbSpace}
          objLengthPerSize={args.objLengthPerSize}
          sliderCheckLocal={sliderCheckLocal}
          duration={scrollPositionLocal.duration}
          isTouched={isTouchedRef.current}
          scrollStateRef={scrollStateRef}
          scrollEl={scrollElementRef}
          scrollBarsRef={scrollBarsRef}
          triggerUpdate={triggerRAF}
          overscroll={overscrollRef}
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
      progressTrigger.arrows &&
      arrowsLocal.contentReduce &&
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
      morph-scroll={`${id}`}
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
          className="ms-element"
          ref={scrollElementRef}
          onScroll={handleScroll}
          tabIndex={0} // ! для работы событий onKeyDown и onKeyUp
          style={{
            width: "100%",
            height: "100%",
            outline: "none",
            ...wrapperAlignLocal,
            ...(typeof progressTrigger.progressElement !== "boolean" ||
            progressTrigger.progressElement === false
              ? {
                  scrollbarWidth: "none",
                  overflow: "hidden",
                }
              : { overflow: overflowStyleValue }),
            ...(progressTrigger.content && { cursor: "grab" }),
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
};

MorphScroll.displayName = "MorphScroll";
export default MorphScroll;

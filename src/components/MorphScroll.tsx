import React from "react";
import { MorphScrollT } from "../types/types";
import argsFormatter from "../helpers/argsFormatter";

import useIdent from "../hooks/useIdent";

import ResizeTracker from "./ResizeTracker";
import ScrollBar from "./ScrollBar";
import Edge from "./Edge";
import Arrow from "./Arrow";

import handleWheel, { ScrollStateRefT } from "../functions/handleWheel";
import handleMouseOrTouch from "../functions/handleMouseOrTouch";
import {
  objectsPerSize,
  smoothScroll,
  getAllScrollBars,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
  stabilizeMany,
  getStyleAlign,
} from "../functions/addFunctions";
import handleArrow, { handleArrowT } from "../functions/handleArrow";
import {
  updateLoadedElementsKeys,
  updateEmptyKeysClick,
} from "../functions/updateKeys";
import {
  calculateThumbSize,
  calculateThumbSpace,
} from "../functions/calculateThumbSize";
import { mouseOnRef } from "../functions/mouseOn";

import { setManagedTask, clearAllManagedTasks } from "../helpers/taskManager";

import { CONST } from "../constants";

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
  // const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");
  const id = useIdent();

  // ♦ errors
  const errorText = (propName: string) =>
    `Prop "${propName}" is not provided\nMorphScroll〈♦${id}〉`;

  if (!size) throw new Error(errorText("size"));
  if (Object.keys(progressTrigger).length === 0)
    console.error(errorText("progressTrigger"));

  // ♦ state
  const [_, forceUpdate] = React.useState({}); // для принудительного обновления

  const triggerUpdate = () => {
    forceUpdate({});
  };

  // ♦ refs
  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const scrollBarsRef = React.useRef<NodeListOf<Element> | []>([]);

  const firstChildKeyRef = React.useRef<string | null>(null);
  const clickedObject = React.useRef<"thumb" | "wrapp" | "slider" | "none">(
    "none"
  );
  // ключи объектов, которые когда либо были загружены
  const objectsKeys = React.useRef<{
    loaded: string[];
    empty: string[] | null;
  }>({ loaded: [], empty: [] });

  const scrollStateRef = React.useRef<ScrollStateRefT>({
    targetScrollY: 0,
    targetScrollX: 0,
    animating: false,
    animationFrameId: 0,
  });
  const isScrollingRef = React.useRef<boolean>(false);
  const numForSliderRef = React.useRef<number>(0);
  const prevCoordsRef = React.useRef<{
    x: number;
    y: number;
    leftover: number;
  } | null>(null);
  const keyDownX = React.useRef<boolean>(false);

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
    scrollPositionValueST,
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
  ] = stabilizeMany(
    scrollPosition?.value,
    render,
    size,
    objectsSize,
    emptyElements,
    wrapperMinSize,
    wrapperAlign,
    gap,
    progressTrigger,
    objectsKeys.current.empty,
    scrollBarEdge
  );

  // ♦ default
  const scrollPositionLocal = React.useMemo(() => {
    return {
      value:
        typeof scrollPosition?.value === "number" ||
        typeof scrollPosition?.value === "string"
          ? [scrollPosition.value, scrollPosition.value]
          : scrollPosition?.value ?? [null],
      duration: scrollPosition?.duration ?? 200,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollPositionValueST, scrollPosition?.duration]);

  // ♦ variables
  const edgeGradientDefault = { color: null, size: 40 };
  const edgeGradientLocal = React.useMemo(() => {
    return typeof edgeGradient === "object"
      ? { ...edgeGradientDefault, ...edgeGradient }
      : edgeGradientDefault;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeGradient]);

  const arrowsLocal = React.useMemo(() => {
    return {
      ...edgeGradientDefault,
      ...(typeof progressTrigger.arrows === "object"
        ? progressTrigger.arrows
        : {}),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTriggerST]);

  // optimization validChildren
  const filterValidChildren = React.useCallback(
    (child: React.ReactNode): React.ReactNode[] => {
      if (child === null || child === undefined) {
        return [];
      }
      if (React.isValidElement(child)) {
        const childElement = child as React.ReactElement<any>;
        if (childElement.type === React.Fragment) {
          return React.Children.toArray(childElement.props.children).flatMap(
            filterValidChildren
          );
        }
        return [childElement];
      }
      return [child];
    },
    []
  );

  const validChildrenKeys = React.useMemo(() => {
    return React.Children.toArray(children)
      .flatMap(filterValidChildren)
      .map((child) => {
        if (React.isValidElement(child) && child.key) {
          return String(child.key);
        }
        return null;
      })
      .filter((key): key is string => key !== null)
      .filter((key) => {
        if (emptyElements?.mode === "clear") {
          return !objectsKeys.current.empty?.includes(key);
        }
        return true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, filterValidChildren, emptyElementsST, objectsKeysEmptyST]);

  const [mT, mR, mB, mL] = wrapperMargin
    ? argsFormatter(wrapperMargin)
    : [0, 0, 0, 0];
  const mLocalY = mT + mB;
  const mLocalX = mL + mR;

  const [gapX, gapY] = React.useMemo(() => {
    if (typeof gap === "number") {
      return [gap, gap];
    }
    if (Array.isArray(gap)) {
      return [gap[1] ?? 0, gap[0] ?? 0];
    }
    return [0, 0];
  }, [gap]);

  const mRootLocal = React.useMemo(() => {
    return argsFormatter(render?.rootMargin || 0, direction === "x");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderST, direction]);

  const [mRootX, mRootY] = mRootLocal ? [mRootLocal[2], mRootLocal[0]] : [0, 0];

  const sizeLocal = React.useMemo(() => {
    const [x, y] = Array.isArray(size)
      ? size
      : typeof size === "number"
      ? [size, size]
      : [
          receivedScrollSizeRef.current.width,
          receivedScrollSizeRef.current.height,
        ];

    if (!progressTrigger.arrows || !arrowsLocal.size) {
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

    return [recountX, recountY, x, y]; // [2] & [3] is only for customScrollRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sizeST,
    progressTriggerST,
    direction,
    arrowsLocal.size,
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
  const scrollBarEdgeHeightOrWidth =
    direction === "x" ? scrollBarEdgeLocal[0] : scrollBarEdgeLocal[1];

  const sizeWithLimit = React.useMemo(() => {
    const x = sizeLocal[0] - scrollBarEdgeLocal[0];
    const y = sizeLocal[1] - scrollBarEdgeLocal[1];

    return [x, y];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollBarEdgeLocal.join(), sizeLocal[0], sizeLocal[1]]);

  const xySizeForThumb =
    direction === "x" ? sizeWithLimit[0] : sizeWithLimit[1];

  const objectsSizing = React.useMemo(
    () =>
      objectsSize
        ? !Array.isArray(objectsSize)
          ? argsFormatter(objectsSize, true, 2)
          : objectsSize
        : [null, null],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objectsSizeST]
  );

  const objectsSizeLocal = React.useMemo(() => {
    const getSize = (
      val: number | "none" | "firstChild" | "size",
      receivedSize: number
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
        receivedChildSizeRef.current.width
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
        receivedChildSizeRef.current.height
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
      ? objectsSizeLocal[1] + gapY
      : objectsSizeLocal[0] + gapX;

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
    gapY,
    gapX,
    objectsSizeLocal.join(),
    validChildrenKeys.length,
    direction,
    sizeLocal.join(),
    crossCount,
  ]);

  const objectsWrapperWidth = React.useMemo(() => {
    const childsGap = !objectsPerDirection[0]
      ? 0
      : objectsPerDirection[0] * gapY - gapY;
    const neededObj =
      direction === "x" ? objectsPerDirection[1] : objectsPerDirection[0];

    return objectsSizeLocal[0]
      ? (objectsSizeLocal[0] + gapY) * neededObj - gapY
      : !render?.type
      ? receivedWrapSizeRef.current.width
      : receivedChildSizeRef.current.width + childsGap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    objectsSizeLocal[0],
    objectsPerDirection.join(),
    gapY,
    receivedWrapSizeRef.current.width,
    receivedChildSizeRef.current.width,
    render?.type,
  ]);

  const objectsWrapperHeight = React.useMemo(() => {
    const childsGap =
      objectsPerDirection[1] < 1 ? 1 : objectsPerDirection[0] * gapX - gapX;

    return objectsSizeLocal[1]
      ? direction === "x"
        ? (objectsSizeLocal[1] + gapX) * objectsPerDirection[0] - gapX
        : (objectsSizeLocal[1] + gapX) * objectsPerDirection[1] - gapX
      : !render?.type
      ? receivedWrapSizeRef.current.height // on "fit-content"
      : receivedChildSizeRef.current.height + childsGap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    objectsSizeLocal[1],
    objectsPerDirection.join(),
    gapX,
    receivedWrapSizeRef.current.height,
    receivedChildSizeRef.current.height,
    render?.type,
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
    [thumbMinSize]
  );

  const getThumbSize = React.useCallback(
    ({ withLimit = true, xSize }: { withLimit?: boolean; xSize?: boolean }) => {
      if (!progressTrigger.progressElement || !fullHeightOrWidth) return 0;

      if (!xSize) {
        return calculateThumbSize(
          withLimit ? xySizeForThumb : xySize,
          withLimit
            ? fullHeightOrWidth - scrollBarEdgeHeightOrWidth
            : fullHeightOrWidth,
          thumbMinSizeLocal
        );
      }

      return calculateThumbSize(
        withLimit ? sizeWithLimit[0] : sizeLocal[0],
        withLimit
          ? objectsWrapperWidthFull - scrollBarEdgeLocal[0]
          : objectsWrapperWidthFull,
        thumbMinSizeLocal
      );
    },
    [
      progressTriggerST,
      fullHeightOrWidth,
      xySizeForThumb,
      scrollBarEdgeHeightOrWidth,
      scrollBarEdgeLocal[0],
      xySize,
      sizeLocal[0],
      sizeWithLimit[0],
      objectsWrapperWidthFull,
      thumbMinSizeLocal,
    ]
  );

  const endObjectsWrapper = React.useMemo(() => {
    if (!xySize) return fullHeightOrWidth;
    return (
      fullHeightOrWidth - xySize // in scroll vindow
    );
  }, [fullHeightOrWidth, xySize]);
  const endObjectsWrapperX = React.useMemo(() => {
    if (!sizeLocal[0]) return objectsWrapperWidthFull;
    return (
      objectsWrapperWidthFull - sizeLocal[0] // in scroll vindow
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectsWrapperWidthFull, sizeLocal[0]]);

  // делим на группы
  const splitIndices = React.useCallback(() => {
    if (!render?.type || objectsPerDirection[0] <= 1) {
      return [];
    }

    // Создаём массив индексов детей
    const indices = Array.from(
      { length: validChildrenKeys.length },
      (_, i) => i
    );

    // Создаём пустые массивы
    const result: number[][] = Array.from(
      { length: objectsPerDirection[0] },
      () => []
    );

    const useMod =
      (direction === "x" && elementsDirection === "column") ||
      (direction !== "x" && elementsDirection === "row");

    indices.forEach((index) => {
      const groupIndex = useMod
        ? index % objectsPerDirection[0]
        : Math.floor(index / objectsPerDirection[1]);

      if (!result[groupIndex]) return;
      result[groupIndex].push(index);
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    validChildrenKeys.length,
    objectsPerDirection.join(),
    render?.type,
    elementsDirection,
    direction,
  ]);

  const memoizedChildrenData = React.useMemo(() => {
    if (!render?.type)
      return [{ elementTop: 0, elementBottom: 0, left: 0, right: 0 }];

    let lastIndices: number[] = [];
    let alignSpaceLeft: number = 0;

    if (elementsAlign) {
      const indices = Array.from(
        { length: validChildrenKeys.length },
        (_, index) => index
      );

      // находим индексы последних элементов
      const lastChildsInDirection = Math.abs(
        Math.floor(validChildrenKeys.length / objectsPerDirection[0]) *
          objectsPerDirection[0] -
          validChildrenKeys.length
      );
      // находим индексы и отсекаем лишние
      lastIndices = !lastChildsInDirection
        ? []
        : indices.slice(-lastChildsInDirection);

      if (elementsAlign === "center") {
        alignSpaceLeft =
          ((objectsSizeLocal[0] + gapY) *
            (objectsPerDirection[0] - lastChildsInDirection)) /
          2;
      } else if (elementsAlign === "end") {
        alignSpaceLeft =
          (objectsSizeLocal[0] + gapY) *
          (objectsPerDirection[0] - lastChildsInDirection);
      }
    }

    return validChildrenKeys.map((_, index) => {
      // разбиваем на группы left, top
      const indexAndSubIndex = (function (
        index: number,
        splitIndices: number[][]
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
      })(index, splitIndices());

      const align =
        lastIndices.length > 0 && lastIndices.includes(index)
          ? alignSpaceLeft
          : 0;

      const elementTop = (function (indexTop: number) {
        const alignLocal = direction === "x" ? align : 0;

        return indexTop > 0
          ? alignLocal + (objectsSizeLocal[1] + gapX) * indexTop
          : alignLocal;
      })(
        objectsPerDirection[0] > 1 || ["hybrid", "x"].includes(direction)
          ? indexAndSubIndex[1]
          : index
      );

      const elementBottom = (function () {
        return objectsSizeLocal[1]
          ? elementTop + objectsSizeLocal[1]
          : elementTop;
      })();

      const left = (function (indexLeft: number) {
        const alignLocal = direction === "x" ? 0 : align;

        return indexLeft > 0
          ? alignLocal + (objectsSizeLocal[0] + gapY) * indexLeft
          : alignLocal;
      })(
        objectsPerDirection[0] === 1 && direction === "x"
          ? index
          : indexAndSubIndex[0]
      );

      const right = left + objectsSizeLocal[0];

      return {
        elementTop,
        elementBottom,
        left,
        right,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    objectsPerDirection[0],
    objectsSizeLocal.join(),
    gapX,
    gapY,
    render?.type,
    elementsDirection,
    elementsAlign,
    splitIndices,
    validChildrenKeys.join(),
  ]);

  const wrapperAlignLocal = React.useMemo(() => {
    if (!sizeLocal?.length || !wrapperAlign) return {};

    return getWrapperAlignStyle(
      wrapperAlign,
      sizeLocal,
      objectsWrapperWidthFull,
      objectsWrapperHeightFull
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
    createResizeHandler(receivedScrollSizeRef, triggerUpdate),
    [receivedScrollSizeRef.current.height, receivedScrollSizeRef.current.width]
  );
  const wrapResize = React.useCallback(
    createResizeHandler(receivedWrapSizeRef, triggerUpdate, mLocalX, mLocalY),
    [
      receivedWrapSizeRef.current.height,
      receivedWrapSizeRef.current.width,
      mLocalX,
      mLocalY,
    ]
  );
  const childResize = React.useCallback(
    createResizeHandler(receivedChildSizeRef, triggerUpdate),
    [receivedChildSizeRef.current.height, receivedChildSizeRef.current.width]
  );

  const smoothScrollLocal = React.useCallback(
    (
      targetScroll: number,
      direction: "y" | "x",
      duration: number,
      callback?: () => void
    ) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return null;

      return smoothScroll(
        direction,
        scrollEl,
        duration,
        targetScroll,
        callback
      );
    },
    []
  );

  const startScrolling = React.useCallback(
    (dir: "x" | "y", targetScroll: number, cancelScrolls: (() => void)[]) => {
      if (!firstChildKeyRef.current) {
        firstChildKeyRef.current = validChildrenKeys[0];
      } else if (firstChildKeyRef.current !== validChildrenKeys[0]) {
        firstChildKeyRef.current = validChildrenKeys[0];
        return;
      }

      const cancel = smoothScrollLocal(
        targetScroll,
        dir,
        scrollPositionLocal.duration
      );
      if (cancel) cancelScrolls.push(cancel);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validChildrenKeys[0], scrollPositionLocal.duration, smoothScrollLocal]
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
      ...(progressTrigger.content && { cursor: "grab" }),
      ...(gap && !render?.type && { gap: `${gapX}px ${gapY}px` }),
      ...(wrapperMinSize &&
        getWrapperMinSizeStyle(
          wrapperMinSize,
          direction,
          sizeLocal,
          mLocalX,
          mLocalY
        )),
      ...(wrapperAlign && { flexShrink: 0 }), // это решает проблему с уменьшением ширины при флексе на objectsWrapper
    };

    if (render?.type) {
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
    [mT, mR, mB, mL, mLocalX, mLocalY, gapX, gapY].join(),
    sizeLocal.join(),
    gapST,
    objectsSizing[1],
    objectsWrapperHeight,
    objectsWrapperWidth,
    progressTrigger.content,
    gapST,
    render?.type,
    direction,
    objectsPerDirection[0],
    elementsDirection,
    elementsAlign,
  ]);

  // ♦ events
  const mouseOnRefHandle = React.useCallback(
    (
      event:
        | React.MouseEvent<HTMLDivElement>
        | React.TouchEvent<HTMLDivElement>
        | MouseEvent
        | TouchEvent
    ) => {
      if (!scrollBarOnHover) return;
      const func = () => mouseOnRef(scrollContentRef.current, "ms-bar", event);

      if (event.type === "mouseleave") {
        !["thumb", "slider", "wrapp"].includes(clickedObject.current) && func();
      } else {
        func();
      }
    },
    [scrollBarOnHover]
  );

  const onMouseOrTouchDown = React.useCallback(
    (
      clicked: "thumb" | "slider" | "wrapp" | null,
      eventType: string = "mousedown",
      clickedSBar?: EventTarget
    ) => {
      const clickedLocal = clicked
        ? clicked
        : type === "scroll"
        ? "thumb"
        : "slider";

      if (
        (clicked === "wrapp" && !progressTrigger.content) ||
        (["thumb", "slider"].includes(clickedLocal) &&
          !progressTrigger.progressElement)
      )
        return;

      getAllScrollBars(type, customScrollRef.current, scrollBarsRef);
      let axisFromAtr: "x" | "y" | null = null;
      if (clickedSBar) {
        const el = clickedSBar as HTMLElement;
        axisFromAtr = el.getAttribute("data-direction") as "x" | "y";
      }

      handleMouseOrTouch({
        eventType,
        scrollElementRef: scrollElementRef.current,
        objectsWrapperRef: objectsWrapperRef.current,
        scrollBar: (clickedSBar as HTMLDivElement) || null,
        clickedObject: clickedObject,
        scrollContentRef: scrollContentRef.current,
        scrollStateRef: scrollStateRef.current,
        type,
        scrollBarOnHover,
        mouseOnRefHandle,
        triggerUpdate,
        direction,
        smoothScroll: smoothScrollLocal,
        sizeLocal: [sizeLocal[0], sizeLocal[1]],
        clicked: clickedLocal,
        numForSliderRef,
        isScrollingRef,
        prevCoordsRef,
        thumbSize:
          axisFromAtr === "x"
            ? getThumbSize({ xSize: true })
            : getThumbSize({}),
        axisFromAtr,
        duration: scrollPositionLocal.duration,
        scrollBarEdge: scrollBarEdgeLocal,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      direction,
      type,
      progressTrigger.content,
      progressTrigger.progressElement,
      sizeLocal.join(),
      getThumbSize({}),
      getThumbSize({ xSize: true }),
      scrollPositionLocal.duration,
      smoothScrollLocal,
      mouseOnRefHandle,
      scrollBarOnHover,
      scrollBarEdgeLocal.join(),
    ]
  );

  const onMouseDownScrollThumb = React.useCallback(
    (event: MouseEvent | TouchEvent) => {
      onMouseOrTouchDown(null, event.type, event.target as EventTarget);
    },
    [onMouseOrTouchDown]
  );

  const onMouseDownWrap = React.useCallback(() => {
    onMouseOrTouchDown("wrapp");
  }, [onMouseOrTouchDown]);

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
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sizeLocal.join(),
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
      scrollPositionLocal.duration,
      smoothScrollLocal,
    ]
  );

  const sliderCheckLocal = React.useCallback(() => {
    getAllScrollBars(type, customScrollRef.current, scrollBarsRef);

    const scrollEl = scrollElementRef.current;
    if (
      !scrollContentRef.current ||
      !scrollEl ||
      scrollBarsRef.current.length === 0
    )
      return;

    sliderCheck(
      scrollEl,
      scrollBarsRef.current as NodeListOf<Element>,
      sizeLocal,
      direction
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeLocal.join(), direction, scrollElementRef, scrollContentRef, type]);

  const updateLoadedElementsKeysLocal = React.useCallback(() => {
    if (!customScrollRef.current) return;
    updateLoadedElementsKeys(
      customScrollRef.current,
      objectsKeys,
      triggerUpdate,
      render?.type
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderST]);

  const updateEmptyKeysClickLocal = React.useCallback(
    (event: React.MouseEvent) => {
      if (emptyElements?.clickTrigger)
        updateEmptyKeysClick(
          event,
          emptyElements.clickTrigger,
          updateLoadedElementsKeysLocal
        );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emptyElementsST, updateLoadedElementsKeysLocal]
  );

  const handleScroll = React.useCallback(() => {
    setManagedTask(() => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return;

      onScrollValue?.(scrollEl.scrollLeft, scrollEl.scrollTop);

      isScrollingRef.current = true;
      isScrolling?.(true);

      setManagedTask(() => {
        isScrollingRef.current = false;
        isScrolling?.(false);
        updateLoadedElementsKeysLocal();
      }, 200);

      if (type === "slider") setManagedTask(() => sliderCheckLocal(), 33);

      setManagedTask(triggerUpdate, "requestFrame", "triggerUpdate");
    }, 6); // помогло убрать просадки FPS ниже 30 из 120 на mack и 20 из 60 на windows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onScrollValue,
    isScrolling,
    type,
    sliderCheckLocal,
    updateLoadedElementsKeysLocal,
  ]);

  // высчитываем сдвиг scroll и ограничиваем его
  const thumbSpace = calculateThumbSpace(
    scrollSpaceFromRef,
    endObjectsWrapper,
    xySizeForThumb,
    getThumbSize({})
  );

  const thumbSpaceX = calculateThumbSpace(
    scrollElementRef.current?.scrollLeft || 0,
    endObjectsWrapperX,
    sizeWithLimit[0],
    getThumbSize({ xSize: true })
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const keyName =
        typeof progressTrigger.wheel === "object" &&
        typeof progressTrigger.wheel.changeDirectionKey === "string"
          ? progressTrigger.wheel.changeDirectionKey
          : "KeyX";

      if (e.code === keyName && direction === "hybrid" && !keyDownX.current) {
        // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
        e.stopPropagation();
        keyDownX.current = true;
        triggerUpdate();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, JSON.stringify(progressTrigger.wheel)]
  );
  const onKeyUp = React.useCallback((e: React.KeyboardEvent) => {
    if (keyDownX.current) {
      // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
      e.stopPropagation();
      keyDownX.current = false;
      triggerUpdate();
    }
  }, []);

  // ♦ effects
  React.useEffect(() => {
    // единоразовый запуск проверки ключей
    if (emptyElements || render?.type) {
      // устанавливаем null для emptyElementKeysString что бы не использовать его когда он не нужен
      if (!emptyElements && objectsKeys.current.empty !== null)
        objectsKeys.current.empty = null;

      updateLoadedElementsKeysLocal();
    }
  }, [emptyElementsST, render?.type, updateLoadedElementsKeysLocal]);

  React.useEffect(() => {
    const animationFrameId = scrollStateRef.current.animationFrameId;

    if (render?.type || isScrolling) {
      if (isScrolling) {
        isScrolling(false);
        triggerUpdate();
      }
    }

    sliderCheckLocal();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearAllManagedTasks("timeout");
    };
  }, []);

  React.useEffect(() => {
    // wheel вешается вручную что бы выключить дефолтный scroll e.preventDefault()!!!
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    const preventScroll = (e: Event) => e.preventDefault();

    const directionWithPriority =
      direction === "hybrid" &&
      typeof progressTrigger.wheel === "object" &&
      progressTrigger.wheel.changeDirection
        ? "x"
        : direction;

    const directionLocal =
      (direction === "hybrid" &&
        objectsWrapperHeight + mLocalY <= sizeLocal[1]) ||
      keyDownX.current
        ? // уточнение был ли применён changeDirection что бы клавиша меняла уже его направление
          ["hybrid", "y"].includes(directionWithPriority)
          ? "x"
          : "y"
        : directionWithPriority;

    const wheelHandler = (e: WheelEvent) => {
      preventScroll(e);
      handleWheel(e, scrollStateRef.current, directionLocal);
    };
    // если wheel не включен, то так же запрещаем scroll
    const handler = progressTrigger.wheel ? wheelHandler : preventScroll;

    scrollEl.addEventListener("wheel", handler, { passive: false });

    return () => {
      scrollEl.removeEventListener("wheel", handler);
    };
  }, [
    direction,
    progressTriggerST,
    objectsWrapperHeight,
    sizeLocal[1],
    mLocalY,
    keyDownX.current,
  ]);

  // эффекты для scrollPosition
  React.useEffect(() => {
    // для "end"
    if (!scrollPositionLocal.value) return;

    const cancelScrolls: (() => void)[] = [];
    const directions = direction === "hybrid" ? ["x", "y"] : [direction];

    directions.forEach((dir) => {
      const index = dir === "x" ? 0 : 1;
      const value = scrollPositionLocal.value[index];

      if (value === "end")
        startScrolling(
          dir as "x" | "y",
          dir === "x" ? endObjectsWrapperX : endObjectsWrapper,
          cancelScrolls
        );
    });

    return () => {
      cancelScrolls.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direction,
    scrollPositionLocal.value.join(),
    scrollPositionValueST,
    endObjectsWrapper,
    endObjectsWrapperX,
    objectsWrapperWidthFull,
    objectsWrapperHeightFull,
    // startScrolling, <-- добавление вызывает некорректный auto scroll так как первый ребёнок перестаёт меняться а full размеры нет
  ]);
  React.useEffect(() => {
    // для number
    if (!scrollPositionLocal.value) return;

    const cancelScrolls: (() => void)[] = [];
    const directions = direction === "hybrid" ? ["x", "y"] : [direction];

    directions.forEach((dir) => {
      const index = dir === "x" ? 0 : 1;
      if (typeof scrollPositionLocal.value[index] === "number")
        startScrolling(
          dir as "x" | "y",
          scrollPositionLocal.value[index],
          cancelScrolls
        );
    });

    return () => {
      cancelScrolls.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scrollPositionValueST,
    scrollPosition?.updater,
    direction,
    startScrolling,
    scrollPositionLocal.value.join(),
  ]);

  // ♦ contents
  const scrollObjectWrapper = React.useCallback(
    (
      key: string,
      elementTop?: number,
      left?: number,
      children?: React.ReactNode
    ) => {
      const wrapStyle: React.CSSProperties = {
        width: objectsSizeLocal[0] ? `${objectsSizeLocal[0]}px` : undefined,
        height: objectsSizeLocal[1] ? `${objectsSizeLocal[1]}px` : undefined,
        ...(render?.type && {
          position: "absolute",
          top: `${elementTop}px`,
          left: `${left}px`,
          ...(!objectsSizeLocal[0] &&
            objectsPerDirection[0] === 1 && {
              transform: "translateX(-50%)",
            }),
        }),
      };

      const content = suspending ? (
        <React.Suspense fallback={fallback}>{children}</React.Suspense>
      ) : (
        children
      );

      const onClickHandler =
        emptyElements?.clickTrigger?.selector && updateEmptyKeysClickLocal;

      return (
        <div
          key={key}
          {...(render || emptyElements
            ? {
                [CONST.WRAP_ATR]: `${key}`,
              }
            : {})}
          className="ms-object-box"
          style={wrapStyle}
          onClick={onClickHandler as React.MouseEventHandler}
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
    ]
  );

  const renderChild = (key: string, index: number) => {
    // ищем реальный child по ключу
    const child = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.key === key
    ) as React.ReactElement | undefined;

    // обработка детей для render?
    const childRenderOnScroll =
      render?.stopLoadOnScroll &&
      isScrollingRef.current &&
      !objectsKeys.current.loaded.includes(`${key}`)
        ? fallback
        : objectsKeys.current.empty?.includes(key)
        ? typeof emptyElements?.mode === "object"
          ? emptyElements.mode.fallback
          : fallback
        : child;

    const childLocal =
      typeof objectsSizing[0] === "number" &&
      typeof objectsSizing[1] === "number" ? (
        childRenderOnScroll
      ) : (objectsSizing[0] === "firstChild" ||
          objectsSizing[1] === "firstChild") &&
        index === 0 ? (
        // for first child
        <ResizeTracker onResize={childResize}>
          {childRenderOnScroll}
        </ResizeTracker>
      ) : (
        childRenderOnScroll
      );

    if (render?.type) {
      const { elementTop, elementBottom, left, right } =
        memoizedChildrenData[index];

      const topOrLeft = direction === "x" ? left : elementTop;
      const bottomOrRight = direction === "x" ? right : elementBottom;
      const mRoot = direction === "x" ? mRootX : mRootY;

      const isElementVisible =
        xySize + mRoot > topOrLeft - scrollSpaceFromRef &&
        bottomOrRight - scrollSpaceFromRef > 0 - mRoot;

      const isElementVisibleHybrid =
        direction !== "hybrid"
          ? true
          : sizeLocal[0] + mRootX >
              left - (scrollElementRef.current?.scrollLeft || 0) &&
            right - (scrollElementRef.current?.scrollLeft || 0) > 0 - mRootX;

      if (isElementVisible && isElementVisibleHybrid) {
        return scrollObjectWrapper(key, elementTop, left, childLocal);
      }
    } else {
      return scrollObjectWrapper(key, 0, 0, childLocal);
    }
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
    [isNotAtStart, isNotAtEnd, direction, isNotAtStartX, isNotAtEndX]
  );

  const containerStyle = React.useMemo(
    () => ({
      width: `${sizeLocal[2]}px`,
      height: `${sizeLocal[3]}px`,
    }),
    [sizeLocal]
  );

  const scrollBarConfigs = React.useMemo(() => {
    const base: any[] = [
      {
        shouldRender: getThumbSize({ withLimit: false }) < xySize,
        direction,
        thumbSize: getThumbSize({}),
        thumbSpace,
        objLengthPerSize: objLengthPerSizeXY,
        progressReverseIndex: 0,
      },
      {
        shouldRender:
          direction === "hybrid" &&
          getThumbSize({ withLimit: false, xSize: true }) < sizeWithLimit[0],
        direction: "x" as const,
        thumbSize: getThumbSize({ xSize: true }),
        thumbSpace: thumbSpaceX,
        objLengthPerSize: objLengthPerSize[0],
        progressReverseIndex: 1,
      },
    ];

    return base.filter(({ shouldRender }) => shouldRender);
  }, [
    getThumbSize,
    xySizeForThumb,
    direction,
    sizeWithLimit[0],
    thumbSpace,
    thumbSpaceX,
    objLengthPerSizeXY,
    objLengthPerSize,
  ]);

  const contentBoxStyle = React.useMemo(() => {
    const base: any = {
      position: "relative",
      width: `${sizeLocal[0]}px`,
      height: `${sizeLocal[1]}px`,
    };

    if (progressTrigger.arrows && arrowsLocal.size) {
      if (direction === "x") base.left = `${arrowsLocal.size}px`;
      else if (direction === "y") base.top = `${arrowsLocal.size}px`;
      else {
        base.top = `${arrowsLocal.size}px`;
        base.left = `${arrowsLocal.size}px`;
      }
    }

    return base;
  }, [sizeLocal, progressTriggerST, arrowsLocal.size, direction]);

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
        progressTrigger.wheel || progressTrigger.content ? direction : "hide"
      ] ?? "hidden"
    );
  }, [
    objectsWrapperWidthFull,
    objectsWrapperHeightFull,
    sizeLocal[0],
    sizeLocal[1],
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
      />
    ));
  }, [edgeGradient, getEdgeOrArrowData, edgeGradientLocal]);

  const arrowsJSX = React.useMemo(() => {
    if (!progressTrigger.arrows) return null;

    return getEdgeOrArrowData.map(({ positionType, visibility }) => (
      <Arrow
        key={`arrow-${positionType}`}
        activity={visibility}
        arrows={arrowsLocal}
        arrowType={positionType as handleArrowT["arrowType"]}
        handleArrow={handleArrowLocal ?? handleArrowLocal}
        size={
          direction === "hybrid"
            ? sizeLocal[0] + arrowsLocal.size * 2
            : sizeLocal[0]
        }
      />
    ));
  }, [
    progressTrigger.arrows,
    getEdgeOrArrowData,
    arrowsLocal,
    handleArrowLocal,
    sizeLocal[0],
    direction,
  ]);

  const scrollBarsJSX = React.useMemo(() => {
    if (
      !progressTrigger.progressElement ||
      progressTrigger.progressElement === true
    )
      return null;

    return scrollBarConfigs.map((args) => {
      const progressReverseValue =
        typeof progressReverse === "boolean"
          ? progressReverse
          : progressReverse[args.progressReverseIndex];

      return (
        <ScrollBar
          key={String(args.direction)}
          type={type}
          direction={args.direction}
          progressReverse={progressReverseValue}
          size={sizeWithLimit}
          progressTrigger={progressTrigger}
          scrollBarOnHover={scrollBarOnHover}
          scrollBarEvent={
            type === "sliderMenu" ? smoothScrollLocal : onMouseDownScrollThumb
          }
          thumbSize={args.thumbSize}
          thumbSpace={args.thumbSpace}
          objLengthPerSize={args.objLengthPerSize}
          sliderCheckLocal={sliderCheckLocal}
          duration={scrollPositionLocal.duration}
        />
      );
    });
  }, [
    progressTrigger.progressElement,
    scrollBarConfigs,
    type,
    progressReverse,
    sizeWithLimit,
    progressTrigger,
    scrollBarOnHover,
    smoothScrollLocal,
    onMouseDownScrollThumb,
    sliderCheckLocal,
    scrollPositionLocal.duration,
  ]);

  const objectsWrapper = (
    <div
      className="ms-objects-wrapper"
      ref={objectsWrapperRef}
      onMouseDown={onMouseDownWrap}
      style={wrapperStyle}
    >
      {validChildrenKeys.map(renderChild)}
    </div>
  );

  const content = (
    <div
      morph-scroll={`〈♦${id}〉`}
      className={className}
      ref={customScrollRef}
      style={containerStyle}
    >
      <div
        className="ms-content"
        ref={scrollContentRef}
        onMouseEnter={mouseOnRefHandle}
        onMouseLeave={mouseOnRefHandle}
        onTouchStart={mouseOnRefHandle}
        onTouchEnd={mouseOnRefHandle}
        style={contentBoxStyle}
      >
        <div
          className="ms-element"
          ref={scrollElementRef}
          onScroll={handleScroll}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          style={{
            width: "100%",
            height: "100%",
            outline: "none",
            ...wrapperAlignLocal,
            overflow: overflowStyleValue,
            ...(type !== "scroll" ||
            typeof progressTrigger.progressElement !== "boolean" ||
            progressTrigger.progressElement === false
              ? { scrollbarWidth: "none" }
              : {}),
          }}
        >
          {objectsSizeLocal[0] && objectsSizeLocal[1] ? (
            objectsWrapper
          ) : (
            <ResizeTracker onResize={wrapResize} style={wrapperAlignLocal}>
              {objectsWrapper}
            </ResizeTracker>
          )}
        </div>

        {edgesJSX}
        {scrollBarsJSX}
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

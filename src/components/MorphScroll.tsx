/* eslint-disable react/no-unknown-property */
import React from "react";
import { MorphScrollT } from "../types/types";
import ArgFormatter from "../functions/ArgFormatter";

import useDebouncedCallback from "../hooks/useDebouncedCallback";
import useIdent from "../hooks/useIdent";

import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";
import ScrollBar from "./ScrollBar";
import Edge from "./Edge";
import Arrow from "./Arrow";

import handleWheel, { ScrollStateRefT } from "../functions/handleWheel";
import handleMouseOrTouch from "../functions/handleMouseOrTouch";
import { mouseOnEl, mouseOnRef } from "../functions/mouseHelpers";
import {
  objectsPerSize,
  clampValue,
  smoothScroll,
  getAllScrollBars,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
} from "../functions/addFunctions";
import handleArrow, { handleArrowT } from "../functions/handleArrow";
import {
  updateEmptyElementKeys,
  updateEmptyKeysClick,
} from "../functions/emptyKeys";
import {
  setManagedTimeout,
  clearAllManagedTimeouts,
} from "../helpers/timeoutManager";

import { CONST } from "../constants";

const MorphScroll: React.FC<MorphScrollT> = ({
  type = "scroll",
  className = "",
  size,
  objectsSize,
  direction = "y",
  gap,
  wrapperMargin,
  wrapperMinSize,
  progressReverse = false,
  progressTrigger = {},
  progressVisibility = "visible",
  suspending = false,
  fallback = null,
  scrollPosition,
  edgeGradient,
  children,
  onScrollValue,

  elementsAlign = false,
  elementsDirection = "row",
  wrapperAlign,

  isScrolling,

  render = { type: "default" },
  emptyElements,
  crossCount,
}) => {
  // ♦ hooks
  // !!! debouncedUpdateEmptyElementKeys почему-то проигрывается два раза, возможно проблема оптимизации scrollObjectWrapper
  const debouncedUpdateEmptyElementKeys = useDebouncedCallback(() => {
    updateEmptyElementKeysLocal();
  }, 40);
  const debouncedSliderCheck = useDebouncedCallback(() => {
    sliderCheckLocal();
  }, 34);

  // const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");
  const id = useIdent();

  // ♦ errors
  if (!objectsSize)
    throw new Error(`⚠️ MorphScroll: 'objectsSize' prop is not provided`);
  if (Object.keys(progressTrigger).length === 0)
    console.error(
      `MorphScroll id〈♦${id}〉
'progressTrigger' prop is not provided`
    );

  // ♦ state
  const [_, forceUpdate] = React.useState<number>(0); // для принудительного обновления

  const triggerUpdate = () => {
    forceUpdate((x) => (typeof x === "number" && x < 1000 ? x + 1 : 0));
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
  const loadedObjects = React.useRef<(string | null)[]>([]);
  const emptyElementKeysString = React.useRef<string>("");
  const evenVisibleObjects = React.useRef<string>("");

  const scrollStateRef = React.useRef<ScrollStateRefT>({
    targetScrollY: 0,
    targetScrollX: 0,
    animating: false,
    animationFrameId: 0,
  });
  const isScrollingRef = React.useRef<boolean>(false);
  const numForSliderRef = React.useRef<number>(0);
  const prevCoordsRef = React.useRef<{ x: number; y: number } | null>(null);

  function useSizeRef() {
    return React.useRef<{ width: number; height: number }>({
      width: 0,
      height: 0,
    });
  }
  const receivedScrollSizeRef = useSizeRef();
  const receivedWrapSizeRef = useSizeRef();
  const receivedChildSizeRef = useSizeRef();

  // ♦ default
  const scrollPositionLocal = React.useMemo(() => {
    return {
      value:
        typeof scrollPosition?.value === "number" ||
        typeof scrollPosition?.value === "string"
          ? [scrollPosition.value, scrollPosition.value]
          : scrollPosition?.value ?? [0, 0],
      duration: scrollPosition?.duration ?? 200,
    };
  }, [scrollPosition]);

  // ♦ variables
  const edgeGradientDefault = { color: null, size: 40 };
  const edgeGradientLocal = React.useMemo(() => {
    return typeof edgeGradient === "object"
      ? { ...edgeGradientDefault, ...edgeGradient }
      : edgeGradientDefault;
  }, [edgeGradient]);

  const arrowsLocal = React.useMemo(() => {
    return {
      ...edgeGradientDefault,
      ...(typeof progressTrigger.arrows === "object"
        ? progressTrigger.arrows
        : {}),
    };
  }, [progressTrigger.arrows]);

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
  const shouldTrackKeys = emptyElements?.mode === "clear";

  const keys = React.useCallback(() => {
    return shouldTrackKeys ? emptyElementKeysString.current : "";
  }, [emptyElementKeysString.current, shouldTrackKeys]);

  const validChildren = React.useMemo(() => {
    return React.Children.toArray(children)
      .flatMap(filterValidChildren)
      .filter(Boolean)
      .filter((child) =>
        shouldTrackKeys && React.isValidElement(child)
          ? !emptyElementKeysString.current.includes(child.key as string)
          : true
      );
  }, [children, shouldTrackKeys, keys]);

  const [mT, mR, mB, mL] = wrapperMargin
    ? ArgFormatter(wrapperMargin)
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

  const objectsSizing = React.useMemo(
    () => ArgFormatter(objectsSize, true),
    [objectsSize]
  );

  const objectsSizeLocal = React.useMemo(() => {
    const x =
      typeof objectsSizing[0] === "number"
        ? objectsSizing[0]
        : objectsSizing[0] === "none"
        ? 0
        : objectsSizing[0] === "firstChild"
        ? receivedChildSizeRef.current.width
        : 0;
    const y =
      typeof objectsSizing[1] === "number"
        ? objectsSizing[1]
        : objectsSizing[1] === "none"
        ? 0
        : objectsSizing[1] === "firstChild"
        ? receivedChildSizeRef.current.height
        : 0;

    return [x, y];
  }, [objectsSizing, receivedChildSizeRef.current]);

  const mRootLocal = React.useMemo(() => {
    return ArgFormatter(
      render.type !== "default" ? render.rootMargin || 0 : 0,
      direction === "x"
    );
  }, [render, direction]);

  const [mRootX, mRootY] = mRootLocal ? [mRootLocal[2], mRootLocal[0]] : [0, 0];

  const sizeLocal = React.useMemo(() => {
    const [x, y] =
      size && Array.isArray(size)
        ? size
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
    } else if (["hybridX", "hybridY"].includes(direction)) {
      recountX = x - arrowFullSize;
      recountY = y - arrowFullSize;
    }

    return [recountX, recountY, x, y]; // [2] & [3] is only for customScrollRef
  }, [size, arrowsLocal.size, receivedScrollSizeRef.current]);
  const xySize = direction === "x" ? sizeLocal[0] : sizeLocal[1];

  // ♦ calculations
  const objectsPerDirection = React.useMemo(() => {
    const isHorizontal = direction === "x";

    const marginPerDirection = isHorizontal ? mLocalY : mLocalX;
    const localObjSize = isHorizontal ? sizeLocal[1] : sizeLocal[0];
    const objectSize = isHorizontal
      ? objectsSizeLocal[1] + gapY
      : objectsSizeLocal[0] + gapX;

    const neededMaxSize = ["hybridX", "hybridY"].includes(direction)
      ? objectSize * (validChildren.length + 1) - objectSize
      : localObjSize;

    const objects =
      Math.floor((neededMaxSize - marginPerDirection) / objectSize) || 1;
    // устанавливаем crossCount если он есть и если он меньше objects
    const objectsPerD =
      crossCount && crossCount < objects
        ? ["hybridX", "hybridY"].includes(direction)
          ? Math.ceil(objects / crossCount)
          : crossCount
        : objects;
    const childsLinePerD =
      objectsPerD > 1
        ? Math.ceil(validChildren.length / objectsPerD)
        : validChildren.length;

    return [Math.ceil(validChildren.length / childsLinePerD), childsLinePerD];
  }, [
    validChildren.length,
    direction,
    objectsSizeLocal[0],
    objectsSizeLocal[1],
    sizeLocal[0],
    sizeLocal[1],
    gapX,
    mLocalX,
    mLocalY,
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
      : render.type !== "virtual"
      ? receivedWrapSizeRef.current.width
      : receivedChildSizeRef.current.width + childsGap;
  }, [
    objectsSizeLocal[0],
    objectsPerDirection[0],
    gapY,
    receivedWrapSizeRef.current.width,
    receivedChildSizeRef.current,
    render.type,
  ]);

  const objectsWrapperHeight = React.useMemo(() => {
    const childsGap =
      objectsPerDirection[1] < 1 ? 1 : objectsPerDirection[0] * gapX - gapX;

    return objectsSizeLocal[1]
      ? direction === "x"
        ? (objectsSizeLocal[1] + gapX) * objectsPerDirection[0] - gapX
        : (objectsSizeLocal[1] + gapX) * objectsPerDirection[1] - gapX
      : render.type !== "virtual"
      ? receivedWrapSizeRef.current.height // on "fit-content"
      : receivedChildSizeRef.current.height + childsGap;
  }, [
    objectsSizeLocal[1],
    objectsPerDirection[1],
    gapX,
    receivedWrapSizeRef.current.height,
    receivedChildSizeRef.current,
    render.type,
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
  if (["hybridX", "hybridY"].includes(direction)) {
    isNotAtStartX = (scrollElementRef.current?.scrollLeft || 0) > 1 && true;
    isNotAtEndX =
      Math.round((scrollElementRef.current?.scrollLeft || 0) + sizeLocal[0]) <
      objectsWrapperWidthFull;
  }

  const thumbSize = React.useMemo(() => {
    if (!progressTrigger.progressElement) return 0;
    return Math.round((xySize / fullHeightOrWidth) * xySize);
  }, [xySize, fullHeightOrWidth, progressTrigger.progressElement]);
  const thumbSizeX = React.useMemo(() => {
    if (!progressTrigger.progressElement) return 0;
    return Math.round((sizeLocal[0] / objectsWrapperWidthFull) * sizeLocal[0]);
  }, [sizeLocal[0], objectsWrapperWidthFull, progressTrigger.progressElement]);

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
  }, [objectsWrapperWidthFull, sizeLocal[0]]);

  // делим на группы
  const splitIndices = React.useCallback(() => {
    if (render.type !== "virtual" || objectsPerDirection[0] <= 1) {
      return [];
    }

    // Создаём массив индексов детей
    const indices = Array.from({ length: validChildren.length }, (_, i) => i);

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
  }, [
    validChildren.length,
    objectsPerDirection[0],
    objectsPerDirection[1],
    render.type,
    elementsDirection,
    direction,
  ]);

  const memoizedChildrenData = React.useMemo(() => {
    if (render.type !== "virtual")
      return [{ elementTop: 0, elementBottom: 0, left: 0, right: 0 }];

    let lastIndices: number[] = [];
    let alignSpaceLeft: number = 0;

    if (elementsAlign) {
      const indices = Array.from(
        { length: validChildren.length },
        (_, index) => index
      );

      // находим индексы последних элементов
      const lastChildsInDirection = Math.abs(
        Math.floor(validChildren.length / objectsPerDirection[0]) *
          objectsPerDirection[0] -
          validChildren.length
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

    return validChildren.map((_, index) => {
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
            const neededTopIndex = ["hybridY", "hybridX", "y"].includes(
              direction
            )
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
        objectsPerDirection[0] > 1 ||
          ["hybridY", "hybridX", "x"].includes(direction)
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
  }, [
    children,
    objectsSizeLocal,
    gap,
    render.type,
    objectsPerDirection[0],
    elementsDirection,
  ]);

  const wrapperAlignLocal = React.useMemo(() => {
    if (!sizeLocal?.length || !wrapperAlign) return {};

    return getWrapperAlignStyle(
      wrapperAlign,
      sizeLocal,
      objectsWrapperWidthFull,
      objectsWrapperHeightFull
    );
  }, [
    wrapperAlign,
    sizeLocal[0],
    sizeLocal[1],
    objectsWrapperHeightFull,
    objectsWrapperWidthFull,
  ]);

  const objLengthPerSize = React.useMemo(() => {
    const x = objectsPerSize(objectsWrapperWidthFull, sizeLocal[0]);
    const y = objectsPerSize(objectsWrapperHeightFull, sizeLocal[1]);

    return [x, y];
  }, [
    objectsWrapperWidthFull,
    objectsWrapperHeightFull,
    sizeLocal[0],
    sizeLocal[1],
  ]);
  const objLengthPerSizeXY = React.useMemo(() => {
    return direction === "x" ? objLengthPerSize[0] : objLengthPerSize[1];
  }, [direction, objLengthPerSize[0], objLengthPerSize[1]]);

  // ♦ events
  const mouseOnRefHandle = React.useCallback(
    (
      event:
        | React.MouseEvent<HTMLDivElement>
        | React.TouchEvent<HTMLDivElement>
        | MouseEvent
        | TouchEvent
    ) => {
      if (progressVisibility !== "hover") return;
      const func = () =>
        mouseOnRef(
          scrollContentRef.current,
          type === "scroll" ? "scrollBar" : "sliderBar",
          event,
          setManagedTimeout
        );

      if (event.type === "mouseleave") {
        !["thumb", "slider", "wrapp"].includes(clickedObject.current) && func();
      } else {
        func();
      }
    },
    [progressVisibility, type, clickedObject.current, scrollContentRef.current]
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
      });
    },
    [
      scrollElementRef.current,
      sizeLocal[0],
      sizeLocal[1],
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
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
  }, [
    sizeLocal[0],
    sizeLocal[1],
    direction,
    scrollElementRef,
    scrollContentRef,
    scrollBarsRef,
    type,
  ]);

  const handleScroll = React.useCallback(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    onScrollValue?.(scrollEl.scrollLeft, scrollEl.scrollTop);

    isScrollingRef.current = true;
    isScrolling?.(true);

    setManagedTimeout(
      "handleScroll-anim",
      () => {
        isScrollingRef.current = false;
        isScrolling?.(false);
        if (render.type !== "default") {
          debouncedUpdateEmptyElementKeys();
        } else triggerUpdate();
      },
      200
    );

    if (type === "slider") debouncedSliderCheck();
    if (render.type !== "default") {
      debouncedUpdateEmptyElementKeys();
    }

    triggerUpdate();
  }, [
    direction,
    onScrollValue,
    isScrolling,
    render,
    type,
    debouncedSliderCheck,
  ]);

  // высчитываем сдвиг скролла и ограничиваем его
  const thumbSpace = clampValue(
    (scrollSpaceFromRef / endObjectsWrapper) * (xySize - thumbSize),
    0,
    xySize - thumbSize
  );

  const thumbSpaceX = clampValue(
    ((scrollElementRef.current?.scrollLeft || 0) / endObjectsWrapperX) *
      (sizeLocal[0] - (sizeLocal[0] / objectsWrapperWidthFull) * sizeLocal[0]),
    0,
    sizeLocal[0] - thumbSizeX
  );

  // ♦ functions
  const scrollResize = React.useCallback(
    createResizeHandler(receivedScrollSizeRef, triggerUpdate),
    []
  );
  const wrapResize = React.useCallback(
    createResizeHandler(receivedWrapSizeRef, triggerUpdate, mLocalX, mLocalY),
    [mLocalX, mLocalY]
  );
  const childResize = React.useCallback(
    createResizeHandler(receivedChildSizeRef, triggerUpdate),
    []
  );

  const smoothScrollLocal = React.useCallback(
    (targetScroll: number, direction: "y" | "x", callback?: () => void) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return null;

      return smoothScroll(
        direction,
        scrollEl,
        scrollPositionLocal.duration,
        targetScroll,
        callback
      );
    },
    [scrollElementRef, scrollPositionLocal.duration]
  );

  const onMouseOrTouchDown = React.useCallback(
    (
      clicked: "thumb" | "slider" | "wrapp" | null,
      eventType: string = "mousedown",
      scrollElemIndex?: number
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

      handleMouseOrTouch({
        eventType,
        scrollElementRef: scrollElementRef.current,
        objectsWrapperRef: objectsWrapperRef.current,
        scrollBarsRef: scrollBarsRef.current,
        clickedObject: clickedObject,
        scrollContentRef: scrollContentRef.current,
        scrollStateRef: scrollStateRef.current,
        type,
        progressVisibility,
        mouseOnEl,
        mouseOnRefHandle,
        triggerUpdate,
        objLengthPerSize: objLengthPerSize,
        direction,
        smoothScroll: smoothScrollLocal,
        sizeLocal: [sizeLocal[0], sizeLocal[1]],
        clicked: clickedLocal,
        scrollElemIndex,
        numForSliderRef,
        isScrollingRef,
        prevCoordsRef,
      });
    },
    [
      type,
      progressTrigger.content,
      progressTrigger.progressElement,
      objLengthPerSize[0],
      objLengthPerSize[1],
      sizeLocal[0],
      sizeLocal[1],
    ]
  );
  const onMouseDownScrollThumb = React.useCallback(
    (
      event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      onMouseOrTouchDown(null, event.type);
    },
    [onMouseOrTouchDown]
  );
  const onMouseDownScrollThumbTwo = React.useCallback(
    (
      event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      onMouseOrTouchDown(null, event.type, 1);
    },
    [onMouseOrTouchDown]
  );
  const onMouseDownWrap = React.useCallback(() => {
    onMouseOrTouchDown("wrapp");
  }, [onMouseOrTouchDown]);

  const getDataIdsFromAtr = React.useCallback(() => {
    const elements = customScrollRef.current!.querySelectorAll(
      `[${CONST.WRAP_ATR}]`
    );
    return elements ?? [];
  }, []);

  const updateEmptyElementKeysLocal = React.useCallback(() => {
    // !!! есть механизм добавления пустых ключей, но нет добавления появившегося ключа который был пустым
    updateEmptyElementKeys(
      getDataIdsFromAtr,
      emptyElementKeysString,
      render,
      triggerUpdate
    );
  }, [render.type]);

  const updateEmptyKeysClickLocal = React.useCallback(
    (event: React.MouseEvent) => {
      if (emptyElements)
        updateEmptyKeysClick(
          event,
          setManagedTimeout,
          emptyElements,
          updateEmptyElementKeysLocal
        );
    },
    [emptyElements]
  );

  // ♦ effects
  React.useEffect(() => {
    if (emptyElements && render.type !== "lazy")
      debouncedUpdateEmptyElementKeys();
  }, [validChildren.length, emptyElements, render.type]);

  React.useEffect(() => {
    if (render.type === "virtual" || isScrolling) {
      if (isScrolling) isScrolling(false);
      triggerUpdate();
    }

    sliderCheckLocal();
    return () => {
      if (scrollStateRef.current.animationFrameId) {
        cancelAnimationFrame(scrollStateRef.current.animationFrameId);
      }
      clearAllManagedTimeouts();
    };
  }, []);

  React.useEffect(() => {
    const scrollEl = scrollElementRef.current;

    if (progressTrigger.wheel && scrollEl) {
      const wheelHandler = (e: WheelEvent) =>
        handleWheel(e, scrollEl, scrollStateRef.current, direction);

      scrollEl.addEventListener("wheel", wheelHandler, { passive: false });

      return () => {
        scrollEl.removeEventListener("wheel", wheelHandler);
      };
    }
  }, [direction, progressTrigger.wheel]);

  React.useEffect(() => {
    if (!scrollPositionLocal.value || validChildren.length === 0) return;

    const firstChildKey = React.isValidElement(validChildren[0])
      ? validChildren[0].key
      : null;

    const cancelScrolls: (() => void)[] = [];

    if (!firstChildKeyRef.current) {
      firstChildKeyRef.current = firstChildKey;
    }

    const tryScroll = (
      dir: "x" | "y",
      value: number | "end",
      full: number,
      size: number,
      endValue: number
    ) => {
      if (firstChildKeyRef.current !== firstChildKey) return;

      if (value === "end" && full > size) {
        const cancel = smoothScrollLocal(endValue, dir);
        if (cancel) cancelScrolls.push(cancel);
      } else if (typeof value === "number") {
        const cancel = smoothScrollLocal(value, dir);
        if (cancel) cancelScrolls.push(cancel);
      }
    };

    const directions = ["hybridX", "hybridY"].includes(direction)
      ? ["x", "y"]
      : [direction];

    directions.forEach((dir) => {
      const index = dir === "x" ? 0 : 1;
      tryScroll(
        dir as "x" | "y",
        scrollPositionLocal.value[index],
        dir === "x" ? objectsWrapperWidthFull : objectsWrapperHeightFull,
        sizeLocal[index],
        dir === "x" ? endObjectsWrapperX : endObjectsWrapper
      );
    });

    if (!isScrollingRef.current) firstChildKeyRef.current = firstChildKey;

    return () => {
      cancelScrolls.forEach((fn) => fn());
    };
  }, [
    scrollPosition?.updater,
    scrollPositionLocal.value[0],
    scrollPositionLocal.value[1],
    smoothScrollLocal,
    endObjectsWrapper,
    direction,
    xySize,
    objectsWrapperWidthFull,
    objectsWrapperHeightFull,
    sizeLocal[0],
    sizeLocal[1],
  ]);

  React.useEffect(() => {
    if (
      (render.type !== "default" && render.stopLoadOnScroll) ||
      render.type === "lazy"
    ) {
      const dataIds = Array.from(getDataIdsFromAtr(), (el) =>
        el.getAttribute(CONST.WRAP_ATR)
      );
      loadedObjects.current = dataIds;
    }

    return () => {
      if (loadedObjects.current.length > 0) loadedObjects.current = [];
    };
  }, [render, validChildren.length, isScrollingRef.current]);

  // ♦ contents
  const scrollObjectWrapper = React.useCallback(
    (
      attribute: string,
      elementTop?: number,
      left?: number,
      children?: React.ReactNode,
      key?: string
    ) => {
      const content = suspending ? (
        <React.Suspense fallback={fallback}>{children}</React.Suspense>
      ) : (
        children
      );

      const wrapStyle1 = {
        width: objectsSizeLocal[0] ? `${objectsSizeLocal[0]}px` : "",
        height: objectsSizeLocal[1] ? `${objectsSizeLocal[1]}px` : "",
      };

      const commonProps = {
        root: scrollElementRef.current,
        rootMargin: render.type === "lazy" ? render.rootMargin : mRootLocal,
        style:
          render.type === "virtual"
            ? ({
                ...wrapStyle1,
                position: "absolute",
                top: `${elementTop}px`,
                left: `${left}px`,
                ...(!objectsSizeLocal[0] &&
                  objectsPerDirection[0] === 1 && {
                    transform: "translateX(-50%)",
                  }),
              } as React.CSSProperties)
            : {
                ...wrapStyle1,
              },
        onVisible: debouncedUpdateEmptyElementKeys,
        onClick: emptyElements?.clickTrigger?.selector
          ? updateEmptyKeysClickLocal
          : undefined,
        attribute: {
          name: CONST.WRAP_ATR,
          value: attribute,
          viewVisible: render.type === "lazy",
        },
      };

      // механизм сохранения видимых элементов в evenVisibleObjects, что бы они всегда были видны
      const previous = evenVisibleObjects.current.split("/").filter(Boolean);
      const current = loadedObjects.current.filter((el) =>
        el?.includes("visible")
      );
      evenVisibleObjects.current = [...new Set([...previous, ...current])].join(
        "/"
      );

      return render.type === "lazy" ? (
        <IntersectionTracker
          key={key}
          style={commonProps.style} // !!! ререндер
          attribute={commonProps.attribute} // !!! ререндер
          onVisible={commonProps.onVisible}
          onClick={commonProps.onClick}
          visibleContent={evenVisibleObjects.current.includes(key!)}
        >
          {content}
        </IntersectionTracker>
      ) : (
        <div
          {...((render.type === "virtual" && render.stopLoadOnScroll) ||
          emptyElements
            ? { [CONST.WRAP_ATR]: `${attribute} visible` }
            : {})}
          onClick={commonProps.onClick}
          key={key}
          style={commonProps.style}
        >
          {content}
        </div>
      );
    },
    [
      suspending,
      fallback,
      objectsSizeLocal[0],
      objectsSizeLocal[1],
      scrollElementRef.current,
      render,
      mRootLocal,
      debouncedUpdateEmptyElementKeys,
      emptyElements,
      objectsPerDirection[0],
      loadedObjects.current,
    ]
  );

  const renderChild = (child: React.ReactNode, index: number) => {
    const key = (child as React.ReactElement).key || "";
    const visibleObjects =
      render.type === "lazy"
        ? evenVisibleObjects.current
        : loadedObjects.current;

    const childRenderOnScroll =
      render.type !== "default" &&
      render.stopLoadOnScroll &&
      !visibleObjects.includes(`${key} visible`) &&
      isScrollingRef.current
        ? fallback
        : emptyElements?.mode === "fallback" &&
          emptyElementKeysString.current.includes(key)
        ? emptyElements.element ?? fallback
        : child;

    const childLocal =
      typeof objectsSizing[0] === "number" &&
      typeof objectsSizing[1] === "number" ? (
        childRenderOnScroll
      ) : (objectsSizing[0] === "firstChild" ||
          objectsSizing[1] === "firstChild") &&
        index === 0 ? (
        <ResizeTracker onResize={childResize}>
          {childRenderOnScroll}
        </ResizeTracker>
      ) : (
        childRenderOnScroll
      );

    if (render.type === "virtual") {
      const { elementTop, elementBottom, left, right } =
        memoizedChildrenData[index];

      const topOrLeft = direction === "x" ? left : elementTop;
      const bottomOrRight = direction === "x" ? right : elementBottom;
      const mRoot = direction === "x" ? mRootX : mRootY;

      const isElementVisible =
        xySize + mRoot > topOrLeft - scrollSpaceFromRef &&
        bottomOrRight - scrollSpaceFromRef > 0 - mRoot;

      const isElementVisibleHybrid = !["hybridX", "hybridY"].includes(direction)
        ? true
        : sizeLocal[0] + mRootX >
            left - (scrollElementRef.current?.scrollLeft || 0) &&
          right - (scrollElementRef.current?.scrollLeft || 0) > 0 - mRootX;

      if (isElementVisible && isElementVisibleHybrid) {
        return scrollObjectWrapper(`${key}`, elementTop, left, childLocal, key);
      }
    } else {
      return scrollObjectWrapper(`${key}`, 0, 0, childLocal, key);
    }
  };

  const objectsWrapper = (
    <div
      className="objectsWrapper"
      ref={objectsWrapperRef}
      onMouseDown={onMouseDownWrap}
      // onTouchStart={onMouseDownWrap}
      style={{
        margin: wrapperMargin ? `${mT}px ${mR}px ${mB}px ${mL}px` : "",
        height:
          objectsSizing[1] !== "none"
            ? `${objectsWrapperHeight}px`
            : "fit-content",
        width: `${objectsWrapperWidth}px`,

        ...(progressTrigger.content && { cursor: "grab" }),

        ...(gap && render.type !== "virtual" && { gap: `${gapX}px ${gapY}px` }),
        ...(render.type === "virtual"
          ? {
              position: "relative",
            }
          : {
              display: "flex",
            }),

        ...(render.type !== "virtual" &&
          objectsPerDirection[0] > 1 && {
            flexDirection: elementsDirection,
          }),

        ...(render.type !== "virtual" &&
          objectsPerDirection[0] === 1 && {
            flexDirection: "column",
          }),

        ...(render.type !== "virtual" &&
          objectsSizing[1] !== "none" && {
            flexWrap: "wrap",
          }),

        ...(elementsAlign &&
        render.type !== "virtual" &&
        objectsPerDirection[0] > 1
          ? {
              justifyContent:
                elementsAlign === "start"
                  ? "flex-start"
                  : elementsAlign === "center"
                  ? "center"
                  : "flex-end",
            }
          : render.type !== "virtual" && {
              alignItems: "center",
            }),

        ...(wrapperMinSize &&
          getWrapperMinSizeStyle(
            wrapperMinSize,
            direction,
            sizeLocal,
            mLocalX,
            mLocalY
          )),

        ...(wrapperAlign && {
          flexShrink: 0, // это решает проблему с уменьшением ширины при флексе на objectsWrapper
        }),
      }}
    >
      {validChildren.map(renderChild)}
    </div>
  );

  const getEdgeOrArrowData = [
    {
      positionType: direction === "x" ? "left" : "top",
      visibility: isNotAtStart,
    },
    {
      positionType: direction === "x" ? "right" : "bottom",
      visibility: isNotAtEnd,
    },
    ...(["hybridX", "hybridY"].includes(direction)
      ? [
          { positionType: "left", visibility: isNotAtStartX },
          { positionType: "right", visibility: isNotAtEndX },
        ]
      : []),
  ];

  const content = (
    <div
      morph-scroll={`〈♦${id}〉`}
      className={`${className && className}`}
      ref={customScrollRef}
      style={{
        width: `${sizeLocal[2]}px`,
        height: `${sizeLocal[3]}px`,
      }}
    >
      <div
        className="scrollContent"
        ref={scrollContentRef}
        onMouseEnter={mouseOnRefHandle}
        onMouseLeave={mouseOnRefHandle}
        onTouchStart={mouseOnRefHandle}
        onTouchEnd={mouseOnRefHandle}
        style={{
          position: "relative",
          width: `${sizeLocal[0]}px`,
          height: `${sizeLocal[1]}px`,
          ...(progressTrigger.arrows &&
            arrowsLocal.size &&
            (direction === "x"
              ? { left: `${arrowsLocal.size}px` }
              : direction === "y"
              ? { top: `${arrowsLocal.size}px` }
              : {
                  top: `${arrowsLocal.size}px`,
                  left: `${arrowsLocal.size}px`,
                })),
        }}
      >
        <div
          className="scrollElement"
          ref={scrollElementRef}
          onScroll={handleScroll}
          style={{
            width: "100%",
            height: "100%",
            ...wrapperAlignLocal,

            // интересное решение overflow
            ...{
              overflow:
                {
                  x: `${
                    objectsWrapperWidthFull > sizeLocal[0]
                      ? "scroll hidden"
                      : "hidden"
                  }`,
                  y: `${
                    objectsWrapperHeightFull > sizeLocal[1]
                      ? "hidden scroll"
                      : "hidden"
                  }`,
                  hybrid: `${
                    objectsWrapperWidthFull > sizeLocal[0] ? "scroll" : "hidden"
                  } ${
                    objectsWrapperHeightFull > sizeLocal[1]
                      ? "scroll"
                      : "hidden"
                  }`,
                }[
                  Object.keys(progressTrigger).length !== 0 &&
                  (direction === "x" || direction === "y")
                    ? direction
                    : "hybrid"
                ] ?? "hidden",
            },

            ...(type !== "scroll" ||
            typeof progressTrigger.progressElement !== "boolean" ||
            progressTrigger.progressElement === false
              ? {
                  scrollbarWidth: "none",
                }
              : {}),

            ...(!(progressTrigger.wheel || progressTrigger.content) && {
              touchAction: "none",
            }),
          }}
        >
          {objectsSizing[0] !== "none" && objectsSizing[1] !== "none" ? (
            objectsWrapper
          ) : (
            <ResizeTracker
              onResize={wrapResize}
              style={{
                ...wrapperAlignLocal,
              }}
            >
              {objectsWrapper}
            </ResizeTracker>
          )}
        </div>

        {edgeGradient &&
          getEdgeOrArrowData.map(({ positionType, visibility }) => (
            <Edge
              key={`edge-${positionType}`}
              edgeGradient={edgeGradientLocal}
              visibility={visibility}
              edgeType={positionType as "left" | "right" | "top" | "bottom"}
            />
          ))}

        {progressTrigger.progressElement &&
          progressTrigger.progressElement !== true &&
          [
            {
              shouldRender: thumbSize < fullHeightOrWidth,
              direction: direction,
              thumbSize,
              thumbSpace,
              objLengthPerSize: objLengthPerSizeXY,
              scrollBarEvent:
                type === "sliderMenu"
                  ? smoothScrollLocal
                  : onMouseDownScrollThumb,
              progressReverseIndex: 0,
            },
            {
              shouldRender:
                ["hybridX", "hybridY"].includes(direction) &&
                thumbSizeX < objectsWrapperWidthFull,
              direction: "x" as const,
              thumbSize: thumbSizeX,
              thumbSpace: thumbSpaceX,
              objLengthPerSize: objLengthPerSize[0],
              scrollBarEvent:
                type === "sliderMenu"
                  ? smoothScrollLocal
                  : onMouseDownScrollThumbTwo,
              progressReverseIndex: 1,
            },
          ]
            .filter(({ shouldRender }) => shouldRender)
            .map((args) => (
              <ScrollBar
                key={args.direction}
                type={type}
                direction={args.direction}
                progressReverse={
                  typeof progressReverse === "boolean"
                    ? progressReverse
                    : progressReverse[args.progressReverseIndex]
                }
                size={sizeLocal}
                progressTrigger={progressTrigger}
                progressVisibility={progressVisibility}
                scrollBarEvent={args.scrollBarEvent}
                thumbSize={args.thumbSize}
                thumbSpace={args.thumbSpace}
                objLengthPerSize={args.objLengthPerSize}
                sliderCheckLocal={sliderCheckLocal}
              />
            ))}
      </div>

      {progressTrigger.arrows &&
        getEdgeOrArrowData.map(({ positionType, visibility }) => (
          <Arrow
            key={`arrow-${positionType}`}
            activity={visibility}
            arrows={arrowsLocal}
            arrowType={positionType as handleArrowT["arrowType"]}
            handleArrow={handleArrowLocal}
            size={
              ["hybridX", "hybridY"].includes(direction)
                ? sizeLocal[0] + arrowsLocal.size * 2
                : sizeLocal[0]
            }
          />
        ))}
    </div>
  );

  if (!size) {
    return (
      <ResizeTracker measure="outer" onResize={scrollResize}>
        {content}
      </ResizeTracker>
    );
  } else {
    return content;
  }
};

export default MorphScroll;

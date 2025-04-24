/* eslint-disable react/no-unknown-property */
import React from "react";
import { MorphScrollT } from "./types";
import numOrArrFormat from "./numOrArrFormater";
import useIdent from "./useIdent";

import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";
import ScrollBar from "./ScrollBar";
import Edge from "./Edge";
import Arrow from "./Arrow";

import handleWheel, { ScrollStateRefT } from "./handleWheel";
import handleMouseDown from "./handleMouse";
import { mouseOnEl, mouseOnRef } from "./mouseHelpers";
import {
  objectsPerSize,
  clampValue,
  smoothScroll,
  getAllScrollBars,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
} from "./addFunctions";
import handleArrow, { handleArrowT } from "./handleArrow";

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
  progressTrigger = { wheel: true },
  progressVisibility = "visible",
  suspending = false,
  fallback = null,
  scrollPosition,
  edgeGradient,
  children,
  onScrollValue,

  elementsAlign = false,
  wrapperAlign,

  isScrolling,
  stopLoadOnScroll = false,

  render = { type: "default" },
  emptyElements,
  crossCount,
}) => {
  const [_, forceUpdate] = React.useState<number>(0); // для принудительного обновления

  const triggerUpdate = () => {
    forceUpdate((n) => (n === 1 ? 0 : 1));
  };

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
  const scrollTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const emptyElementKeysString = React.useRef<string>("");
  const scrollStateRef = React.useRef<ScrollStateRefT>({
    targetScrollY: 0,
    targetScrollX: 0,
    animating: false,
    animationFrameId: 0,
  });
  const isScrollingRef = React.useRef<boolean>(false);
  const numForSliderRef = React.useRef<number>(0);

  const [receivedScrollSize, setReceivedScrollSize] = React.useState({
    width: 0,
    height: 0,
  });
  const [receivedWrapSize, setReceivedWrapSize] = React.useState({
    width: 0,
    height: 0,
  });
  const [receivedChildSize, setReceivedChildSize] = React.useState({
    width: 0,
    height: 0,
  });

  // const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");
  const id = useIdent();

  // default
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

  // variables
  const edgeGradientDefault = { color: null, size: 40 };
  const edgeGradientLocal = React.useMemo(() => {
    return typeof edgeGradient === "object"
      ? { ...edgeGradientDefault, ...edgeGradient }
      : edgeGradientDefault;
  }, []);

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
  const keys = React.useMemo(
    () => (shouldTrackKeys ? emptyElementKeysString.current : ""),
    [shouldTrackKeys, emptyElementKeysString.current]
  );
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

  const [mT, mR, mB, mL] = numOrArrFormat(wrapperMargin) || [0, 0, 0, 0];
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

  const objectsSizeLocal = React.useMemo(() => {
    const x =
      typeof objectsSize[0] === "number"
        ? objectsSize[0]
        : objectsSize[0] === "none"
        ? 0
        : objectsSize[0] === "firstChild"
        ? receivedChildSize.width
        : 0;
    const y =
      typeof objectsSize[1] === "number"
        ? objectsSize[1]
        : objectsSize[1] === "none"
        ? 0
        : objectsSize[1] === "firstChild"
        ? receivedChildSize.height
        : 0;

    return [x, y];
  }, [objectsSize, receivedChildSize]);

  const mRootLocal = React.useMemo(() => {
    return numOrArrFormat(
      render.type !== "default" ? render.rootMargin || 0 : 0,
      direction === "x"
    );
  }, [render, direction]);

  const [mRootX, mRootY] = mRootLocal ? [mRootLocal[2], mRootLocal[0]] : [0, 0];

  const sizeLocal = React.useMemo(() => {
    const [x, y] =
      size && Array.isArray(size)
        ? size
        : [receivedScrollSize.width, receivedScrollSize.height];

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
  }, [size, arrowsLocal.size, receivedScrollSize]);
  const xySize = direction === "x" ? sizeLocal[0] : sizeLocal[1];

  // calculations
  const objectsPerDirection = React.useMemo(() => {
    const isHorizontal = direction === "x";

    const marginPerDirection = isHorizontal ? mLocalY : mLocalX;
    const localObjSize = isHorizontal ? sizeLocal[1] : sizeLocal[0];
    const objectSize = isHorizontal
      ? objectsSizeLocal[1] + gapY
      : objectsSizeLocal[0] + gapX;

    const hybridSize = objectSize * (validChildren.length + 1) - objectSize;
    const neededMaxSize = direction === "hybrid" ? hybridSize : localObjSize;

    const objects = objectSize
      ? Math.floor((neededMaxSize - marginPerDirection) / objectSize)
      : 1;

    // устанавливаем crossCount если он есть и если он меньше objects
    return crossCount && crossCount < objects ? crossCount : objects;
  }, [direction, objectsSizeLocal, sizeLocal, gapX, mLocalX, mLocalY]);

  const childsLinePerDirection = React.useMemo(() => {
    return objectsPerDirection > 1
      ? Math.ceil(validChildren.length / objectsPerDirection)
      : validChildren.length;
  }, [validChildren.length, objectsPerDirection]);

  // делим на группы
  const splitIndices = React.useCallback(() => {
    if (render.type !== "virtual" || objectsPerDirection <= 1) {
      return [];
    }

    // Создаём массив индексов детей
    const indices = Array.from({ length: validChildren.length }, (_, i) => i);

    // Создаём пустые массивы
    const result: number[][] = Array.from(
      { length: objectsPerDirection },
      () => []
    );

    indices.forEach((index) => {
      const groupIndex = index % objectsPerDirection;

      if (!result[groupIndex]) {
        return;
      }

      result[groupIndex].push(index);
    });

    return result;
  }, [validChildren.length, objectsPerDirection, render.type]);

  const objectsWrapperWidth = React.useMemo(() => {
    const childsGap = !objectsPerDirection
      ? 0
      : objectsPerDirection * gapY - gapY;
    const neededObj =
      direction === "x" ? childsLinePerDirection : objectsPerDirection;

    return objectsSizeLocal[0]
      ? (objectsSizeLocal[0] + gapY) * neededObj - gapY
      : render.type !== "virtual"
      ? receivedWrapSize.width
      : receivedChildSize.width + childsGap;
  }, [
    objectsSizeLocal[0],
    objectsPerDirection,
    gapY,
    receivedWrapSize.width,
    receivedChildSize,
    render.type,
  ]);

  const objectsWrapperHeight = React.useMemo(() => {
    const childsGap =
      childsLinePerDirection < 1 ? 1 : objectsPerDirection * gapX - gapX;

    return objectsSizeLocal[1]
      ? direction === "x"
        ? (objectsSizeLocal[1] + gapX) * objectsPerDirection - gapX
        : (objectsSizeLocal[1] + gapX) * childsLinePerDirection - gapX
      : render.type !== "virtual"
      ? receivedWrapSize.height // on "fit-content"
      : receivedChildSize.height + childsGap;
  }, [
    objectsSizeLocal[1],
    childsLinePerDirection,
    gapX,
    receivedWrapSize.height,
    receivedChildSize,
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
  if (direction === "hybrid") {
    isNotAtStartX = (scrollElementRef.current?.scrollLeft || 0) > 1 && true;
    isNotAtEndX =
      Math.round((scrollElementRef.current?.scrollLeft || 0) + sizeLocal[0]) <
      objectsWrapperWidthFull;
  }

  const thumbSize = React.useMemo(() => {
    if (progressVisibility === "hidden") return 0;
    return Math.round((xySize / fullHeightOrWidth) * xySize);
  }, [xySize, fullHeightOrWidth, progressVisibility]);
  const thumbSizeX = React.useMemo(() => {
    if (progressVisibility === "hidden") return 0;
    return Math.round((sizeLocal[0] / objectsWrapperWidthFull) * sizeLocal[0]);
  }, [sizeLocal[0], objectsWrapperWidthFull]);

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
        Math.floor(validChildren.length / objectsPerDirection) *
          objectsPerDirection -
          validChildren.length
      );
      // находим индексы и отсекаем лишние
      lastIndices = !lastChildsInDirection
        ? []
        : indices.slice(-lastChildsInDirection);

      if (elementsAlign === "center") {
        alignSpaceLeft =
          ((objectsSizeLocal[0] + gapY) *
            (objectsPerDirection - lastChildsInDirection)) /
          2;
      } else if (elementsAlign === "end") {
        alignSpaceLeft =
          (objectsSizeLocal[0] + gapY) *
          (objectsPerDirection - lastChildsInDirection);
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
            const neededTopIndex =
              direction === "y" || direction === "hybrid"
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
        objectsPerDirection > 1 || direction === "x" || direction === "hybrid"
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
        objectsPerDirection === 1 && direction === "x"
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
    splitIndices,
    objectsSizeLocal,
    gap,
    render.type,
    objectsPerDirection,
  ]);

  const wrapperAlignLocal = React.useMemo(
    () =>
      getWrapperAlignStyle(
        wrapperAlign,
        sizeLocal,
        objectsWrapperWidthFull,
        objectsWrapperHeightFull
      ),
    [wrapperAlign, sizeLocal, objectsWrapperHeightFull, objectsWrapperWidthFull]
  );

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

  // events
  const mouseOnRefHandle = React.useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      if (progressVisibility !== "hover") return;
      const func = () =>
        mouseOnRef(
          scrollContentRef.current,
          type === "scroll" ? "scrollBar" : "sliderBar",
          event
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
    if (!scrollEl || scrollBarsRef.current.length === 0) return;

    getAllScrollBars(type, customScrollRef.current, scrollBarsRef);

    if (!scrollContentRef.current || scrollBarsRef.current.length === 0) return;

    sliderCheck(
      scrollEl,
      scrollBarsRef.current as NodeListOf<Element>,
      sizeLocal,
      direction
    );
  }, [
    sizeLocal,
    direction,
    scrollElementRef,
    scrollContentRef,
    scrollBarsRef,
    type,
    id,
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

  const handleScroll = React.useCallback(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    onScrollValue?.(scrollEl.scrollLeft, scrollEl.scrollTop);

    // scroll status
    isScrollingRef.current = true;
    isScrolling?.(true);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      isScrollingRef.current = false;
      isScrolling?.(false);
      if (render.type !== "default") updateEmptyElementKeys(false);

      triggerUpdate();
    }, 200);

    if (type === "slider") sliderCheckLocal();
    if (render.type !== "default") updateEmptyElementKeys(false);

    triggerUpdate();
  }, [direction, onScrollValue, isScrolling, render, type, sliderCheckLocal]);

  // functions
  const scrollResize = React.useCallback(
    (rect: Partial<DOMRectReadOnly>) => {
      const newSize = { width: rect.width ?? 0, height: rect.height ?? 0 };

      if (
        receivedScrollSize.width === newSize.width &&
        receivedScrollSize.height === newSize.height
      )
        return;

      setReceivedScrollSize(newSize);
    },
    [mLocalY, receivedScrollSize]
  );
  const wrapResize = React.useCallback(
    (rect: Partial<DOMRectReadOnly>) => {
      const newSize = {
        width: (rect.width ?? 0) - mLocalX,
        height: (rect.height ?? 0) - mLocalY,
      };

      if (
        receivedWrapSize.width === newSize.width &&
        receivedWrapSize.height === newSize.height
      ) {
        return;
      }

      setReceivedWrapSize(newSize);
    },
    [mLocalX, mLocalY, receivedWrapSize]
  );
  const childResize = React.useCallback(
    (rect: Partial<DOMRectReadOnly>) => {
      const newSize = { width: rect.width ?? 0, height: rect.height ?? 0 };

      if (
        receivedChildSize.width === newSize.width &&
        receivedChildSize.height === newSize.height
      ) {
        return;
      }

      setReceivedChildSize(newSize);
    },
    [receivedChildSize]
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

  const onMouseDown = React.useCallback(
    (
      clicked: "thumb" | "slider" | "wrapp" | null,
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

      handleMouseDown({
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
      });
    },
    [
      type,
      progressTrigger.content,
      progressTrigger.progressElement,
      objLengthPerSize[0],
      objLengthPerSize[1],
    ]
  );
  const onMouseDownScrollThumb = React.useCallback(() => {
    onMouseDown(null);
  }, [onMouseDown]);
  const onMouseDownScrollThumbTwo = React.useCallback(() => {
    onMouseDown(null, 1);
  }, [onMouseDown]);
  const onMouseDownWrap = React.useCallback(() => {
    onMouseDown("wrapp");
  }, [onMouseDown]);

  const IntersectionTrackerOnVisible = React.useCallback(
    (key: string) => {
      if (render.type === "lazy" && render.onVisible) {
        render.onVisible(key);
        updateEmptyElementKeys();
      } else {
        updateEmptyElementKeys();
      }
    },
    [render]
  );

  const scrollObjectWrapper = (
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
                objectsPerDirection === 1 && {
                  transform: "translateX(-50%)",
                }),
            } as React.CSSProperties)
          : {
              ...wrapStyle1,
            },
      onVisible: IntersectionTrackerOnVisible,
      attribute: { name: "wrap-id", value: attribute },
    };

    return render.type === "virtual" ? (
      <div
        wrap-id={attribute}
        onClick={updateEmptyKeysClick}
        key={key}
        style={commonProps.style}
      >
        {content}
      </div>
    ) : render.type === "lazy" ? (
      // !!! наладить updateEmptyElementKeys для IntersectionTracker
      <IntersectionTracker
        key={key}
        style={commonProps.style} // постоянный ререндер из пропса
        // attribute={commonProps.attribute} // Добавление attribute удаляет всё при прокрутке
      >
        {content}
      </IntersectionTracker>
    ) : (
      <div
        wrap-id={attribute}
        onClick={updateEmptyKeysClick}
        key={key}
        style={commonProps.style}
      >
        {content}
      </div>
    );
  };

  // !!! попробовать вынести всё что касается EmptyKeys
  const getDataIdsFromAtr = React.useCallback(() => {
    const elements = customScrollRef.current?.querySelectorAll(`[wrap-id]`);
    return elements ?? [];
  }, []);

  const updateEmptyElementKeys = React.useCallback(
    (update = true) => {
      if (!emptyElements) return;

      const emptyElementKays = Array.from(getDataIdsFromAtr())
        .filter((el) => el.children.length === 0)
        .map((el) => el.getAttribute("wrap-id"))
        .filter(Boolean)
        .join("/");

      if (!emptyElementKeysString.current) {
        emptyElementKeysString.current = emptyElementKays;
      } else if (
        emptyElementKays &&
        !emptyElementKeysString.current.includes(emptyElementKays)
      ) {
        emptyElementKeysString.current = `${emptyElementKeysString.current}/${emptyElementKays}`;
      }

      update && triggerUpdate();
    },
    [emptyElementKeysString.current]
  );

  const updateEmptyKeysClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (!emptyElements?.clickTrigger?.selector) return;

      const target = event.target as HTMLElement;
      const closeSelector = target.closest(
        emptyElements?.clickTrigger.selector
      );

      if (closeSelector) {
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          updateEmptyElementKeys();
        }, emptyElements.clickTrigger.delay);
      }
    },
    [emptyElements]
  );

  // effects
  React.useEffect(() => {
    updateEmptyElementKeys();
  }, [validChildren.length]);

  React.useEffect(() => {
    if (render.type === "virtual") {
      triggerUpdate();
    }

    sliderCheckLocal();
  }, []);

  React.useEffect(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    const wheelHandler = (e: WheelEvent) =>
      handleWheel(e, scrollEl, scrollStateRef.current, direction);

    scrollEl.addEventListener("wheel", wheelHandler, { passive: false });

    return () => {
      scrollEl.removeEventListener("wheel", wheelHandler);
      if (scrollStateRef.current.animationFrameId) {
        cancelAnimationFrame(scrollStateRef.current.animationFrameId);
      }
    };
  }, [direction]);

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

    const directions = direction === "hybrid" ? ["x", "y"] : [direction];

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
      clearTimeout(scrollTimeout.current!);
      loadedObjects.current = [];
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
    sizeLocal,
  ]);

  React.useEffect(() => {
    if (stopLoadOnScroll) {
      const dataIds = Array.from(getDataIdsFromAtr(), (el) =>
        el.getAttribute("wrap-id")
      );
      loadedObjects.current = dataIds;
    }
  }, [stopLoadOnScroll]);

  // contents
  const renderChild = (child: React.ReactNode, index: number) => {
    const key = (child as React.ReactElement).key || "";

    const childRenderOnScroll =
      stopLoadOnScroll &&
      !loadedObjects.current.includes(`${id}-${key}`) &&
      isScrollingRef.current
        ? fallback
        : emptyElements?.mode === "fallback" &&
          emptyElementKeysString.current.includes(key)
        ? emptyElements.element ?? fallback
        : child;

    const childLocal =
      typeof objectsSize[0] === "number" &&
      typeof objectsSize[1] === "number" ? (
        childRenderOnScroll
      ) : (objectsSize[0] === "firstChild" ||
          objectsSize[1] === "firstChild") &&
        index === 0 ? (
        <ResizeTracker onResize={childResize}>
          {() => childRenderOnScroll}
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

      const isElementVisibleHybrid =
        direction !== "hybrid"
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
      style={{
        margin: wrapperMargin ? `${mT}px ${mR}px ${mB}px ${mL}px` : "",
        height:
          objectsSize[1] !== "none"
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
        (direction === "y" || direction === "hybrid") &&
        objectsPerDirection > 1
          ? {
              flexDirection: "row",
            }
          : render.type !== "virtual" && {
              flexDirection: "column",
            }),

        ...(render.type !== "virtual" &&
          direction === "x" && {
            flexDirection: "row",
          }),

        ...(render.type !== "virtual" &&
          objectsSize[1] !== "none" && {
            flexWrap: "wrap",
          }),

        ...(elementsAlign &&
        render.type !== "virtual" &&
        objectsPerDirection > 1
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
    ...(direction === "hybrid"
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
            ...(progressTrigger.wheel
              ? {
                  overflow: {
                    y:
                      objectsWrapperHeightFull > sizeLocal[1]
                        ? "hidden scroll"
                        : "hidden",
                    x:
                      objectsWrapperWidthFull > sizeLocal[0]
                        ? "scroll hidden"
                        : "hidden",
                    hybrid:
                      objectsWrapperWidthFull > sizeLocal[0] &&
                      objectsWrapperHeightFull > sizeLocal[1]
                        ? "scroll"
                        : "hidden",
                  }[direction],
                }
              : { overflow: "hidden" }),

            ...(typeof progressTrigger.progressElement !== "boolean" ||
            progressTrigger.progressElement === false
              ? {
                  scrollbarWidth: "none",
                }
              : {}),
          }}
        >
          {objectsSize[0] !== "none" && objectsSize[1] !== "none" ? (
            objectsWrapper
          ) : (
            <ResizeTracker
              measure={"all"}
              onResize={wrapResize}
              style={{
                ...wrapperAlignLocal,
              }}
            >
              {() => objectsWrapper}
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

        {progressVisibility !== "hidden" &&
          typeof progressTrigger.progressElement !== "boolean" &&
          [
            {
              shouldRender: thumbSize < fullHeightOrWidth,
              direction: direction,
              thumbSize,
              thumbSpace,
              objLengthPerSize: objLengthPerSizeXY,
              onMouseDown: onMouseDownScrollThumb,
              progressReverseIndex: 0,
            },
            {
              shouldRender:
                direction === "hybrid" && thumbSizeX < objectsWrapperWidthFull,
              direction: "x" as const,
              thumbSize: thumbSizeX,
              thumbSpace: thumbSpaceX,
              objLengthPerSize: objLengthPerSize[0],
              onMouseDown: onMouseDownScrollThumbTwo,
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
                sizeHeight={sizeLocal[0]}
                progressTrigger={progressTrigger}
                progressVisibility={progressVisibility}
                onMouseDown={args.onMouseDown}
                thumbSize={args.thumbSize}
                thumbSpace={args.thumbSpace}
                objLengthPerSize={args.objLengthPerSize}
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
          />
        ))}
    </div>
  );

  if (!size) {
    return (
      <ResizeTracker measure="outer" onResize={scrollResize}>
        {() => content}
      </ResizeTracker>
    );
  } else {
    return content;
  }
};

export default MorphScroll;

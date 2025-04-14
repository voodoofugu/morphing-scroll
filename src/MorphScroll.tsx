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
import { objectsPerSize, clampValue, smoothScroll } from "./addFunctions";
import handleArrow, { handleArrowT } from "./handleArrow";

const MorphScroll: React.FC<MorphScrollT> = ({
  type = "scroll",
  className = "",
  size,
  objectsSize,
  direction = "y",
  gap,
  padding,
  progressReverse = false,
  progressTrigger = { wheel: true },
  progressVisibility = "visible",
  suspending = false,
  fallback = null,
  scrollTop,
  edgeGradient,
  objectsWrapFullMinSize = false,
  children,
  onScrollValue,

  elementsAlign = false,
  contentAlign,

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
  const scrollContentlRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const scrollBarsRef = React.useRef<NodeListOf<Element> | []>([]);

  const firstChildKeyRef = React.useRef<string | null>(null);
  const clickedObject = React.useRef<"thumb" | "wrapp" | "slider" | "none">(
    "none"
  );
  const numForSlider = React.useRef<number>(0);
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

  const [scrollingStatus, setScrollingStatus] = React.useState(false);
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
  const scrollTopLocal = React.useMemo(() => {
    return {
      value:
        typeof scrollTop?.value === "number" ||
        typeof scrollTop?.value === "string"
          ? [scrollTop.value, scrollTop.value]
          : scrollTop?.value ?? [0, 0],
      duration: scrollTop?.duration ?? 200,
    };
  }, [scrollTop]);

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

  const firstChildKey = React.useMemo(() => {
    if (!scrollTopLocal.value.includes("end")) return null;

    if (validChildren.length > 0) {
      const firstChild = validChildren[0];
      if (React.isValidElement(firstChild)) return firstChild.key;
    }
    return null;
  }, [validChildren, scrollTopLocal.value]);

  const [pT, pR, pB, pL] = numOrArrFormat(padding) || [0, 0, 0, 0];

  const pLocalY = pT + pB;
  const pLocalX = pL + pR;

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

    const padding = isHorizontal ? pLocalY : pLocalX;
    const localObjSize = isHorizontal ? sizeLocal[1] : sizeLocal[0];
    const objectSize = isHorizontal
      ? objectsSizeLocal[1] + gapX
      : objectsSizeLocal[0] + gapX;

    const hybridSize = objectSize * (validChildren.length + 1) - objectSize;
    const neededMaxSize = direction === "hybrid" ? hybridSize : localObjSize;

    const objects = objectSize
      ? Math.floor((neededMaxSize - padding) / objectSize)
      : 1;

    // устанавливаем crossCount если он есть и если он меньше objects
    return crossCount && crossCount < objects ? crossCount : objects;
  }, [direction, objectsSizeLocal, sizeLocal, gapX, pLocalX, pLocalY]);

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
      ? receivedWrapSize.height
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
    return objectsWrapperHeight + pLocalY;
  }, [objectsWrapperHeight, pLocalY]);
  const objectsWrapperWidthFull = React.useMemo(() => {
    return objectsWrapperWidth + pLocalX;
  }, [objectsWrapperWidth, pLocalX]);
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
          ? alignLocal + (objectsSizeLocal[1] + gapX) * indexTop + pT
          : alignLocal + pT;
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
          ? alignLocal + (objectsSizeLocal[0] + gapY) * indexLeft + pL
          : alignLocal + pL;
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

  const contentAlignLocal = React.useMemo(() => {
    if (!contentAlign) return {};

    const [verticalAlign, horizontalAlign = "start"] = contentAlign;

    const vAlign =
      verticalAlign === "start"
        ? "flex-start"
        : verticalAlign === "center"
        ? "center"
        : "flex-end";

    const hAlign =
      horizontalAlign === "start"
        ? "flex-start"
        : horizontalAlign === "center"
        ? "center"
        : "flex-end";

    const scrollX = sizeLocal[0] ?? 0;
    const scrollY = sizeLocal[1] ?? 0;

    const shouldAlignHeight = scrollY > objectsWrapperHeightFull;

    const shouldAlignWidth = scrollX > objectsWrapperWidthFull;

    const alignStyles: Record<string, string> = {};

    if (shouldAlignWidth) {
      alignStyles.display = "flex";
      alignStyles.justifyContent = vAlign;
    }

    if (shouldAlignHeight) {
      alignStyles.display = "flex";
      alignStyles.alignItems = hAlign;
    }

    return alignStyles;
  }, [
    contentAlign,
    sizeLocal,
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

  // events
  const mouseOnRefHandle = React.useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      if (progressVisibility !== "hover") return;
      const func = () =>
        mouseOnRef(
          scrollContentlRef.current,
          type === "scroll" ? "scrollBar" : "sliderBar",
          event
        );

      if (event.type === "mouseleave") {
        !["thumb", "slider", "wrapp"].includes(clickedObject.current) && func();
      } else {
        func();
      }
    },
    [progressVisibility, type, clickedObject.current, scrollContentlRef.current]
  );

  const handleArrowLocal = React.useCallback(
    (arrowType: handleArrowT["arrowType"]) => {
      handleArrow({
        arrowType: arrowType,
        scrollElement: scrollElementRef.current,
        wrapElement: objectsWrapperRef.current,
        scrollSize: sizeLocal,
        smoothScroll: smoothScrollLocal,
      });
    },
    [scrollElementRef, objectsWrapperRef, objLengthPerSizeXY, sizeLocal[1]]
  );

  // !!! вынести функцию
  const sliderAndArrowsCheck = React.useCallback(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    if (scrollContentlRef.current) {
      if (scrollBarsRef.current.length > 0) {
        function getActiveElem() {
          const elements =
            scrollBarsRef.current[0].querySelectorAll(".sliderElem");

          elements &&
            elements.forEach((element, index) => {
              const scroll = scrollEl?.scrollTop ?? 0;
              const isActive =
                scroll >= sizeLocal[1] * index &&
                scroll < sizeLocal[1] * (index + 1);

              element.classList.toggle("active", isActive);
            });
        }

        getActiveElem();
      }
    }
  }, [sizeLocal[1], objectsWrapperHeightFull]);

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

    const scrollLeftOrTop =
      direction === "x" ? scrollEl.scrollLeft : scrollEl.scrollTop;
    if (onScrollValue) {
      onScrollValue(scrollLeftOrTop);
    }

    // scroll status
    const shouldUpdateScroll = stopLoadOnScroll || isScrolling;
    !scrollingStatus && isScrolling?.(true);
    shouldUpdateScroll && setScrollingStatus(true);

    scrollTimeout.current && clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      shouldUpdateScroll && setScrollingStatus(false);
      isScrolling?.(false);
      if (render.type !== "default") {
        updateEmptyElementKeys();
      }
    }, 200);

    type === "slider" && sliderAndArrowsCheck();
    render.type !== "default" && updateEmptyElementKeys(false);

    triggerUpdate();
  }, [
    onScrollValue,
    sliderAndArrowsCheck,
    isScrolling,
    stopLoadOnScroll,
    render,
  ]);

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
    [pLocalY, receivedScrollSize]
  );
  const wrapResize = React.useCallback(
    (rect: Partial<DOMRectReadOnly>) => {
      const newSize = {
        width: (rect.width ?? 0) - pLocalX,
        height: (rect.height ?? 0) - pLocalY,
      };

      if (
        receivedWrapSize.width === newSize.width &&
        receivedWrapSize.height === newSize.height
      ) {
        return;
      }

      setReceivedWrapSize(newSize);
    },
    [pLocalX, pLocalY, receivedWrapSize]
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
    (targetScrollTop: number, direction: "y" | "x", callback?: () => void) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return null;

      return smoothScroll(
        direction,
        scrollEl,
        scrollTopLocal.duration,
        targetScrollTop,
        callback
      );
    },
    [scrollElementRef, scrollTopLocal.duration]
  );

  // !!! objLengthPerSize
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
      console.log("objLengthPerSize", objLengthPerSize);

      handleMouseDown({
        scrollElementRef: scrollElementRef.current,
        objectsWrapperRef: objectsWrapperRef.current,
        scrollBarsRef: scrollBarsRef.current,
        clickedObject: clickedObject,
        scrollContentlRef: scrollContentlRef.current,
        scrollStateRef: scrollStateRef.current,
        numForSlider: numForSlider.current,
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
      });
    },
    [
      progressTrigger.content,
      progressTrigger.progressElement,
      objLengthPerSize[0],
      objLengthPerSize[1],
    ]
  );
  const onMouseDownScrollThumb = React.useCallback(() => {
    onMouseDown(null);
  }, [type]);
  const onMouseDownScrollThumbTwo = React.useCallback(() => {
    onMouseDown(null, 1);
  }, [type]);
  const onMouseDownWrap = React.useCallback(() => {
    onMouseDown("wrapp");
  }, []);

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
    elementTop?: number,
    left?: number,
    attribute?: string,
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
              ...(left && { left: `${left}px` }),
              ...(!objectsSizeLocal[0] &&
                objectsPerDirection === 1 && {
                  transform: "translateX(-50%)",
                }),
            } as React.CSSProperties)
          : wrapStyle1,
      onVisible: IntersectionTrackerOnVisible,
    };

    return render.type === "virtual" ? (
      <div
        // !!! наладить updateEmptyElementKeys
        // {...(attribute ? { "wrap-id": attribute } : {})}
        // onClick={updateEmptyKeysClick}
        key={key}
        style={{
          position: "absolute",
          top: `${elementTop}px`,
          ...(left && { left: `${left}px` }),
          ...(!objectsSizeLocal[0] &&
            objectsPerDirection === 1 && {
              transform: "translateX(-50%)",
            }),
          ...wrapStyle1,
        }}
      >
        {content}
      </div>
    ) : render.type === "lazy" ? (
      <IntersectionTracker key={key} {...commonProps}>
        {content}
      </IntersectionTracker>
    ) : (
      <div
        // {...(attribute ? { "wrap-id": attribute } : {})}
        // onClick={updateEmptyKeysClick}
        key={key}
        style={wrapStyle1}
      >
        {content}
      </div>
    );
  };

  const getDataIdsFromAtr = React.useCallback(() => {
    const elements = document.querySelectorAll(`[wrap-id^="${id}-"]`);
    return elements;
  }, []);

  const updateEmptyElementKeys = React.useCallback(
    (update = true) => {
      if (!emptyElements) return;
      const emptyElementKays = Array.from(getDataIdsFromAtr())
        .filter((el) => el.children.length === 0)
        .map((el) => el.getAttribute("wrap-id")?.split("-")[1])
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
    if (progressTrigger.progressElement !== true) {
      // рекурсия? !!!
      const bars = document.querySelectorAll(
        `.${type === "scroll" ? "scrollBarThumb" : "sliderBar"}.${id}`
      );
      if (bars.length > 0) {
        scrollBarsRef.current = bars;
      }
    }

    if (render.type === "virtual") {
      triggerUpdate();
    }

    sliderAndArrowsCheck();
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
    if (!scrollElementRef.current || validChildren.length === 0) return;

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
      if (value === "end" && full > size) {
        if (firstChildKeyRef.current === firstChildKey) {
          const cancel = smoothScrollLocal(endValue, dir);
          if (cancel) cancelScrolls.push(cancel);
        }
      } else if (typeof value === "number") {
        const cancel = smoothScrollLocal(value, dir);
        if (cancel) cancelScrolls.push(cancel);
      }
    };

    if (direction === "x" || direction === "y") {
      const dir = direction;
      const value = scrollTopLocal.value[dir === "x" ? 0 : 1];
      tryScroll(dir, value, fullHeightOrWidth, xySize, endObjectsWrapper);
    }

    if (direction === "hybrid") {
      tryScroll(
        "x",
        scrollTopLocal.value[0],
        objectsWrapperWidthFull,
        sizeLocal[0],
        objectsWrapperWidthFull
      );
      tryScroll(
        "y",
        scrollTopLocal.value[1],
        objectsWrapperHeightFull,
        sizeLocal[1],
        objectsWrapperHeightFull
      );
    }

    firstChildKeyRef.current = firstChildKey;

    return () => {
      cancelScrolls.forEach((fn) => fn());
      clearTimeout(scrollTimeout.current!);
      loadedObjects.current = [];
    };
  }, [
    scrollTop?.updater,
    scrollTopLocal.value[0],
    scrollTopLocal.value[1],
    smoothScrollLocal,
    endObjectsWrapper,
    direction,
    xySize,
    fullHeightOrWidth,
    objectsWrapperWidthFull,
    objectsWrapperHeightFull,
    firstChildKey,
    sizeLocal,
    validChildren.length,
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
  const objectsWrapper = (
    <div
      className="objectsWrapper"
      ref={objectsWrapperRef}
      onMouseDown={onMouseDownWrap}
      style={{
        padding: `${pT}px ${pR}px ${pB}px ${pL}px`,
        height:
          objectsSize[1] !== "none"
            ? `${
                render.type === "virtual"
                  ? objectsWrapperHeightFull
                  : objectsWrapperHeight
              }px`
            : "fit-content",

        ...(progressTrigger.content && { cursor: "grab" }),
        ...(gap && render.type !== "virtual" && { gap: `${gapX}px ${gapY}px` }),
        ...(render.type === "virtual"
          ? {
              position: "relative",
              minWidth: `${objectsWrapperWidthFull}px`,
            }
          : {
              display: "flex",
              minWidth: `${objectsWrapperWidth}px`,
            }),

        ...(render.type !== "virtual" &&
        (direction === "y" || direction === "hybrid") &&
        objectsPerDirection > 1
          ? {
              flexDirection: "row",
            }
          : {
              flexDirection: "column",
            }),

        ...(render.type !== "virtual" &&
          direction === "x" && {
            flexDirection: "column",
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
          : {
              alignItems: "center",
            }),

        ...(objectsWrapFullMinSize && {
          minHeight: `${sizeLocal[1] - pLocalY}px`,
        }),
      }}
    >
      {validChildren.map((child, index) => {
        const key = (child as React.ReactElement).key || "";

        const childRenderOnScroll =
          stopLoadOnScroll &&
          !loadedObjects.current.includes(`${id}-${key}`) &&
          scrollingStatus
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
          // !!!
          const mRootReverse = direction === "x" ? mRootY : mRootX;

          const isElementVisible =
            xySize + mRoot > topOrLeft - scrollSpaceFromRef &&
            bottomOrRight - scrollSpaceFromRef > 0 - mRoot;
          const isElementVisibleHybrid = (function () {
            if (direction !== "hybrid") return true;

            return (
              (sizeLocal[0] + mRootX >
                left - (scrollElementRef.current?.scrollLeft || 0) &&
                right - (scrollElementRef.current?.scrollLeft || 0) >
                  0 - mRootX) ||
              false
            );
          })();

          if (isElementVisible && isElementVisibleHybrid) {
            return scrollObjectWrapper(
              elementTop,
              left,
              `${id}-${key}`,
              childLocal,
              key
            );
          }
        } else {
          return scrollObjectWrapper(0, 0, `${id}-${key}`, childLocal, key);
        }
      })}
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
      morph-scroll="〈♦〉"
      className={`${className && className}`}
      ref={customScrollRef}
      style={{
        width: `${sizeLocal[2]}px`,
        height: `${sizeLocal[3]}px`,
      }}
    >
      <div
        className="scrollContent"
        ref={scrollContentlRef}
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
            ...contentAlignLocal,

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
            <ResizeTracker measure={"all"} onResize={wrapResize}>
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
                id={id}
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

/* eslint-disable react/no-unknown-property */
import React from "react";
import { MorphScrollT } from "./types";
import numOrArrFormat from "./numOrArrFormater";
import useIdent from "./useIdent";

import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";
import ScrollBar from "./ScrollBar";

import handleWheel, { ScrollStateRefT } from "./handleWheel";
import handleMouseDown from "./handleMouse";
import { mouseOnEl, mouseOnRef } from "./mouseHelpers";

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
}) => {
  const [_, forceUpdate] = React.useState<number>(0); // для принудительного обновления

  const triggerUpdate = () => {
    forceUpdate((n) => (n === 1 ? 0 : 1));
  };

  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentlRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const scrollBarsRef = React.useRef<NodeListOf<Element> | null>(null);

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
  const scrollTopLocal = {
    value: scrollTop?.value ?? null,
    duration: scrollTop?.duration ?? 200,
  };

  const pixelsForSwipe = 1;

  const arrowsDefault = {
    size: 40,
  };

  const arrowsStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  };

  const edgeGradientDefault = { color: null, size: 40 };

  // variables
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
    // !!!
    if (scrollTopLocal.value !== "end") return null;

    if (validChildren.length > 0) {
      const firstChild = validChildren[0];

      if (React.isValidElement(firstChild)) {
        return firstChild.key;
      }
    }
    return null;
  }, [validChildren, scrollTopLocal.value]);

  const arrowsLocal = {
    ...arrowsDefault,
    ...(typeof progressTrigger.arrows === "object"
      ? progressTrigger.arrows
      : {}),
  };

  const edgeGradientLocal =
    typeof edgeGradient === "object"
      ? { ...edgeGradientDefault, ...edgeGradient }
      : edgeGradientDefault;

  const edgeStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    transition: "opacity 0.1s ease-in-out",
    ...(edgeGradientLocal.color && {
      background: `linear-gradient(${edgeGradientLocal.color}, transparent)`,
    }),
    ...(direction === "x"
      ? {
          height: "100%",
          width: `${edgeGradientLocal.size}px`,
          top: 0,
          ...(edgeGradientLocal.color && {
            background: `linear-gradient(90deg, ${edgeGradientLocal.color}, transparent)`,
          }),
        }
      : {
          width: "100%",
          height: `${edgeGradientLocal.size}px`,
          left: 0,
          ...(edgeGradientLocal.color && {
            background: `linear-gradient(${edgeGradientLocal.color}, transparent)`,
          }),
        }),
  };

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

    return [x, y ? y - arrowsLocal.size * 2 : y, x, y]; // [2] & [3] is only for customScrollRef
  }, [size, arrowsLocal.size, receivedScrollSize]);
  const xySize = direction === "x" ? sizeLocal[0] : sizeLocal[1];

  // calculations
  const objectsPerDirection = React.useMemo(() => {
    const isHorizontal = direction === "x";

    const objectSize = isHorizontal
      ? objectsSizeLocal[1] + gapX
      : objectsSizeLocal[0] + gapX;

    const availableSize = isHorizontal ? sizeLocal[1] : sizeLocal[0];
    const padding = isHorizontal ? pLocalY : pLocalX;

    const objects = objectSize
      ? Math.floor((availableSize - padding) / objectSize)
      : 1;

    return objects;
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
    return objectsSizeLocal[0]
      ? direction === "y"
        ? (objectsSizeLocal[0] + gapY) * objectsPerDirection - gapY
        : (objectsSizeLocal[0] + gapY) * childsLinePerDirection - gapY
      : render.type !== "virtual"
      ? receivedWrapSize.width
      : receivedChildSize.width + childsGap;
  }, [
    objectsSizeLocal[0],
    objectsPerDirection,
    gapY,
    receivedWrapSize,
    receivedChildSize,
    render.type,
  ]);

  const objectsWrapperHeight = React.useMemo(() => {
    const childsGap =
      childsLinePerDirection < 1 ? 0 : objectsPerDirection * gapX - gapX;
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
    receivedWrapSize,
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
  const isNotAtBottom =
    Math.round(scrollSpaceFromRef + xySize) < fullHeightOrWidth;

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
              direction === "y" ? indexInArray : arrayIndex;
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

      // !!! придумать как обрабатывать отступы для hybrid
      const elementTop = (function (indexTop: number) {
        const alignLocal = direction === "x" ? align : 0;
        return indexTop > 0
          ? alignLocal + (objectsSizeLocal[1] + gapX) * indexTop + pT
          : alignLocal + pT;
      })(
        objectsPerDirection > 1 || direction === "x"
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

  const sizeLocalToObjectsWrapperXY = React.useCallback(
    (max?: boolean) => {
      const calcFn = max ? Math.ceil : Math.floor;
      const size = direction === "x" ? sizeLocal[0] : sizeLocal[1];
      const fullHeightOrWidth =
        direction === "x" ? objectsWrapperWidthFull : objectsWrapperHeightFull;

      return calcFn(fullHeightOrWidth / size);
    },
    [sizeLocal, objectsWrapperHeightFull, objectsWrapperWidthFull, direction]
  );
  const sizeLocalToObjectsWrapperX = React.useCallback(() => {
    return Math.floor(objectsWrapperWidthFull / sizeLocal[0]);
  }, [sizeLocal, objectsWrapperWidthFull]);

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
        !["thumb", "slider"].includes(clickedObject.current) && func();
      } else {
        func();
      }
    },
    [progressVisibility, type, clickedObject.current]
  );

  const handleArrows = React.useCallback(
    (arr: string) => {
      const scrollEl = scrollElementRef.current;
      const wrapEl = objectsWrapperRef.current;
      if (!scrollEl || !wrapEl) return;

      const height = wrapEl.clientHeight;
      const length = sizeLocalToObjectsWrapperXY();

      const scrollTo = (position: number) => smoothScroll(position);

      if (arr === "first" && scrollEl.scrollTop > 0) {
        scrollTo(
          scrollEl.scrollTop <= sizeLocal[1]
            ? 0
            : scrollEl.scrollTop - sizeLocal[1]
        );
      }

      if (
        arr === "last" &&
        length &&
        scrollEl.scrollTop + sizeLocal[1] !== height
      ) {
        scrollTo(
          scrollEl.scrollTop + sizeLocal[1] >= sizeLocal[1] * length
            ? height
            : scrollEl.scrollTop + sizeLocal[1]
        );
      }
    },
    [scrollElementRef, objectsWrapperRef, sizeLocalToObjectsWrapperXY]
  );

  // !!! вынести функцию
  const sliderAndArrowsCheck = React.useCallback(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    if (scrollContentlRef.current) {
      if (scrollBarsRef.current && scrollBarsRef.current.length > 0) {
        function getActiveElem() {
          const elements =
            scrollBarsRef.current &&
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
  const thumbSpace = Math.max(
    0,
    Math.min(
      Math.abs(
        Math.round(
          (scrollSpaceFromRef / endObjectsWrapper) * (xySize - thumbSize)
        )
      ),
      xySize - thumbSize
    )
  );
  const thumbSpaceX = Math.max(
    0,
    Math.min(
      Math.abs(
        Math.round(
          ((scrollElementRef.current?.scrollLeft || 0) /
            (objectsWrapperWidthFull - sizeLocal[0])) *
            (sizeLocal[0] -
              Math.round(
                (sizeLocal[0] / objectsWrapperWidthFull) * sizeLocal[0]
              ))
        )
      ),
      sizeLocal[0] - thumbSizeX
    )
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

  let frameId: number;
  const smoothScroll = React.useCallback(
    (targetScrollTop: number, callback?: () => void) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return null;

      const startScrollTop = scrollEl.scrollTop;
      let startTime: number | null = null;

      const scrollStep = (currentTime: number) => {
        if (startTime === null) startTime = currentTime; // Фиксируем начальное время в первом кадре

        const timeElapsed = Math.round(currentTime - startTime);
        const progress =
          Math.min(timeElapsed / scrollTopLocal.duration, 1) || 0;

        scrollEl.scrollTop =
          startScrollTop + (targetScrollTop - startScrollTop) * progress;

        if (timeElapsed <= scrollTopLocal.duration) {
          frameId = requestAnimationFrame(scrollStep);
        } else {
          callback?.();
        }
      };

      frameId = requestAnimationFrame(scrollStep); // Первый кадр фиксирует startTime

      // Возвращаем функцию для отмены анимации
      return () => cancelAnimationFrame(frameId);
    },
    [scrollElementRef, scrollTopLocal.duration, scrollTopLocal.value]
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
        sizeLocalToObjectsWrapperXY,
        direction,
        smoothScroll,
        sizeLocal: [sizeLocal[0], sizeLocal[1]],
        clicked: clickedLocal,
        scrollElemIndex,
      });
    },
    [progressTrigger.content, progressTrigger.progressElement]
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
    if (scrollElementRef.current && validChildren.length > 0) {
      let cancelScroll: (() => void) | null;

      if (
        scrollTopLocal.value === "end" &&
        objectsWrapperHeightFull > sizeLocal[1]
      ) {
        if (!firstChildKeyRef.current) {
          firstChildKeyRef.current = firstChildKey;
        }

        cancelScroll =
          firstChildKeyRef.current === firstChildKey
            ? smoothScroll(endObjectsWrapper)
            : null;

        firstChildKeyRef.current = firstChildKey;
      } else if (typeof scrollTopLocal.value === "number") {
        cancelScroll = smoothScroll(scrollTopLocal.value);
      }

      return () => {
        if (cancelScroll) cancelScroll(); // cancelAnimationFrame for smoothScroll
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
        loadedObjects.current = [];
      };
    }
  }, [
    scrollTop?.updater,
    scrollTopLocal.value,
    smoothScroll,
    endObjectsWrapper,
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
        height:
          render.type === "virtual" || objectsSize[1] !== "none"
            ? `${objectsWrapperHeightFull}px`
            : "fit-content",
        minWidth: objectsWrapperWidthFull ? `${objectsWrapperWidthFull}px` : "",

        ...(progressTrigger.content && { cursor: "grab" }),
        ...(render.type === "virtual"
          ? {
              position: "relative",
            }
          : {
              display: "flex",
              alignContent: "center",
            }),
        ...(render.type !== "virtual" &&
          direction === "y" && {
            alignItems: "center",
          }),
        ...(render.type !== "virtual" && {
          flexWrap: "wrap",
        }),
        ...(render.type !== "virtual" && {
          flexDirection: "column",
        }),
        ...(gap && render.type !== "virtual" && { gap: `${gapX}px ${gapY}px` }),
        ...(elementsAlign &&
          render.type !== "virtual" && {
            justifyContent:
              elementsAlign === "start"
                ? "flex-start"
                : elementsAlign === "center"
                ? "center"
                : "flex-end",
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
          const mRootReverse = direction === "x" ? mRootY : mRootX;
          const isElementVisible =
            xySize + mRoot > topOrLeft - scrollSpaceFromRef &&
            bottomOrRight - scrollSpaceFromRef > 0 - mRoot;
          if (isElementVisible) {
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
              : { top: `${arrowsLocal.size}px` })),
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

            // !!!
            ...(direction === "y" &&
            progressTrigger.wheel &&
            objectsWrapperHeightFull > sizeLocal[1]
              ? {
                  overflow: "hidden scroll",
                }
              : direction === "x" &&
                progressTrigger.wheel &&
                objectsWrapperWidthFull > sizeLocal[0]
              ? {
                  overflow: "scroll hidden",
                }
              : direction === "hybrid" &&
                progressTrigger.wheel &&
                objectsWrapperWidthFull > sizeLocal[0] &&
                objectsWrapperWidthFull > sizeLocal[1]
              ? { overflow: "scroll" }
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
            <ResizeTracker onResize={wrapResize}>
              {() => objectsWrapper}
            </ResizeTracker>
          )}
        </div>
        {edgeGradient && (
          <div
            className="edge"
            style={{
              ...edgeStyle,
              ...(direction === "x"
                ? {
                    left: 0,
                  }
                : { top: 0 }),
              opacity: scrollSpaceFromRef > 1 ? 1 : 0,
            }}
          ></div>
        )}
        {edgeGradient && (
          <div
            className="edge"
            style={{
              ...edgeStyle,
              ...(direction === "x"
                ? {
                    right: 0,
                  }
                : { bottom: 0 }),
              opacity: isNotAtBottom ? 1 : 0,
              ...(direction === "x"
                ? {
                    transform: "scaleX(-1)",
                  }
                : { transform: "scaleY(-1)" }),
            }}
          ></div>
        )}
        {progressTrigger.arrows && (
          <React.Fragment>
            <div
              className={`arrowBox${scrollSpaceFromRef > 1 ? " active" : ""}`}
              style={{
                ...arrowsStyle,
                top: 0,
                transform: "translateY(-100%)",
                height: `${arrowsLocal.size}px`,
              }}
              onClick={() => handleArrows("first")}
            >
              {arrowsLocal.element}
            </div>

            <div
              className={`arrowBox${isNotAtBottom ? " active" : ""}`}
              style={{
                ...arrowsStyle,
                bottom: 0,
                transform: "translateY(100%) scaleY(-1)",
                height: `${arrowsLocal.size}px`,
              }}
              onClick={() => handleArrows("last")}
            >
              {arrowsLocal.element}
            </div>
          </React.Fragment>
        )}

        {progressVisibility !== "hidden" &&
          typeof progressTrigger.progressElement !== "boolean" &&
          thumbSize < fullHeightOrWidth && (
            <ScrollBar
              type={type}
              direction={direction}
              progressReverse={progressReverse}
              sizeHeight={sizeLocal[0]}
              progressTrigger={progressTrigger}
              progressVisibility={progressVisibility}
              onMouseDown={onMouseDownScrollThumb}
              thumbSize={thumbSize}
              thumbSpace={thumbSpace}
              sizeLocalToObjectsWrapperXY={sizeLocalToObjectsWrapperXY}
              id={id}
            />
          )}
        {progressVisibility !== "hidden" &&
          typeof progressTrigger.progressElement !== "boolean" &&
          thumbSize < objectsWrapperWidthFull &&
          direction === "hybrid" && (
            <ScrollBar
              type={type}
              direction="x"
              progressReverse={progressReverse}
              sizeHeight={sizeLocal[0]}
              progressTrigger={progressTrigger}
              progressVisibility={progressVisibility}
              onMouseDown={onMouseDownScrollThumbTwo}
              thumbSize={thumbSizeX}
              thumbSpace={thumbSpaceX}
              sizeLocalToObjectsWrapperXY={sizeLocalToObjectsWrapperX}
              id={id}
            />
          )}
      </div>
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

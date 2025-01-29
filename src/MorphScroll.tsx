/* eslint-disable react/no-unknown-property */
import React from "react";
import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";
import { MorphScrollT } from "./types";

export const numOrArrFormat = (
  v?: number | number[],
  r?: boolean
): number[] | undefined => {
  if (v === undefined) return;
  if (typeof v === "number") return [v, v, v, v];
  if (v.length === 2) {
    return r ? [v[0], v[1], v[0], v[1]] : [v[1], v[0], v[1], v[0]];
  }
  if (v.length === 4) {
    return r ? [v[1], v[0], v[3], v[2]] : v;
  }
  return;
};

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
  lazyRender = false,
  rootMargin = 0,
  suspending = false,
  fallback = null,
  scrollTop,
  infiniteScroll = false,
  edgeGradient,
  objectsWrapFullMinSize = false,
  children,
  onScrollValue,

  elementsAlign = false,
  contentAlign,

  isScrolling,
  stopLoadOnScroll = false,
}) => {
  const forceUpdate = React.useReducer(() => ({}), {})[1]; // для принудительного обновления

  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentlRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const scrollBarThumbRef = React.useRef<HTMLDivElement | null>(null);
  const sliderBarRef = React.useRef<HTMLDivElement | null>(null);

  const firstChildKeyRef = React.useRef<string | null>(null);
  const clickedObject = React.useRef<"thumb" | "wrapp" | "slider" | "none">(
    "none"
  );
  const numForSlider = React.useRef<number>(0);
  const loadedObjects = React.useRef<(string | null)[]>([]);
  const topThumb = React.useRef<number>(0);
  const scrollTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");

  // default
  const scrollTopLocal = {
    value: 1,
    duration: 200,
    ...scrollTop,
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

  const edgeGradientDefault = { color: "rgba(0,0,0,0.4)", size: 40 };

  // variables
  const validChildren = React.useMemo(() => {
    return React.Children.toArray(children).filter(
      (child) => child !== null && child !== undefined
    );
  }, [children]);

  const firstChildKey = React.useMemo(() => {
    if (scrollTopLocal.value !== "end") return null;

    if (validChildren.length > 0) {
      const firstChild = validChildren[0];

      if (React.isValidElement(firstChild)) {
        return firstChild.key;
      }
    }
    return null;
  }, [validChildren]);

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
    left: 0,
    width: "100%",
    pointerEvents: "none",
    transition: "opacity 0.1s ease-in-out",
    background: `linear-gradient(${edgeGradientLocal.color}, transparent)`,
    height: `${edgeGradientLocal.size}px`,
  };

  const [pT, pR, pB, pL] = numOrArrFormat(padding, direction === "x") || [
    0, 0, 0, 0,
  ];

  const pLocalY = pT + pB;
  const pLocalX = pL + pR;

  const [gapX, gapY] = React.useMemo(() => {
    return typeof gap === "number"
      ? [gap, gap]
      : direction === "x"
      ? [gap?.[0] ?? 0, gap?.[1] ?? 0]
      : [gap?.[1] ?? 0, gap?.[0] ?? 0];
  }, [gap, direction]);

  const objectsSizeLocal = React.useMemo(() => {
    const x =
      typeof objectsSize[0] === "number"
        ? objectsSize[0]
        : objectsSize[0] === "none"
        ? null
        : objectsSize[0] === "firstChild"
        ? receivedChildSize.width
        : null;
    const y =
      typeof objectsSize[1] === "number"
        ? objectsSize[1]
        : objectsSize[1] === "none"
        ? null
        : objectsSize[1] === "firstChild"
        ? receivedChildSize.height
        : null;

    return [x, y];
  }, [objectsSize, receivedChildSize]);

  const xyObject =
    direction === "x" ? objectsSizeLocal[0] : objectsSizeLocal[1];
  const xyObjectReverse =
    direction === "x" ? objectsSizeLocal[1] : objectsSizeLocal[0];

  const mRootLocal = React.useMemo(() => {
    return numOrArrFormat(rootMargin, direction === "x");
  }, [rootMargin, direction]);
  const [mRootX, mRootY] = mRootLocal ? [mRootLocal[2], mRootLocal[0]] : [0, 0];

  const sizeLocal = React.useMemo(() => {
    const [x, y] =
      size && Array.isArray(size)
        ? size
        : [receivedScrollSize.width, receivedScrollSize.height];

    if (!progressTrigger.arrows || !arrowsLocal.size) {
      return [x, y, x, y];
    }

    return direction === "x"
      ? [x ? x - arrowsLocal.size * 2 : x, y, x, y]
      : [x, y ? y - arrowsLocal.size * 2 : y, x, y]; // [2] & [3] is only for customScrollRef
  }, [size, direction, arrowsLocal.size, receivedScrollSize]);

  const xy = direction === "x" ? sizeLocal[0] : sizeLocal[1];
  const xyReverse = direction === "x" ? sizeLocal[1] : sizeLocal[0];

  // calculations
  const objectsPerDirection = React.useMemo(() => {
    const objectSize = xyObjectReverse ? xyObjectReverse + gapX : null;

    const objects = objectSize
      ? Math.floor((xyReverse - pLocalX) / objectSize)
      : 1;

    return objects;
  }, [xyObjectReverse, xyReverse, gapX, pLocalX]);

  const splitIndices = React.useMemo(() => {
    if (!infiniteScroll || objectsPerDirection <= 1) {
      return [];
    }

    const indices = validChildren.map((_, index) => index);

    if (!indices) return [];

    const result: number[][] = Array.from(
      { length: objectsPerDirection },
      () => []
    );

    indices.forEach((index) => {
      result[index % objectsPerDirection].push(index);
    });

    return result;
  }, [children, objectsPerDirection, infiniteScroll]);

  const childsPerDirection = React.useMemo(() => {
    return objectsPerDirection > 1
      ? Math.ceil(validChildren.length / objectsPerDirection)
      : validChildren.length;
  }, [validChildren.length, objectsPerDirection]);

  const objectsWrapperWidth = React.useMemo(() => {
    const objPerDirLocal = objectsPerDirection ? objectsPerDirection : 1;
    return xyObjectReverse
      ? xyObjectReverse * objPerDirLocal + (objPerDirLocal - 1) * gapY
      : !infiniteScroll
      ? receivedWrapSize.width
      : (receivedChildSize.width + gapY) * objPerDirLocal - gapY;
  }, [
    xyObjectReverse,
    objectsPerDirection,
    gapY,
    receivedWrapSize,
    receivedChildSize,
  ]);

  const objectsWrapperHeight = React.useMemo(() => {
    return xyObject
      ? xyObject * childsPerDirection + (childsPerDirection - 1) * gapX
      : !infiniteScroll
      ? receivedWrapSize.height
      : (receivedChildSize.height + gapX) * childsPerDirection - gapX;
  }, [xyObject, childsPerDirection, gapX, receivedWrapSize, receivedChildSize]);

  const objectsWrapperHeightFull = React.useMemo(() => {
    return objectsWrapperHeight ? objectsWrapperHeight + pLocalY : 0;
  }, [objectsWrapperHeight, pLocalY]);

  const objectsWrapperWidthFull = React.useMemo(() => {
    return objectsWrapperWidth + pLocalX;
  }, [objectsWrapperWidth, pLocalX]);

  const scrollTopFromRef = scrollElementRef.current?.scrollTop || 0;
  const isNotAtBottom =
    Math.round(scrollTopFromRef + xy) !== objectsWrapperHeightFull;

  const thumbSize = React.useMemo(() => {
    if (progressVisibility !== "hidden" || !objectsWrapperHeightFull) {
      if (objectsWrapperHeight === 0) return 0;
      if (!xy) return 0;
      return Math.round((xy / objectsWrapperHeightFull) * xy);
    } else {
      return 0;
    }
  }, [xy, objectsWrapperHeightFull, progressVisibility]);

  const endObjectsWrapper = React.useMemo(() => {
    if (!xy) return objectsWrapperHeightFull;
    return (
      objectsWrapperHeightFull - xy // in scroll vindow
    );
  }, [objectsWrapperHeightFull, xy]);

  const localScrollTop = React.useMemo(() => {
    return typeof scrollTopLocal.value === "number"
      ? scrollTopLocal.value
      : scrollTopLocal.value === "end" && objectsWrapperHeightFull > xy
      ? endObjectsWrapper
      : 1;
  }, [scrollTop, objectsWrapperHeightFull, endObjectsWrapper]);

  const translateProperty = React.useMemo(() => {
    if (!sizeLocal[0] || !sizeLocal[1]) return 0;
    return sizeLocal[0] / 2 - sizeLocal[1] / 2;
  }, [sizeLocal]);

  const memoizedChildrenData = React.useMemo(() => {
    let lastIndices: number[] = [];
    let alignSpace: number = 0;

    if (infiniteScroll && elementsAlign) {
      const indices = Array.from(
        { length: validChildren.length },
        (_, index) => index
      );
      const firstChildsInDirection = Math.abs(
        Math.floor(validChildren.length / objectsPerDirection) *
          objectsPerDirection -
          validChildren.length
      );
      lastIndices = firstChildsInDirection
        ? indices.slice(-firstChildsInDirection)
        : [];

      if (elementsAlign === "center") {
        alignSpace =
          (((xyObjectReverse ?? 0) + gapY) *
            (objectsPerDirection - firstChildsInDirection)) /
          2;
      } else if (elementsAlign === "end") {
        alignSpace =
          ((xyObjectReverse ?? 0) + gapY) *
          (objectsPerDirection - firstChildsInDirection);
      }
    }

    return validChildren.map((_, index) => {
      const indexAndSubIndex = (function (
        index: number,
        splitIndices: number[][]
      ) {
        if (!splitIndices) {
          return [0, index];
        }
        for (
          let arrayIndex = 0;
          arrayIndex < splitIndices.length;
          arrayIndex++
        ) {
          const indexInArray = splitIndices[arrayIndex].indexOf(index);
          if (indexInArray !== -1) {
            return [arrayIndex, indexInArray];
          }
        }
        return [0, 0];
      })(index, splitIndices);

      const elementTop = (function (index: number) {
        return index !== 0 ? ((xyObject ?? 0) + gapX) * index + pT : pT;
      })(
        infiniteScroll
          ? objectsPerDirection > 1
            ? indexAndSubIndex[1]
            : index
          : 0
      );

      const elementBottom = (function () {
        return infiniteScroll && objectsSizeLocal[1]
          ? elementTop + objectsSizeLocal[1]
          : 0;
      })();

      const left =
        infiniteScroll && xyObjectReverse
          ? xyObjectReverse * indexAndSubIndex[0] +
            gapY * indexAndSubIndex[0] +
            pL +
            (elementsAlign && lastIndices.length > 0
              ? lastIndices.includes(index)
                ? alignSpace
                : 0
              : 0)
          : 0;

      return {
        elementTop,
        elementBottom,
        left,
      };
    });
  }, [
    children,
    splitIndices,
    objectsSizeLocal,
    gap,
    infiniteScroll,
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

    const shouldAlignHeight =
      direction === "x"
        ? scrollX > objectsWrapperHeightFull
        : scrollY > objectsWrapperHeightFull;

    const shouldAlignWidth =
      direction === "x"
        ? scrollY > objectsWrapperWidthFull
        : scrollX > objectsWrapperWidthFull;

    const alignStyles: Record<string, string> = {};

    if (shouldAlignWidth) {
      alignStyles.justifyContent = direction === "x" ? hAlign : vAlign;
    }

    if (shouldAlignHeight) {
      alignStyles.alignItems = direction === "x" ? vAlign : hAlign;
    }

    return alignStyles;
  }, [
    contentAlign,
    direction,
    sizeLocal,
    objectsWrapperHeightFull,
    objectsWrapperWidthFull,
  ]);

  const sizeLocalToObjectsWrapperXY = React.useCallback(
    (max?: boolean) => {
      const calcFn = max ? Math.ceil : Math.floor;

      return calcFn(objectsWrapperHeightFull / xy);
    },
    [xy, objectsWrapperHeightFull]
  );

  // events
  const mouseOnRefDown = (el: HTMLDivElement | null) => {
    if (el) {
      el.style.cursor = "grabbing";
    }
  };
  const mouseOnRefUp = (el: HTMLDivElement | null) => {
    if (el && el.style.cursor === "grabbing") {
      el.style.cursor = "grab";
    }
  };

  const mouseOnRefEnter = (el: HTMLDivElement | null, childClass: string) => {
    if (el) {
      const child = el.querySelector(`.${childClass}`) as HTMLDivElement;
      if (child) {
        child.style.opacity = "1";
      }
    }
  };
  const mouseOnRefLeave = (el: HTMLDivElement | null, childClass: string) => {
    if (el) {
      const child = el.querySelector(`.${childClass}`) as HTMLDivElement;
      if (child) {
        child.style.opacity = "0";
      }
    }
  };

  const handleArrows = React.useCallback(
    (arr: string) => {
      const scrollEl = scrollElementRef.current;
      const wrapEl = objectsWrapperRef.current;
      if (!scrollEl || !wrapEl) return;

      const height = wrapEl.clientHeight;
      const length = sizeLocalToObjectsWrapperXY();

      const scrollTo = (position: number) => smoothScroll(position);

      if (arr === "first" && scrollEl.scrollTop > 0) {
        scrollTo(scrollEl.scrollTop <= xy ? 0 : scrollEl.scrollTop - xy);
      }

      if (arr === "last" && length && scrollEl.scrollTop + xy !== height) {
        scrollTo(
          scrollEl.scrollTop + xy >= xy * length
            ? height
            : scrollEl.scrollTop + xy
        );
      }
    },
    [scrollElementRef, objectsWrapperRef, sizeLocalToObjectsWrapperXY]
  );

  const sliderAndArrowsCheck = React.useCallback(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    if (scrollContentlRef.current) {
      if (sliderBarRef.current) {
        function getActiveElem() {
          const elements =
            sliderBarRef.current?.querySelectorAll(".sliderElem");

          elements &&
            elements.forEach((element, index) => {
              const isActive =
                (scrollEl?.scrollTop ?? 0) >= xy * index &&
                (scrollEl?.scrollTop ?? 0) < xy * (index + 1);

              element.classList.toggle("active", isActive);
            });
        }

        getActiveElem();
      }
    }
  }, [xy, objectsWrapperHeightFull]);

  const handleScroll = React.useCallback(() => {
    forceUpdate();
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    // scroll status
    !scrollingStatus && isScrolling?.(true);
    (stopLoadOnScroll || isScrolling) && setScrollingStatus(true);

    scrollTimeout.current && clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      (stopLoadOnScroll || isScrolling) && setScrollingStatus(false);
      isScrolling?.(false);
    }, 200);

    // newScroll
    if (thumbSize !== 0 && progressVisibility !== "hidden") {
      const newScroll = Math.abs(
        Math.round((scrollEl.scrollTop / endObjectsWrapper) * (xy - thumbSize))
      );
      if (newScroll !== topThumb.current && type !== "slider") {
        // фиксим то что скролл срабатывает если один из детей последнего элемента больше чем родитель
        // не позволяя ползунку выходить за пределы
        topThumb.current =
          thumbSize + newScroll > xy ? xy - thumbSize : newScroll;
      }

      // avoid jumping to the top when loading new items on top in the scroll
      if (scrollEl.scrollTop === 0 && clickedObject.current === "none") {
        scrollEl.scrollTop = 1;
      }
      // onScrollValue
      if (onScrollValue) {
        onScrollValue(scrollEl.scrollTop);
      }
    }

    edgeGradient && sliderAndArrowsCheck();
  }, [
    xy,
    thumbSize,
    topThumb,
    progressVisibility,
    onScrollValue,
    sliderAndArrowsCheck,
    edgeGradient,
    isScrolling,
  ]);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      const scrollEl = scrollElementRef.current;
      const length = sizeLocalToObjectsWrapperXY();
      if (!scrollEl || !length) return;

      if (["thumb", "wrapp"].includes(clickedObject.current)) {
        const plusMinus = clickedObject.current === "thumb" ? 1 : -1;

        scrollEl.scrollTop +=
          (direction === "x" ? e.movementX : e.movementY) * length * plusMinus;
      }

      if (clickedObject.current === "slider") {
        const wrapEl = objectsWrapperRef.current;
        if (!wrapEl) return;

        const height = wrapEl.clientHeight;
        const scrollTo = (position: number) =>
          smoothScroll(position, () => {
            numForSlider.current = 0;
            forceUpdate();
          });

        const updateScroll = (delta: number) => {
          const targetScrollTop = scrollEl.scrollTop + delta * xy;

          if (delta > 0) {
            scrollTo(Math.min(targetScrollTop, height - xy));
          } else {
            scrollTo(Math.max(targetScrollTop, 0));
          }
        };

        if (e.movementY > 0 && numForSlider.current < pixelsForSwipe) {
          numForSlider.current += e.movementY;
          if (
            numForSlider.current >= pixelsForSwipe &&
            scrollEl.scrollTop + xy != height
          )
            updateScroll(1);
        } else if (e.movementY < 0 && numForSlider.current > -pixelsForSwipe) {
          numForSlider.current -= Math.abs(e.movementY);
          if (
            numForSlider.current <= -pixelsForSwipe &&
            scrollEl.scrollTop != 0
          )
            updateScroll(-1);
        }
      }
    },
    [direction, scrollElementRef, sizeLocalToObjectsWrapperXY]
  );

  const handleMouseUp = React.useCallback(
    (mouseUpEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      document.body.style.removeProperty("cursor");
      mouseOnRefUp(objectsWrapperRef.current);
      mouseOnRefUp(scrollBarThumbRef.current);

      clickedObject.current = "none";

      // обрабатываем progressVisibility "hover" для элемента прогресса
      if (progressVisibility === "hover") {
        let target = mouseUpEvent.target as HTMLElement | null;
        let isChildOfScrollContent = false;
        // Проверяем, находится ли target внутри scrollContentlRef.current
        while (target && target !== document.body) {
          if (target === scrollContentlRef.current) {
            isChildOfScrollContent = true;
            break;
          }
          target = target.parentNode as HTMLElement | null;
        }

        if (!isChildOfScrollContent) {
          mouseOnRefLeave(
            scrollContentlRef.current,
            type === "scroll" ? "scrollBar" : "sliderBar"
          );
        }
      }

      forceUpdate(); // for update ref only
    },
    [handleMouseMove, customScrollRef, progressVisibility, type]
  );

  const handleMouseDown = React.useCallback(
    (clicked: "thumb" | "wrapp" | "slider") => {
      clickedObject.current = clicked;
      forceUpdate(); // for update ref only

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
    },
    [handleMouseMove, handleMouseUp, customScrollRef]
  );

  const scrollResize = React.useCallback(
    (width: number, height: number) => {
      const newSize = { width: width, height: height - pLocalY };

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
    (width: number, height: number) => {
      const newSize = { width: width - pLocalX, height: height - pLocalY };

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
    (width: number, height: number) => {
      const newSize = { width: width, height: height };

      if (
        receivedChildSize.width === newSize.width &&
        receivedChildSize.height === newSize.height
      )
        return;

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
      const startTime = performance.now();

      const scrollStep = (currentTime: number) => {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / scrollTopLocal.duration, 1);

        if (targetScrollTop !== undefined && targetScrollTop !== null) {
          scrollEl.scrollTop =
            startScrollTop + (targetScrollTop - startScrollTop) * progress;
        }

        if (timeElapsed < scrollTopLocal.duration) {
          requestAnimationFrame(scrollStep);
        } else {
          callback?.();
        }
      };

      frameId = requestAnimationFrame(scrollStep);

      // Возвращаем функцию для отмены
      return () => cancelAnimationFrame(frameId);
    },
    [scrollElementRef]
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
      width: xyObjectReverse ? `${xyObjectReverse}px` : "",
      height: xyObject ? `${xyObject}px` : "",
      ...(direction === "x" && {
        display: "flex",
      }),
    };

    const wrapStyle2 = {
      width: objectsSizeLocal[0] ? `${objectsSizeLocal[0]}px` : "",
      ...(direction === "x" && {
        transform: "rotate(-90deg) scaleX(-1)",
      }),
    };

    const commonProps = {
      root: scrollElementRef.current,
      rootMargin: infiniteScroll ? rootMargin : mRootLocal,
      style: infiniteScroll
        ? ({
            ...wrapStyle1,
            position: "absolute",
            top: `${elementTop}px`,
            ...(left && { left: `${left}px` }),
            ...(!xyObjectReverse &&
              objectsPerDirection === 1 && {
                transform: "translateX(-50%)",
              }),
          } as React.CSSProperties)
        : wrapStyle1,
    };

    const innerContent = (
      <div {...(attribute ? { "wrap-id": attribute } : {})} style={wrapStyle2}>
        {content}
      </div>
    );

    return infiniteScroll ? (
      <div
        key={key}
        style={{
          position: "absolute",
          top: `${elementTop}px`,
          ...(left && { left: `${left}px` }),
          ...(!xyObjectReverse &&
            objectsPerDirection === 1 && {
              transform: "translateX(-50%)",
            }),
          ...wrapStyle1,
        }}
      >
        {innerContent}
      </div>
    ) : lazyRender ? (
      <IntersectionTracker {...commonProps}>{innerContent}</IntersectionTracker>
    ) : (
      <div key={key} style={wrapStyle1}>
        {innerContent}
      </div>
    );
  };

  // effects
  React.useEffect(() => {
    // warn handling
    function warn(
      prop: string,
      missingProp: string,
      availability: boolean = false
    ) {
      console.warn(
        `You are using the ${prop} ${
          availability ? "with" : "without"
        } ${missingProp} 👺`
      );
    }
    if (!lazyRender && rootMargin) {
      progressReverse && warn("rootMargin", "lazyRender");
    }
    if (infiniteScroll && lazyRender) {
      progressReverse && warn("lazyRender", "infiniteScroll", true);
    }
    if (progressVisibility === "hidden") {
      progressReverse &&
        warn("progressReverse", "progressVisibility `hidden`", true);
      progressTrigger.progressElement &&
        warn(
          "progressTrigger [`scrollThumb`]",
          "progressVisibility `hidden`",
          true
        );
      progressTrigger.arrows &&
        warn("progressTrigger [`arrows`]", "progressVisibility `hidden`", true);
    }

    if (!suspending && fallback) {
      progressReverse && warn("fallback", "suspending");
    }

    // other
    if (infiniteScroll) {
      forceUpdate();
    }

    sliderAndArrowsCheck();
  }, []);

  React.useEffect(() => {
    if (scrollElementRef.current && validChildren.length > 0) {
      let cancelScroll: (() => void) | null;

      if (scrollTopLocal.value === "end") {
        if (!firstChildKeyRef.current) {
          firstChildKeyRef.current = firstChildKey;
        }
        cancelScroll =
          firstChildKeyRef.current === firstChildKey
            ? smoothScroll(localScrollTop)
            : null;

        firstChildKeyRef.current = firstChildKey;
      } else {
        cancelScroll = smoothScroll(localScrollTop);
      }

      return () => {
        if (cancelScroll) cancelScroll(); // cancelAnimationFrame for smoothScroll
        loadedObjects.current = [];
        scrollTimeout.current && clearTimeout(scrollTimeout.current);
      };
    }
  }, [localScrollTop, objectsWrapperHeight]);

  React.useEffect(() => {
    if (stopLoadOnScroll) {
      const elements = document.querySelectorAll(`[wrap-id^="${id}-"]`);
      const dataIds = Array.from(elements, (el) => el.getAttribute("wrap-id"));

      loadedObjects.current = dataIds;
    }
  }, [scrollingStatus]);

  // contents
  const objectsWrapper = (
    <div
      className="objectsWrapper"
      ref={objectsWrapperRef}
      onMouseDown={() => {
        if (progressTrigger.content) {
          handleMouseDown("wrapp");
          mouseOnRefDown(objectsWrapperRef.current);
        }
      }}
      style={{
        // padding: `${pT}px ${pR}px ${pB}px ${pL}px`,
        height:
          (infiniteScroll && objectsWrapperHeightFull) ||
          objectsSize[1] !== "none"
            ? `${objectsWrapperHeightFull}px`
            : "fit-content",
        width: objectsWrapperWidthFull ? `${objectsWrapperWidthFull}px` : "",

        // ...((objectsSize[1] === "none" || objectsSize[2] === "none") && {
        //   padding: `${pT}px ${pR}px ${pB}px ${pL}px`,
        // }),
        ...(progressTrigger.content && { cursor: "grab" }),
        ...(infiniteScroll && {
          position: "relative",
        }),
        ...(!infiniteScroll && {
          display: "flex",
          alignContent: "center",
        }),
        ...(!infiniteScroll &&
          direction === "y" && {
            alignItems: "center",
          }),
        ...(!infiniteScroll &&
          objectsPerDirection > 1 && {
            flexWrap: "wrap",
          }),
        ...(!infiniteScroll &&
          objectsPerDirection <= 1 && {
            flexDirection: "column",
          }),
        ...(gap && !infiniteScroll && { gap: `${gapX}px ${gapY}px` }),
        ...(elementsAlign &&
          !infiniteScroll && {
            justifyContent:
              elementsAlign === "start"
                ? "flex-start"
                : elementsAlign === "center"
                ? "center"
                : "flex-end",
          }),
        ...(objectsWrapFullMinSize && {
          minHeight: `${xy - pLocalY}px`,
        }),
      }}
    >
      {validChildren.map((child, index) => {
        const key = (child as React.ReactElement).key;

        const childRenderOnScroll =
          stopLoadOnScroll &&
          !loadedObjects.current.includes(`${id}-${key}`) &&
          scrollingStatus
            ? fallback
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

        if (infiniteScroll) {
          const { elementTop, elementBottom, left } =
            memoizedChildrenData[index];
          const isElementVisible =
            (direction === "x" ? sizeLocal[0] ?? 0 : sizeLocal[1] ?? 0) +
              mRootX >
              elementTop - scrollTopFromRef &&
            elementBottom - scrollTopFromRef > 0 - mRootY;

          if (isElementVisible) {
            return scrollObjectWrapper(
              elementTop,
              left,
              "",
              childLocal,
              key ?? ""
            );
          }
        } else {
          return scrollObjectWrapper(
            0,
            0,
            `${stopLoadOnScroll ? `${id}-${key}` : ""}`,
            childLocal,
            key ?? ""
          );
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
        onMouseEnter={() =>
          progressVisibility === "hover" &&
          mouseOnRefEnter(
            scrollContentlRef.current,
            type === "scroll" ? "scrollBar" : "sliderBar"
          )
        }
        onMouseLeave={() =>
          progressVisibility === "hover" &&
          clickedObject.current !== "thumb" &&
          clickedObject.current !== "slider" &&
          mouseOnRefLeave(
            scrollContentlRef.current,
            type === "scroll" ? "scrollBar" : "sliderBar"
          )
        }
        style={{
          position: "relative",
          width: `${xyReverse}px`,
          height: `${xy}px`,
          ...(direction === "x" && {
            transform: `rotate(-90deg) translate(${translateProperty}px, ${translateProperty}px) scaleX(-1)`,
          }),
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
            display: "flex",
            width: "100%",
            height: "100%",
            ...contentAlignLocal,
            ...(progressTrigger.wheel
              ? {
                  overflow: "hidden scroll",
                }
              : { overflow: "hidden hidden" }),
            ...(typeof progressTrigger.progressElement !== "boolean" ||
            progressTrigger.progressElement === false
              ? {
                  scrollbarWidth: "none",
                }
              : {}),
          }}
        >
          {(typeof objectsSize[0] !== "string" ||
            typeof objectsSize[1] !== "string") &&
          infiniteScroll ? (
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
              top: 0,
              opacity: scrollTopFromRef > 1 ? 1 : 0,
            }}
          ></div>
        )}
        {edgeGradient && (
          <div
            className="edge"
            style={{
              ...edgeStyle,
              bottom: 0,
              opacity: isNotAtBottom ? 1 : 0,
              transform: "scaleY(-1)",
            }}
          ></div>
        )}

        {progressTrigger.arrows && (
          <>
            <div
              className={`arrowBox${scrollTopFromRef > 1 ? " active" : ""}`}
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
          </>
        )}

        {progressVisibility !== "hidden" &&
          thumbSize < xy &&
          typeof progressTrigger.progressElement !== "boolean" && (
            <>
              {type !== "slider" ? (
                <div
                  className="scrollBar"
                  style={{
                    position: "absolute",
                    top: 0,
                    ...(progressReverse ? { left: 0 } : { right: 0 }),
                    width: "fit-content",
                    height: "100%",
                    ...(!progressTrigger.progressElement !== false && {
                      pointerEvents: "none",
                    }),
                    ...(progressVisibility === "hover" && {
                      opacity: 0,
                      transition: "opacity 0.1s ease-in-out",
                    }),
                  }}
                >
                  <div
                    ref={scrollBarThumbRef}
                    className="scrollBarThumb"
                    onMouseDown={() => {
                      if (progressTrigger.progressElement) {
                        handleMouseDown("thumb");
                        mouseOnRefDown(scrollBarThumbRef.current);
                      }
                    }}
                    style={{
                      height: `${thumbSize}px`,
                      willChange: "transform", // свойство убирает артефакты во время анимации
                      transform: `translateY(${topThumb.current}px)`, // translateZ для улучшения производительности и сглаживания
                      ...(progressTrigger.progressElement && {
                        cursor: "grab",
                      }),
                    }}
                  >
                    {progressTrigger.progressElement}
                  </div>
                </div>
              ) : (
                <div
                  className="sliderBar"
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(progressReverse ? { left: 0 } : { right: 0 }),
                    ...(!progressTrigger.progressElement && {
                      pointerEvents: "none",
                    }),
                    ...(progressVisibility === "hover" && {
                      opacity: 0,
                      transition: "opacity 0.1s ease-in-out",
                    }),
                  }}
                  ref={sliderBarRef}
                  onMouseDown={() => handleMouseDown("slider")}
                >
                  {Array.from(
                    { length: sizeLocalToObjectsWrapperXY() || 0 },
                    (_, index) => (
                      <div
                        key={index}
                        className="sliderElem"
                        style={{ width: "fit-content" }}
                      >
                        {progressTrigger.progressElement}
                      </div>
                    )
                  )}
                </div>
              )}
            </>
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

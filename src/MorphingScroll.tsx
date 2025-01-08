import React from "react";
import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";
import { ScrollType, progressTriggerT } from "./types";

const Scroll: React.FC<ScrollType> = ({
  scrollID = "",
  className = "",
  scrollXY,
  objectXY,
  xDirection = false,
  gap,
  padding = [0, 0, 0, 0],
  progressReverse = false,
  progressTrigger = "wheel",
  progressVisibility = "visible",
  sliderType = false,
  lazyRender = false,
  rootMargin = 0,
  suspending = false,
  fallback = null,
  scrollTop = 1,
  infiniteScroll = false,
  edgeGradient,
  objectsWrapperMinSize,
  children,
  onScrollValue,
  thumbElement,
  arrows,

  elementsAlign = false,
  contentAlign,

  pixelsForSwipe = 8,
  progressBarSize = 4,
  duration = 200,

  isScrolling,
  renderOnScroll,
}) => {
  const forceUpdate = React.useReducer(() => ({}), {})[1]; // для принудительного обновления

  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentlRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const sliderBarRef = React.useRef<HTMLDivElement | null>(null);

  const grabbingElementRef = React.useRef<HTMLElement | null>(null);

  const prevKey = React.useRef<string | null | undefined>(null);
  const clickedObject = React.useRef("");
  const numForSlider = React.useRef<number>(0);
  const loadedObjects = React.useRef<(string | null)[]>([]);

  const [topThumb, setTopThumb] = React.useState(0);
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

  const validChildren = React.useMemo(() => {
    return React.Children.toArray(children).filter(
      (child) => child !== null && child !== undefined
    );
  }, [children]);

  const firstChildKey = React.useMemo(() => {
    if (validChildren.length > 0) {
      const firstChild = validChildren[0];

      if (React.isValidElement(firstChild)) {
        return firstChild.key;
      }
    }
  }, [validChildren]);

  // default
  const arrowsDefault = {
    size: 40,
    className: "",
    element: <div className="arrow"></div>,
  };

  const edgeGradientDefault = { color: "rgba(0,0,0,0.4)", size: 40 };

  // variables
  const scrollXYLocal = React.useMemo(() => {
    return typeof scrollXY === "string"
      ? [receivedScrollSize.width, receivedScrollSize.height]
      : scrollXY;
  }, [scrollXY, receivedScrollSize]);

  const arrowsLocal = React.useMemo(() => {
    return { ...arrowsDefault, ...arrows };
  }, [arrows]);

  const edgeGradientLocal =
    typeof edgeGradient === "object"
      ? { ...edgeGradientDefault, ...edgeGradient }
      : edgeGradientDefault;

  const edgeStyle = {
    background: `linear-gradient(${edgeGradientLocal.color}, transparent)`,
    height: `${edgeGradientLocal.size}px`,
  };

  const pLocal =
    typeof padding === "number"
      ? [padding, padding, padding, padding]
      : padding.length === 2
      ? [padding[0], padding[1], padding[0], padding[1]]
      : padding.length === 3
      ? [padding[0], padding[1], padding[2], padding[1]]
      : padding;

  const [pT, pR, pB, pL] = xDirection
    ? [pLocal[1], pLocal[2], pLocal[3], pLocal[0]]
    : pLocal;

  const pY = pLocal[1] + pLocal[3];
  const pLocalY = pT + pB;
  const pLocalX = pL + pR;

  const [gapX, gapY] = React.useMemo(() => {
    return typeof gap === "number"
      ? [gap, gap]
      : xDirection
      ? [gap?.[1] ?? 0, gap?.[0] ?? 0]
      : [0, 0];
  }, [gap, xDirection]);

  const objectXYLocal = React.useMemo(() => {
    if (Array.isArray(objectXY)) {
      return objectXY;
    } else {
      return [receivedChildSize.width, receivedChildSize.height];
    }
  }, [objectXY, scrollXYLocal, pY, xDirection, receivedChildSize]);

  const xyObject = objectXYLocal
    ? xDirection
      ? objectXYLocal[0]
      : objectXYLocal[1]
    : null;
  const xyObjectReverse = objectXYLocal
    ? xDirection
      ? objectXYLocal[1]
      : objectXYLocal[0]
    : null;

  const mRootLocal = rootMargin
    ? typeof rootMargin === "number"
      ? [rootMargin, rootMargin, rootMargin, rootMargin]
      : xDirection
      ? rootMargin.length === 2
        ? [rootMargin[0], rootMargin[1], rootMargin[0], rootMargin[1]]
        : [rootMargin[1], rootMargin[0], rootMargin[3], rootMargin[2]]
      : rootMargin.length === 2
      ? [rootMargin[1], rootMargin[0], rootMargin[1], rootMargin[0]]
      : rootMargin
    : null;

  const [mRootX, mRootY] = mRootLocal
    ? rootMargin
      ? xDirection
        ? [mRootLocal[3], mRootLocal[1]]
        : [mRootLocal[2], mRootLocal[0]]
      : [0, 0]
    : [0, 0];

  const progressTriggerCheck = React.useCallback(
    (triggerType: progressTriggerT) => {
      return progressTrigger.includes(triggerType);
    },
    [progressTrigger]
  );

  const localScrollXY = React.useMemo(() => {
    const [x, y] = Array.isArray(scrollXYLocal)
      ? scrollXYLocal
      : typeof scrollXYLocal === "string"
      ? [receivedScrollSize.width, receivedScrollSize.height]
      : Array.isArray(objectXYLocal)
      ? objectXYLocal
      : [0, 0];

    if (!progressTriggerCheck("arrows") || !arrowsLocal.size) {
      return [x, y, x, y];
    }

    return xDirection
      ? [x ? x - arrowsLocal.size * 2 : x, y, x, y]
      : [x, y ? y - arrowsLocal.size * 2 : y, x, y]; // [2] & [3] is only for customScroll
  }, [scrollXYLocal, objectXYLocal, xDirection, arrows]);

  const xy = xDirection ? localScrollXY[0] || 0 : localScrollXY[1] || 0;

  // calculations
  const objectsPerDirection = React.useMemo(() => {
    if (!objectXYLocal) return validChildren.length;

    if (!localScrollXY[0] || !localScrollXY[1]) return 1;

    const [scrollX, scrollY] = localScrollXY;
    const [objectX, objectY] = objectXYLocal;

    const objectSize = xDirection
      ? objectY
        ? objectY + gapX
        : scrollY + gapX
      : objectX
      ? objectX + gapX
      : scrollX + gapX;

    const availableSpace = xDirection ? scrollY - pY : scrollX - pY;
    const objects = Math.floor(availableSpace / objectSize);

    return Math.max(1, Math.min(objects, validChildren.length));
  }, [objectXYLocal, localScrollXY, xDirection, gapX, pY]);

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
    return objectXY
      ? (xyObjectReverse ? xyObjectReverse : 0) * objectsPerDirection +
          (objectsPerDirection - 1) * gapY
      : !infiniteScroll
      ? receivedWrapSize.width
      : (receivedChildSize.width + gapY) * objectsPerDirection - gapY;
  }, [
    xyObjectReverse,
    objectsPerDirection,
    gapY,
    receivedWrapSize,
    receivedChildSize,
  ]);

  const objectsWrapperHeight = React.useMemo(() => {
    return objectXY
      ? (xyObject ?? 0) * childsPerDirection + (childsPerDirection - 1) * gapX
      : !infiniteScroll
      ? receivedWrapSize.height
      : (receivedChildSize.height + gapX) * childsPerDirection - gapX;
  }, [xyObject, childsPerDirection, gapX, receivedWrapSize, receivedChildSize]);

  const objectsWrapperHeightFull = React.useMemo(() => {
    return objectsWrapperHeight + pLocalY;
  }, [objectsWrapperHeight, pLocalY]);

  const objectsWrapperWidthFull = React.useMemo(() => {
    return objectsWrapperWidth + pLocalX;
  }, [objectsWrapperWidth, pLocalX]);

  const thumbSize = React.useMemo(() => {
    if (progressVisibility === "visible" || progressVisibility === "hover") {
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
    return typeof scrollTop === "number"
      ? scrollTop
      : scrollTop === "end"
      ? objectsWrapperHeightFull > xy
        ? endObjectsWrapper
        : 1
      : 0;
  }, [scrollTop, objectsWrapperHeightFull, endObjectsWrapper]);

  const translateProperty = React.useMemo(() => {
    if (!localScrollXY[0] || !localScrollXY[1]) return 0;
    return localScrollXY[0] / 2 - localScrollXY[1] / 2;
  }, [localScrollXY]);

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
        return infiniteScroll &&
          Array.isArray(objectXYLocal) &&
          objectXYLocal[1]
          ? elementTop + objectXYLocal[1]
          : 0;
      })();

      const left =
        infiniteScroll && xyObjectReverse
          ? xyObjectReverse * indexAndSubIndex[0] +
            gapY * indexAndSubIndex[0] +
            (xDirection ? pLocal[0] : pLocal[1]) +
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
    objectXYLocal,
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

    const scrollX = localScrollXY[0] ?? 0;
    const scrollY = localScrollXY[1] ?? 0;

    const shouldAlignHeight = xDirection
      ? scrollX > objectsWrapperHeightFull
      : scrollY > objectsWrapperHeightFull;

    const shouldAlignWidth = xDirection
      ? scrollY > objectsWrapperWidthFull
      : scrollX > objectsWrapperWidthFull;

    const alignStyles: Record<string, string> = {};

    if (shouldAlignWidth) {
      alignStyles.justifyContent = xDirection ? hAlign : vAlign;
    }

    if (shouldAlignHeight) {
      alignStyles.alignItems = xDirection ? vAlign : hAlign;
    }

    return alignStyles;
  }, [
    contentAlign,
    xDirection,
    localScrollXY,
    objectsWrapperHeightFull,
    objectsWrapperWidthFull,
  ]);

  const scrollXYLocalToobjectsWrapperXY = React.useCallback(
    (max?: boolean) => {
      const scrollValue = xDirection ? localScrollXY[0] : localScrollXY[1];
      if (!scrollValue) return null;

      const calcFn = max ? Math.ceil : Math.floor;
      return calcFn(objectsWrapperHeight / scrollValue);
    },
    [xDirection, localScrollXY, objectsWrapperHeight]
  );

  // events
  const handleArrows = React.useCallback(
    (arr: string) => {
      const scrollEl = scrollElementRef.current;
      const wrapEl = objectsWrapperRef.current;
      if (!scrollEl || !wrapEl) return;

      const scrollTopEl = scrollEl.scrollTop;
      const height = wrapEl.clientHeight;
      const length = scrollXYLocalToobjectsWrapperXY(true);

      const scrollTo = (position: number) => smoothScroll(position, () => {});

      if (arr === "first" && scrollTopEl > 0) {
        scrollTo(scrollTopEl <= xy ? 0 : scrollTopEl - xy);
      }

      if (arr === "last" && length && scrollTopEl + xy !== height) {
        scrollTo(scrollTopEl + xy >= xy * length ? height : scrollTopEl + xy);
      }
    },
    [scrollElementRef, objectsWrapperRef, scrollXYLocalToobjectsWrapperXY]
  );

  const edgeGradientAndArrowsCheck = React.useCallback(() => {
    if (!edgeGradient) return;

    const scrollTopEl = scrollElementRef.current?.scrollTop || 0;
    const isNotAtBottom =
      Math.round(scrollTopEl + xy) !== objectsWrapperHeightFull;

    if (scrollContentlRef.current) {
      scrollContentlRef.current.classList.toggle("edgeLast", isNotAtBottom);
      scrollContentlRef.current.classList.toggle("edgeFirst", scrollTopEl > 1);
      if (progressTriggerCheck("arrows")) {
        scrollContentlRef.current.classList.toggle("l_ArrOff", !isNotAtBottom);
        scrollContentlRef.current.classList.toggle(
          "f_ArrOff",
          scrollTopEl <= 1
        );
      }

      if (sliderBarRef.current) {
        function getActiveElem() {
          const elements =
            sliderBarRef.current?.querySelectorAll(".sliderElem");

          elements &&
            elements.forEach((element, index) => {
              const isActive =
                scrollTopEl >= xy * index && scrollTopEl < xy * (index + 1);
              element.classList.toggle("active", isActive);
            });
        }

        getActiveElem();
      }
    }
  }, [edgeGradient, xy, objectsWrapperHeightFull]);

  const handleScroll = React.useCallback(() => {
    if (
      scrollElementRef.current &&
      thumbSize !== 0 &&
      (progressVisibility === "visible" || progressVisibility === "hover")
    ) {
      const newScroll = Math.abs(
        Math.round(
          (scrollElementRef.current.scrollTop / endObjectsWrapper) *
            (xy - thumbSize)
        )
      );
      if (newScroll !== topThumb && !sliderType) {
        setTopThumb(newScroll);
      }

      // avoid jumping to the top when loading new items on top in the scroll
      if (
        scrollElementRef.current.scrollTop === 0 && // xDirection!!! scrollLeft === 0
        clickedObject.current === "none"
      ) {
        scrollElementRef.current.scrollTop = 1;
      }
      // lock objectsWrapper to bottom
      if (scrollElementRef.current.scrollTop > endObjectsWrapper) {
        scrollElementRef.current.scrollTop = endObjectsWrapper;
      }
      // onScrollValue
      if (onScrollValue) {
        onScrollValue.forEach((conditionFunc) => {
          if (scrollElementRef.current) {
            conditionFunc(scrollElementRef.current.scrollTop);
          }
        });
      }
    }

    edgeGradientAndArrowsCheck();
  }, [xy, thumbSize, topThumb]);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      const scrollEl = scrollElementRef.current;
      const length = scrollXYLocalToobjectsWrapperXY();
      if (!scrollEl || !length) return;

      if (["thumb", "wrapp"].includes(clickedObject.current)) {
        const plusMinus = clickedObject.current === "thumb" ? 1 : -1;

        scrollEl.scrollTop +=
          (xDirection ? e.movementX : e.movementY) * length * plusMinus;
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
    [xDirection, scrollElementRef, scrollXYLocalToobjectsWrapperXY]
  );

  const handleMouseUp = React.useCallback(() => {
    const grabbingElement = grabbingElementRef.current;
    if (!grabbingElement) return;

    grabbingElement.classList.remove("grabbingElement");
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    document.body.style.removeProperty("cursor");

    clickedObject.current = "";
    forceUpdate(); // for update ref only
  }, [handleMouseMove, customScrollRef]);

  const handleMouseDown = React.useCallback(
    (
      e: React.MouseEvent,
      clicked: "thumb" | "wrapp" | "slider",
      grabbingElement: HTMLElement | null
    ) => {
      if (!grabbingElement) return;

      grabbingElementRef.current = grabbingElement;
      clickedObject.current = clicked;
      forceUpdate(); // for update ref only

      (progressVisibility === "hover" || progressVisibility === "visible") &&
        grabbingElement.classList.add("grabbingElement");
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
    [xDirection, pLocalY, objectsWrapperHeight]
  );
  const wrapResize = React.useCallback(
    (width: number, height: number) => {
      const newSize = { width: width - pLocalX, height: height - pLocalY };

      if (
        receivedWrapSize.width === newSize.width &&
        receivedWrapSize.height === newSize.height
      )
        return;

      setReceivedWrapSize(newSize);
    },
    [xDirection, pLocalY, objectsWrapperHeight]
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
    [xDirection, pLocalY, objectsWrapperHeight]
  );

  const smoothScroll = React.useCallback(
    (targetScrollTop: number, callback: () => void) => {
      console.log("smoothScroll");
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return;

      const startScrollTop = scrollEl.scrollTop;
      const startTime = performance.now();

      const easeInOutQuad = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const scrollStep = (currentTime: number) => {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const easedProgress = easeInOutQuad(progress);

        if (targetScrollTop !== undefined && targetScrollTop !== null) {
          scrollEl.scrollTop =
            startScrollTop + (targetScrollTop - startScrollTop) * easedProgress;
        }

        if (timeElapsed < duration) {
          requestAnimationFrame(scrollStep);
        } else {
          callback();
        }
      };

      requestAnimationFrame(scrollStep);
    },
    [scrollElementRef]
  );

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
        } ${missingProp}${scrollID ? ` in ${scrollID}` : ""} 👺`
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
      progressTriggerCheck("progressElement") &&
        warn(
          "progressTrigger [`scrollThumb`]",
          "progressVisibility `hidden`",
          true
        );
      progressTriggerCheck("arrows") &&
        warn("progressTrigger [`arrows`]", "progressVisibility `hidden`", true);
    }
    if (!progressTriggerCheck("arrows") && arrows) {
      progressReverse && warn("arrows", "progressTrigger [`arrows`]");
    }

    if (!suspending && fallback) {
      progressReverse && warn("fallback", "suspending");
    }

    // other
    if (infiniteScroll) {
      forceUpdate();
    }

    edgeGradientAndArrowsCheck();
  }, []);

  React.useEffect(() => {
    if (scrollElementRef.current && validChildren.length > 0) {
      let animationId: number;

      // prevKey ???
      if (prevKey.current === null || prevKey.current !== firstChildKey) {
        animationId = requestAnimationFrame(() =>
          smoothScroll(localScrollTop, () => {
            prevKey.current = firstChildKey;
          })
        );
      } else {
        animationId = requestAnimationFrame(() =>
          smoothScroll(localScrollTop, () => {})
        );
      }

      return () => cancelAnimationFrame(animationId);
    }
  }, [localScrollTop, objectsWrapperHeight, firstChildKey]);

  React.useEffect(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      setScrollingStatus(true);
      isScrolling?.(true);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setScrollingStatus(false);
        isScrolling?.(false);
      }, 200);
    };

    scrollEl.addEventListener("scroll", handleScroll);

    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  React.useEffect(() => {
    if (renderOnScroll) {
      const elements = document.querySelectorAll("[data-id]");
      const dataIds = Array.from(elements, (el) => el.getAttribute("data-id"));

      loadedObjects.current = dataIds;
    }

    return () => {
      loadedObjects.current = [];
    };
  }, [scrollingStatus]);

  // contents
  const objectsWrapper = (
    <div
      className="objectsWrapper"
      ref={objectsWrapperRef}
      onMouseDown={(e) =>
        progressTriggerCheck("content") &&
        handleMouseDown(e, "wrapp", objectsWrapperRef.current)
      }
      style={{
        padding: `${pT}px ${pR}px ${pB}px ${pL}px`,
        ...(!infiniteScroll && { display: "flex", flexWrap: "wrap" }),
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
        ...(objectsWrapperWidth && { width: `${objectsWrapperWidth}px` }),
        ...(objectsWrapperHeight && {
          position: "absolute",
          height: `${objectsWrapperHeight}px`,
        }),
        ...(objectsWrapperMinSize && {
          minHeight: `calc(${objectsWrapperMinSize}px - ${pLocalY}px)`,
        }),
      }}
    >
      {validChildren.map((child, index) => {
        const key = (child as React.ReactElement).key;
        const commonProps = {
          scrollElementRef,
          xyObjectReverse,
          xyObject,
          rootMargin,
          suspending,
          fallback,
          mRootLocal,
          objectXYLocal,
        };

        const childRenderOnScroll =
          renderOnScroll &&
          !loadedObjects.current.includes(`${key}`) &&
          scrollingStatus
            ? fallback
            : child;

        const childLocal = Array.isArray(objectXY) ? (
          childRenderOnScroll
        ) : index === 0 ? (
          <ResizeTracker onResize={childResize}>
            {() => childRenderOnScroll}
          </ResizeTracker>
        ) : (
          childRenderOnScroll
        );

        if (infiniteScroll && scrollElementRef.current) {
          const { elementTop, elementBottom, left } =
            memoizedChildrenData[index];
          const isElementVisible =
            (xDirection ? localScrollXY[0] ?? 0 : localScrollXY[1] ?? 0) +
              mRootX >
              elementTop - scrollElementRef.current!.scrollTop &&
            elementBottom - scrollElementRef.current!.scrollTop > 0 - mRootY;

          if (isElementVisible) {
            return (
              <ScrollObjectWrapper
                key={key}
                {...commonProps}
                elementTop={elementTop}
                left={left}
                infiniteScroll={infiniteScroll}
                attribute={renderOnScroll ? `${key}` : ""}
              >
                {childLocal}
              </ScrollObjectWrapper>
            );
          }
        } else {
          return (
            <ScrollObjectWrapper
              key={key}
              {...commonProps}
              lazyRender={lazyRender}
            >
              {childLocal}
            </ScrollObjectWrapper>
          );
        }
      })}
    </div>
  );

  const content = (
    <div
      className={`customScroll${xDirection ? " xDirection" : " yDirection"}${
        progressTriggerCheck("content") ? " draggableContent" : ""
      }${progressVisibility === "hover" ? " progressOnHover" : ""}${
        className ? ` ${className}` : ""
      }`}
      ref={customScrollRef}
      style={{
        width: `${localScrollXY[2]}px`,
        height: `${localScrollXY[3]}px`,
      }}
    >
      <div
        className="scrollContent"
        ref={scrollContentlRef}
        style={{
          width: xDirection ? `${localScrollXY[1]}px` : `${localScrollXY[0]}px`,
          height: xDirection
            ? `${localScrollXY[0]}px`
            : `${localScrollXY[1]}px`,
          ...(xDirection && {
            transform: `rotate(-90deg) translate(${translateProperty}px, ${translateProperty}px) scaleX(-1)`,
          }),
          ...(progressTriggerCheck("arrows") &&
            arrowsLocal.size &&
            (xDirection
              ? { left: `${arrowsLocal.size}px` }
              : { top: `${arrowsLocal.size}px` })),
        }}
      >
        {progressTriggerCheck("arrows") &&
          ["first", "last"].map((position) => (
            <div
              key={position}
              className={`arrowBox ${position}${
                arrowsLocal.className ? ` ` + arrowsLocal.className : ""
              }`}
              style={{ height: `${arrowsLocal.size}px` }}
              onClick={() => handleArrows(position)}
            >
              {arrowsLocal.element}
            </div>
          ))}

        {(progressVisibility === "visible" || progressVisibility === "hover") &&
          thumbSize < xy && (
            <>
              {!sliderType ? (
                <div
                  className={`scrollBar${
                    progressReverse ? " progressReverse" : ""
                  }${
                    progressTriggerCheck("progressElement") ? " draggable" : ""
                  }`}
                  style={{ width: `${progressBarSize}px` }}
                >
                  <div
                    className={`scrollBarThumb${
                      thumbElement ? "" : " defaultThumb"
                    }`}
                    onMouseDown={(e) =>
                      progressTriggerCheck("progressElement") &&
                      handleMouseDown(e, "thumb", customScrollRef.current)
                    }
                    style={{ height: `${thumbSize}px`, top: `${topThumb}px` }}
                  >
                    {thumbElement}
                    <div className="clickField"></div>
                  </div>
                </div>
              ) : (
                <div
                  className={`sliderBar${
                    progressReverse ? " progressReverse" : ""
                  }${
                    progressTriggerCheck("progressElement") ? " draggable" : ""
                  }`}
                  ref={sliderBarRef}
                  onMouseDown={(e) =>
                    handleMouseDown(e, "slider", customScrollRef.current)
                  }
                >
                  {Array.from(
                    { length: scrollXYLocalToobjectsWrapperXY() || 0 },
                    (_, index) => (
                      <div
                        key={index}
                        className={`sliderElem`}
                        style={{ width: `${progressBarSize}px` }}
                      >
                        {thumbElement}
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

        <div
          className="scrollElement"
          ref={scrollElementRef}
          onScroll={handleScroll}
          style={{
            ...contentAlignLocal,
            ...(progressTriggerCheck("wheel")
              ? {
                  overflow: "hidden scroll",
                }
              : { overflow: "hidden hidden" }),
          }}
        >
          {objectXY || infiniteScroll ? (
            objectsWrapper
          ) : (
            <ResizeTracker measure="all" onResize={wrapResize}>
              {() => objectsWrapper}
            </ResizeTracker>
          )}
        </div>

        {edgeGradient && <div className="edge first" style={edgeStyle}></div>}
        {edgeGradient && <div className="edge last" style={edgeStyle}></div>}
      </div>
    </div>
  );

  if (typeof scrollXY === "string") {
    return (
      <ResizeTracker measure="outer" onResize={scrollResize}>
        {() => content}
      </ResizeTracker>
    );
  } else {
    return content;
  }
};

export default Scroll;

interface ScrollObjectWrapperType
  extends Pick<
    ScrollType,
    "rootMargin" | "suspending" | "fallback" | "infiniteScroll" | "lazyRender"
  > {
  children: React.ReactNode;
  elementTop?: number;
  left?: number;
  mRootLocal?: number[] | number | null;
  scrollElementRef: React.RefObject<HTMLDivElement>;
  xyObject: number | null;
  xyObjectReverse: number | null;
  objectXYLocal: (number | null)[];
  attribute?: string;
}

const ScrollObjectWrapper: React.FC<ScrollObjectWrapperType> = React.memo(
  ({
    children,
    elementTop,
    left,
    mRootLocal,
    scrollElementRef,
    xyObject,
    xyObjectReverse,
    objectXYLocal,
    rootMargin,
    suspending,
    fallback,
    infiniteScroll,
    lazyRender,
    attribute,
  }) => {
    const content = suspending ? (
      <React.Suspense fallback={fallback}>{children}</React.Suspense>
    ) : (
      children
    );

    const wrapStyle1 = objectXYLocal[0]
      ? { width: `${objectXYLocal[0]}px` }
      : {};

    const wrapStyle2 = {
      width: `${xyObjectReverse}px`,
      height: `${xyObject}px`,
    };

    const commonProps = {
      root: scrollElementRef.current,
      rootMargin: infiniteScroll ? rootMargin : mRootLocal,
      style: infiniteScroll
        ? ({
            ...wrapStyle2,
            position: "absolute",
            top: `${elementTop}px`,
            ...(left !== null ? { left: `${left}px` } : {}),
          } as React.CSSProperties)
        : wrapStyle2,
    };

    const innerContent = (
      <div {...(attribute ? { "data-id": attribute } : {})} style={wrapStyle1}>
        {content}
      </div>
    );

    return infiniteScroll ? (
      <div
        style={{
          position: "absolute",
          top: `${elementTop}px`,
          ...(left !== null ? { left: `${left}px` } : {}),
          ...wrapStyle2,
        }}
      >
        {innerContent}
      </div>
    ) : lazyRender ? (
      <IntersectionTracker {...commonProps}>{innerContent}</IntersectionTracker>
    ) : (
      <div style={wrapStyle2}>{innerContent}</div>
    );
  }
);

ScrollObjectWrapper.displayName = "ScrollObject";

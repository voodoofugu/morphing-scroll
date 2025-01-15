/* eslint-disable react/no-unknown-property */
import React from "react";
import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";
import { ScrollType, progressTriggerT } from "./types";

const Scroll: React.FC<ScrollType> = ({
  scrollID = "",
  className = "",
  size,
  objectsSize,
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
  objectsBoxFullMinSize,
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
}) => {
  const forceUpdate = React.useReducer(() => ({}), {})[1]; // для принудительного обновления

  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentlRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const sliderBarRef = React.useRef<HTMLDivElement | null>(null);

  const grabbingElementRef = React.useRef<HTMLElement | null>(null);
  const clickedObject = React.useRef("");
  const numForSlider = React.useRef<number>(0);
  const loadedObjects = React.useRef<(string | null)[]>([]);
  const firstChildKeyRef = React.useRef<string | null | undefined>(null);
  const scrollTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");

  const validChildren = React.useMemo(() => {
    return React.Children.toArray(children).filter(
      (child) => child !== null && child !== undefined
    );
  }, [children]);

  const firstChildKey = React.useMemo(() => {
    if (scrollTop !== "end") return;

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
  }, [objectsSize, pY, xDirection, receivedChildSize]);

  const xyObject = xDirection ? objectsSizeLocal[0] : objectsSizeLocal[1];
  const xyObjectReverse = xDirection
    ? objectsSizeLocal[1]
    : objectsSizeLocal[0];

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

  const sizeLocal = React.useMemo(() => {
    const [x, y] =
      size && Array.isArray(size)
        ? size
        : [receivedScrollSize.width, receivedScrollSize.height];

    if (!progressTriggerCheck("arrows") || !arrowsLocal.size) {
      return [x, y, x, y];
    }

    return xDirection
      ? [x ? x - arrowsLocal.size * 2 : x, y, x, y]
      : [x, y ? y - arrowsLocal.size * 2 : y, x, y]; // [2] & [3] is only for customScroll
  }, [size, xDirection, arrows, receivedScrollSize]);

  const xy = xDirection ? sizeLocal[0] : sizeLocal[1];
  const xyReverse = xDirection ? sizeLocal[1] : sizeLocal[0];

  // calculations
  const objectsPerDirection = React.useMemo(() => {
    const objectSize = xyObjectReverse ? xyObjectReverse + gapX : null;

    const objects = objectSize ? Math.floor((xyReverse - pY) / objectSize) : 1;

    return objects;
  }, [xyObjectReverse, xyReverse, gapX, pY]);

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
    return objectsWrapperHeight + pLocalY;
  }, [objectsWrapperHeight, pLocalY]);

  const objectsWrapperWidthFull = React.useMemo(() => {
    return objectsWrapperWidth + pLocalX;
  }, [objectsWrapperWidth, pLocalX]);

  const thumbSize = React.useMemo(() => {
    if (
      progressVisibility === "visible" ||
      progressVisibility === "hover" ||
      !objectsWrapperHeightFull
    ) {
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
      : scrollTop === "end" && objectsWrapperHeightFull > xy
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
    sizeLocal,
    objectsWrapperHeightFull,
    objectsWrapperWidthFull,
  ]);

  const sizeLocalToobjectsWrapperXY = React.useCallback(
    (max?: boolean) => {
      const scrollValue = xDirection ? sizeLocal[0] : sizeLocal[1];
      if (!scrollValue) return null;

      const calcFn = max ? Math.ceil : Math.floor;
      return calcFn(objectsWrapperHeight / scrollValue);
    },
    [xDirection, sizeLocal, objectsWrapperHeight]
  );

  // events
  const handleArrows = React.useCallback(
    (arr: string) => {
      const scrollEl = scrollElementRef.current;
      const wrapEl = objectsWrapperRef.current;
      if (!scrollEl || !wrapEl) return;

      const scrollTopEl = scrollEl.scrollTop;
      const height = wrapEl.clientHeight;
      const length = sizeLocalToobjectsWrapperXY(true);

      const scrollTo = (position: number) => smoothScroll(position);

      if (arr === "first" && scrollTopEl > 0) {
        scrollTo(scrollTopEl <= xy ? 0 : scrollTopEl - xy);
      }

      if (arr === "last" && length && scrollTopEl + xy !== height) {
        scrollTo(scrollTopEl + xy >= xy * length ? height : scrollTopEl + xy);
      }
    },
    [scrollElementRef, objectsWrapperRef, sizeLocalToobjectsWrapperXY]
  );

  const edgeGradientAndArrowsCheck = React.useCallback(() => {
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
  }, [xy, objectsWrapperHeightFull]);

  const handleScroll = React.useCallback(() => {
    const scrollEl = scrollElementRef.current;
    if (!scrollEl) return;

    // scroll status
    infiniteScroll === "freezeOnScroll" && setScrollingStatus(true);
    isScrolling?.(true);

    scrollTimeout.current && clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      infiniteScroll === "freezeOnScroll" && setScrollingStatus(false);
      isScrolling?.(false);
    }, 200);

    // newScroll
    if (
      thumbSize !== 0 &&
      (progressVisibility === "visible" || progressVisibility === "hover")
    ) {
      const newScroll = Math.abs(
        Math.round((scrollEl.scrollTop / endObjectsWrapper) * (xy - thumbSize))
      );
      if (newScroll !== topThumb && !sliderType) {
        // фиксим то что скролл срабатывает если один из детей последнего элемента больше чем родитель
        // не позволяя ползунку выходить за пределы
        setTopThumb(thumbSize + newScroll > xy ? xy - thumbSize : newScroll);
      }

      // avoid jumping to the top when loading new items on top in the scroll
      if (
        scrollEl.scrollTop === 0 && // xDirection!!! scrollLeft === 0
        clickedObject.current === "none"
      ) {
        scrollEl.scrollTop = 1;
      }
      // onScrollValue
      if (onScrollValue) {
        onScrollValue.forEach((conditionFunc) => {
          conditionFunc(scrollEl.scrollTop);
        });
      }
    }

    edgeGradient && edgeGradientAndArrowsCheck();
  }, [
    xy,
    thumbSize,
    topThumb,
    progressVisibility,
    sliderType,
    onScrollValue,
    edgeGradientAndArrowsCheck,
    isScrolling,
  ]);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      const scrollEl = scrollElementRef.current;
      const length = sizeLocalToobjectsWrapperXY();
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
    [xDirection, scrollElementRef, sizeLocalToobjectsWrapperXY]
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
      ) {
        return;
      }

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

  let frameId: number;
  const smoothScroll = React.useCallback(
    (targetScrollTop: number, callback?: () => void) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return null;

      const startScrollTop = scrollEl.scrollTop;
      const startTime = performance.now();

      const scrollStep = (currentTime: number) => {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        if (targetScrollTop !== undefined && targetScrollTop !== null) {
          scrollEl.scrollTop =
            startScrollTop + (targetScrollTop - startScrollTop) * progress;
        }

        if (timeElapsed < duration) {
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
      let cancelScroll: (() => void) | null;

      if (scrollTop === "end") {
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
    if (infiniteScroll === "freezeOnScroll") {
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
      onMouseDown={(e) =>
        progressTriggerCheck("content") &&
        handleMouseDown(e, "wrapp", objectsWrapperRef.current)
      }
      style={{
        padding: `${pT}px ${pR}px ${pB}px ${pL}px`,
        height:
          infiniteScroll && objectsWrapperHeightFull
            ? `${objectsWrapperHeightFull}px`
            : "fit-content",
        width: objectsWrapperWidth ? `${objectsWrapperWidth}px` : "",

        ...(infiniteScroll && {
          position: "relative",
        }),
        ...(!infiniteScroll && {
          display: "flex",
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
        ...(objectsBoxFullMinSize && {
          minHeight: `${xy - pLocalY}px`,
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
          objectsSizeLocal,
        };

        const childRenderOnScroll =
          infiniteScroll === "freezeOnScroll" &&
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

        if (infiniteScroll && scrollElementRef.current) {
          const { elementTop, elementBottom, left } =
            memoizedChildrenData[index];
          const isElementVisible =
            (xDirection ? sizeLocal[0] ?? 0 : sizeLocal[1] ?? 0) + mRootX >
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
                attribute={
                  infiniteScroll === "freezeOnScroll" ? `${id}-${key}` : ""
                }
                objectsPerDirection={objectsPerDirection}
                objectsSize={objectsSize}
                xDirection={xDirection}
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
              objectsPerDirection={objectsPerDirection}
              objectsSize={objectsSize}
              xDirection={xDirection}
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
      m-s="〈♦〉"
      className={`customScroll${xDirection ? " xDirection" : " yDirection"}${
        progressTriggerCheck("content") ? " draggableContent" : ""
      }${progressVisibility === "hover" ? " progressOnHover" : ""}${
        className ? ` ${className}` : ""
      }`}
      ref={customScrollRef}
      style={{
        width: `${sizeLocal[2]}px`,
        height: `${sizeLocal[3]}px`,
      }}
    >
      <div
        className="scrollContent"
        ref={scrollContentlRef}
        style={{
          width: xDirection ? `${sizeLocal[1]}px` : `${sizeLocal[0]}px`,
          height: xDirection ? `${sizeLocal[0]}px` : `${sizeLocal[1]}px`,
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
          {typeof objectsSize[0] !== "string" ||
          typeof objectsSize[1] !== "string" ||
          infiniteScroll ? (
            objectsWrapper
          ) : (
            <ResizeTracker onResize={wrapResize}>
              {() => objectsWrapper}
            </ResizeTracker>
          )}
        </div>

        {edgeGradient && <div className="edge first" style={edgeStyle}></div>}
        {edgeGradient && <div className="edge last" style={edgeStyle}></div>}

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
                    { length: sizeLocalToobjectsWrapperXY() || 0 },
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
  scrollElementRef: React.RefObject<HTMLDivElement | null>;
  xyObject: number | null;
  xyObjectReverse: number | null;
  objectsSizeLocal: (number | null)[];
  attribute?: string;
  objectsPerDirection: number;
  objectsSize: (number | "none" | "firstChild")[];
  xDirection: boolean;
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
    objectsSizeLocal,
    rootMargin,
    suspending,
    fallback,
    infiniteScroll,
    lazyRender,
    attribute,
    objectsPerDirection,
    xDirection,
  }) => {
    const content = suspending ? (
      <React.Suspense fallback={fallback}>{children}</React.Suspense>
    ) : (
      children
    );

    const wrapStyle1 = {
      width: xyObjectReverse ? `${xyObjectReverse}px` : "",
      height: xyObject ? `${xyObject}px` : "",
      ...(xDirection && {
        display: "flex",
      }),
    };

    const wrapStyle2 = {
      width: objectsSizeLocal[0] ? `${objectsSizeLocal[0]}px` : "",
      ...(xDirection && {
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
      <div style={wrapStyle1}>{innerContent}</div>
    );
  }
);

ScrollObjectWrapper.displayName = "ScrollObject";

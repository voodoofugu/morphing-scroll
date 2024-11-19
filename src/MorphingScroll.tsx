import React from "react";
import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";
import { ScrollType, progressTriggerOptions } from "./types";

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
  contentAlignCenter = false,
  wrapAlignCenter = false,
  edgeGradient,
  objectsWrapperMinSize,
  children,
  onScrollValue,
  thumbElement,
  arrows,

  pixelsForSwipe = 8,
  progressBarSize = 4,
  duration = 200,
}) => {
  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentlRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const sliderBarRef = React.useRef<HTMLDivElement | null>(null);

  const grabbingElementRef = React.useRef<HTMLElement | null>(null);

  let objectsWrapperAligning = false;
  const prevKey = React.useRef<string | null | undefined>(null);
  const clickedObject = React.useRef("");
  const numForSlider = React.useRef<number>(0);

  const [refUpdater, setRefUpdater] = React.useState(false);
  const [topThumb, setTopThumb] = React.useState(0);
  const [receivedObjectsWrapperSize, setReceivedObjectsWrapperSize] =
    React.useState(0);
  const [infiniteScrollState, setInfiniteScrollState] = React.useState(false);

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
  const arrowsLocal = { ...arrowsDefault, ...arrows };

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
  const pLocalXY = pT + pB;

  const [gapX, gapY] = React.useMemo(() => {
    return typeof gap === "number"
      ? [gap, gap]
      : xDirection
      ? [gap ? gap[1] : 0, gap ? gap[0] : 0]
      : [0, 0];
  }, [gap, xDirection]);

  const progressTriggerLocal = React.useMemo(() => {
    return typeof progressTrigger === "string"
      ? [progressTrigger]
      : progressTrigger;
  }, [progressTrigger]);

  const localObjectXY = React.useMemo(() => {
    return objectXY
      ? objectXY
      : xDirection
      ? [scrollXY ? scrollXY[0] : null, scrollXY ? scrollXY[1] - pY : null]
      : [scrollXY ? scrollXY[0] - pY : null, null];
  }, [objectXY, scrollXY, pY, xDirection]);

  const xyObject = localObjectXY
    ? xDirection
      ? localObjectXY[0]
      : localObjectXY[1]
    : null;
  const xyObjectReverse = localObjectXY
    ? xDirection
      ? localObjectXY[1]
      : localObjectXY[0]
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
    (triggerType: progressTriggerOptions) => {
      return progressTriggerLocal.includes(triggerType);
    },
    [progressTriggerLocal]
  );

  const localScrollXY = React.useMemo(() => {
    const [x, y] = scrollXY || localObjectXY;

    if (!progressTriggerCheck("arrows") || !arrowsLocal.size) {
      return [x, y, x, y];
    }

    return xDirection
      ? [x ? x - arrowsLocal.size * 2 : x, y, x, y]
      : [x, y ? y - arrowsLocal.size * 2 : y, x, y]; // [2] & [3] is only for customScroll
  }, [scrollXY, localObjectXY, xDirection, arrows]);

  // calculations
  const objectsPerDirection = localObjectXY
    ? React.useMemo(() => {
        if (!localScrollXY[0] || !localScrollXY[1]) {
          return 1;
        }
        const objects = xDirection
          ? Math.floor(
              (localScrollXY[1] - pY) /
                (localObjectXY[1]
                  ? localObjectXY[1] + gapX
                  : localScrollXY[1] + gapX)
            )
          : Math.floor(
              (localScrollXY[0] - pY) /
                (localObjectXY[0]
                  ? localObjectXY[0] + gapX
                  : localScrollXY[0] + gapX)
            );
        return objects > validChildren.length
          ? validChildren.length
          : objects < 1
          ? 1
          : objects;
      }, [])
    : validChildren.length;

  const xy = xDirection ? localScrollXY[0] || 0 : localScrollXY[1] || 0;

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
    return (
      (xyObjectReverse ? xyObjectReverse : 0) * objectsPerDirection +
      (objectsPerDirection - 1) * gapY
    );
  }, [xyObjectReverse, objectsPerDirection, gapY]);

  const objectsWrapperHeight = React.useMemo(() => {
    return objectXY
      ? (xyObject ? xyObject : 0) * childsPerDirection +
          (childsPerDirection - 1) * gapX
      : receivedObjectsWrapperSize;
  }, [xyObject, childsPerDirection, gapX, receivedObjectsWrapperSize]);

  const objectsWrapperSizeFull = React.useMemo(() => {
    return objectsWrapperHeight + pLocalXY;
  }, [objectsWrapperHeight, pLocalXY]);

  const thumbSize = React.useMemo(() => {
    if (progressVisibility === "visible" || progressVisibility === "hover") {
      if (objectsWrapperHeight === 0) return 0;
      if (!xy) return 0;
      return Math.round((xy / objectsWrapperSizeFull) * xy);
    } else {
      return 0;
    }
  }, [xy, objectsWrapperSizeFull, progressVisibility]);

  const endObjectsWrapper = React.useMemo(() => {
    if (!xy) return objectsWrapperSizeFull;
    return (
      objectsWrapperSizeFull - xy // in scroll vindow
    );
  }, [objectsWrapperSizeFull, xy]);

  const localScrollTop = React.useMemo(() => {
    if (scrollTop) {
      return typeof scrollTop === "number"
        ? scrollTop
        : scrollTop === "end"
        ? objectsWrapperSizeFull > xy
          ? endObjectsWrapper
          : 0
        : 0;
    }
  }, [scrollTop, objectsWrapperSizeFull, endObjectsWrapper]);

  const translateProperty = React.useMemo(() => {
    if (!localScrollXY[0] || !localScrollXY[1]) return 0;
    return localScrollXY[0] / 2 - localScrollXY[1] / 2;
  }, [localScrollXY]);

  const memoizedChildrenData = React.useMemo(() => {
    let lastIndices: number[] = [];
    let balanceHeight: number = 0;

    if (infiniteScroll && contentAlignCenter) {
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
      balanceHeight =
        (((xyObjectReverse ? xyObjectReverse : 0) + gapY) *
          (objectsPerDirection - firstChildsInDirection)) /
        2;
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
        return index !== 0
          ? ((xyObject ? xyObject : 0) + gapX) * index + pT
          : pT;
      })(
        infiniteScroll
          ? objectsPerDirection > 1
            ? indexAndSubIndex[1]
            : index
          : 0
      );

      const elementBottom = (function () {
        return infiniteScroll && localObjectXY[1]
          ? elementTop + localObjectXY[1]
          : 0;
      })();

      const left =
        infiniteScroll && xyObjectReverse && objectsPerDirection > 1
          ? xyObjectReverse * indexAndSubIndex[0] +
            gapY * indexAndSubIndex[0] +
            (xDirection ? pLocal[0] : pLocal[1]) +
            (contentAlignCenter && lastIndices.length > 0
              ? lastIndices.includes(index)
                ? balanceHeight
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
    localObjectXY,
    gap,
    infiniteScroll,
    objectsPerDirection,
  ]);

  objectsWrapperAligning = React.useMemo(() => {
    if (!localScrollXY[0] || !localScrollXY[1]) return false;
    if (wrapAlignCenter && scrollXY) {
      if (xDirection) {
        if (localScrollXY[0] > objectsWrapperSizeFull) {
          return true;
        }
      } else {
        if (localScrollXY[1] > objectsWrapperSizeFull) {
          return true;
        }
      }
    }
    return false;
  }, [xDirection, localScrollXY, localObjectXY, gap, objectsWrapperSizeFull]);

  const scrollXYToobjectsWrapperXY = React.useCallback(
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
    (arr: string, e?: React.MouseEvent) => {
      const scrollEl = scrollElementRef.current;
      const wrapEl = objectsWrapperRef.current;
      if (!scrollEl || !wrapEl) return;

      const scrollTop = scrollEl.scrollTop;
      const height = wrapEl.clientHeight;
      const length = scrollXYToobjectsWrapperXY(true);

      const scrollTo = (position: number) => smoothScroll(position, () => {});

      if (arr === "first" && scrollTop > 0) {
        scrollTo(scrollTop <= xy ? 0 : scrollTop - xy);
      }

      if (arr === "last" && length && scrollTop + xy !== height) {
        scrollTo(scrollTop + xy >= xy * length ? height : scrollTop + xy);
      }
    },
    [scrollElementRef, objectsWrapperRef, scrollXYToobjectsWrapperXY]
  );

  const edgeGradientAndArrowsCheck = React.useCallback(() => {
    if (!edgeGradient) return;

    const scrollTop = scrollElementRef.current?.scrollTop || 0;
    const isNotAtBottom = Math.round(scrollTop + xy) !== objectsWrapperSizeFull;

    if (scrollContentlRef.current) {
      scrollContentlRef.current.classList.toggle("edgeLast", isNotAtBottom);
      scrollContentlRef.current.classList.toggle("edgeFirst", scrollTop > 1);
      if (progressTriggerCheck("arrows")) {
        scrollContentlRef.current.classList.toggle("l_ArrOff", !isNotAtBottom);
        scrollContentlRef.current.classList.toggle("f_ArrOff", scrollTop <= 1);
      }

      if (sliderBarRef.current) {
        function getActiveElem() {
          const elements =
            sliderBarRef.current?.querySelectorAll(".sliderElem");

          elements &&
            elements.forEach((element, index) => {
              const isActive =
                scrollTop >= xy * index && scrollTop < xy * (index + 1);
              element.classList.toggle("active", isActive);
            });
        }

        getActiveElem();
      }
    }
  }, [edgeGradient, xy, objectsWrapperSizeFull]);

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
        onScrollValue.forEach(([conditionFunc, callbackFunc]) => {
          if (
            scrollElementRef.current &&
            conditionFunc(scrollElementRef.current.scrollTop)
          ) {
            callbackFunc();
          }
        });
      }
    }

    edgeGradientAndArrowsCheck();
  }, [xy, thumbSize, topThumb]);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      const scrollEl = scrollElementRef.current;
      const length = scrollXYToobjectsWrapperXY();
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
            setRefUpdater((prev) => !prev);
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
    [xDirection, scrollElementRef, scrollXYToobjectsWrapperXY]
  );

  const handleMouseUp = React.useCallback(() => {
    const grabbingElement = grabbingElementRef.current;
    if (!grabbingElement) return;

    grabbingElement.classList.remove("grabbingElement");
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    document.body.style.removeProperty("cursor");

    clickedObject.current = "";
    setRefUpdater((prev) => !prev); // for update ref only
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
      setRefUpdater((prev) => !prev); // for update ref only

      (progressVisibility === "hover" || progressVisibility === "visible") &&
        grabbingElement.classList.add("grabbingElement");
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
    },
    [handleMouseMove, handleMouseUp, customScrollRef]
  );

  const handleResize = React.useCallback(
    (_: number, height: number) => {
      const newSize = height - pLocalXY;
      setReceivedObjectsWrapperSize(newSize);
    },
    [xDirection, pLocalXY, objectsWrapperHeight]
  );

  const smoothScroll = React.useCallback(
    (targetScrollTop: number, callback: () => void) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return;

      const startScrollTop = scrollEl.scrollTop;
      const startTime = performance.now();

      const scrollStep = (currentTime: number) => {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        if (targetScrollTop || targetScrollTop === 0) {
          scrollEl.scrollTop =
            startScrollTop + (targetScrollTop - startScrollTop) * progress;
        }

        if (timeElapsed < duration) {
          requestAnimationFrame(scrollStep);
        } else {
          callback();
        }
      };

      requestAnimationFrame(scrollStep);
    },
    [scrollElementRef.current]
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
      setInfiniteScrollState(true);
    }

    edgeGradientAndArrowsCheck();
  }, []);

  React.useEffect(() => {
    if (
      scrollTop &&
      scrollElementRef.current &&
      validChildren.length > 0 &&
      scrollTop === "end"
    ) {
      let animationId: number;

      const scrollCallback = () => {
        prevKey.current = firstChildKey;
      };

      if (prevKey.current === null) {
        animationId = requestAnimationFrame(() =>
          smoothScroll(localScrollTop ?? 0, scrollCallback)
        );
      } else if (prevKey.current !== firstChildKey) {
        smoothScroll(NaN, scrollCallback);
      } else if (prevKey.current === firstChildKey) {
        animationId = requestAnimationFrame(() =>
          smoothScroll(localScrollTop ?? 0, () => {})
        );
      }

      return () => cancelAnimationFrame(animationId);
    }
  }, [objectsWrapperHeight]);

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
        ...(gap ? { gap: `${gapX}px ${gapY}px` } : {}),
        ...(objectsWrapperWidth ? { width: `${objectsWrapperWidth}px` } : {}),
        ...(objectXY &&
          objectsWrapperHeight && {
            position: "absolute",
            height: `${objectsWrapperHeight}px`,
          }),
        ...(objectsWrapperMinSize && {
          minHeight: `calc(${objectsWrapperMinSize}px - ${pLocalXY}px)`,
        }),
      }}
    >
      {validChildren.map((child, index) => {
        const key = (child as React.ReactElement).key;

        if (infiniteScroll && infiniteScrollState) {
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
                scrollElementRef={scrollElementRef}
                xyObjectReverse={xyObjectReverse}
                xyObject={xyObject}
                rootMargin={rootMargin}
                suspending={suspending}
                fallback={fallback}
                elementTop={elementTop}
                left={left}
                mRootLocal={mRootLocal}
                infiniteScroll={infiniteScroll}
                infiniteScrollState={infiniteScrollState}
                localObjectXY={localObjectXY}
              >
                {child}
              </ScrollObjectWrapper>
            );
          }
        } else {
          return (
            <ScrollObjectWrapper
              key={key}
              scrollElementRef={scrollElementRef}
              xyObjectReverse={xyObjectReverse}
              xyObject={xyObject}
              rootMargin={rootMargin}
              suspending={suspending}
              fallback={fallback}
              mRootLocal={mRootLocal}
              localObjectXY={localObjectXY}
              lazyRender={lazyRender}
            >
              {child}
            </ScrollObjectWrapper>
          );
        }
      })}
    </div>
  );

  return (
    <div
      className={`customScroll${xDirection ? " xDirection" : " yDirection"}${
        progressTriggerCheck("content") ? " draggableContent" : ""
      }${
        progressVisibility === "hover" ? " progressOnHover" : ""
      } ${className}`}
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

        {edgeGradient && <div className="edge first" style={edgeStyle}></div>}
        {edgeGradient && <div className="edge last" style={edgeStyle}></div>}

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
                    { length: scrollXYToobjectsWrapperXY() || 0 },
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
            ...(objectsWrapperAligning && {
              alignItems: "center",
            }),
            ...(progressTriggerCheck("wheel")
              ? {
                  overflow: "hidden scroll",
                }
              : { overflow: "hidden hidden" }),
          }}
        >
          {objectXY ? (
            objectsWrapper
          ) : (
            <ResizeTracker
              onResize={handleResize}
              // ???
              // style={{
              //   minHeight: `${localScrollXY[1]}px`,
              // }}
            >
              {() => objectsWrapper}
            </ResizeTracker>
          )}
        </div>
      </div>
    </div>
  );
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
  infiniteScrollState?: boolean;
  xyObject: number | null;
  xyObjectReverse: number | null;
  localObjectXY: (number | null)[];
}

const ScrollObjectWrapper: React.FC<ScrollObjectWrapperType> = React.memo(
  ({
    children,
    elementTop,
    left,
    mRootLocal,
    scrollElementRef,
    infiniteScrollState,
    xyObject,
    xyObjectReverse,
    localObjectXY,
    rootMargin,
    suspending,
    fallback,
    infiniteScroll,
    lazyRender,
  }) => {
    const content = suspending ? (
      <React.Suspense fallback={fallback}>{children}</React.Suspense>
    ) : (
      children
    );

    if (infiniteScroll && infiniteScrollState) {
      return (
        <IntersectionTracker
          root={scrollElementRef.current}
          rootMargin={rootMargin}
          style={{
            position: "absolute",
            width: `${xyObjectReverse}px`,
            height: `${xyObject}px`,
            top: `${elementTop}px`,
            ...(left !== null ? { left: `${left}px` } : {}),
          }}
        >
          <div
            style={{
              width: `${xyObjectReverse}px`,
            }}
          >
            {content}
          </div>
        </IntersectionTracker>
      );
    } else {
      const wrapStyle1 = localObjectXY[0]
        ? {
            width: `${localObjectXY[0]}px`,
            // height: `${localObjectXY[1]}px`,
          }
        : {};
      const wrapStyle2 = {
        width: `${xyObjectReverse}px`,
        height: `${xyObject}px`,
      };

      return lazyRender ? (
        <IntersectionTracker
          root={scrollElementRef.current}
          rootMargin={mRootLocal}
          style={wrapStyle2}
        >
          <div style={wrapStyle1}>{content}</div>
        </IntersectionTracker>
      ) : (
        <div style={wrapStyle2}>
          <div style={wrapStyle1}>{content}</div>
        </div>
      );
    }
  }
);
ScrollObjectWrapper.displayName = "ScrollObject";

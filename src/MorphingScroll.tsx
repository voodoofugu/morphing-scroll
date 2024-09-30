import React from "react";
import IntersectionTracker from "./IntersectionTracker";
import ResizeTracker from "./ResizeTracker";

type ScrollTriggerOptions = "mouseWheel" | "scrollThumb" | "content" | "arrows";

interface ScrollType {
  scrollID?: string; // This is only used to better recognize warnings
  className?: string;
  scrollXY?: number[];

  objectXY?: number[];
  gap?: number[] | number;
  padding?: number[] | number;

  xDirection?: boolean;
  contentAlignCenter?: boolean;
  wrapAlignCenter?: boolean;

  progressReverse?: boolean;
  scrollTrigger?: Array<ScrollTriggerOptions> | ScrollTriggerOptions;
  progressVisibility?: "visible" | "hover" | "hidden";
  scrollTop?: number | "end";

  lazyRender?: boolean;
  infiniteScroll?: boolean;
  rootMargin?: number[] | number;
  suspending?: boolean;

  fallback?: React.ReactNode;
  thumbElement?: React.ReactNode;
  edgeGradient?: boolean | string;
  arrow?: { size?: number; className?: string; element?: React.ReactNode };

  objectsWrapperMinSize?: number;
  onScrollValue?: Array<[(scrollTop: number) => boolean, () => void]>;
  children?: React.ReactNode;
  // multipleDirectionQuantity?: boolean;
  // autoSize?: boolean;
}

const Scroll: React.FC<ScrollType> = ({
  scrollID = "",
  className = "",
  scrollXY,
  objectXY,
  xDirection = false,
  gap,
  padding = [0, 0, 0, 0],
  progressReverse = false,
  scrollTrigger = "mouseWheel",
  progressVisibility = "visible",
  lazyRender = false,
  rootMargin = 0,
  suspending = false,
  fallback = null,
  scrollTop = 1,
  infiniteScroll = false,
  contentAlignCenter = false,
  wrapAlignCenter = false,
  edgeGradient = false,
  objectsWrapperMinSize,
  children,
  onScrollValue,
  thumbElement,
  arrow = {
    size: 40,
    className: "",
    element: <div className="arrow"></div>,
  },
}) => {
  const customScrollRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContentlRef = React.useRef<HTMLDivElement | null>(null);
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
  const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const sliderBarRef = React.useRef<HTMLDivElement | null>(null);

  let objectsWrapperAligning = false;
  const clickedObject = React.useRef("none");
  const prevKey = React.useRef<string | null | undefined>(null);

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

  // variables
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

  const scrollTriggerLocal = React.useMemo(() => {
    return typeof scrollTrigger === "string" ? [scrollTrigger] : scrollTrigger;
  }, [scrollTrigger]);

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

  const localScrollXY = React.useMemo(() => {
    const [x, y] = scrollXY || localObjectXY;

    if (!scrollTriggerLocal.includes("arrows") || !arrow.size) {
      return [x, y];
    }

    return xDirection
      ? [x ? x - arrow.size * 2 : x, y, x, y]
      : [x, y ? y - arrow.size * 2 : y, x, y]; // [2] & [3] is only for customScroll
  }, [scrollXY, localObjectXY, xDirection, arrow]);

  // calculations
  const objectsPerDirection = localObjectXY
    ? React.useMemo(() => {
        if (!localScrollXY[0] || !localScrollXY[1]) {
          return 1;
        }
        const objects = xDirection
          ? Math.abs(
              Math.floor((localScrollXY[1] - pY) / (localScrollXY[1] + gapX))
            )
          : Math.abs(
              Math.floor((localScrollXY[0] - pY) / (localScrollXY[0] + gapX))
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
          : 0;
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

  const scrollingSizeToObjectsWrapper = React.useCallback(
    (max?: boolean) => {
      const scrollValue = xDirection ? localScrollXY[0] : localScrollXY[1];
      if (!scrollValue) return null;

      const calcFn = max ? Math.ceil : Math.floor;
      return calcFn(objectsWrapperHeight / scrollValue);
    },
    [xDirection, localScrollXY, objectsWrapperHeight]
  );

  const edgeColor =
    typeof edgeGradient === "string"
      ? { background: `linear-gradient(${edgeGradient}, transparent)` }
      : {
          background: `linear-gradient(rgba(0,0,0,0.4), transparent)`,
        };

  // events
  const handleArrows = React.useCallback(
    (arr: string) => {
      const scrollEl = scrollElementRef.current;
      const wrapEl = objectsWrapperRef.current;
      if (!scrollEl || !wrapEl) return;

      const scrollTop = scrollEl.scrollTop;
      const height = wrapEl.clientHeight;
      const length = scrollingSizeToObjectsWrapper(true);

      const scrollTo = (position: number) =>
        smoothScroll(200, position, () => {});

      if (arr === "first" && scrollTop > 0) {
        scrollTo(scrollTop <= xy ? 0 : scrollTop - xy);
      }

      if (arr === "last" && length && scrollTop + xy !== height) {
        scrollTo(scrollTop + xy >= xy * length ? height : scrollTop + xy);
      }
    },
    [scrollElementRef, objectsWrapperRef, scrollingSizeToObjectsWrapper]
  );

  const edgeGradientAndArrowsCheck = React.useCallback(() => {
    if (!edgeGradient) return;

    const scrollTop = scrollElementRef.current?.scrollTop || 0;
    const isNotAtBottom = Math.round(scrollTop + xy) !== objectsWrapperSizeFull;

    if (scrollContentlRef.current) {
      scrollContentlRef.current.classList.toggle("edgeLast", isNotAtBottom);
      scrollContentlRef.current.classList.toggle("edgeFirst", scrollTop > 1);
      if (scrollTriggerLocal.includes("arrows")) {
        scrollContentlRef.current.classList.toggle("l_ArrOff", !isNotAtBottom);
        scrollContentlRef.current.classList.toggle("f_ArrOff", scrollTop <= 1);
      }

      if (sliderBarRef.current) {
        function getActiveElem() {
          const elements =
            sliderBarRef.current?.querySelectorAll(".sliderElem");
          const total = scrollingSizeToObjectsWrapper() || 0;

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
      if (newScroll !== topThumb && !scrollTriggerLocal.includes("arrows")) {
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
      const length = scrollingSizeToObjectsWrapper();
      if (!length) return;
      const plusMinus = clickedObject.current === "thumb" ? 1 : -1;
      if (xDirection) {
        scrollElementRef.current!.scrollTop += e.movementX * length * plusMinus;
      } else {
        scrollElementRef.current!.scrollTop += e.movementY * length * plusMinus;
      }
    },
    [xDirection, scrollElementRef, scrollingSizeToObjectsWrapper]
  );

  const handleMouseUp = React.useCallback(() => {
    if (!customScrollRef.current) return;
    customScrollRef.current.classList.remove("grabbingScroll");
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    document.body.style.removeProperty("cursor");
    clickedObject.current = "none";
  }, [handleMouseMove, customScrollRef]);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent, clicked: "thumb" | "wrapp") => {
      if (!customScrollRef.current) return;
      clickedObject.current = clicked;
      (progressVisibility === "hover" || progressVisibility === "visible") &&
        customScrollRef.current.classList.add("grabbingScroll");
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
    (duration: number, targetScrollTop: number, callback: () => void) => {
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
        `⛔ You are using the ${prop} ${
          availability ? "with" : "without"
        } ${missingProp}${scrollID ? ` in ${scrollID}` : ""}`
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
      scrollTriggerLocal.includes("scrollThumb") &&
        warn(
          "scrollTrigger `scrollThumb`",
          "progressVisibility `hidden`",
          true
        );
      scrollTriggerLocal.includes("arrows") &&
        warn("scrollTrigger `arrows`", "progressVisibility `hidden`", true);
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
          smoothScroll(200, localScrollTop ?? 0, scrollCallback)
        );
      } else if (prevKey.current !== firstChildKey) {
        smoothScroll(200, NaN, scrollCallback);
      } else if (prevKey.current === firstChildKey) {
        animationId = requestAnimationFrame(() =>
          smoothScroll(200, localScrollTop ?? 0, () => {})
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
        scrollTriggerLocal.includes("content") && handleMouseDown(e, "wrapp")
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
        ...(!infiniteScroll &&
          contentAlignCenter && {
            flexDirection: "row",
            justifyContent: "center",
          }),
        ...(!xDirection && {
          flexDirection: "column",
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
        scrollTriggerLocal.includes("scrollThumb") ? " draggableScroll" : ""
      }${scrollTriggerLocal.includes("content") ? " draggableContent" : ""}${
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
          ...(scrollTrigger.includes("arrows") &&
            arrow.size &&
            (xDirection
              ? { left: `${arrow.size}px` }
              : { top: `${arrow.size}px` })),
        }}
      >
        {scrollTriggerLocal.includes("arrows") &&
          ["first", "last"].map((position) => (
            <div
              key={position}
              className={`arrowBox ${position}${
                arrow.className ? ` ` + arrow.className : ""
              }`}
              style={{ height: `${arrow.size}px` }}
              onClick={() => handleArrows(position)}
            >
              {arrow.element}
            </div>
          ))}

        {edgeGradient && <div className="edge first" style={edgeColor}></div>}
        {edgeGradient && <div className="edge last" style={edgeColor}></div>}

        {(progressVisibility === "visible" || progressVisibility === "hover") &&
          thumbSize < xy && (
            <>
              {!scrollTriggerLocal.includes("arrows") ? (
                <div
                  className={`scrollBar${
                    progressReverse ? " progressReverse" : ""
                  }`}
                  style={
                    scrollTriggerLocal.includes("scrollThumb")
                      ? {}
                      : { pointerEvents: "none" }
                  }
                >
                  <div
                    className={`scrollBarThumb${
                      thumbElement ? "" : " defaultThumb"
                    }`}
                    onMouseDown={(e) =>
                      scrollTriggerLocal.includes("scrollThumb") &&
                      handleMouseDown(e, "thumb")
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
                  }`}
                  ref={sliderBarRef}
                >
                  {Array.from(
                    { length: scrollingSizeToObjectsWrapper() || 0 },
                    (_, index) => (
                      <div key={index} className={`sliderElem`}></div>
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
            ...(scrollTriggerLocal.includes("mouseWheel")
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

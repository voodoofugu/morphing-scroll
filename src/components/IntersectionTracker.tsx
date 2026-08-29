import React from "react";
import type { IntersectionTracker as IntersectionTrackerProps } from "../types/types";
import numOrArrFormat from "../helpers/argsFormatter";

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***IntersectionTracker***:
 * component for tracking the intersection of an element with the viewport.
 *
 * Наблюдатель, и только: детей он всегда рисует и никогда не прячет.
 * Прятать по видимости умеет `MorphScroll` через `render`, и умеет лучше —
 * он считает позиции, а не заводит наблюдатель на каждый элемент.
 *
 * [MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 * ### Links:
 * [IntersectionTracker Documentation](https://www.npmjs.com/package/morphing-scroll)
 */
const IntersectionTracker: React.FC<IntersectionTrackerProps> = ({
  className,
  children,
  style,
  root,
  threshold,
  rootMargin,
  onIntersection,
}) => {
  const observableElement = React.useRef<HTMLDivElement | null>(null);

  const rootMarginStr = React.useMemo(() => {
    if (!rootMargin) return "";
    const margin = numOrArrFormat(rootMargin);
    return `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`;
  }, [rootMargin]);

  const callback = React.useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (onIntersection) {
        onIntersection({
          time: entry.time,
          rootBounds: entry.rootBounds,
          boundingClientRect: entry.boundingClientRect,
          intersectionRect: entry.intersectionRect,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          target: entry.target,
        });
      }
    },
    [onIntersection],
  );

  React.useEffect(() => {
    const observer = new IntersectionObserver(callback, {
      root,
      threshold,
      rootMargin: rootMarginStr,
    });

    if (observableElement.current) {
      observer.observe(observableElement.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [callback, root, threshold, rootMarginStr]);

  return (
    <div
      intersection-tracker=""
      className={className}
      ref={observableElement}
      style={style}
    >
      {children}
    </div>
  );
};

IntersectionTracker.displayName = "IntersectionTracker";
export default IntersectionTracker;

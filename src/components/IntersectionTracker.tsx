/* eslint-disable react/no-unknown-property */
import React from "react";
import { IntersectionTrackerT } from "../types/types";
import numOrArrFormat from "../helpers/argsFormatter";

const IntersectionTracker: React.FC<IntersectionTrackerT> = ({
  className,
  children,
  style,
  root,
  threshold,
  rootMargin,
  visibleContent = false,
  onIntersection, // onIntersection потом переименовать
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const observableElement = React.useRef<HTMLDivElement | null>(null);

  const rootMarginStr = React.useMemo(() => {
    if (!rootMargin) return "";
    const margin = numOrArrFormat(rootMargin);
    return `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`;
  }, [rootMargin]);

  const callback = React.useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      setIsVisible(entry.isIntersecting);

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
    [onIntersection]
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
      {visibleContent || isVisible ? children : null}
    </div>
  );
};

IntersectionTracker.displayName = "IntersectionTracker";
export default IntersectionTracker;

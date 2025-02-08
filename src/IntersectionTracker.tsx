/* eslint-disable react/no-unknown-property */
import React from "react";
import { IntersectionTrackerT } from "./types";
import numOrArrFormat from "./numOrArrFormat";

const IntersectionTracker: React.FC<IntersectionTrackerT> = ({
  style,
  root,
  children,
  threshold,
  rootMargin,
  visibleContent = false,
  onVisible,
  intersectionDelay,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const observableElement = React.useRef<HTMLDivElement | null>(null);
  const timeoutRef = React.useRef<
    number | ReturnType<typeof setTimeout> | null
  >(null);

  const margin = numOrArrFormat(rootMargin);
  const rootMarginStr = margin
    ? `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`
    : "";

  const callback = React.useCallback(([entry]: IntersectionObserverEntry[]) => {
    setIsVisible(entry.isIntersecting);
  }, []);

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

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
  }, [root, threshold, rootMarginStr]);

  React.useEffect(() => {
    if (!isVisible || !onVisible) return;
    clearTimeoutRef();

    if (intersectionDelay) {
      timeoutRef.current = setTimeout(() => {
        if (isVisible && onVisible) {
          onVisible();
        }
      }, intersectionDelay);
    } else {
      if (isVisible && onVisible) {
        onVisible();
      }
    }

    return () => clearTimeoutRef();
  }, [isVisible, intersectionDelay, onVisible]);

  const content = visibleContent || isVisible ? children : null;

  return (
    <div ref={observableElement} intersection-tracker="〈•〉" style={style}>
      {content}
    </div>
  );
};
export default IntersectionTracker;

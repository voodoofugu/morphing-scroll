/* eslint-disable react/no-unknown-property */
import React from "react";
import { IntersectionTrackerT } from "./types";

import { numOrArrFormat } from "./MorphScroll";

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

  const callback = ([entry]: IntersectionObserverEntry[]) => {
    setIsVisible(entry.isIntersecting);
  };

  const options: IntersectionObserverInit = {
    root,
    threshold,
    rootMargin: margin
      ? `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`
      : "",
  };

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  React.useEffect(() => {
    if (visibleContent) return;

    const observer = new IntersectionObserver(callback, options);

    if (observableElement.current) {
      observer.observe(observableElement.current);
    }

    return () => {
      if (observableElement.current) {
        observer.unobserve(observableElement.current);
      }
    };
  }, [root, threshold, rootMargin, visibleContent]);

  React.useEffect(() => {
    if (visibleContent || !onVisible || !isVisible) return;
    clearTimeoutRef();

    if (intersectionDelay) {
      timeoutRef.current = setTimeout(onVisible, intersectionDelay);
    } else {
      onVisible();
    }

    return () => {
      clearTimeoutRef();
    };
  }, [isVisible, intersectionDelay, onVisible, visibleContent]);

  const content = visibleContent ? children : isVisible && children;

  return (
    <div ref={observableElement} intersection-tracker="〈•〉" style={style}>
      {content}
    </div>
  );
};
export default IntersectionTracker;

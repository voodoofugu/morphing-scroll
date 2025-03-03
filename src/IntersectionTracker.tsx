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
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const observableElement = React.useRef<HTMLDivElement | null>(null);

  const margin = numOrArrFormat(rootMargin);
  const rootMarginStr = margin
    ? `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`
    : "";

  const callback = React.useCallback(([entry]: IntersectionObserverEntry[]) => {
    setIsVisible(entry.isIntersecting);
  }, []);

  const validChildren = React.useMemo(() => {
    return React.Children.toArray(children).filter((child) =>
      React.isValidElement(child)
    );
  }, [children]);

  const firstChildKey = React.useMemo(() => {
    if (validChildren.length > 0) {
      return validChildren[0].key ?? null;
    }
    return null;
  }, [validChildren]);

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

    if (isVisible && onVisible) {
      onVisible(firstChildKey || "");
    }
  }, [isVisible, onVisible, firstChildKey]);

  const content = visibleContent || isVisible ? children : null;

  return (
    <div ref={observableElement} intersection-tracker="〈♦〉" style={style}>
      {content}
    </div>
  );
};
export default IntersectionTracker;

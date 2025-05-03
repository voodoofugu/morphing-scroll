/* eslint-disable react/no-unknown-property */
import React from "react";
import { IntersectionTrackerT } from "./types";
import numOrArrFormat from "./numOrArrFormater";

const IntersectionTracker: React.FC<IntersectionTrackerT> = ({
  className,
  children,
  style,
  root,
  threshold,
  rootMargin,
  visibleContent = false,
  onVisible,
  onClick,
  attribute,
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
      onVisible();
    }
  }, [isVisible, onVisible]);

  const content = visibleContent || isVisible ? children : null;

  return (
    <div
      intersection-tracker=""
      {...(attribute
        ? {
            [attribute.name]: `${attribute.value} ${
              attribute.viewVisible ? (isVisible ? "visible" : "") : ""
            }`.trim(),
          }
        : {})}
      className={className}
      ref={observableElement}
      style={style}
      onClick={onClick}
    >
      {content}
    </div>
  );
};
export default IntersectionTracker;

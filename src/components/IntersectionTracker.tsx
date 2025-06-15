/* eslint-disable react/no-unknown-property */
import React from "react";
import { IntersectionTrackerT } from "../types/types";
import numOrArrFormat from "../functions/ArgFormatter";

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

  const margin = rootMargin ? numOrArrFormat(rootMargin) : null;
  const rootMarginStr = margin
    ? `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`
    : "";

  const callback = React.useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      setIsVisible(entry.isIntersecting);

      if (entry.isIntersecting && onVisible) {
        onVisible(entry);
      }
    },
    [onVisible]
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

  const content = visibleContent || isVisible ? children : null;

  return (
    <div
      intersection-tracker=""
      {...(attribute
        ? {
            [attribute.name]: `${attribute.value}${
              attribute.viewVisible ? (isVisible ? " visible" : "") : ""
            }`,
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

import React from "react";

type IntersectionTrackerProps = {
  children: React.ReactNode;
  root?: Element | null;
  threshold?: number;
  rootMargin?: number[] | number | null;
  style?: React.CSSProperties;
  visibleContent?: boolean;
  onVisible?: () => void;
  intersectionDeley?: number;
};

const IntersectionTracker: React.FC<IntersectionTrackerProps> = ({
  children,
  root,
  threshold,
  rootMargin,
  style,
  visibleContent = false,
  onVisible,
  intersectionDeley,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const observableElement = React.useRef<HTMLDivElement | null>(null);
  const timeoutRef = React.useRef<
    number | ReturnType<typeof setTimeout> | null
  >(null);

  const marginString = rootMargin
    ? typeof rootMargin === "number"
      ? `${rootMargin}px ${rootMargin}px ${rootMargin}px ${rootMargin}px`
      : rootMargin.length === 2
      ? `${rootMargin[0]}px ${rootMargin[1]}px ${rootMargin[0]}px ${rootMargin[1]}px`
      : `${rootMargin[0]}px ${rootMargin[1]}px ${rootMargin[2]}px ${rootMargin[3]}px`
    : "";

  const callback = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      setIsVisible(entry.isIntersecting);
    });
  };

  const options = {
    root,
    threshold,
    rootMargin: marginString,
  };

  React.useEffect(() => {
    const observer = new IntersectionObserver(callback, options);

    if (observableElement.current) {
      observer.observe(observableElement.current);
    }

    return () => {
      if (observableElement.current) {
        observer.unobserve(observableElement.current);
      }
    };
  }, [root, threshold, rootMargin]);

  React.useEffect(() => {
    if (intersectionDeley) {
      timeoutRef.current = setTimeout(() => {
        if (isVisible && onVisible) {
          onVisible();
        }
      }, intersectionDeley);
    } else {
      if (isVisible && onVisible) {
        onVisible();
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div ref={observableElement} style={style}>
      {visibleContent ? children : isVisible && children}
    </div>
  );
};
export default IntersectionTracker;

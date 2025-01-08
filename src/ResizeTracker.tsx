import React from "react";
import { ResizeTrackerType } from "./types";

const ResizeTracker: React.FC<ResizeTrackerType> = ({
  measure = "inner",
  style,
  onResize,
  children,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = containerRef.current;
    const parentElement = element?.parentElement;

    if (!element) return;

    const updateDimensions = (width: number, height: number) => {
      setDimensions({ width, height });
      onResize && onResize(width, height);
    };

    const observeElement = (target: Element) => {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          updateDimensions(width, height);
        }
      });
      resizeObserver.observe(target);
      return resizeObserver;
    };

    const resizeObservers: ResizeObserver[] = [];

    if (measure === "outer" && parentElement) {
      resizeObservers.push(observeElement(parentElement));
    } else if (measure === "inner") {
      resizeObservers.push(observeElement(element));
    } else if (measure === "all" && parentElement) {
      resizeObservers.push(
        observeElement(element),
        observeElement(parentElement)
      );
    }

    return () => {
      resizeObservers.forEach((observer) => observer.disconnect());
    };
  }, [measure, onResize]);

  // Styles
  const outer = {
    minWidth: "100%",
    minHeight: "100%",
  };

  const inner = {
    width: "max-content",
    height: "max-content",
  };

  const measureStyles = {
    inner: { ...inner },
    outer: { ...outer },
    all: { ...outer, ...inner },
  };

  return (
    <div
      className="resizeTracker"
      ref={containerRef}
      style={{
        ...measureStyles[measure],
        ...style,
      }}
    >
      {children(dimensions.width, dimensions.height)}
    </div>
  );
};

export default ResizeTracker;

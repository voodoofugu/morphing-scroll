import React from "react";
import { ResizeTrackerT } from "./types";

const ResizeTracker: React.FC<ResizeTrackerT> = ({
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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;

        setDimensions({ width, height });
        onResize && onResize(width, height);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
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

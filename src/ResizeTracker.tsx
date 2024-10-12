import React from "react";
import { ResizeTrackerType } from "./types";

const ResizeTracker: React.FC<ResizeTrackerType> = ({
  children,
  onResize,
  style,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = containerRef.current;
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
  }, [onResize]);

  return (
    <div
      className="resizeTracker"
      ref={containerRef}
      style={{
        width: "max-content",
        height: "max-content",
        ...style,
      }}
    >
      {children(dimensions.width, dimensions.height)}
    </div>
  );
};

export default ResizeTracker;

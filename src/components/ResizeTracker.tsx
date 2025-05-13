/* eslint-disable react/no-unknown-property */
import React from "react";
import { ResizeTrackerT } from "../types/types";

const ResizeTracker: React.FC<ResizeTrackerT> = ({
  className,
  children,
  style,
  measure = "inner",
  onResize,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onResize && onResize(entry.contentRect);
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
      resize-tracker=""
      className={className}
      ref={containerRef}
      style={{
        ...measureStyles[measure],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default ResizeTracker;

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
    width: "100%",
    height: "100%",
  };

  const inner = {
    width: "max-content",
    height: "max-content",
  };

  const measureStyles = {
    inner: { ...inner },
    outer: { ...outer },
    all: { minWidth: "100%", minHeight: "100%", ...inner },
  };

  return (
    <div
      resize-tracker=""
      className={className}
      ref={containerRef}
      style={{
        willChange: "width, height",
        ...measureStyles[measure],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

ResizeTracker.displayName = "ResizeTracker";
export default ResizeTracker;

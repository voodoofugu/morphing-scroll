import React from "react";
import type { ResizeTracker as ResizeTrackerProps } from "../types/types";
import useEvent from "../hooks/useEvent";
import stabilize from "../helpers/stabilize";

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***ResizeTracker***:
 * component that monitors changes to an element's size.
 * ### Props:
 * - `className`
 * - `children`
 * - `style`
 * - `measure`
 * - `onResize`
 *
 * [MDN Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
 * ### Links:
 * [ResizeTracker Documentation](https://www.npmjs.com/package/morphing-scroll)
 */
const ResizeTracker: React.FC<ResizeTrackerProps> = ({
  className,
  children,
  style,
  measure = "inner",
  onResize,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  /*
   * Наблюдатель переживает рендер. Раньше `onResize` стоял в зависимостях, и
   * колбэк, написанный прямо в пропсах, снимал наблюдение и заводил новое на
   * каждый рендер родителя — то есть ровно тогда, когда его пишут чаще всего.
   * Ссылка развязывает это: наблюдатель один, а зовёт он всегда свежий колбэк.
   */
  const resize = useEvent(onResize);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) resize(entry.contentRect);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, [resize]);

  // Styles
  const [styleST] = stabilize(style);

  const boxStyle = React.useMemo<React.CSSProperties>(() => {
    const outer = { width: "100%", height: "100%" };
    const inner = { width: "max-content", height: "max-content" };

    const measureStyles = {
      inner,
      outer,
      all: { minWidth: "100%", minHeight: "100%", ...inner },
    };

    return {
      willChange: "width, height",
      ...measureStyles[measure],
      ...style,
    };
  }, [measure, styleST]);

  return (
    <div
      resize-tracker=""
      className={className}
      ref={containerRef}
      style={boxStyle}
    >
      {children}
    </div>
  );
};

ResizeTracker.displayName = "ResizeTracker";
export default ResizeTracker;

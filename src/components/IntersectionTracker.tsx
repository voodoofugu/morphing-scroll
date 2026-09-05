import React from "react";
import type { IntersectionTracker as IntersectionTrackerProps } from "../types/types";
import argsFormatter from "../helpers/argsFormatter";
import useEvent from "../hooks/useEvent";
import stabilize from "../helpers/stabilize";

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***IntersectionTracker***:
 * component for tracking the intersection of an element with the viewport.
 *
 * A watcher, and nothing else: it always renders its children and never hides
 * them. Hiding by visibility is what `MorphScroll` does through `render`, and
 * it does it better — it counts positions instead of putting an observer on
 * every element.
 *
 * ### Props:
 * - `className`
 * - `children`
 * - `style`
 * - `root`
 * - `rootMargin`
 * - `threshold`
 * - `onIntersection`
 *
 * [MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 * ### Links:
 * [IntersectionTracker Documentation](https://www.npmjs.com/package/morphing-scroll)
 */
const IntersectionTracker: React.FC<IntersectionTrackerProps> = ({
  className,
  children,
  style,
  root,
  threshold,
  rootMargin,
  onIntersection,
}) => {
  const observableElement = React.useRef<HTMLDivElement | null>(null);

  /*
   * Значения сравниваем по содержимому, а не по ссылке: `threshold={[0, 1]}`
   * написанный прямо в пропсах — новый массив на каждый рендер, и наблюдатель
   * пересоздавался бы, хотя просят у него ровно то же самое.
   */
  const [thresholdST, styleST] = stabilize(threshold, style);

  const rootMarginStr = React.useMemo(() => {
    if (!rootMargin) return "";

    const margin = argsFormatter(rootMargin);
    return `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`;
  }, [rootMargin]);

  // колбэк живёт в ссылке — наблюдателю незачем знать, что он поменялся
  const report = useEvent(onIntersection);

  const thresholdRef = React.useRef(threshold);
  thresholdRef.current = threshold;

  React.useEffect(() => {
    const element = observableElement.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        report({
          time: entry.time,
          rootBounds: entry.rootBounds,
          boundingClientRect: entry.boundingClientRect,
          intersectionRect: entry.intersectionRect,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          target: entry.target,
        } as IntersectionObserverEntry);
      },
      { root, threshold: thresholdRef.current, rootMargin: rootMarginStr },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [report, root, thresholdST, rootMarginStr]);

  const boxStyle = React.useMemo(() => style, [styleST]);

  return (
    <div
      intersection-tracker=""
      className={className}
      ref={observableElement}
      style={boxStyle}
    >
      {children}
    </div>
  );
};

IntersectionTracker.displayName = "IntersectionTracker";
export default IntersectionTracker;

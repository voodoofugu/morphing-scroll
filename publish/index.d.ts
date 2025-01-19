import React from "react";

type ResizeTrackerType = {
  children: (width: number, height: number) => React.ReactNode;
  onResize?: (width: number, height: number) => void;
  style?: React.CSSProperties;
};

type IntersectionTrackerType = {
  children: React.ReactNode;
  root?: Element | null;
  threshold?: number;
  rootMargin?: number[] | number | null;
  style?: React.CSSProperties;
  visibleContent?: boolean;
  onVisible?: () => void;
  intersectionDeley?: number;
};

type AlignT = "start" | "center" | "end";
type ScrollType = {
  type?: "scroll" | "slider";
  size?: number[];
  objectsSize: (number | "none" | "firstChild")[];
  scrollID?: string;
  className?: string;
  gap?: number[] | number;
  padding?: number[] | number;
  xDirection?: boolean;
  elementsAlign?: AlignT;
  contentAlign?: [AlignT, AlignT];
  progressReverse?: boolean;
  progressTrigger?: Array<
    "wheel" | "progressElement" | "content" | "arrows" | "loopedArrows"
  >;
  progressVisibility?: "visible" | "hover" | "hidden";
  scrollTop?: number | "end";
  lazyRender?: boolean;
  infiniteScroll?: boolean | "freezeOnScroll";
  rootMargin?: number[] | number;
  suspending?: boolean;
  fallback?: React.ReactNode;
  progressElement?: boolean | React.ReactNode | "none";
  edgeGradient?: boolean | { color?: string; size?: number };
  arrows?: {
    size?: number;
    className?: string;
    element?: React.ReactNode;
  };
  objectsBoxFullMinSize?: boolean;
  onScrollValue?: Array<(scroll: number) => boolean>;
  children?: React.ReactNode;
  pixelsForSwipe?: number;
  progressBarSize?: number;
  duration?: number;
  isScrolling?: (status: boolean) => void;
};

declare const ResizeTracker: React.FC<ResizeTrackerType>;
declare const IntersectionTracker: React.FC<IntersectionTrackerType>;

/**
 * `Scroll` component.
 * @param scrollID - Optional: Scroll ID.
 * @param type - Optional: Change type of progress element. By default "scroll".
 * @param className - Optional: Add class name to scroll.
 * @param size - Optional: Scroll width and height.
 * @param objectsSize - Optional: Cell width and height for each transmitted object.
 * @param xDirection - Optional: Direction of horizontal scrolling.
 * @param gap - Optional: Gap between cells.
 * @param padding - Optional: Objects Wrapper padding.
 * @param progressReverse - Optional: Reverse progress bar (scroll / slider).
 * @param progressTrigger - Optional: Array of trigger elements for progress bar.
 * @param progressVisibility - Optional: Hide or show progress bar.
 * @param scrollTop - Optional: Initial scroll position.
 * @param lazyRender - Optional: Enable objects rendering when they are in the viewport.
 * @param infiniteScroll - Optional: Enable objects and objects wrapper rendering when they are in the viewport.
 * @param rootMargin - Optional: Expand objects Wrapper margin for objects rendering.
 * @param suspending - Optional: Add React Suspense.
 * @param fallback - Optional: Add Fallback element.
 * @param progressElement - Optional: Add custom progress element (scroll / slider).
 * @param edgeGradient - Optional: Enable edge gradient then objects Wrapper is outside the Scroll. You can add gradient color and size. By default color: "rgba(0,0,0,0.4)", size: 40.
 * @param objectsBoxFullMinSize - Optional: Objects Wrapper gets min-height equal to the Scroll height.
 * @param onScrollValue - Optional: Add callback for scroll value.
 * @example `onScrollValue={[
    (scroll) => scroll > 200 && console.log("scroll > 200"),
  ]}`
 * @param children - Optional: React children elements.
 * @param pixelsForSwipe - Optional: Number of pixels for swipe. !!!
 * @returns React component.
 * @see {@link https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-scroll Documentation}
 */

declare const Scroll: React.FC<ScrollType>;

export { Scroll, ResizeTracker, IntersectionTracker };

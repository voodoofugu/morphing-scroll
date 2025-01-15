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

type progressTriggerT =
  | "wheel"
  | "progressElement"
  | "content"
  | "contentSlider"
  | "arrows"
  | "loopedArrows";
type AlignT = "start" | "center" | "end";
type ScrollType = {
  scrollID?: string;
  className?: string;
  scrollXY?: number[];
  objectXY?: number[];
  gap?: number[] | number;
  padding?: number[] | number;
  xDirection?: boolean;
  elementsAlign?: AlignT;
  contentAlign?: [AlignT, AlignT];
  progressReverse?: boolean;
  progressTrigger?: Array<progressTriggerT>;
  progressVisibility?: "visible" | "hover" | "hidden";
  scrollTop?: number | "end";
  sliderType?: boolean;
  lazyRender?: boolean;
  infiniteScroll?: boolean;
  rootMargin?: number[] | number;
  suspending?: boolean;
  fallback?: React.ReactNode;
  thumbElement?: React.ReactNode;
  edgeGradient?: boolean | { color?: string; size?: number };
  arrows?: {
    size?: number;
    className?: string;
    element?: React.ReactNode;
  };
  objectsWrapperMinSize?: number;
  onScrollValue?: Array<[(scrollTop: number) => boolean, () => void]>;
  children?: React.ReactNode;
  pixelsForSwipe?: number;
  progressBarSize?: number;
  duration?: number;
};

declare const ResizeTracker: React.FC<ResizeTrackerType>;
declare const IntersectionTracker: React.FC<IntersectionTrackerType>;

/**
 * `Scroll` component.
 * @param scrollID - Optional: Scroll ID.
 * @param className - Optional: Scroll class name.
 * @param size - Optional: Scroll size.
 * @example `<Scroll size={[100, 100]} />`
 * @param objectsSize - Optional: Cell size for each transmitted object.
 * @param xDirection - Optional: Direction of horizontal scrolling.
 * @param gap - Optional: Gap between cells.
 * @param padding - Optional: Objects Wrapper padding.
 * @param progressReverse - Optional: Reverse progress bar (scrollBar or slider).
 * @param children - Optional: React children elements.
 * @returns React component.
 * @see {@link https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-scroll Documentation}
 */

declare const Scroll: React.FC<ScrollType>;

export { Scroll, ResizeTracker, IntersectionTracker };

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
type progressTriggerOptions =
  | "wheel"
  | "progressElement"
  | "content"
  | "contentSlider"
  | "arrows"
  | "loopedArrows";
type MorphingScrollType = {
  scrollID?: string;
  className?: string;
  scrollXY?: number[];
  objectXY?: number[];
  gap?: number[] | number;
  padding?: number[] | number;
  xDirection?: boolean;
  contentAlignCenter?: boolean;
  wrapAlignCenter?: boolean;
  progressReverse?: boolean;
  progressTrigger?: Array<progressTriggerOptions> | progressTriggerOptions;
  progressVisibility?: "visible" | "hover" | "hidden";
  scrollTop?: number | "end";
  sliderType?: boolean;
  lazyRender?: boolean;
  infiniteScroll?: boolean;
  rootMargin?: number[] | number;
  suspending?: boolean;
  fallback?: React.ReactNode;
  thumbElement?: React.ReactNode;
  edgeGradient?:
    | boolean
    | {
        color?: string;
        size?: number;
      };
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
declare const MorphingScroll: React.FC<MorphingScrollType>;

export default MorphingScroll;
export { IntersectionTracker, ResizeTracker };

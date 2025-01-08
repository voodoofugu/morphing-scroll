import React from "react";

export type ResizeTrackerType = {
  measure?: "inner" | "outer" | "all";
  style?: React.CSSProperties;
  onResize?: (width: number, height: number) => void;
  children: (width: number, height: number) => React.ReactNode;
};

export type IntersectionTrackerType = {
  children: React.ReactNode;
  root?: Element | null;
  threshold?: number;
  rootMargin?: number[] | number | null;
  style?: React.CSSProperties;
  visibleContent?: boolean;
  onVisible?: () => void;
  intersectionDeley?: number;
};

export type progressTriggerT =
  | "wheel"
  | "progressElement"
  | "content"
  | "contentSlider"
  | "arrows"
  | "loopedArrows";

type AlignT = "start" | "center" | "end";

export type ScrollType = {
  scrollXY: number[] | "auto";
  objectXY: number[] | "auto";

  scrollID?: string; // This is only used to better recognize warnings
  className?: string;

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
  onScrollValue?: Array<(scroll: number) => boolean>;
  children?: React.ReactNode;

  pixelsForSwipe?: number;
  progressBarSize?: number;
  duration?: number;

  isScrolling?: (status: boolean) => void;
  renderOnScroll?: boolean;
};

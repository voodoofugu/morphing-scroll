import React from "react";

export type ResizeTrackerType = {
  children: (width: number, height: number) => React.ReactNode;
  onResize?: (width: number, height: number) => void;
  style?: React.CSSProperties;
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
  scrollID?: string; // This is only used to better recognize warnings
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

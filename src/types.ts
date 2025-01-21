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

type AlignT = "start" | "center" | "end";

export type ScrollType = {
  type?: "scroll" | "slider"; // "progress"

  size?: number[];
  objectsSize: (number | "none" | "firstChild")[];

  scrollID?: string; // This is only used to better recognize warnings
  className?: string;

  gap?: number[] | number;
  padding?: number[] | number;

  direction?: "x" | "y";
  elementsAlign?: AlignT;
  contentAlign?: [AlignT, AlignT];

  progressReverse?: boolean;
  progressTrigger?: {
    wheel?: boolean;
    progressElement?: boolean;
    content?: boolean;
    arrows?:
      | boolean
      | { size?: number; element?: React.ReactNode; looped?: boolean };
  };
  progressVisibility?: "visible" | "hover" | "hidden";
  scrollTop?: { value: number | "end"; duration?: number };

  lazyRender?: boolean;
  infiniteScroll?: boolean;
  rootMargin?: number[] | number;
  suspending?: boolean;

  fallback?: React.ReactNode;
  progressElement?: boolean | React.ReactNode | "none";
  edgeGradient?: boolean | { color?: string; size?: number };
  arrows?: {
    element?: React.ReactNode;
    size?: number;
  };

  objectsWrapFullMinSize?: boolean;
  onScrollValue?: Array<(scroll: number) => boolean>;
  children?: React.ReactNode;

  isScrolling?: (status: boolean) => void;
  stopLoadOnScroll?: boolean;
};
// progressTrigger contentSlider & arrows looped

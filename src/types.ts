import React from "react";

export type ResizeTrackerT = {
  measure?: "inner" | "outer" | "all";
  style?: React.CSSProperties;
  onResize?: (width: number, height: number) => void;
  children: (width: number, height: number) => React.ReactNode;
};

export type IntersectionTrackerT = {
  children: React.ReactNode;
  root?: Element | null;
  threshold?: number;
  rootMargin?: number[] | number | null;
  style?: React.CSSProperties;
  visibleContent?: boolean;
  onVisible?: () => void;
  intersectionDeley?: number;
};

export type MorphScrollT = {
  // General Settings
  scrollID?: string;
  className?: string;
  children?: React.ReactNode;

  // Scroll Settings
  type?: "scroll" | "slider";
  direction?: "x" | "y";
  scrollTop?: { value: number | "end"; duration?: number };
  stopLoadOnScroll?: boolean;
  onScrollValue?: Array<(scroll: number) => boolean>;
  isScrolling?: (status: boolean) => void;

  // Visual Settings
  size?: number[];
  objectsSize: (number | "none" | "firstChild")[];
  gap?: number[] | number;
  padding?: number[] | number;
  contentAlign?: ["start" | "center" | "end", "start" | "center" | "end"];
  elementsAlign?: "start" | "center" | "end";
  edgeGradient?: boolean | { color?: string; size?: number };
  objectsWrapFullMinSize?: boolean;

  // Progress and Rendering
  progressReverse?: boolean;
  progressVisibility?: "visible" | "hover" | "hidden";
  progressTrigger?: {
    wheel?: boolean;
    content?: boolean;
    progressElement?: boolean | React.ReactNode;
    arrows?: boolean | { size?: number; element?: React.ReactNode };
  };

  // Additional Settings
  lazyRender?: boolean;
  infiniteScroll?: boolean;
  rootMargin?: number[] | number;
  suspending?: boolean;
  fallback?: React.ReactNode;
};

// progressTrigger contentSlider & arrows looped

import React from "react";

export type ResizeTrackerT = {
  children: (width: number, height: number) => React.ReactNode;
  style?: React.CSSProperties;
  measure?: "inner" | "outer" | "all";
  onResize?: (width: number, height: number) => void;
};

export type IntersectionTrackerT = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  root?: Element | null;
  rootMargin?: number[] | number;
  threshold?: number;
  visibleContent?: boolean;
  onVisible?: () => void;
  intersectionDelay?: number;
};

export type MorphScrollT = {
  // General Settings
  className?: string;
  children?: React.ReactNode;

  // Scroll Settings
  type?: "scroll" | "slider";
  direction?: "x" | "y";
  scrollTop?: { value: number | "end"; duration?: number };
  stopLoadOnScroll?: boolean;
  onScrollValue?: (scroll: number) => void;
  isScrolling?: (motion: boolean) => void;

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

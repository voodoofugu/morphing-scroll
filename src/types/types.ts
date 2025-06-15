import React from "react";

export type ResizeTrackerT = {
  className?: string; // !
  children: React.ReactNode; // !
  style?: React.CSSProperties;
  measure?: "inner" | "outer" | "all";
  onResize?: (rect: Partial<DOMRectReadOnly>) => void;
};

export type IntersectionTrackerT = {
  className?: string; // !
  children: React.ReactNode;
  style?: React.CSSProperties;
  root?: Element | null;
  rootMargin?: number | number[];
  threshold?: number | number[];
  visibleContent?: boolean;
  onVisible?: (entry: IntersectionObserverEntry) => void; // !
};

export type MorphScrollT = {
  // General Settings
  className?: string;
  children?: React.ReactNode;

  // Scroll Settings
  type?: "scroll" | "slider" | "sliderMenu"; // morphType
  direction?: "x" | "y" | "hybrid"; // !
  scrollPosition?: {
    // !
    value: number | "end" | (number | "end")[]; // !
    duration?: number;
    updater?: boolean;
  };
  onScrollValue?: (left: number, top: number) => void;
  isScrolling?: (motion: boolean) => void;

  // Visual Settings
  size: number | number[] | "auto";
  objectsSize?:
    | number
    | "none"
    | "firstChild"
    | (number | "none" | "firstChild")[];
  crossCount?: number; // !
  gap?: number | number[];
  wrapperMargin?: number | number[];
  wrapperMinSize?: number | "full" | (number | "full")[];
  wrapperAlign?: "start" | "center" | "end" | ("start" | "center" | "end")[]; // !
  elementsAlign?: "start" | "center" | "end";
  elementsDirection?: "row" | "column"; // !
  edgeGradient?: boolean | { color?: string; size?: number }; // !

  // ProgressBar
  progressTrigger: {
    wheel?: boolean;
    content?: boolean;
    progressElement?: boolean | React.ReactNode | React.ReactNode[];
    arrows?: boolean | { size?: number; element?: React.ReactNode };
  };
  progressReverse?: boolean | boolean[]; // !
  scrollBarOnHover?: boolean;

  // Optimization
  render?: {
    type: "lazy" | "virtual";
    rootMargin?: number | number[];
    stopLoadOnScroll?: boolean;
  };
  emptyElements?: {
    mode: "clear" | "fallback" | { fallback: React.ReactNode };
    clickTrigger?: { selector: string; delay?: number };
  };
  suspending?: boolean;
  fallback?: React.ReactNode;
};

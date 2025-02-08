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
  scrollTop?: { value: number | "end"; duration?: number; updater?: boolean };
  stopLoadOnScroll?: boolean;
  onScrollValue?: (scroll: number) => void;
  isScrolling?: (motion: boolean) => boolean;

  // Visual Settings
  size?: number[];
  objectsSize: (number | "none" | "firstChild")[];
  gap?: number[] | number;
  padding?: number[] | number;
  contentAlign?: ["start" | "center" | "end", "start" | "center" | "end"];
  elementsAlign?: "start" | "center" | "end";
  edgeGradient?: boolean | { color?: string; size?: number };
  progressReverse?: boolean;
  progressVisibility?: "visible" | "hover" | "hidden";
  objectsWrapFullMinSize?: boolean;

  // Progress & Rendering
  progressTrigger?: {
    wheel?: boolean;
    content?: boolean;
    progressElement?: boolean | React.ReactNode;
    arrows?: boolean | { size?: number; element?: React.ReactNode };
  };
  render?:
    | { type: "default" }
    | { type: "lazy"; rootMargin?: number }
    | { type: "virtual" };
  emptyElements?:
    | { mode: "clear"; closeSelector?: string }
    | {
        mode: "fallback";
        closeSelector?: string;
        element?: React.ReactNode;
      };
  suspending?: boolean;
  fallback?: React.ReactNode;
};

// progressTrigger contentSlider & arrows looped

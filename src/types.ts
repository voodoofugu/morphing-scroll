import React from "react";

export type ResizeTrackerT = {
  children: (rect: DOMRectReadOnly) => React.ReactNode; // change!
  style?: React.CSSProperties;
  measure?: "inner" | "outer" | "all";
  onResize?: (rect: Partial<DOMRectReadOnly>) => void;
};

export type IntersectionTrackerT = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  root?: Element | null;
  rootMargin?: number[] | number;
  threshold?: number | number[];
  visibleContent?: boolean;
  onVisible?: (key: string) => void;
};

export type MorphScrollT = {
  // General Settings
  className?: string;
  children?: React.ReactNode;

  // Scroll Settings
  type?: "scroll" | "slider";
  direction?: "x" | "y" | "hybrid";
  scrollPosition?: {
    // !
    value: number | "end" | (number | "end")[]; // !
    duration?: number;
    updater?: boolean;
  };
  onScrollValue?: (left: number, top: number) => void;
  isScrolling?: (motion: boolean) => boolean;

  // Visual Settings
  size?: number[];
  crossCount?: number; // !
  objectsSize: (number | "none" | "firstChild")[];
  gap?: number[] | number;
  wrapperMargin?: number[] | number;
  wrapperMinSize?: number | "full" | (number | "full")[];
  wrapperAlign?: "start" | "center" | "end" | ("start" | "center" | "end")[]; // !
  elementsAlign?: "start" | "center" | "end";
  edgeGradient?: boolean | { color?: string; size?: number }; // !

  // ProgressBar & Rendering
  progressTrigger?: {
    wheel?: boolean; // default ?
    content?: boolean;
    progressElement?: boolean | React.ReactNode;
    arrows?: boolean | { size?: number; element?: React.ReactNode };
  };
  progressReverse?: boolean | boolean[]; // !
  progressVisibility?: "visible" | "hover" | "hidden";

  // optimization
  render?:
    | { type: "default" } // ?
    | {
        type: "lazy";
        rootMargin?: number | number[];
        onVisible?: (key: string) => void;
      }
    | { type: "virtual"; rootMargin?: number | number[] };
  emptyElements?:
    | { mode: "clear"; clickTrigger?: { selector: string; delay?: number } }
    | {
        mode: "fallback";
        element?: React.ReactNode;
        clickTrigger?: { selector: string; delay?: number };
      };
  suspending?: boolean;
  fallback?: React.ReactNode;
  stopLoadOnScroll?: boolean;
};

// progressTrigger contentSlider & arrows looped

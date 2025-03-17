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
};

// progressTrigger contentSlider & arrows looped

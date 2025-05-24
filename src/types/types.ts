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
  onClick?: React.MouseEventHandler<HTMLDivElement>; // !
  attribute?: { name: string; value: string; viewVisible?: boolean }; // !
};

export type MorphScrollT = {
  // General Settings
  className?: string;
  children?: React.ReactNode;

  // Scroll Settings
  type?: "scroll" | "slider" | "sliderMenu"; // morphType
  direction?: "x" | "y" | "hybridX" | "hybridY";
  scrollPosition?: {
    // !
    value: number | "end" | (number | "end")[]; // !
    duration?: number;
    updater?: boolean;
  };
  onScrollValue?: (left: number, top: number) => void;
  isScrolling?: (motion: boolean) => void;

  // Visual Settings
  size: number | number[] | "auto"; // может добавить одно число для одинакового размера, как и для objectsSize
  objectsSize:
    | number
    | "none"
    | "firstChild"
    | (number | "none" | "firstChild")[]; // parentSize?
  crossCount?: number; // !
  gap?: number[] | number;
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
  progressVisibility?: "visible" | "hover";

  // Optimization
  render?:
    | { type: "default" } // ?
    | {
        type: "lazy";
        rootMargin?: number | number[];
        onVisible?: (key: string) => void;
        stopLoadOnScroll?: boolean;
      }
    | {
        type: "virtual";
        rootMargin?: number | number[];
        // onVisible?: (key: string) => void; // ?
        stopLoadOnScroll?: boolean;
      };
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

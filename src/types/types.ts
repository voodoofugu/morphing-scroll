export type ResizeTrackerT = {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  measure?: "inner" | "outer" | "all";
  onResize?: (rect: Partial<DOMRectReadOnly>) => void;
};

export type IntersectionTrackerT = {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  root?: Element | null;
  rootMargin?: number | number[];
  threshold?: number | number[];
  visibleContent?: boolean;
  onIntersection?: (entry: IntersectionObserverEntry) => void;
};

export type MorphScrollT = {
  // General Settings
  className?: string;
  children?: React.ReactNode;

  // Scroll Settings
  type?: "scroll" | "slider" | "sliderMenu";
  direction?: "x" | "y" | "hybrid";
  scrollPosition?:
    | {
        value: number | "end" | (number | "end")[];
        duration?: number;
        updater?: boolean;
      }
    | number
    | "end"
    | (number | "end")[]; // !!! добавить возможность передачи не объекта
  onScrollValue?: (left: number, top: number) => void;
  isScrolling?: (motion: boolean) => void;

  // Visual Settings
  size: number | number[] | "auto";
  objectsSize?:
    | number
    | "size"
    | "firstChild"
    | "none"
    | (number | "size" | "firstChild" | "none")[];
  crossCount?: number;
  gap?: number | number[];
  wrapperMargin?: number | number[];
  wrapperMinSize?: number | "full" | (number | "full")[];
  wrapperAlign?: "start" | "center" | "end" | ("start" | "center" | "end")[];
  elementsAlign?: "start" | "center" | "end";
  elementsDirection?: "row" | "column";
  edgeGradient?: boolean | { color?: string; size?: number };

  // Progress Bar
  progressTrigger: {
    wheel?:
      | boolean
      | { changeDirection?: boolean; changeDirectionKey?: string };
    content?: boolean;
    progressElement?: boolean | React.ReactNode | React.ReactNode[];
    arrows?:
      | boolean
      | React.ReactNode
      | { size?: number; element?: React.ReactNode; contentReduce?: boolean }; // !!! contentReduce
  };
  progressReverse?: boolean | boolean[];
  scrollBarOnHover?: boolean;
  scrollBarEdge?: number | number[];
  thumbMinSize?: number;

  // Optimization
  render?:
    | "lazy"
    | "virtual"
    | {
        type: "lazy" | "virtual";
        rootMargin?: number | number[];
        stopLoadOnScroll?: boolean; // позже сократить до loadOnScroll
      };
  emptyElements?: {
    mode: "clear" | "fallback" | { fallback: React.ReactNode };
    clickTrigger?: { selector: string; delay?: number };
  };
  suspending?: boolean;
  fallback?: React.ReactNode;
};

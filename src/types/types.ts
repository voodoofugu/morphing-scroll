export type Vec2 = [x: number, y: number];
type Size = [width: number, height: number];
type Edges = [top: number, right: number, bottom: number, left: number];
type SpacingValue = number | Vec2 | Edges;
type Align = "start" | "center" | "end";

export type ResizeTracker = {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  measure?: "inner" | "outer" | "all";
  onResize?: (rect: Partial<DOMRectReadOnly>) => void;
};

export type IntersectionTracker = {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  root?: Element | null;
  rootMargin?: SpacingValue;
  threshold?: number | number[];
  visibleContent?: boolean;
  onIntersection?: (entry: IntersectionObserverEntry) => void;
};

export type MorphScroll = {
  // — General Settings —
  className?: string;
  children?: React.ReactNode;

  // — Scroll Settings —
  type?: "scroll" | "slider" | "sliderMenu";
  direction?: "x" | "y" | "hybrid";
  scrollPosition?:
    | null
    | number
    | "end"
    | (null | number | "end")[]
    | {
        value: null | number | "end" | (null | number | "end")[];
        duration?: number;
        updater?: boolean;
        // callback?: (left: number, top: number) => void; // ! это onScrollValue
      };
  onScrollValue?: (left: number, top: number) => void;
  isScrolling?: (motion: boolean) => void;

  // — Visual Settings —
  size: number | "auto" | Size;
  objectsSize?:
    | number
    | "size"
    | "firstChild"
    | "none"
    | (number | "size" | "firstChild" | "none")[];
  crossCount?: number;
  gap?: number | Vec2;
  wrapperMargin?: SpacingValue;
  wrapperMinSize?: number | "full" | (number | "full")[];
  wrapperAlign?: Align | [x: Align, y: Align];
  elementsAlign?: Align;
  elementsDirection?: "row" | "column";
  edgeGradient?: boolean | string | { color?: string; size?: number };
  progressTrigger?: {
    // TODO добавить "wheel" | "content" | "arrows"
    wheel?:
      | boolean
      | { changeDirection?: boolean; changeDirectionKey?: string };
    content?: boolean;
    progressElement?: boolean | React.ReactNode | React.ReactNode[];
    arrows?:
      | boolean
      | React.ReactNode
      | {
          element?: React.ReactNode;
          size?: number;
          contentReduce?: boolean;
          loop?: boolean;
        };
  };
  progressReverse?: boolean | boolean[];
  scrollBarOnHover?: boolean;
  scrollBarEdge?: number | Vec2;
  thumbMinSize?: number;

  // — Optimization —
  render?:
    | "lazy"
    | "virtual"
    | {
        type: "lazy" | "virtual";
        rootMargin?: SpacingValue;
        stopLoadOnScroll?: boolean;
        trackVisibility?: boolean;
      };
  emptyElements?:
    | "clear"
    | "fallback"
    | React.ReactNode
    | {
        mode: "clear" | "fallback" | { fallback: React.ReactNode };
        clickTrigger?: string | { selector: string; delay?: number };
      };
  suspending?: boolean;
  fallback?: React.ReactNode;

  // — Additional —
  dragScroll?: boolean;
};

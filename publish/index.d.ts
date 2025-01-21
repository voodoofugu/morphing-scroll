import React from "react";

type ResizeTrackerType = {
  children: (width: number, height: number) => React.ReactNode;
  onResize?: (width: number, height: number) => void;
  style?: React.CSSProperties;
};

type IntersectionTrackerType = {
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
type ScrollType = {
  type?: "scroll" | "slider";
  size?: number[];
  objectsSize: (number | "none" | "firstChild")[];
  scrollID?: string;
  className?: string;
  gap?: number[] | number;
  padding?: number[] | number;
  direction?: boolean;
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
  infiniteScroll?: boolean | "freezeOnScroll";
  rootMargin?: number[] | number;
  suspending?: boolean;
  fallback?: React.ReactNode;
  progressElement?: boolean | React.ReactNode | "none";
  edgeGradient?: boolean | { color?: string; size?: number };
  objectsWrapFullMinSize?: boolean;
  onScrollValue?: Array<(scroll: number) => boolean>;
  children?: React.ReactNode;
  isScrolling?: (status: boolean) => void;
};

declare const ResizeTracker: React.FC<ResizeTrackerType>;
declare const IntersectionTracker: React.FC<IntersectionTrackerType>;

/**
 * `Scroll` component.
 *
 * ### General Settings
 * @param scrollID - *(string | undefined)* Scroll identifier.
 * @param className - *(string | undefined)* Additional CSS class for the component.
 * @param children - *(React.ReactNode)* Child elements.
 *
 * ### Scroll Settings
 * @param type - *(string)* Type of progress element. Default: `"scroll"`.
 * @param direction - *(boolean | undefined)* Scrolling direction.
 * @param scrollTop - *(number | "end" | undefined)* Scroll position and animation duration.
 * @param onScrollValue - *(Array<(scroll: number) => boolean> | undefined)* Callback for scroll value.
 * @example
 * `onScrollValue={[
 *   (scroll) => scroll > 200 && console.log("scroll > 200"),
 * ]}`
 * @param isScrolling - *(function | undefined)* Callback for scroll status.
 * @example
 * `isScrolling={(value) => console.log(value)}`
 *
 * ### Visual Settings
 * @param size - *(number[] | undefined)* Scroll width and height.
 * @param objectsSize - *(Array<number | "none" | "firstChild">)* Size of cells for each object.
 * @param gap - *(number | number[] | undefined)* Gap between cells.
 * @param padding - *(number | number[] | undefined)* Padding for the objects wrapper.
 * @param edgeGradient - *(boolean | { color?: string; size?: number } | undefined)* Edge gradient. Default: `{ color: "rgba(0,0,0,0.4)", size: 40 }`.
 *
 * ### Progress and Rendering
 * @param progressReverse - *(boolean | undefined)* Reverse the progress bar direction.
 * @param progressTrigger - *(Array<string> | undefined)* Triggers for the progress bar. Default: `{ wheel: true }`.
 * @param progressVisibility - *(string | undefined)* Visibility of the progress bar.
 *
 * ### Additional Settings
 * @param lazyRender - *(boolean | undefined)* Lazy rendering of objects.
 * @param infiniteScroll - *(boolean | "freezeOnScroll" | undefined)* Infinite scrolling.
 * @param rootMargin - *(number | number[] | undefined)* Margin expansion for object rendering.
 * @param suspending - *(boolean | undefined)* Adds React Suspense.
 * @param fallback - *(React.ReactNode | undefined)* Fallback element for error handling.
 *
 * @returns React component.
 * @see [Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-scroll)
 */

declare const Scroll: React.FC<ScrollType>;

export { Scroll, ResizeTracker, IntersectionTracker };

import React from "react";

type ResizeTrackerT = {
  measure?: "inner" | "outer" | "all";
  style?: React.CSSProperties;
  onResize?: (width: number, height: number) => void;
  children: (width: number, height: number) => React.ReactNode;
};

declare const ResizeTracker: React.FC<ResizeTrackerT>;

type IntersectionTrackerT = {
  children: React.ReactNode;
  root?: Element | null;
  threshold?: number;
  rootMargin?: number[] | number | null;
  style?: React.CSSProperties;
  visibleContent?: boolean;
  onVisible?: () => void;
  intersectionDeley?: number;
};

declare const IntersectionTracker: React.FC<IntersectionTrackerT>;

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

/**
 * `MorphScroll` component.
 *
 * ### General Settings
 * @param scrollID - Optional: Scroll identifier.
 * @param className - Optional: Additional CSS class for the component.
 * @param children - Optional: Child elements.
 *
 * ### Scroll Settings
 * @param type - Optional: Type of progress element. Default: `"scroll"`.
 * @param direction - Optional: Scrolling direction.
 * @param scrollTop - Optional: Scroll position and animation duration.
 * @param stopLoadOnScroll - Optional: Stop loading when scrolling.
 * @param onScrollValue - Optional: Callback for scroll value.
 * @example
 * `onScrollValue={[
 *   (scroll) => scroll > 200 && console.log("scroll > 200"),
 * ]}`
 * @param isScrolling - Optional: Callback for scroll status.
 * @example
 * `isScrolling={(value) => console.log(value)}`
 *
 * ### Visual Settings
 * @param size - Optional: Scroll width and height.
 * @param objectsSize - Required: Size of cells for each object.
 * @param gap - Optional: Gap between cells.
 * @param padding - Optional: Padding for the `objectsWrapper`.
 * @param contentAlign - Optional: Aligns the content when it is smaller than the MorphScroll `size`.
 * @param elementsAlign - Optional: Aligns the objects within the `objectsWrapper`.
 * @param edgeGradient - Optional: Edge gradient. Default: `{ color: "rgba(0,0,0,0.4)", size: 40 }`.
 * @param objectsWrapFullMinSize - Optional: Sets the `min-height` of the `objectsWrapper` to match the height of the MorphScroll.
 *
 * ### Progress and Rendering
 * @param progressReverse - Optional: Reverse the progress bar direction.
 * @param progressVisibility - Optional: Visibility of the progress bar.
 * @param progressTrigger - Optional: Triggers for the progress bar. Default: `{ wheel: true }`.
 * @example
 * `progressTrigger={
 *   wheel: true,
 *   content: true,
 *   progressElement: `true/false` or <YourProgressComponent/>
 *   arrows: true or { size: number, element: <YourArrowComponent/> }
 * }`
 *
 * ### Additional Settings
 * @param lazyRender - Optional: Lazy rendering of objects.
 * @param infiniteScroll - Optional: Infinite scrolling.
 * @param rootMargin - Optional: Margin expansion for object rendering.
 * @param suspending - Optional: Adds React Suspense.
 * @param fallback - Optional: Fallback element for error handling.
 *
 * @returns React component.
 * @see [Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-scroll)
 */

declare const MorphScroll: React.FC<MorphScrollT>;

export { MorphScroll, ResizeTracker, IntersectionTracker };

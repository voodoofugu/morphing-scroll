import React from "react";

// RESIZE_TRACKER //////////////////////////////////
type ResizeTrackerT = {
  measure?: "inner" | "outer" | "all";
  style?: React.CSSProperties;
  onResize?: (width: number, height: number) => void;
  children: (width: number, height: number) => React.ReactNode;
};

declare const ResizeTracker: React.FC<ResizeTrackerT>;

// INTERSECTION_TRACKER ////////////////////////////
type IntersectionTrackerT = {
  /**
   * Inline styles for the IntersectionTracker component.
   */
  style?: React.CSSProperties;
  /**
   * The root element for IntersectionObserver.
   * @default viewport
   */
  root?: Element | null;
  /**
   * Child elements to be rendered when visible.
   */
  children: React.ReactNode;
  /**
   * Visibility threshold for triggering intersection events.
   * A value between 0.0 (out of view) and 1.0 (fully visible).
   */
  threshold?: number;
  /**
   * Margin around the root.
   * Can be a single number or an array of up to 4 numbers (top, right, bottom, left).
   */
  rootMargin?: number[] | number;
  /**
   * Renders children regardless of their visibility in the viewport.
   * @default false
   */
  visibleContent?: boolean;
  /**
   * Callback function triggered when `children` become visible.
   */
  onVisible?: () => void;
  /**
   * Delay (in ms) before invoking `onVisible`.
   */
  intersectionDeley?: number;
};

/**
 * ## IntersectionTracker component〈♦〉
 *
 * ### General Settings
 * @param children- `Required`
 *
 * ### Other
 * @returns React component.
 *
 * ### Links
 * @see [Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 */

declare const IntersectionTracker: React.FC<IntersectionTrackerT>;

// MORPH_SCROLL ////////////////////////////////////
export type MorphScrollT = {
  /**
   * Scroll identifier.
   */
  scrollID?: string;
  /**
   * Additional class for the component.
   */
  className?: string;
  /**
   * Child elements.
   */
  children?: React.ReactNode;

  /**
   * Type of progress element.
   * @default "scroll"
   */
  type?: "scroll" | "slider";
  /**
   * Scroll position and animation duration.
   */
  scrollTop?: { value: number | "end"; duration?: number };
  /**
   * Stop loading when scrolling.
   */
  stopLoadOnScroll?: boolean;
  /**
   * Callback for scroll value.
   * @example
   * `onScrollValue={[
   *   (scroll) => scroll > 200 && console.log("scroll > 200")
   * ]}`
   */
  onScrollValue?: Array<(scroll: number) => boolean>;
  /**
   * Callback for scroll status.
   * @example
   * `isScrolling={(value) => console.log(value)}`
   */
  isScrolling?: (status: boolean) => void;

  /**
   * Scroll width and height.
   */
  size?: number[];
  /**
   * Required: Size of cells for each object.
   */
  objectsSize: (number | "none" | "firstChild")[];
  /**
   * Gap between cells.
   */
  gap?: number[] | number;
  /**
   * Padding for the `objectsWrapper`.
   */
  padding?: number[] | number;
  /**
   * Scrolling direction.
   */
  direction?: "x" | "y";
  /**
   * Aligns the content when it is smaller than the MorphScroll `size`.
   */
  contentAlign?: ["start" | "center" | "end", "start" | "center" | "end"];
  /**
   * Aligns the objects within the `objectsWrapper`.
   */
  elementsAlign?: "start" | "center" | "end";
  /**
   * Edge gradient.
   * @default { color: "rgba(0,0,0,0.4)", size: 40 }
   */
  edgeGradient?: boolean | { color?: string; size?: number };
  /**
   * Reverse the progress bar direction.
   */
  progressReverse?: boolean;
  /**
   * Visibility of the progress bar.
   */
  progressVisibility?: "visible" | "hover" | "hidden";
  /**
   * Sets the `min-height` of the `objectsWrapper` to match the height of the MorphScroll.
   */
  objectsWrapFullMinSize?: boolean;

  /**
   * Triggers for the progress bar.
   * @default { wheel: true }
   * @example
   * `progressTrigger={
   *   wheel: true,
   *   content: true,
   *   progressElement: `true/false` or <YourProgressComponent/>,
   *   arrows: true or { size: number, element: <YourArrowComponent/> }
   * }`
   */
  progressTrigger?: {
    wheel?: boolean;
    content?: boolean;
    progressElement?: boolean | React.ReactNode;
    arrows?: boolean | { size?: number; element?: React.ReactNode };
  };
  /**
   * Lazy rendering of objects.
   */
  lazyRender?: boolean;
  /**
   * Infinite scrolling.
   */
  infiniteScroll?: boolean;
  /**
   * Margin expansion for object rendering.
   */
  rootMargin?: number[] | number;
  /**
   * Adds React Suspense.
   */
  suspending?: boolean;
  /**
   * Fallback element for error handling.
   */
  fallback?: React.ReactNode;
};

/**
 * ## MorphScroll component〈♦〉
 *
 * ### General Settings
 * @param scrollID
 * @param className
 * @param children
 *
 * ### Scroll Settings
 * @param type
 * @param scrollTop
 * @param stopLoadOnScroll
 * @param onScrollValue
 * @param isScrolling
 *
 * ### Visual Settings
 * @param size
 * @param objectsSize - `Required`
 * @param gap
 * @param padding
 * @param direction
 * @param contentAlign
 * @param elementsAlign
 * @param edgeGradient
 * @param progressReverse
 * @param progressVisibility
 * @param objectsWrapFullMinSize
 *
 * ### Progress and Rendering
 * @param progressTrigger
 * @param lazyRender
 * @param infiniteScroll
 * @param rootMargin
 * @param suspending
 * @param fallback
 *
 * ### Other
 * @returns React component.
 *
 * ### Links
 * @see [Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-scroll)
 */
declare const MorphScroll: React.FC<MorphScrollT>;

export { MorphScroll, ResizeTracker, IntersectionTracker };

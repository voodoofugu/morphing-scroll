import React from "react";

// RESIZE_TRACKER //////////////////////////////////
type ResizeTrackerT = {
  /**---
   * ✨ *Render-prop function receiving the container's size.*
   *
   * @param width - Current width in pixels.
   * @param height - Current height in pixels.
   * @example
   * ```tsx
   * <ResizeTracker>
   *   {(width, height) => <div>{`${width}x${height}`}</div>}
   * </ResizeTracker>
   * ```
   * */
  children: (width: number, height: number) => React.ReactNode;
  /**---
   * ✨ *Custom inline styles for the ResizeTracker.*
   */
  style?: React.CSSProperties;
  /**---
   * ✨ *Defines size measurement behavior*
   * #### Options:
   * - `"inner"`: Fits content.
   * - `"outer"`: Fills parent.
   * - `"all"`: Combines both.
   *
   * @default-"inner"
   */
  measure?: "inner" | "outer" | "all";
  /**---
   * ✨ *Callback on dimension change.*
   *
   * @param width - Updated width (in px).
   * @param height - Updated height (in px).
   * @example
   * ```typescript
   * onResize={(width, height) => console.log(`New size: ${width}x${height}`)}
   * ```
   */
  onResize?: (width: number, height: number) => void;
};

/**
 * ## *ResizeTracker component*〈♦〉
 *
 * ---
 * ## PROPS:
 * - `children` *◄ REQUIRED ►*
 * - `style`
 * - `measure`
 * - `onResize`
 * ##### ! MORE DETAILS IN PROPS OR LINKS !
 *
 * ---
 * ## RETURNS:
 * React component.
 *
 * ---
 * ## LINKS:
 * [ResizeTracker Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 *
 * [MDN Reference for Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
 */
declare const ResizeTracker: React.FC<ResizeTrackerT>;

// INTERSECTION_TRACKER ////////////////////////////
type IntersectionTrackerT = {
  /**---
   * ✨ *Child elements to be rendered when visible.*
   */
  children: React.ReactNode;
  /**---
   * ✨ *Custom inline styles for the IntersectionTracker component.*
   */
  style?: React.CSSProperties;
  /**---
   * ✨ *The root element for IntersectionObserver.*
   * @default-viewport
   */
  root?: Element | null;
  /**---
   * ✨ *Margin around the root.
   * Can be a single number or an array of up to 4 numbers (top, right, bottom, left).*
   */
  rootMargin?: number[] | number;
  /**---
   * ✨ Visibility threshold for triggering intersection events.
   * A value between 0.0 (out of view) and 1.0 (fully visible).
   */
  threshold?: number;
  /**---
   * ✨ Renders children regardless of their visibility in the viewport.
   * @default-false
   */
  visibleContent?: boolean;
  /**---
   * ✨ Callback function triggered when `children` become visible.
   */
  onVisible?: () => void;
  /**---
   * ✨ Delay (in ms) before invoking `onVisible`.
   */
  intersectionDelay?: number;
};

/**
 * ## *IntersectionTracker component*〈♦〉
 *
 * ---
 * ## PROPS:
 * - `children` *◄ REQUIRED ►*
 * - `style`
 * - `root`
 * - `rootMargin`
 * - `threshold`
 * - `visibleContent`
 * - `onVisible`
 * - `intersectionDelay`
 * ##### ! MORE DETAILS IN PROPS OR LINKS !
 *
 * ---
 * ## RETURNS:
 * React component.
 *
 * ---
 * ## LINKS:
 * [IntersectionTracker Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 *
 * [MDN Reference for Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 */
declare const IntersectionTracker: React.FC<IntersectionTrackerT>;

// MORPH_SCROLL ////////////////////////////////////
export type MorphScrollT = {
  /**---
   * ✨ *Additional class for the component.*
   */
  className?: string;
  /**---
   * ✨ *Child elements.*
   */
  children?: React.ReactNode;
  /**---
   * ✨ *Type of progress element.*
   * @default-"scroll"
   */
  type?: "scroll" | "slider";
  /**---
   * ✨ *Scrolling direction.*
   * @default-"y"
   */
  direction?: "x" | "y";
  /**---
   * ✨ *Scroll position and animation duration.*
   */
  scrollTop?: {
    value: number | "end" | null;
    duration?: number;
    updater?: boolean;
  };
  /**---
   * ✨ *Stop loading when scrolling.*
   * @default-false
   */
  stopLoadOnScroll?: boolean;
  /**---
   * ✨ *Callback for scroll value.*
   * @example
   * `onScrollValue={
   *   (scroll) => scroll > 200 && console.log("scroll > 200")
   * }`
   */
  onScrollValue?: (scroll: number) => void;
  /**---
   * ✨ *Callback for scroll status.*
   * @example `isScrolling={(value) => console.log(value)}`
   */
  isScrolling?: (motion: boolean) => void;
  /**---
   * ✨ *MorphScroll width and height.*
   */
  size?: number[];
  /**---
   * ✨ *Required: Size of cells for each object.*
   */
  objectsSize: (number | "none" | "firstChild")[];
  /**---
   * ✨ *Gap between cells.*
   */
  gap?: number[] | number;
  /**---
   * ✨ *Padding for the `objectsWrapper`.*
   */
  padding?: number[] | number;
  /**---
   * ✨ *Aligns the content when it is smaller than the MorphScroll `size`.*
   */
  contentAlign?: ["start" | "center" | "end", "start" | "center" | "end"];
  /**---
   * ✨ *Aligns the objects within the `objectsWrapper`.*
   */
  elementsAlign?: "start" | "center" | "end";
  /**---
   * ✨ *Edge gradient.*
   * @default if true { color: "rgba(0,0,0,0.4)", size: 40 }
   */
  edgeGradient?: boolean | { color?: string; size?: number };
  /**---
   * ✨ *Reverse the progress bar direction.*
   * @default false
   */
  progressReverse?: boolean;
  /**---
   * ✨ *Visibility of the progress bar.*
   * @default "visible"
   */
  progressVisibility?: "visible" | "hover" | "hidden";
  /**---
   * ✨ *Sets the `min-height` CSS property of the `objectsWrapper` to match the height of the MorphScroll.*
   */
  objectsWrapFullMinSize?: boolean;
  /**---
   * ✨ *Triggers for the progress bar.*
   * @default-{ wheel: true }
   * @example
   * `progressTrigger={
   *   wheel: true,
   *   content: true,
   *   progressElement: true // false // <YourProgressComponent/>,
   *   arrows: true // { size: number, element: <YourArrowComponent/> }
   * }`
   */
  progressTrigger?: {
    wheel?: boolean;
    content?: boolean;
    progressElement?: boolean | React.ReactNode;
    arrows?: boolean | { size?: number; element?: React.ReactNode };
  };
  /**---
   * ✨ *Types of rendering for optimization.*
   * @default-{ type: "default" }
   */
  render?:
    | { type: "default" }
    | { type: "lazy"; rootMargin?: number | number[] }
    | { type: "virtual" };
  /**---
   * ✨ *Processing of empty scroll elements.*
   */
  emptyElements?:
    | {
        mode: "clear";
        closeSelector?: string;
      }
    | {
        mode: "fallback";
        closeSelector?: string;
        element?: React.ReactNode;
      };
  /**---
   * ✨ *Adds React Suspense.*
   */
  suspending?: boolean;
  /**---
   * ✨ *Fallback element for error handling.*
   */
  fallback?: React.ReactNode;
};

/**
 * ## *MorphScroll component*〈♦〉
 *
 * ---
 * ## PROPS:
 * #### • GENERAL SETTINGS:
 * - `className`
 * - `children`
 *
 * #### • SCROLL SETTINGS:
 * - `type`
 * - `direction`
 * - `scrollTop`
 * - `stopLoadOnScroll`
 * - `onScrollValue`
 * - `isScrolling`
 *
 * #### • VISUAL SETTINGS:
 * - `size`
 * - `objectsSize` *◄ REQUIRED ►*
 * - `gap`
 * - `padding`
 * - `contentAlign`
 * - `elementsAlign`
 * - `edgeGradient`
 * - `progressReverse`
 * - `progressVisibility`
 * - `objectsWrapFullMinSize`
 *
 * #### • PROGRESS AND RENDERING:
 * - `progressTrigger`
 * - `render`
 * - `emptyElements`
 * - `suspending`
 * - `fallback`
 * ##### ! MORE DETAILS IN PROPS OR LINKS !
 *
 * ---
 * ## RETURNS:
 * React component.
 *
 * ---
 * ## LINKS:
 * [MorphScroll Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-scroll)
 */
declare const MorphScroll: React.FC<MorphScrollT>;

export { MorphScroll, ResizeTracker, IntersectionTracker };

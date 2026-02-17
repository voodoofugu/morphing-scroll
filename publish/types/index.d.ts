import React from "react";

import ResizeTrackerT from "./resizeTracker";
import IntersectionTrackerT from "./intersectionTracker";
import MorphScrollT from "./morphScroll";

/** ---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***ResizeTracker***:
 * React component.
 * ### Props:
 * - `className`
 * - `children`
 * - `style`
 * - `measure`
 * - `onResize`
 * ### Links:
 * [ResizeTracker Documentation](https://www.npmjs.com/package/morphing-scroll)
 *
 * [MDN Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
 */
declare const ResizeTracker: React.FC<ResizeTrackerT>;

/** ---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***IntersectionTracker***:
 * React component.
 * ### Props:
 * - `className`
 * - `children`
 * - `style`
 * - `root`
 * - `rootMargin`
 * - `threshold`
 * - `visibleContent`
 * - `onVisible`
 * ### Links:
 * [IntersectionTracker Documentation](https://www.npmjs.com/package/morphing-scroll)
 *
 * [MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 */
declare const IntersectionTracker: React.FC<IntersectionTrackerT>;

/** ---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***MorphScroll***:
 * React component.
 * ### Props:
 * ##### — GENERAL SETTINGS —
 * - `className`
 * - `children`
 *
 * ##### — SCROLL SETTINGS —
 * - `type`
 * - `direction`
 * - `scrollPosition`
 * - `onScrollValue`
 * - `isScrolling`
 *
 * ##### — VISUAL SETTINGS —
 * - `size` - ***REQUIRED***
 * - `objectsSize`
 * - `crossCount`
 * - `gap`
 * - `wrapperMargin`
 * - `wrapperMinSize`
 * - `wrapperAlign`
 * - `elementsAlign`
 * - `elementsDirection`
 * - `edgeGradient`
 * - `progressTrigger`
 * - `progressReverse`
 * - `scrollBarOnHover`
 * - `scrollBarEdge`
 * - `thumbMinSize`
 *
 * ##### — OPTIMIZATIONS —
 * - `render`
 * - `emptyElements`
 * - `suspending`
 * - `fallback`
 * ### Links:
 * [MorphScroll Documentation](https://www.npmjs.com/package/morphing-scroll)
 */
declare const MorphScroll: React.FC<MorphScrollT>;

/** ---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***Morph***:
 * content of the library
 *
 * ### Returns:
 * - `ResizeTracker`: *component that monitors changes to an element’s size.*
 * - `IntersectionTracker`: *component for tracking the intersection of an element with the viewport.*
 * - `MorphScroll`: *is the main component of the library responsible for displaying your data.*
 */
declare const Morph: {
  /** ---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***MorphScroll***:
   * React component.
   * ### Props:
   * ##### — GENERAL SETTINGS —
   * - `className`
   * - `children`
   *
   * ##### — SCROLL SETTINGS —
   * - `type`
   * - `direction`
   * - `scrollPosition`
   * - `onScrollValue`
   * - `isScrolling`
   *
   * ##### — VISUAL SETTINGS —
   * - `size` - ***REQUIRED***
   * - `objectsSize`
   * - `crossCount`
   * - `gap`
   * - `wrapperMargin`
   * - `wrapperMinSize`
   * - `wrapperAlign`
   * - `elementsAlign`
   * - `elementsDirection`
   * - `edgeGradient`
   * - `progressTrigger`
   * - `progressReverse`
   * - `scrollBarOnHover`
   * - `scrollBarEdge`
   * - `thumbMinSize`
   *
   * ##### — OPTIMIZATIONS —
   * - `render`
   * - `emptyElements`
   * - `suspending`
   * - `fallback`
   * ### Links:
   * [MorphScroll Documentation](https://www.npmjs.com/package/morphing-scroll)
   */
  MorphScroll: React.FC<MorphScrollT>;
  /** ---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***ResizeTracker***:
   * React component.
   * ### Props:
   * - `className`
   * - `children`
   * - `style`
   * - `measure`
   * - `onResize`
   * ### Links:
   * [ResizeTracker Documentation](https://www.npmjs.com/package/morphing-scroll)
   *
   * [MDN Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
   */
  ResizeTracker: React.FC<ResizeTrackerT>;
  /** ---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***IntersectionTracker***:
   * React component.
   * ### Props:
   * - `className`
   * - `children`
   * - `style`
   * - `root`
   * - `rootMargin`
   * - `threshold`
   * - `visibleContent`
   * - `onVisible`
   * ### Links:
   * [IntersectionTracker Documentation](https://www.npmjs.com/package/morphing-scroll)
   *
   * [MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
   */
  IntersectionTracker: React.FC<IntersectionTrackerT>;
};

export { MorphScroll, ResizeTracker, IntersectionTracker };
export default Morph;

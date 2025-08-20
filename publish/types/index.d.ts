import React from "react";

import ResizeTrackerT from "./resizeTracker";
import IntersectionTrackerT from "./intersectionTracker";
import MorphScrollT from "./morphScroll";

/** ---
 * ### ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png) ResizeTracker component
 *
 * ---
 * ### Props:
 * - `className`
 * - `children`
 * - `style`
 * - `measure`
 * - `onResize`
 *
 * _More information in props or links!_
 *
 * ---
 * ### Returns:
 * _React component._
 *
 * ---
 * ### Links:
 * [ResizeTracker Documentation](https://www.npmjs.com/package/morphing-scroll#-resizetracker)
 *
 * [MDN Reference for Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
 */
declare const ResizeTracker: React.FC<ResizeTrackerT>;

/** ---
 * ### ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png) IntersectionTracker component
 *
 * ---
 * ### Props:
 * - `className`
 * - `children`
 * - `style`
 * - `root`
 * - `rootMargin`
 * - `threshold`
 * - `visibleContent`
 * - `onVisible`
 *
 * _More information in props or links!_
 *
 * ---
 * ### Returns:
 * _React component._
 *
 * ---
 * ### Links:
 * [IntersectionTracker Documentation](https://www.npmjs.com/package/morphing-scroll#-intersectiontracker)
 *
 * [MDN Reference for Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 */
declare const IntersectionTracker: React.FC<IntersectionTrackerT>;

/** ---
 * ### ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png) MorphScroll component
 *
 * ---
 * ### Props:
 * ##### - GENERAL SETTINGS:
 * - `className`
 * - `children`
 *
 * ##### - SCROLL SETTINGS:
 * - `type`
 * - `direction`
 * - `scrollPosition`
 * - `onScrollValue`
 * - `isScrolling`
 *
 * ##### - VISUAL SETTINGS:
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
 *
 * ##### - PROGRESSBAR:
 * - `progressTrigger`
 * - `progressReverse`
 * - `scrollBarOnHover`
 *
 * ##### - OPTIMIZATIONS:
 * - `render`
 * - `emptyElements`
 * - `suspending`
 * - `fallback`
 *
 * _More information in props or links!_
 *
 * ---
 * ### Returns:
 * _React component._
 *
 * ---
 * ### Links:
 * [MorphScroll Documentation](https://www.npmjs.com/package/morphing-scroll#-morphscroll)
 */

declare const MorphScroll: React.FC<MorphScrollT>;

/** ---
 * ### ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png) Morph - all content of the library
 *
 * ---
 * ### Returns:
 * - `ResizeTracker`: *component that monitors changes to an element’s size.*
 * - `IntersectionTracker`: *component for tracking the intersection of an element with the viewport.*
 * - `MorphScroll`: *is the main component of the library responsible for displaying your data.*
 */
declare const Morph: {
  /** See `{ MorphScroll }` */
  MorphScroll: React.FC<MorphScrollT>;
  /** See `{ ResizeTracker }` */
  ResizeTracker: React.FC<ResizeTrackerT>;
  /** See `{ IntersectionTracker }` */
  IntersectionTracker: React.FC<IntersectionTrackerT>;
};

export { MorphScroll, ResizeTracker, IntersectionTracker };
export default Morph;

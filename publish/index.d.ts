import React from "react";

import ResizeTrackerT from "./resizeTracker";
import IntersectionTrackerT from "./intersectionTracker";
import MorphScrollT from "./morphScroll";

/**
 * ### ResizeTracker component〈♦〉
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
 * [ResizeTracker Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-resizetracker)
 *
 * [MDN Reference for Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
 */
declare const ResizeTracker: React.FC<ResizeTrackerT>;

/**
 * ### IntersectionTracker component〈♦〉
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
 * [IntersectionTracker Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-intersectiontracker)
 *
 * [MDN Reference for Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 */
declare const IntersectionTracker: React.FC<IntersectionTrackerT>;

/**
 * ### MorphScroll component〈♦〉
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
 * [MorphScroll Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-morphscroll)
 */
declare const MorphScroll: React.FC<MorphScrollT>;

export { MorphScroll, ResizeTracker, IntersectionTracker };

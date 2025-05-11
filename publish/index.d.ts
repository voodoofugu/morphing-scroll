import React from "react";

import ResizeTrackerT from "./resizeTracker";
import IntersectionTrackerT from "./intersectionTracker";
import MorphScrollT from "./morphScroll";

/**
 * ### *ResizeTracker component*〈♦〉
 *
 * ---
 * ### PROPS:
 * - `className`
 * - `children`
 * - `style`
 * - `measure`
 * - `onResize`
 * ##### ! MORE DETAILS IN PROPS OR LINKS !
 *
 * ---
 * ### RETURNS:
 * React component.
 *
 * ---
 * ### LINKS:
 * [ResizeTracker Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-resizetracker-)
 *
 * [MDN Reference for Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
 */
declare const ResizeTracker: React.FC<ResizeTrackerT>;

/**
 * ### *IntersectionTracker component*〈♦〉
 *
 * ---
 * ### PROPS:
 * - `children`
 * - `style`
 * - `root`
 * - `rootMargin`
 * - `threshold`
 * - `visibleContent`
 * - `onVisible`
 * ##### ! MORE DETAILS IN PROPS OR LINKS !
 *
 * ---
 * ### RETURNS:
 * React component.
 *
 * ---
 * ### LINKS:
 * [IntersectionTracker Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 *
 * [MDN Reference for Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 */
declare const IntersectionTracker: React.FC<IntersectionTrackerT>;

/**
 * ### *MorphScroll component*〈♦〉
 *
 * ---
 * ### PROPS:
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
 * - `objectsSize` - ***REQUIRED***
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
 * - `progressTrigger` - ***REQUIRED***
 * - `render`
 * - `emptyElements`
 * - `suspending`
 * - `fallback`
 * ##### ! MORE DETAILS IN PROPS OR LINKS !
 *
 * ---
 * ### RETURNS:
 * React component.
 *
 * ---
 * ### LINKS:
 * [MorphScroll Documentation](https://github.com/voodoofugu/morphing-scroll?tab=readme-ov-file#-scroll)
 */
declare const MorphScroll: React.FC<MorphScrollT>;

export { MorphScroll, ResizeTracker, IntersectionTracker };

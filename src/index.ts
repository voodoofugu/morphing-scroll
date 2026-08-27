import IntersectionTracker from "./components/IntersectionTracker";
import ResizeTracker from "./components/ResizeTracker";
import MorphScroll from "./components/MorphScroll";

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***Morph***:
 * content of the library.
 *
 * ### Returns:
 * - `MorphScroll`: *the main component, responsible for displaying your data.*
 * - `ResizeTracker`: *monitors changes to an element's size.*
 * - `IntersectionTracker`: *tracks the intersection of an element with the viewport.*
 * ### Links:
 * [Morph Documentation](https://www.npmjs.com/package/morphing-scroll)
 */
const Morph = { MorphScroll, ResizeTracker, IntersectionTracker };

export { MorphScroll, ResizeTracker, IntersectionTracker };
export type {
  MorphScroll as MorphScrollProps,
  ResizeTracker as ResizeTrackerProps,
  IntersectionTracker as IntersectionTrackerProps,
  MorphScrollHandle,
  ScrollTarget,
  ProgressTriggerName,
  ProgressTriggerConfig,
  BarConfig,
  ArrowsConfig,
  WheelConfig,
  EmptyObjectsConfig,
  WrapperConfig,
  Pair,
} from "./types/types";
export default Morph;

type MorphScrollT = {
  // General Settings
  /**---
   * *♦︎ Custom class name.*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} className="custom-class" >
   *   {children}
   * </MorphScroll>
   * ```
   * */
  className?: string;
  /**---
   * *♦︎ Custom user content.*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} >
   *   {children}
   * </MorphScroll>
   * ```
   * */
  children?: React.ReactNode;

  // Scroll Settings
  /**---
   * *♦︎ Type of progress element.*
   *
   * @default "scroll"
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} type="slider" >
   *   {children}
   * </MorphScroll>
   * ```
   */
  type?: "scroll" | "slider";
  /**---
   * *♦︎ Scrolling direction.*
   *
   * @default "y"
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} direction="x" >
   *   {children}
   * </MorphScroll>
   * ```
   */
  direction?: "x" | "y" | "hybridX" | "hybridY";
  /**---
   * *♦︎ Scroll position value.*
   *
   * @default { duration: 200; updater: false }
   *
   * @description
   * - `value`: *Scroll position value*
   * - `duration`: *Duration of the scroll animation*
   * - `updater`: *Helper to force an update when setting the same scroll value repeatedly*
   *
   * @note
   * `value` can be an array of values for x and y directions
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} scrollPosition={{ value: 100, duration: 300 }} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  scrollPosition?: {
    value: number | "end" | (number | "end")[];
    duration?: number;
    updater?: boolean;
  };
  /**---
   * *♦︎ Callback for scroll value.*
   *
   * @description
   * - `left`: *Scroll position on the x-axis*
   * - `top`: *Scroll position on the y-axis*
   *
   * @note
   * `left` can be used for x direction, `top` for y direction and both for hybrid directions
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} onScrollValue={(left, top) => console.log(left, top)} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  onScrollValue?: (left: number, top: number) => void;
  /**---
   * *♦︎ Callback for scroll status.*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} isScrolling={(motion) => console.log(motion)} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  isScrolling?: (motion: boolean) => boolean;

  // Visual Settings
  /**---
   * *♦︎ Dimensions of the* `MorphScroll` *component:* `[width, height]`.
   *
   * @default
   * Inherits the size of its parent element
   *
   * @note
   * *Uses the library’s* `ResizeTracker` *for automatic resizing*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} size={[200, 100]} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  size?: number[];
  /**---
   * *♦︎ Size of the objects inside* `MorphScroll` *component:* `[width, height]`.
   *
   * @note
   * - *Use `"none"` to disable size calculation - **not compatible** with* `render={{ type: "virtual" }}`
   * - *Use `"firstChild"` to auto-size based on the first child of each cell*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} objectsSize={[80, 80]} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  objectsSize:
    | number
    | "none"
    | "firstChild"
    | (number | "none" | "firstChild")[];
  /**---
   * *♦︎ Number of cells in the* `objectsWrapper` *in each direction.*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} crossCount={3} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  crossCount?: number;
  /**---
   * *♦︎ Gap between cells.*
   *
   * @note
   * *It can be 1 number or an array of 2 or 4 numbers*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} gap={10} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  gap?: number | number[];
  /**---
   * *♦︎ Margin for the* `objectsWrapper`.
   *
   * @note
   * *It can be 1 number or an array of 2 or 4 numbers*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} wrapperMargin={10} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapperMargin?: number | number[];
  /**---
   * *♦︎ Sets the `min-width` or `min-height` CSS property of the* `objectsWrapper`.
   *
   * @note
   * - *Use an array of 2 numbers with hybrid directions to set different values*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} wrapperMinSize={"full"} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapperMinSize?: number | "full" | (number | "full")[];
  /**---
   * *♦︎ Aligns the* `objectsWrapper` *when it's smaller than the defined* `size`.
   *
   * @note
   * *Use 1 value to align one or both axes, or an array of 2 values for x and y alignment*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} wrapperAlign={["start", "center"]} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapperAlign?: "start" | "center" | "end" | ("start" | "center" | "end")[];
  /**---
   * *♦︎ Aligns the objects inside* `MorphScroll` *component.*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} elementsAlign={"center"} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  elementsAlign?: "start" | "center" | "end";
  /**---
   * *♦︎ Direction of the objects inside* `MorphScroll` *component.*
   *
   * @default "row"
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} elementsDirection={"column"} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  elementsDirection?: "row" | "column";
  /**---
   * *♦︎ Gradient overlay at the edges of the scroll area.*
   *
   * @default `true` is treated as `{ size: 40 }`
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} edgeGradient={{ color: "rgba(0,0,0,0.4)"}} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  edgeGradient?: boolean | { color?: string; size?: number };

  // ProgressBar
  /**---
   * *♦︎ Defines the sources that can trigger the progress bar.*
   *
   * @description
   * - `wheel`: *Triggered by mouse wheel scroll*
   * - `content`: *Triggered by content click and drag*
   * - `progressElement`: *Triggered by the progress element scroll*
   * - `arrows`: *Triggered by arrow button click*
   *
   * @note
   * - *`progressElement` can be thumb or slider, use props `type`*
   * - *If `progressElement` is true and `type` is "scroll", the default browser scroll element will be used*
   * - *`arrows` can be designed with their className or you can pass a custom element*
   * - *`arrows` resize the `objectsWrapper` subtracting their size*
   *
   * @example
   * ```tsx
   * <MorphScroll
   *   {...props}
   *   progressTrigger={ wheel: true, progressElement: <ScrollThumb /> }
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  progressTrigger: {
    wheel?: boolean;
    content?: boolean;
    progressElement?: boolean | React.ReactNode;
    arrows?: boolean | { size?: number; element?: React.ReactNode };
  };
  /**---
   * *♦︎ Reverse the progress bar position.*
   *
   * @default false
   *
   * @note
   * *Use 1 boolean or an array of 2 booleans to set different values for hybrid `direction`*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} progressReverse={true} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  progressReverse?: boolean | boolean[];
  /**---
   * *♦︎ Controls the visibility of the progress bar.*
   *
   * @default "visible"
   *
   * @note
   * - *To remove the `progressElement`, just don't pass it in `progressTrigger`*
   * - *In "hover" mode, "hover"/"leave" classes are added for styling or animation*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} progressVisibility={"hover"} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  progressVisibility?: "visible" | "hover";

  // Optimization
  /**---
   * *♦︎ Rendering strategy for performance optimization.*
   *
   * @default { type: "default" }
   *
   * @description
   * - `"default"`: *Renders all elements normally*
   * - `"lazy"`: *Renders elements only when they enter the viewport*
   * - `"virtual"`: *Like* `"lazy"`*, but removes elements when they leave the viewport*
   *
   * @note
   * - `rootMargin`: *Margin around your objects for loading*
   * - `onVisible`: *Callback function when an element becomes visible*
   * - `stopLoadOnScroll`: *Stops loading elements when scrolling*
   * - `virtual`: *Is not compatible with* `objectsSize: "none"`
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} render={{ type: "virtual" }} >
   *   {children}
   * </MorphScroll>
   * ```
   */
  render?:
    | { type: "default" }
    | {
        type: "lazy";
        rootMargin?: number | number[];
        onVisible?: (key: string) => void;
        stopLoadOnScroll?: boolean;
      }
    | {
        type: "virtual";
        rootMargin?: number | number[];
        stopLoadOnScroll?: boolean;
      };
  /**---
   * *♦︎ Behavior for handling empty scroll elements.*
   *
   * @description
   * - `clear`: *Removes empty elements from the DOM*
   * - `fallback`: *Replaces empty elements with a fallback element*
   *
   * @note
   * - `clickTrigger`: *Start clearing elements when passed selector is clicked*
   * - `element`: *Custom fallback node, if omitted, uses the* `fallback` *prop*
   *
   * @example
   * ```tsx
   * <MorphScroll
   *   {...props}
   *   emptyElements={{
   *     mode: "clear",
   *     clickTrigger: { selector: ".close", delay: 100 } }}
   * >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  emptyElements?:
    | {
        mode: "clear";
        clickTrigger?: { selector: string; delay?: number };
      }
    | {
        mode: "fallback";
        element?: React.ReactNode;
        clickTrigger?: { selector: string; delay?: number };
      };
  /**---
   * *♦︎ Enables React Suspense for children.*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} suspending >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  suspending?: boolean;
  /**---
   * *♦︎ Fallback element to display during loading or as a placeholder.*
   *
   * @note
   * *Used when `suspending`, `emptyElements.mode === "fallback"`, or `render.type === "lazy"` / `"virtual"`*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props} fallback={<div>Loading...</div>} >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  fallback?: React.ReactNode;
};

export default MorphScrollT;

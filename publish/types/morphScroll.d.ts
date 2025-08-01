type MorphScrollT = {
  // General Settings
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom class name.
   * ___
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   className="custom-class"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   * */
  className?: string;
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom user content.
   * ___
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
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Type of progress element.
   * ___
   * @default "scroll"
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   type="slider"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  type?: "scroll" | "slider" | "sliderMenu";
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Scrolling direction.
   * ___
   * @default "y"
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   direction="x"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  direction?: "x" | "y" | "hybrid";
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Scroll position value and additional options.
   * ___
   * @default { duration: 200; updater: false }
   *
   * @description
   * - `value`: *Scroll position value*
   * - `duration`: *Duration of the scroll animation*
   * - `updater`: *Helper to force an update when setting the same scroll value repeatedly*
   *
   * @note
   * `value` property can be an array of two values for hybrid directions
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   scrollPosition={{ value: 100, duration: 300 }}
   * >
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
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Callback for scroll value.
   * ___
   * @description
   * - `left`: *Current scroll position on the x-axis*
   * - `top`: *Current scroll position on the y-axis*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   onScrollValue={(left, top) => console.log("Scroll position:", left, top)}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  onScrollValue?: (left: number, top: number) => void;
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Callback for scroll status.
   * ___
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   isScrolling={(motion) => console.log(motion)}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  isScrolling?: (motion: boolean) => void;

  // Visual Settings
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * `[width, height]` dimension of `MorphScroll`.
   *
   * **REQUIRED**
   * ___
   * @description
   * - `number` *sets the width and height, can be an array of 2 numbers*
   * - `"auto"` *for automatic resizing based on the parent element*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   size={[200, 100]}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  size: number | number[] | "auto";
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * [width, height] dimension of cells for each object.
   * ___
   * @default [width, height] from size
   *
   * @description
   * - `number` *sets the width and height, can be an array of 2 numbers*
   * - `"size"` *all objects will take the dimensions from the `size` prop*
   * - `"firstChild"` *all objects will have the same size as the first child*
   * - `"none"` *objects will be created without defined size*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   objectsSize={80}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  objectsSize:
    | number
    | "size"
    | "firstChild"
    | "none"
    | (number | "size" | "firstChild" | "none")[];
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Number of cells in each direction.
   *___
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   crossCount={3}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  crossCount?: number;
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Gap between cells.
   * ___
   * @note
   * *It can be 1 number or an array of 2 or 4 numbers*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   gap={10}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  gap?: number | number[];
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Margin for the* `.ms-objects-wrapper`.
   * ___
   * @note
   * *It can be 1 number or an array of 2 or 4 numbers*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   wrapperMargin={10}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapperMargin?: number | number[];
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Minimum height or width of the `.ms-objects-wrapper`.
   * ___
   * @description
   * - `number` *sets the min-size*
   * - `"full"` *min-size is equal to property `size`*
   *
   * @note
   * - *Can be used as 1 value, or an array of 2 values for [width, height].*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   wrapperMinSize={"full"}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapperMinSize?: number | "full" | (number | "full")[];
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * [horizontal, vertical] aligns your content when it is smaller than the `size`.
   *___
   * @note
   * *Use 1 value to align one or both axes, or an array of 2 values to align both axes*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   wrapperAlign={["start", "center"]}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapperAlign?: "start" | "center" | "end" | ("start" | "center" | "end")[];
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Aligns the objects inside `MorphScroll`.
   * ___
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   elementsAlign={"center"}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  elementsAlign?: "start" | "center" | "end";
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Direction of the provided elements.
   * ___
   * @default "row"
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   elementsDirection={"column"}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  elementsDirection?: "row" | "column";
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Gradient overlay at the edges of the scroll area.
   * ___
   * @default { size: 40 }
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   edgeGradient={{ color: "rgba(0,0,0,0.4)"}}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  edgeGradient?: boolean | { color?: string; size?: number };

  // Progress Bar
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Triggers for the scroll progress.
   * ___
   * @description
   * - `wheel`: *Triggered by mouse wheel scroll*
   * - `content`: *Triggered by content click and drag*
   * - `progressElement`: *Triggered by provided progress element*
   * - `arrows`: *Triggered by arrow button click*
   *
   * @note
   * - *`progressElement` can be thumb or slider, use props `type`*
   * - *If `progressElement` is true and `type` is "scroll", the default browser scroll element will be used*
   * - *`arrows` can be designed with their className or you can provide a custom element*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
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
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Reverse the progress bar position.
   * ___
   * @default false
   *
   * @note
   * *Use 1 boolean or an array of 2 booleans to set different values for hybrid `direction`*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   progressReverse={true}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  progressReverse?: boolean | boolean[];
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Hover visibility of the progress bar.
   * ___
   * @default false
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   progressVisibility={"hover"}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  scrollBarOnHover?: boolean;

  // Optimization
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Rendering strategy for performance optimization.
   * ___
   * @description
   * - `"lazy"`: *Does not deleted content when it leaves the viewport*
   * - `"virtual"`: *Deletes content when it leaves the viewport*
   * - `rootMargin`: *Distance for loading from the root element*
   * - `stopLoadOnScroll`: *Stops loading content when scrolling*
   *
   * @note
   * *`render` is not compatible with `objectsSize: "none"`*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   render={{ type: "virtual" }}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  render?: {
    type: "lazy" | "virtual";
    rootMargin?: number | number[];
    stopLoadOnScroll?: boolean;
  };
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Handling of empty scroll elements.
   * ___
   * @description
   * - `"clear"`: *Removes empty elements from the DOM*
   * - `fallback`: *Replaces empty elements with a fallback element*
   * - `clickTrigger`: *Start clearing elements when passed selector is clicked*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   emptyElements={{
   *     mode: "clear",
   *     clickTrigger: { selector: ".close-button" }
   *   }}
   * >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  emptyElements?: {
    mode: "clear" | "fallback" | { fallback: React.ReactNode };
    clickTrigger?: { selector: string; delay?: number };
  };
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Enables React Suspense for children.
   * ___
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   suspending
   * >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  suspending?: boolean;
  /**---
   * ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Fallback element to display during loading or placeholder.
   * ___
   * @note
   * *Used when:*
   * - *`suspending === true`*
   * - *`render.stopLoadOnScroll === true`*
   * - *`emptyElements.mode === "fallback"`*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   fallback={<div>Loading...</div>}
   * >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  fallback?: React.ReactNode;
};

export default MorphScrollT;

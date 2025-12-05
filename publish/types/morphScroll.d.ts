type MorphScrollT = {
  // — General Settings —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***className***:
   * set a custom class name.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***children***:
   * add custom user content.
   * @example
   * ```tsx
   * <MorphScroll {...props} >
   *   {children}
   * </MorphScroll>
   * ```
   * */
  children?: React.ReactNode;

  // — Scroll Settings —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***type***:
   * change the type of progress element.
   * @default "scroll"
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***direction***:
   * change the scrolling direction.
   * @default "y"
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***scrollPosition***:
   * set the scroll position value and additional options.
   * @default { duration: 200; updater: false }
   * @description
   * - `value`: *scroll position value*
   * - `duration`: *duration of the scroll animation*
   * - `updater`: *helper to force an update when setting the same scroll value repeatedly*
   * @note `value` property can be an array of two values for hybrid directions
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   scrollPosition={100}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  scrollPosition?:
    | number
    | "end"
    | (number | "end")[]
    | {
        value: number | "end" | (number | "end")[];
        duration?: number;
        updater?: boolean;
      };
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***onScrollValue***:
   * callback for scroll value.
   * @param left current scroll position on the x-axis.
   * @param top current scroll position on the y-axis.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***isScrolling***:
   * callback for scroll status.
   * @param motion boolean indicating if scrolling is in progress.
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   isScrolling={(motion) => console.log("Is scrolling:", motion)}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  isScrolling?: (motion: boolean) => void;

  // — Visual Settings —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***size***:
   * width and height dimension of scroll area ( **REQUIRED** ).gt
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***objectsSize***:
   * width and height dimension of cells for each object.
   * @default size prop value
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***crossCount***:
   * number of cells in each direction.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***gap***:
   * gap between cells.
   * @note
   * *It can be a number or an array of 2 or 4 numbers*
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***wrapperMargin***:
   * margin for the `.ms-objects-wrapper` element.
   * @note
   * *It can be a number or an array of 2 or 4 numbers*
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***wrapperMinSize***:
   * minimum height or width of the `.ms-objects-wrapper` element.
   * @description
   * - `number` *sets the min-size*
   * - `"full"` *min-size is equal to property `size`*
   * @note
   * - *Can be used as 1 value, or an array of 2 values for width and height.*
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***wrapperAlign***:
   * horizontal and vertical aligns your content when it is smaller than the `size`.
   * @note
   * *Use 1 value to align one or both axes, or an array of 2 values to align both axes*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   wrapperAlign="center"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapperAlign?: "start" | "center" | "end" | ("start" | "center" | "end")[];
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***elementsAlign***:
   * aligns the objects inside `MorphScroll`.
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   elementsAlign="center"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  elementsAlign?: "start" | "center" | "end";
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***elementsDirection***:
   * direction of the provided elements.
   * @default "row"
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   elementsDirection="column"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  elementsDirection?: "row" | "column";
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***edgeGradient***:
   * gradient overlay at the edges of the scroll area.
   * @default { size: 40 }
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   edgeGradient="rgba(0,0,0,0.4)"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  edgeGradient?: boolean | string | { color?: string; size?: number };
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***progressTrigger***:
   * triggers for the scroll progress.
   * @description
   * - `wheel`: *allow to scroll by mouse wheel*
   * - `content`: *allow to scroll by content drag*
   * - `progressElement`: *add custom progress element*
   * - `arrows`: *add custom arrows*
   * @note
   * - *`progressElement` can be thumb or slider, use props `type`*
   * - *If `progressElement` is true and `type` is "scroll", the default browser scroll element will be used*
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
    wheel?:
      | boolean
      | { changeDirection?: boolean; changeDirectionKey?: string };
    content?: boolean;
    progressElement?: boolean | React.ReactNode;
    arrows?:
      | boolean
      | React.ReactNode
      | {
          element?: React.ReactNode;
          size?: number;
          contentReduce?: boolean;
          loop?: boolean;
        };
  };
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***progressReverse***:
   * reverse your progress bar position.
   * @default false
   * @note
   * *use 1 boolean or an array of 2 booleans to set different values for hybrid `direction`*
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***scrollBarOnHover***:
   * progress bar hover visibility.
   * @default false
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   progressVisibility="hover"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  scrollBarOnHover?: boolean;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***scrollBarEdge***:
   * scroll bar margin at its edges.
   * @note
   * - *Used when: `type="scroll"`*
   * - *When `direction="hybrid"` you can set an array of values*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   scrollBarEdge={10}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  scrollBarEdge?: number | number[];
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***thumbMinSize***:
   * scroll bar thumb minimum size.
   * @note
   * *Used when: `type="scroll"`*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   thumbMinSize={40}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  thumbMinSize?: number;

  // — Optimization —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***render***:
   * rendering strategy for performance optimization.
   * @description
   * - `"lazy"`: *does not deleted content when it leaves the viewport*
   * - `"virtual"`: *deletes content when it leaves the viewport*
   * - `rootMargin`: *distance for loading from the root element*
   * - `stopLoadOnScroll`: *stops loading content when scrolling*
   * @note
   * *`render` is not compatible with `objectsSize: "none"`*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   render="virtual"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  render?:
    | "lazy"
    | "virtual"
    | {
        type: "lazy" | "virtual";
        rootMargin?: number | number[];
        stopLoadOnScroll?: boolean;
      };
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***emptyElements***:
   * handling of empty scroll elements.
   * @description
   * - `"clear"`: *removes empty elements from the DOM*
   * - `fallback`: *replaces empty elements with a fallback element*
   * - `clickTrigger`: *start clearing elements when passed selector is clicked*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   emptyElements={{
   *     mode: "clear",
   *     clickTrigger: ".close-button"
   *   }}
   * >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  emptyElements?: {
    mode: "clear" | "fallback" | { fallback: React.ReactNode };
    clickTrigger?: string | { selector: string; delay?: number };
  };
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***suspending***:
   * enables React Suspense for children.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***fallback***:
   * element to display during loading or placeholder.
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

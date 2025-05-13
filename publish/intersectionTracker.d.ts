type IntersectionTrackerT = {
  /**---
   * *♦︎ Custom class name.*
   *
   * @example
   * ```tsx
   * <IntersectionTracker className="custom-class" >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  className?: string;
  /**---
   * *♦︎ Custom user content.*
   *
   * @example
   * ```tsx
   * <IntersectionTracker>
   *   {children}
   * </IntersectionTracker>
   * ```
   * */
  children?: React.ReactNode;
  /**---
   * *♦︎ Custom inline styles.*
   *
   * @example
   * ```tsx
   * <IntersectionTracker
   *  style={{ backgroundColor: "blue" }}
   * >
   *  {children}
   * </IntersectionTracker>
   * ```
   */
  style?: React.CSSProperties;
  /**---
   * *♦︎ The root element for* `IntersectionObserver`.
   *
   * @default
   * If not provided, the documents viewport is used
   *
   * @example
   * ```tsx
   * <IntersectionTracker root={document.getElementById("root")} >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  root?: Element | null;
  /**---
   * *♦︎ The margin for the root element of the* `IntersectionObserver`.
   *
   * @note
   * *It can be 1 number or an array of 2 or 4 numbers*
   *
   * @example
   * ```tsx
   * <IntersectionTracker rootMargin={[10, 20, 30, 40]} >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  rootMargin?: number | number[];
  /**---
   * *♦︎ Visibility threshold for triggering intersection events.*
   *
   * @note
   * *A value between `0` (out of view) and `1` (fully visible) can be single or an array*
   *
   * @example
   * ```tsx
   * <IntersectionTracker threshold={0.5} >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  threshold?: number | number[];
  /**---
   * *♦︎ Callback function triggered when* `threshold` *is met.*
   *
   * @description
   * `entry`: *The intersection observer entry*
   *
   * @note
   * - *When* `threshold` *is an array, the callback is triggered for each value in the array*
   * - *You can use* `entry.intersectionRatio` *to run a custom logic*
   *
   * @example
   * ```tsx
   * <IntersectionTracker onVisible={(entry) => console.log(entry)} >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  onVisible?: (entry: IntersectionObserverEntry) => void;
  /**---
   * *♦︎ Renders children regardless of their visibility in the viewport.*
   *
   * @default false
   *
   * @example
   * ```tsx
   * <IntersectionTracker visibleContent={true} >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  visibleContent?: boolean;
  /**---
   * *♦︎ Custom attribute for the* `IntersectionTracker`.
   *
   * @description
   * - `name`: *Attribute name* `required`
   * - `value`: *Attribute value* `required`
   * - `viewVisible`: *Toggles "visible" in the attribute when the element is visible*
   *
   * @example
   * ```tsx
   * <IntersectionTracker attribute={{ name: "data-visible", value: "true" }} >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  attribute?: {
    name: string;
    value: string;
    viewVisible?: boolean;
  };
  /**---
   * *♦︎ Callback function triggered when the* `IntersectionTracker` *is clicked.*
   *
   * @example
   * ```tsx
   * <IntersectionTracker onClick={() => console.log("clicked")} >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

export default IntersectionTrackerT;

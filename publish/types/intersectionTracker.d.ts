type IntersectionTrackerT = {
  /**---
   * Custom class name.
   * ___
   * @example
   * ```tsx
   * <IntersectionTracker
   *   className="custom-class"
   * >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  className?: string;
  /**---
   * Custom user content.
   * ___
   * @example
   * ```tsx
   * <IntersectionTracker>
   *   {children}
   * </IntersectionTracker>
   * ```
   * */
  children?: React.ReactNode;
  /**---
   * Custom inline styles.
   * ___
   * @example
   * ```tsx
   * <IntersectionTracker
   *  style={{ backgroundColor: "yellow" }}
   * >
   *  {children}
   * </IntersectionTracker>
   * ```
   */
  style?: React.CSSProperties;
  /**---
   * The root element for `IntersectionObserver`.
   * ___
   * @default document viewport
   *
   * @example
   * ```tsx
   * <IntersectionTracker
   *   root={document.getElementById("observer-container")}
   * >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  root?: Element | null;
  /**---
   * The margin for the root element of the `IntersectionObserver`.
   * ___
   * @note
   * *It can be 1 number or an array of 2 or 4 numbers*
   *
   * @example
   * ```tsx
   * <IntersectionTracker
   *   rootMargin={10}
   * >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  rootMargin?: number | number[];
  /**---
   * Visibility threshold for triggering intersection events.
   * ___
   * @note
   * *A value between `0` (out of view) and `1` (fully visible) can be single or an array*
   *
   * @example
   * ```tsx
   * <IntersectionTracker
   *   threshold={0.5}
   * >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  threshold?: number | number[];
  /**---
   * Renders children regardless of their visibility in the viewport.
   * ___
   * @default false
   *
   * @example
   * ```tsx
   * <IntersectionTracker
   *   visibleContent
   * >
   *   {children}
   * </IntersectionTracker>
   * ```
   */
  visibleContent?: boolean;
  /**---
   * Callback function triggered when `threshold` is met.
   * ___
   *
   * @example
   * ```tsx
   * <IntersectionTracker
   *   onIntersection={(entry) => {
   *     if (entry.isIntersecting) loadMoreItems();
   *   }}
   * >
   *   {children}
   * </IntersectionTracker>
   * ```
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry
   */
  onIntersection?: (entry: IntersectionObserverEntry) => void;
};

export default IntersectionTrackerT;

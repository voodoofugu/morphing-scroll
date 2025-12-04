type IntersectionTrackerT = {
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom class name.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom user content.
   * @example
   * ```tsx
   * <IntersectionTracker>
   *   {children}
   * </IntersectionTracker>
   * ```
   * */
  children?: React.ReactNode;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom inline styles.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * The root element for `IntersectionObserver`.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * The margin for the root element of the `IntersectionObserver`.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Visibility threshold for triggering intersection events.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Renders children regardless of their visibility in the viewport.
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
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Callback function triggered when `threshold` is met.
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

type IntersectionTrackerT = {
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***className***:
   * set a custom class name.
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
   * ### ***children***:
   * add custom user content.
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
   * ### ***style***:
   * set custom inline styles.
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
   * ### ***root***:
   * root element.
   * @default document viewport
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
   * ### ***rootMargin***:
   * margin for the root element.
   * @note
   * *It can be a number or an array of 2 or 4 numbers*
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
   * ### ***threshold***:
   * visibility threshold for triggering intersection events.
   * @note
   * *a value between `0` (out of view) and `1` (fully visible) can be single or an array*
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
   * ### ***visibleContent***:
   * renders children regardless of their visibility in the viewport.
   * @default false
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
   * ### ***onIntersection***:
   * callback triggered when `threshold` is met.
   * @param entry is the IntersectionObserverEntry object.
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

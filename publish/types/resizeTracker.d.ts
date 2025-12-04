type ResizeTrackerT = {
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom class name.
   * @example
   * ```tsx
   * <ResizeTracker
   *   className="custom-class"
   * >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  className?: string;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom user content.
   * @example
   * ```tsx
   * <ResizeTracker>
   *   {children}
   * </ResizeTracker>
   * ```
   * */
  children: React.ReactNode;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Custom inline styles.
   * @example
   * ```tsx
   * <ResizeTracker
   *   style={{ backgroundColor: "yellow" }}
   * >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  style?: React.CSSProperties;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Defines size measurement behavior.
   * @description
   * - `inner`: *Fits content*
   * - `outer`: *Fills parent*
   * - `all`: *Combines both*
   *
   * @default "inner"
   *
   * @example
   * ```tsx
   * <ResizeTracker
   *   measure="outer"
   * >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  measure?: "inner" | "outer" | "all";
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * Callback on dimension change.
   * @description
   * *`rect` is the dimensions of the container*
   *
   * @example
   * ```tsx
   * <ResizeTracker
   *  onResize={(rect) => console.log(rect)}
   * >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  onResize?: (rect: Partial<DOMRectReadOnly>) => void;
};

export default ResizeTrackerT;

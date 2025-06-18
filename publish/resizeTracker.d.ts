type ResizeTrackerT = {
  /**---
   * Custom class name.
   * ___
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
   * Custom user content.
   * ___
   * @example
   * ```tsx
   * <ResizeTracker>
   *   {children}
   * </ResizeTracker>
   * ```
   * */
  children: React.ReactNode;
  /**---
   * Custom inline styles.
   * ___
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
   * Defines size measurement behavior.
   * ___
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
   * Callback on dimension change.
   * ___
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

type ResizeTrackerT = {
  /**---
   * *♦︎ Custom class name.*
   *
   * @example
   * ```tsx
   * <ResizeTracker className="custom-class" >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  className?: string;
  /**---
   * *♦︎ Custom user content.*
   *
   * @example
   * ```tsx
   * <ResizeTracker>
   *   {children}
   * </ResizeTracker>
   * ```
   * */
  children: React.ReactNode;
  /**---
   * *♦︎ Custom inline styles for the ResizeTracker.*
   *
   * @example
   * ```tsx
   * <ResizeTracker
   *   style={{ backgroundColor: "blue" }}
   * >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  style?: React.CSSProperties;
  /**---
   * *♦︎ Defines size measurement behavior.*
   *
   * @description
   * - `inner`: *Fits content*
   * - `outer`: *Fills parent*
   * - `all`: *Combines both*
   *
   * @default "inner"
   *
   * @example
   * ```tsx
   * <ResizeTracker measure="outer" >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  measure?: "inner" | "outer" | "all";
  /**---
   * *♦︎ Callback on dimension change.*
   *
   * @description
   * `rect`: *The dimensions of the container*
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

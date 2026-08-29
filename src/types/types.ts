/** a pair by axis: x always first, y second */
export type Pair<T> = [x: T, y: T];
export type Vec2 = Pair<number>;

type Edges = [top: number, right: number, bottom: number, left: number];
type SpacingValue = number | Vec2 | Edges;
type Align = "start" | "center" | "end";
type MinSize = number | "full";
type ObjectSize = number | "full" | "firstChild" | "none";

/** the short form of `progressTrigger` */
export type ProgressTriggerName =
  | "wheel"
  | "content"
  | "arrows"
  | "bar"
  | "keys";

/** the object form of `progressTrigger.bar` */
export type BarConfig = {
  /** what the bar is made of; an array feeds one node per slider element */
  element?: React.ReactNode | React.ReactNode[];
  /**
   * distance between the bar and the side it sits on;
   * a negative value pushes it past the edge
   */
  edgeGap?: number | Vec2;
  /** shortens the track by this much at each of its two ends */
  trackGap?: number | Vec2;
  /** put the bar on the opposite side */
  reverse?: boolean | Pair<boolean>;
  /**
   * report the bar as idle unless it is hovered, touched or the content is
   * moving — through `--ms-bar-visibility` and the `ms-hover` / `ms-leave`
   * classes. Nothing is styled for you; see the README.
   */
  showOnHover?: boolean;
  /** the thumb never shrinks below this */
  thumbMinSize?: number;
};

/** the object form of `progressTrigger.wheel` */
export type WheelConfig = {
  /** let the wheel switch the axis it scrolls */
  changeDirection?: boolean;
  /**
   * `KeyboardEvent.code` that switches the axis while held;
   * an empty string turns it off
   * @default "KeyX"
   */
  changeDirectionBtn?: string;
};

/** the object form of `progressTrigger.keys` */
export type KeysConfig = {
  /**
   * what an arrow key does:
   * - `"step"`: *turns a page, the same move the arrow buttons make*
   * - `"pan"`: *nudges the content along, the way a plain scroll behaves*
   * - `"focus"`: *moves focus from object to object and follows it*
   * @default `"step"` in the slider modes, `"pan"` in `mode="scroll"`
   */
  mode?: "pan" | "step" | "focus";
  /** how far one press nudges in `"pan"` */
  step?: number;
};

/** the object form of `progressTrigger.arrows` */
export type ArrowsConfig = {
  /** the icon; author it pointing right, the library turns it for the rest */
  element?: React.ReactNode;
  /** thickness of the `.ms-arrow-box` strip */
  size?: number;
  /** the strip takes its thickness from the content instead of covering it */
  reserveSpace?: boolean;
  /** the last step wraps around to the other end */
  loop?: boolean;
};

/** the object form of `progressTrigger` */
export type ProgressTriggerConfig = {
  wheel?: boolean | WheelConfig;
  content?: boolean;
  keys?: boolean | KeysConfig;
  bar?: boolean | React.ReactNode | React.ReactNode[] | BarConfig;
  arrows?: boolean | React.ReactNode | ArrowsConfig;
};

/** what brought the scroll to a new page */
/**
 * What brought the scroll to a new page. Names of your own fit here too: a
 * command through the `ref` takes any string, and it reaches `onNavigate`
 * untouched.
 */
export type NavigateReason =
  | "arrows"
  | "bar"
  | "keys"
  | "scroll"
  // `& {}` не даёт литералам выше раствориться в `string` и потерять подсказки
  | (string & {});

/** the argument of `onNavigate` */
export type NavigateEvent = {
  /** `"scroll"` — the content got there on its own: a drag, the wheel, inertia */
  reason: NavigateReason;
  axis: "x" | "y";
  from: number;
  to: number;
};

/** the object form of `wrapper` */
export type WrapperConfig = {
  /** space around `.ms-objects-wrapper`; 1, 2 or 4 numbers */
  margin?: SpacingValue;
  /** the box never gets smaller than this; `"full"` means the `size` prop */
  minSize?: MinSize | Pair<MinSize>;
  /** where the box sits when it is smaller than `size` */
  align?: Align | Pair<Align>;
};

/** the object form of `emptyObjects` */
export type EmptyObjectsConfig = {
  mode: "clear" | "fallback";
  /** what stands in for an empty object; the `fallback` prop when omitted */
  fallback?: React.ReactNode;
  /** start clearing when something matching this selector is clicked */
  clickTrigger?: string | { selector: string; delay?: number };
};

/** a value understood by both `scrollPosition` and `scrollTo` */
export type ScrollTarget =
  | null
  | number
  | "end"
  | Pair<null | number | "end">;

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***MorphScrollHandle***:
 * imperative commands, reachable through a `ref`.
 * @description
 * `scrollPosition` describes *where the scroll is* and only reacts when that
 * value changes. These *do something now*, so they work even when the target
 * is the same as last time — scrolling back to the top twice, for example.
 *
 * They are also the way to drive the scroll from an input the library knows
 * nothing about. A gamepad, a remote, a MIDI pedal: your code decides what a
 * button means, calls `step` or `pan`, and passes a `reason` that comes back
 * out of `onNavigate` unchanged.
 * @example
 * ```tsx
 * const scroll = React.useRef<MorphScrollHandle>(null);
 *
 * <MorphScroll ref={scroll} size={300}>{children}</MorphScroll>
 *
 * scroll.current?.scrollTo(0);
 * scroll.current?.scrollTo("end", { duration: 0 });
 * ```
 * @example
 * ```tsx
 * // the gamepad: the polling is yours, the move is the library's
 * const pad = navigator.getGamepads()[0];
 *
 * if (pad?.buttons[13].pressed)
 *   scroll.current?.step("bottom", { reason: "gamepad" });
 *
 * scroll.current?.pan({ y: pad.axes[3] * 12 }, { reason: "gamepad" });
 * ```
 */
export type MorphScrollHandle = {
  /** run a scroll now; `duration: 0` jumps without animating */
  scrollTo: (target: ScrollTarget, options?: { duration?: number }) => void;
  /**
   * turn one page toward that side — the move the arrow buttons make.
   * Does nothing at the end of the run unless `arrows.loop` is on.
   */
  step: (
    side: "top" | "right" | "bottom" | "left",
    options?: { reason?: NavigateReason },
  ) => void;
  /**
   * nudge the content by this many pixels. This is plain movement, so it
   * lands in `onScrollPosition`; it only reaches `onNavigate` if it settles
   * on a new page of a slider.
   */
  pan: (
    delta: { x?: number; y?: number },
    options?: { duration?: number; reason?: NavigateReason },
  ) => void;
  /**
   * move focus to the neighbouring object and bring it into view — Tab, but
   * aimed: the neighbour is picked by geometry, so a grid moves across its
   * row and down to the next one.
   *
   * Focus lands on the `.ms-object-box` itself, so the highlight is the whole
   * card and there is one thing to style. Where it went is reported by the
   * DOM, through the `focus` events of your own items.
   */
  moveFocus: (
    side: "top" | "right" | "bottom" | "left",
    options?: { duration?: number; reason?: NavigateReason },
  ) => void;
};

export type ResizeTracker = {
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***className***:
   * set a custom class name.
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
   * ### ***children***:
   * add custom user content.
   * @example
   * ```tsx
   * <ResizeTracker>
   *   {children}
   * </ResizeTracker>
   * ```
   * */
  children?: React.ReactNode;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***style***:
   * set custom inline styles.
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
   * ### ***measure***:
   * defines size measurement behavior.
   * @description
   * - `inner`: *Fits content*
   * - `outer`: *Fills parent*
   * - `all`: *Combines both*
   * @default "inner"
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
   * ### ***onResize***:
   * callback on dimension change.
   * @param rect is the dimensions of the container.
   * @example
   * ```tsx
   * <ResizeTracker
   *  onResize={(rect) => console.log("Resized:", rect)}
   * >
   *   {children}
   * </ResizeTracker>
   * ```
   */
  onResize?: (rect: Partial<DOMRectReadOnly>) => void;
};

export type IntersectionTracker = {
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
  rootMargin?: SpacingValue;
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

export type MorphScroll = {
  // — GENERAL —
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

  // — SCROLL —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***mode***:
   * change how the scroll behaves and what the progress element is.
   * @default "scroll"
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   mode="slider"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  mode?: "scroll" | "slider" | "sliderMenu";
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
   * where the scroll should sit.
   * @default { duration: 200 }
   * @description
   * - `value`: *scroll position value*
   * - `duration`: *duration of the scroll animation*
   * @note `value` property can be an array of two values for hybrid directions
   * @note
   * this is a description, not a command: it applies when the value changes.
   * To run the same scroll again — back to the top twice, for instance — use
   * the `scrollTo` method on the component `ref`.
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   scrollPosition={100}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  scrollPosition?: ScrollTarget | { value: ScrollTarget; duration?: number };
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***autoScrollOnDrag***:
   * enables automatic scrolling when dragging elements near the edges of the container.
   * @note
   * *Supports attributes:*
   * - *`draggable="true"`*
   * - *`ms-custom-drag`*
   *
   * *Set attribute: `ms-under-drag`*
   *
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   autoScrollOnDrag
   * >
   *   {children}
   * </MorphScroll>
   *  ```
   */
  autoScrollOnDrag?: boolean;

  // — SIZE —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***size***:
   * width and height dimension of scroll area. ( **REQUIRED** )
   * @description
   * - `number` *sets the width and height*
   * - `Size` *width and height as an array*
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
  size: number | "auto" | Vec2;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***objectsSize***:
   * width and height dimension of cells for each object.
   * @default size prop value
   * @description
   * - `number` *sets the width and height, can be an array of 2 numbers*
   * - `"full"` *all objects will take the dimensions from the `size` prop*
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
  objectsSize?: ObjectSize | Pair<ObjectSize>;
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
   * space between cells.
   * @note
   * *It can be a number or an array of 2 numbers*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   gap={10}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  gap?: number | Vec2;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***wrapper***:
   * everything about the `.ms-objects-wrapper` box that holds your objects.
   * @description
   * - `margin`: *space around the box; 1, 2 or 4 numbers*
   * - `minSize`: *the box never gets smaller than this; `"full"` means the
   *   `size` prop*
   * - `align`: *where the box sits when it is smaller than `size`*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   wrapper={{ margin: 10, minSize: "full", align: "center" }}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  wrapper?: WrapperConfig;

  // — LAYOUT —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***objectsAlign***:
   * aligns the objects inside `MorphScroll`.
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   objectsAlign="center"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  objectsAlign?: Align;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***objectsDirection***:
   * direction of the provided elements.
   * @default "row"
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   objectsDirection="column"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  objectsDirection?: "row" | "column";

  // — PROGRESS —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***progressTrigger***:
   * triggers for the scroll progress.
   * @description
   * - `wheel`: *allow to scroll by mouse wheel*
   * - `content`: *allow to scroll by content drag*
   * - `keys`: *arrow keys move the scroll while it has focus*
   * - `bar`: *the progress element, plus everything about how it sits*
   * - `arrows`: *add custom arrows*
   * @note
   * - *a name, or a list of names, switches those triggers on: `"wheel"` is
   *   the same as `{ wheel: true }`*
   * - *`bar` renders as a thumb or as a slider depending on `mode`*
   * - *`bar: true` with `mode="scroll"` hands the job to the browser's own
   *   scrollbar*
   * - *`content` skips text fields and anything that carries its own drag ([more...](https://www.npmjs.com/package/morphing-scroll))*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   progressTrigger={{ wheel: true, bar: <ScrollThumb /> }}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   * @example
   * ```tsx
   * // with settings
   * progressTrigger={{
   *   wheel: true,
   *   bar: { element: <ScrollThumb />, edgeGap: 8, showOnHover: true },
   * }}
   * ```
   */
  progressTrigger?:
    | ProgressTriggerName
    | ProgressTriggerName[]
    | ProgressTriggerConfig;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***edge***:
   * marks the edges where the content is cut off.
   * @description
   * a place and a signal, not a ready-made gradient: `.ms-edge` is stretched
   * along its side and carries `--ms-edge-visibility` (`0` / `1`). What it
   * looks like is up to your CSS or the node you pass in.
   * @note
   * *the node is mirrored for you — one gradient serves both ends of an axis*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   edge={<div className="my-fade" />}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  edge?: boolean | React.ReactNode;

  // — OPTIMIZATION —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***render***:
   * rendering strategy for performance optimization.
   * @descriptions
   * - `mode` — determines the render strategy:
   *   - `"lazy"`: *render once when visible*
   *   - `"virtual"`: *render only when visible*
   * - `rootMargin`: *distance for loading from the root element*
   * - `stopLoadOnScroll`: *stops loading content when scrolling*
   * - `trackVisibility`: *sets the `--ms-content-visibility` variable*
   * @note
   * *`render` is not compatible with `objectsSize: "none"`*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   render="lazy"
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  render?:
    | "lazy"
    | "virtual"
    | {
        mode: "lazy" | "virtual";
        rootMargin?: SpacingValue;
        stopLoadOnScroll?: boolean;
        trackVisibility?: boolean;
      };
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***emptyObjects***:
   * what to do with objects that render nothing.
   * @description
   * - `"clear"`: *removes the empty objects from the DOM*
   * - `"fallback"`: *puts a placeholder in their place*
   * - `fallback`: *the placeholder to use; defaults to the `fallback` prop*
   * - `clickTrigger`: *also start clearing when the selector is clicked*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   emptyObjects="clear"
   * >
   *   {children}
   * </MorphScroll>
   *  ```
   * @example
   * ```tsx
   * // with settings
   * emptyObjects={{ mode: "fallback", fallback: <Empty />, clickTrigger: ".btn" }}
   * ```
   */
  emptyObjects?: "clear" | "fallback" | EmptyObjectsConfig;
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
   * - *`emptyObjects.mode === "fallback"`*
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

  // — EVENTS —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***onScrollPosition***:
   * callback for scroll value.
   * @param left current scroll position on the x-axis.
   * @param top current scroll position on the y-axis.
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   onScrollPosition={(left, top) => console.log("Scroll position:", left, top)}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  onScrollPosition?: (left: number, top: number) => void;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***onScrollingChange***:
   * callback for scroll status.
   * @param motion boolean indicating if scrolling is in progress.
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   onScrollingChange={(motion) => console.log("Is scrolling:", motion)}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  onScrollingChange?: (motion: boolean) => void;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***onNavigate***:
   * callback for a finished move from one page to another.
   * @param event which page the scroll left, which one it landed on, and what
   * put it there.
   * @description
   * this is the discrete half of scrolling — an arrow press, a slider dot, a
   * drag that settled on the next page. Continuous movement is
   * `onScrollPosition`; this one fires once per page, so it is the place to
   * hang a sound, a haptic, or an analytics event.
   * @note
   * *in `mode="scroll"` only the arrows page the content, so only they report*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   onNavigate={({ reason, from, to }) => {
   *     if (reason !== "scroll") playClick();
   *     console.log(`${from} -> ${to}`);
   *   }}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  onNavigate?: (event: NavigateEvent) => void;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***onRenderedKeysChange***:
   * callback for keys that are currently rendered inside `MorphScroll`.
   * @param keys array of rendered child keys.
   * @note
   * *Use explicit React keys to receive meaningful names.*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   onRenderedKeysChange={(keys) => console.log("Rendered:", keys)}
   * >
   *   <Card key="profile" />
   *   <Card key="settings" />
   * </MorphScroll>
   * ```
   */
  onRenderedKeysChange?: (keys: string[]) => void;
};

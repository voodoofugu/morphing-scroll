/** a pair by axis: x always first, y second */
export type Pair<T> = [x: T, y: T];
export type Vec2 = Pair<number>;

type Edges = [top: number, right: number, bottom: number, left: number];
type SpacingValue = number | Vec2 | Edges;
type Align = "start" | "center" | "end";
type MinSize = number | "full";
type ObjectSize = number | "full" | "firstChild" | "each" | "none";

/** the short form of `controls` */
export type ControlName =
  | "wheel"
  | "drag"
  | "arrows"
  | "bar"
  | "keys";

/** the object form of `controls.bar` */
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

/** the object form of `controls.wheel` */
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

/** the object form of `controls.keys` */
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

/** the object form of `controls.arrows` */
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

/** the object form of `controls` */
export type ControlsConfig = {
  wheel?: boolean | WheelConfig;
  drag?: boolean;
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

/** the object form of `objects` */
export type ObjectsConfig = {
  size?: ObjectSize | Pair<ObjectSize>;
  gap?: number | Vec2;
  crossCount?: number;
  align?: Align;
  direction?: "row" | "column";
  empty?: "clear" | "fallback" | EmptyObjectsConfig;
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

/** a value understood by both `initialPosition` and `scrollTo` */
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
 * `initialPosition` says where the scroll opens and is never applied again.
 * These *do something now*, so they work even when the target is the same as
 * last time — scrolling back to the top twice, for example.
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
   * ### ***initialPosition***:
   * where the scroll opens.
   * @description
   * Applied once, without animation, as soon as the content can hold it — a
   * measured layout is waited for. It is the opening position and nothing
   * else: changing it later does nothing, so it can never take the scroll back
   * from the person using it.
   * @note a pair of values sets both axes in `direction="hybrid"`
   * @note
   * every later move is a command on the component `ref` — `scrollTo`, `step`,
   * `pan`, `moveFocus`. To follow growing content, see `stickToEnd`.
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   initialPosition={100}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  initialPosition?: ScrollTarget;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***stickToEnd***:
   * keeps the scroll at the end of its content.
   * @description
   * A standing rule rather than a move: every time the content grows the
   * scroll follows it, and it opens at the end too. It steps aside as soon as
   * the reader scrolls away from the end, and picks up again when they come
   * back — a chat that does not fight the person reading its history.
   * @note a pair sets the axes apart: `[true, false]` in `direction="hybrid"`
   * follows the right edge and leaves the bottom alone
   * @example
   * ```tsx
   * <MorphScroll {...props} stickToEnd>
   *   {messages}
   * </MorphScroll>
   * ```
   */
  stickToEnd?: boolean | Pair<boolean>;
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***duration***:
   * how long a move takes, in ms.
   * @default 200
   * @description
   * The animation length of every move the scroll makes on its own: an arrow,
   * a key, a focus step, a slider settling after a drag. Commands on the `ref`
   * take it as their default and can override it per call. `0` jumps.
   * @example
   * ```tsx
   * <MorphScroll {...props} duration={400}>
   *   {children}
   * </MorphScroll>
   * ```
   */
  duration?: number;
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
   * ### ***objects***:
   * everything about the objects themselves: how big they are, how they sit
   * next to each other, and what to do with the empty ones.
   * @default { size: "none" } — `direction` falls back to `"row"` only where
   * nothing else answers for it
   * @description
   * - `size`: *the size of one object — a number, a pair for both axes,
   *   `"full"` for the size of the scroll, `"firstChild"` to measure the first
   *   one, `"each"` to measure every one of them, or `"none"` to leave it to
   *   your own CSS. Leaving it out means `"none"` on both axes, so the word
   *   earns its place in a pair, where there is no empty slot to leave:
   *   `[100, "none"]` — and a computed `undefined` there means the same*
   * - `gap`: *space between the objects, one number or `[x, y]`*
   * - `crossCount`: *how many of them fit across the scrolling axis*
   * - `align`: *where a short last line sits*
   * - `direction`: *whether the objects run in rows or in columns; leaving it
   *   out is its own answer, and with `size: "each"` it differs from `"row"`*
   * - `empty`: *`"clear"` removes objects that render nothing, `"fallback"`
   *   replaces them with a placeholder; the object form adds `fallback` and
   *   `clickTrigger`*
   * @note the sizes are what the virtual and lazy rendering count with, so
   * `render` needs a `size` it can rely on — `"each"` counts as one, because
   * the library measures it and then knows it
   * @note *which side is `"each"` decides how the objects are laid out:*
   * - *along the scroll — **masonry**: the other side is the column, and each
   *   object goes into the shortest column at that moment, so the bottom
   *   stays even. `[90, "each"]` for a vertical scroll*
   * - *across it — **flow**: objects follow one another with the same gap
   *   between them, and a new line starts when the room across runs out, or
   *   when `crossCount` says the line is full. Each line is as thick as the
   *   thickest object in it*
   * - *both sides — **fill**: every object takes the highest place it fits
   *   into, so nothing is left hanging under a short neighbour. Order gives
   *   way to the fit — an object further down the list can end up higher on
   *   the screen. Naming `crossCount` asks for lines instead, and lines is
   *   what you get*
   * - *`direction="hybrid"` — both ways scroll, so which side is `"each"`
   *   says nothing about which axis a line runs along: `crossCount` is the
   *   only thing left that can end one. A fill cannot stand in for it — it
   *   needs a boundary across, and the only one on offer is the scroll
   *   itself. With `crossCount` and a known size across it is masonry; with
   *   both sides handed over, flow by that count*
   * @note *`"each"` on its own is the short way of saying it about both
   * sides — the same as `["each", "each"]`*
   * @note *`align` lines the rows up against the widest one — widest across
   * the scroll, the vertical spread on a horizontal scroll same as the
   * horizontal one on a vertical scroll. That row is as much room as the
   * content needs and has nowhere to move; the rest close the gap that
   * separates them from it. A fill has no rows, so each object closes
   * its own gap instead — the one between it and whatever sits past it, or
   * the edge of the room if nothing does. `"center"` stops halfway between
   * where the fit first placed it and where `"end"` would push it. Nothing
   * moves until every object has been measured*
   * @note *`direction` names the line the objects run along, on every axis. A
   * single scrolling axis is already taken, leaving two readings: lines along
   * it are columns — masonry — and lines across it are rows — flow. Leave it
   * out and the side you hand over decides; name it and it decides instead,
   * so `[90, "each"]` with `direction: "row"` is strict rows rather than
   * masonry. Columns need a width, so asking for them while that side is the
   * objects' own is the one reading that cannot be built. `direction="hybrid"`
   * hands over neither axis: `"row"` (the default) has `crossCount` bound the
   * width and growth run down; `"column"` swaps them — `crossCount` bounds
   * the height, growth runs right*
   * @note *pages need one size for all, so `"each"` is for `mode="scroll"`*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   objects={{ size: 100, gap: 10 }}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   objects={{
   *     size: [150, 112],
   *     gap: [10, 20],
   *     crossCount: 3,
   *     align: "center",
   *     direction: "column",
   *     empty: "clear",
   *   }}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   */
  objects?: ObjectsConfig;
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

  // — CONTROLS —
  /**---
   * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
   * ### ***controls***:
   * everything that can move the scroll.
   * @description
   * - `wheel`: *allow to scroll by mouse wheel*
   * - `drag`: *allow to scroll by dragging the content*
   * - `keys`: *arrow keys move the scroll while it has focus*
   * - `bar`: *the progress element, plus everything about how it sits*
   * - `arrows`: *add custom arrows*
   * @note
   * - *a name, or a list of names, switches those on: `"wheel"` is the same
   *   as `{ wheel: true }`*
   * - *`bar` renders as a thumb or as a slider depending on `mode`*
   * - *`bar: true` with `mode="scroll"` hands the job to the browser's own
   *   scrollbar*
   * - *`drag` skips text fields and anything that carries its own drag ([more...](https://www.npmjs.com/package/morphing-scroll))*
   * @example
   * ```tsx
   * <MorphScroll {...props}
   *   controls={{ wheel: true, bar: <ScrollThumb /> }}
   * >
   *   {children}
   * </MorphScroll>
   * ```
   * @example
   * ```tsx
   * // with settings
   * controls={{
   *   wheel: true,
   *   bar: { element: <ScrollThumb />, edgeGap: 8, showOnHover: true },
   * }}
   * ```
   */
  controls?:
    | ControlName
    | ControlName[]
    | ControlsConfig;
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
   * callback for a move from one page to another.
   * @param event which page the scroll left, which one it goes to, and what
   * put it there.
   * @description
   * this is the discrete half of scrolling — an arrow press, a slider dot, a
   * drag that settled on the next page. Continuous movement is
   * `onScrollPosition`; this one fires once per page turn, so it is the place
   * to hang a sound, a haptic, or an analytics event.
   * @note
   * *a page turn asked for by a command — an arrow, a key, a gesture along the
   * slider — reports the moment it is asked for, one event per press. Three
   * quick presses share one ride and still report three times. A page reached
   * without asking reports when the scroll settles, as `"scroll"`*
   * @note
   * *in `mode="scroll"` only commands page the content, so only they report*
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

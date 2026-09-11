/** a pair by axis: x always first, y second */
export type Pair<T> = [x: T, y: T];
export type Vec2 = Pair<number>;

type Edges = [top: number, right: number, bottom: number, left: number];
type SpacingValue = number | Vec2 | Edges;
export type Align = "start" | "center" | "end";
type MinSize = number | "full";
type ObjectSize = number | "full" | "firstChild" | "auto";

/** the short form of `controls` */
export type ControlName = "wheel" | "drag" | "arrows" | "bar" | "keys";

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
  /**
   * in `direction="hybrid"`, give the wheel to the x axis.
   * @note *one axis has nothing to switch to, so it needs `"hybrid"`*
   */
  changeDirection?: boolean;
  /**
   * `KeyboardEvent.code`, or a list of them, that hands the wheel back to the
   * other axis while held — **Shift** by default, the same key a browser
   * scrolls sideways with. Needs `changeDirection`; an empty list turns it off
   * @default ["ShiftLeft", "ShiftRight"]
   * @note *a list is "any of these"; `"+"` joins codes into one combination,
   * so `["ShiftLeft+KeyX"]` waits for both*
   * @note *a modifier arrives with the wheel event itself and works wherever
   * the pointer is; any other key is read from the keyboard, which the scroll
   * only hears while it has focus*
   */
  changeDirectionBtn?: string | string[];
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

/** the object form of `edge` */
export type EdgeConfig = {
  /**
   * the node; author it as it looks on top, the library turns it for the rest
   */
  element?: React.ReactNode;
  /** thickness of the `.ms-edge` strip; without it your CSS decides */
  size?: number;
};

/** the object form of `controls.arrows` */
export type ArrowsConfig = {
  /** the icon; author it pointing right, the library turns it for the rest */
  element?: React.ReactNode;
  /** thickness of the `.ms-arrow-box` strip */
  size?: number;
  /** the strip takes its thickness from the content instead of covering it */
  reserveSpace?: boolean;
};

/** the object form of `controls` */
export type ControlsConfig = {
  wheel?: boolean | WheelConfig;
  drag?: boolean;
  keys?: boolean | KeysConfig;
  bar?: boolean | React.ReactNode | React.ReactNode[] | BarConfig;
  arrows?: boolean | React.ReactNode | ArrowsConfig;
};

/**
 * What brought the scroll to a new page. Names of your own fit here too: a
 * command through the `ref` takes any string, and it reaches `onNavigate`
 * untouched.
 */
export type NavigateReason =
  | "arrows"
  | "bar"
  | "keys"
  | "wheel"
  | "scroll"
  // `& {}` не даёт литералам выше раствориться в `string` и потерять подсказки
  | (string & {});

/** the argument of `onNavigate` */
export type NavigateEvent = {
  /**
   * `"scroll"` — the content got there on its own: a drag or inertia. A wheel
   * notch over a slider is a page turn asked for, and reports as `"wheel"`
   */
  reason: NavigateReason;
  axis: "x" | "y";
  from: number;
  to: number;
};

/** the object form of `objects` */
export type ObjectsConfig = {
  /**
   * one value for both sides, or a pair. A side left out of a pair is the
   * same as `"auto"`: the object decides it and the library measures it
   */
  size?: ObjectSize | Pair<ObjectSize | undefined>;
  gap?: number | Vec2;
  /**
   * how many lines the objects run in, across the scroll.
   * @note *in `direction="hybrid"` there is no window across to end a line,
   * so the count is the only thing that can: it is `1` unless you raise it*
   */
  lines?: number;
  /** where a short last line sits */
  align?: Align;
  /**
   * which way the list runs through the lines — it names the order, not the
   * layout: `"row"` fills a row and moves down, `"column"` fills a column and
   * moves right
   */
  order?: "row" | "column";
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

/** the object form of `objects.empty` */
export type EmptyObjectsConfig = {
  mode: "clear" | "fallback";
  /** start clearing when something matching this selector is clicked */
  clickTrigger?: string | { selector: string; delay?: number };
};

/** the object form of `fallback` */
export type FallbackConfig = {
  /** stands in while an object is on its way */
  loading?: React.ReactNode;
  /** stands in where an object rendered nothing */
  empty?: React.ReactNode;
};

/** a value understood by both `initialPosition` and `scrollTo` */
export type ScrollTarget = null | number | "end" | Pair<null | number | "end">;

/**
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
 */
export type MorphScrollHandle = {
  /** run a scroll now; `duration: 0` jumps without animating */
  scrollTo: (target: ScrollTarget, options?: { duration?: number }) => void;
  /**
   * bring one object into view.
   * @description
   * A place in the list rather than in pixels — the one a caller can name:
   * with `render` the object may not be in the document, and with
   * `objects.size: "auto"` only the library knows where it ended up.
   *
   * `target` is a place counted from one, a child's `key`, or a group name,
   * which a child gives itself: `ms-group="news"`. A group goes to its first
   * object; a key wins over a group of the same name.
   *
   * `align` is `"start"` by default, `"center"`, or `"end"`. The object stops
   * short of the edge by whatever is really in that place: the `objects.gap`
   * it holds against its neighbour, or `wrapper.margin` where the objects run
   * out — so `scrollToObject(1, "start")` arrives where `scrollTo(0)` does.
   * A pair aims the axes apart under `direction="hybrid"`:
   * `["center", "start"]`.
   * @note *`align` asks, the range answers: an object near either end of an
   * axis cannot be moved off it, so all three land in the same place there —
   * the first object is at the start whatever you ask for*
   */
  scrollToObject: (
    target: number | string,
    options?: {
      duration?: number;
      align?: Align | Pair<Align>;
      reason?: NavigateReason;
    },
  ) => void;
  /**
   * turn one page toward that side — the move the arrow buttons make.
   * Does nothing at the end of the run, unless `loop` has made it endless.
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
  /** set a custom class name. */
  className?: string;
  /** add custom user content. */
  children?: React.ReactNode;
  /** set custom inline styles. */
  style?: React.CSSProperties;
  /**
   * defines size measurement behavior.
   * @description
   * - `inner`: *Fits content*
   * - `outer`: *Fills parent*
   * - `all`: *Combines both*
   * @default "inner"
   */
  measure?: "inner" | "outer" | "all";
  /**
   * callback on dimension change.
   * @param rect is the dimensions of the container.
   */
  onResize?: (rect: Partial<DOMRectReadOnly>) => void;
};

export type IntersectionTracker = {
  /** set a custom class name. */
  className?: string;
  /** add custom user content. */
  children?: React.ReactNode;
  /** set custom inline styles. */
  style?: React.CSSProperties;
  /**
   * root element.
   * @default document viewport
   */
  root?: Element | null;
  /**
   * margin for the root element.
   * @note
   * *It can be a number or an array of 2 or 4 numbers*
   */
  rootMargin?: SpacingValue;
  /**
   * visibility threshold for triggering intersection events.
   * @note
   * *a value between `0` (out of view) and `1` (fully visible) can be single or an array*
   */
  threshold?: number | number[];
  /**
   * callback triggered when `threshold` is met.
   * @param entry is the IntersectionObserverEntry object.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry
   */
  onIntersection?: (entry: IntersectionObserverEntry) => void;
};

export type MorphScroll = {
  // — GENERAL —
  /**
   * your own class on the root element.
   * @note *where an `.ms-object-box` stands is said with `transform`, and a
   * CSS animation touching `transform` on it outranks that — animate what is
   * inside the box instead*
   */
  className?: string;
  /** the objects; give each a key of its own, as React asks */
  children?: React.ReactNode;

  // — SCROLL —
  /**
   * change how the scroll behaves and what the progress element is.
   * @default "scroll"
   * @description
   * - `"scroll"`: *a thumb running along a track*
   * - `"slider"`: *a carousel — one element per page; the strip is a handle,
   * dragged along, and a press on it does nothing*
   * - `"sliderMenu"`: *the same pages, but the strip is a menu — a press on
   * an element turns to its page, and there is nothing to drag*
   * @note *what tells them apart is the gesture the strip answers, and the
   * cursor says which. The elements are yours either way: `controls.bar`
   * takes an array, one node per page, in both*
   * @note *a slider draws one element per page, so a long list makes a long
   * strip of them: they are for a handful of pages, a growing list is
   * `mode="scroll"`*
   * @note *a page is one window, so content that does not divide into whole
   * windows ends on a short one — `objects.size: "full"` keeps them equal*
   */
  mode?: "scroll" | "slider" | "sliderMenu";
  /**
   * change the scrolling direction.
   * @default "y"
   */
  direction?: "x" | "y" | "hybrid";
  /**
   * the list begins at the right and runs leftwards.
   * @default false
   * @description
   * The first object stands at the right and a horizontal scroll opens there:
   * the bar starts at the right, and a slider's first page is the right dot.
   * The objects themselves are left alone — how they look is yours.
   * @note *positions are still counted from the start of the list, so
   * `scrollTo(0)` and `scrollToObject` reach the first object either way; only
   * the element's own `scrollLeft` counts from the left, where the start of
   * the list is its largest value*
   */
  fromRight?: boolean;
  /**
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
   */
  initialPosition?: ScrollTarget;
  /**
   * keeps the scroll at the end of its content.
   * @description
   * A standing rule rather than a move: every time the content grows the
   * scroll follows it, and it opens at the end too. It steps aside as soon as
   * the reader scrolls away from the end, and picks up again when they come
   * back — a chat that does not fight the person reading its history.
   * @note a pair sets the axes apart: `[true, false]` in `direction="hybrid"`
   * follows the right edge and leaves the bottom alone
   */
  stickToEnd?: boolean | Pair<boolean>;
  /**
   * the content runs in a circle, with no start and no end. The strip stays a
   * fixed length: the position moves by one period whenever the window leaves
   * the middle copy, where the content is the same.
   * @default false
   * @note *the list is repeated, not referenced — a few copies of every child
   * are mounted, so give a long one `render.mode`*
   * @note *`stickToEnd` has no end to hold onto and is refused*
   * @note *a period is the exact length of the content, so a size that can be
   * counted is needed; `objects.size: "auto"` measures it for you*
   * @see the README for the slider modes, `edge` and `scrollTo` inside a turn
   */
  loop?: boolean;
  /**
   * how long a move takes, in ms.
   * @default 200
   * @description
   * The animation length of every move the scroll makes on its own: an arrow,
   * a key, a focus step, a slider settling after a drag. Commands on the `ref`
   * take it as their default and can override it per call. `0` jumps.
   */
  duration?: number;
  /**
   * an object dragged toward an edge scrolls the list under it.
   * @note *the dragged object is either `draggable="true"` or carries
   * `ms-custom-drag` for a drag of your own; while it moves the scroll, the
   * root carries `ms-under-drag`*
   */
  autoScrollOnDrag?: boolean;

  // — SIZE —
  /**
   * how big the scroll is — the only prop it cannot do without.
   * @description
   * - `number`: *the same for both sides*
   * - `[x, y]`: *a pair*
   * - `"auto"`: *takes it from the parent element*
   */
  size: number | "auto" | Vec2;
  /**
   * everything about the objects themselves: how big they are, how they sit
   * next to each other, and what to do with the empty ones.
   * @default { order: "row" }
   * @description
   * - `size`: *a number, a pair for both axes, `"full"` for all the room an
   * object has — the scroll less `wrapper.margin` — `"firstChild"` to measure
   * the first one, or `"auto"` to hand a side to the object itself*
   * @note *an unnamed `size` answers for the objects rather than standing
   * aside: across the scroll an object takes the whole window, along it the
   * size is its own — a slider's page is the window on both sides, and
   * `direction="hybrid"` hands both to the objects. All of that can be
   * counted, so `render` and `loop` work with nothing named. The exception is
   * `lines` above one without a size: that is a grid whose track widths your
   * CSS decides, and nothing can count them — name a size to get them back*
   * - `gap`: *space between the objects, one number or `[x, y]`*
   * - `lines`: *how many lines the objects run in, across the scroll — `1` in
   * `direction="hybrid"`, where nothing else can end one*
   * - `align`: *where a short last line sits*
   * - `order`: *which way the list runs through the lines — `"row"` fills a
   * row and moves down, `"column"` fills a column and moves right*
   * - `empty`: *`"clear"` removes objects that render nothing, `"fallback"`
   * replaces them with `fallback.empty`*
   * @note *which side you hand over with `"auto"` arranges them: along the
   * scroll is a masonry — fixed columns, each object into the shortest one;
   * across it, or both, is a flow — a line at a time, ended by the room or by
   * `lines`*
   * @note *a side left to CSS is the one `render` cannot count; `"auto"` it
   * can, and pages need one size for all — so `"auto"` is for `mode="scroll"`*
   * @see the README for how each arrangement places its objects
   */
  objects?: ObjectsConfig;
  /**
   * everything about the `.ms-objects-wrapper` box that holds your objects.
   * @description
   * - `margin`: *space around the box; 1, 2 or 4 numbers*
   * - `minSize`: *the box never gets smaller than this; `"full"` means the
   * `size` prop*
   * - `align`: *where the box sits when it is smaller than `size`*
   */
  wrapper?: WrapperConfig;

  // — CONTROLS —
  /**
   * everything that can move the scroll.
   * @default { wheel: true, keys: true }
   * @description
   * - `wheel`: *allow to scroll by mouse wheel; in the slider modes one notch
   * turns one page*
   * - `drag`: *allow to scroll by dragging the content. A scroll moving one
   * way takes only drags going that way; one going across it is handed to
   * whoever outside can move that way*
   * - `keys`: *arrow keys move the scroll while it has focus*
   * - `bar`: *the progress element, plus everything about how it sits*
   * - `arrows`: *add custom arrows*
   * @note
   * - *what you write replaces the default rather than adding to it: name a
   * bar and the wheel is not thrown in — `{ wheel: true, bar }` asks for both.
   * `{ wheel: true, keys: true }` is only what an unwritten prop means*
   * - *a name, or a list of them, switches those on: `"wheel"` is
   * `{ wheel: true }`*
   * - *`bar` draws a thumb or a slider depending on `mode`; `bar: true` with
   * `mode="scroll"` hands the job to the browser's own scrollbar*
   * - *`drag` skips text fields and anything with a drag of its own*
   */
  controls?: ControlName | ControlName[] | ControlsConfig;
  /**
   * marks the edges where the content is cut off.
   * @description
   * a place and a signal, not a ready-made gradient: `.ms-edge` is stretched
   * along its side and carries `--ms-edge-visibility` (`0` / `1`). What it
   * looks like is up to your CSS or the node you pass in.
   * @note *author the node once, the way it looks along the top: the library
   * turns it onto the other three sides*
   * @note *`{ element, size }` names the thickness too, the way `arrows.size`
   * does; without it the thickness is yours to write in CSS*
   */
  edge?: boolean | React.ReactNode | EdgeConfig;

  // — OPTIMIZATION —
  /**
   * draw only what is worth drawing — for lists too long to mount whole.
   * @description
   * - `mode`: *`"lazy"` draws an object once it comes near and keeps it;
   * `"virtual"` also drops it again once it leaves*
   * - `rootMargin`: *how far beyond the window counts as near*
   * - `deferLoadOnScroll`: *holds new content back while the scroll moves,
   * and lets it in once the scroll settles*
   * @note
   * *`render` places objects by counting, and an unnamed `objects.size`
   * answers for them, so it works with nothing else named. The one size it
   * cannot count is `objects.lines` above one without a size — that grid's
   * tracks are your CSS's to decide*
   */
  render?:
    | "lazy"
    | "virtual"
    | {
        mode: "lazy" | "virtual";
        rootMargin?: SpacingValue;
        deferLoadOnScroll?: boolean;
      };
  /**
   * report how much of every object shows, through `--ms-content-visibility`
   * on its `.ms-object-box` — `0` out of sight, `1` whole, a fraction in
   * between.
   * @description
   * Nothing is styled and nothing is dropped: the objects stay mounted and
   * simply know where they are, so a card can fade or shrink as it leaves.
   * It goes with `render` and without it alike.
   * @note *the ratio is counted against the window itself, so
   * `render.rootMargin` does not widen it — an object preloaded past the
   * edge reports `0` until it truly shows*
   * @note *counted by place, so it needs an `objects.size` that can be
   * counted — the same one `render` needs*
   */
  trackVisibility?: boolean;
  /** wrap the objects in React Suspense */
  suspending?: boolean;
  /**
   * what stands in for an object that is not showing.
   * @description
   * A node stands in wherever that happens. The two occasions can be told
   * apart by name: `loading` while an object is on its way — `suspending`
   * and `render.deferLoadOnScroll` — and `empty` where one rendered nothing,
   * under `objects.empty: "fallback"`.
   * @note *`empty` is a refinement, not a separate set: leaving it out is not
   * turning it off, and the one you did name stands in there too*
   */
  fallback?: React.ReactNode | FallbackConfig;

  // — EVENTS —
  /**
   * callback for scroll value.
   * @param left current scroll position on the x-axis.
   * @param top current scroll position on the y-axis.
   * @param max how far each axis can go — the position at its very end, read
   * from the element itself, so it is a position the scroll really reaches.
   * @description
   * `max` is what makes this a "load more" signal without a prop for it: how
   * far the end is, is `max` minus the position. With `render` or
   * `objects.size: "auto"` nothing else *can* know it.
   * @note *test it with a distance, not equality: the sizes it comes from are
   * whole numbers while the position need not be, and under browser zoom the
   * two drift apart — `max.y - top < 1` is "at the end"*
   * @note *in `loop` there is no end, and `max` measures the whole strip*
   */
  onScrollPosition?: (
    left: number,
    top: number,
    max: { x: number; y: number },
  ) => void;
  /**
   * called when the scroll starts moving and when it stops.
   * @param motion whether it is moving now
   */
  onScrollingChange?: (motion: boolean) => void;
  /**
   * callback for a move from one page to another.
   * @param event which page the scroll left, which one it goes to, and what
   * put it there.
   * @description
   * the discrete half of scrolling — an arrow, a slider dot, a drag that
   * settled on the next page. Continuous movement is `onScrollPosition`; this
   * fires once per page turn, so it is where a sound or an analytics event
   * belongs.
   * @note *a turn asked for reports the moment it is asked: three quick
   * presses share one ride and still report three times. One reached without
   * asking reports when the scroll settles, as `"scroll"`*
   * @note *in `mode="scroll"` only commands page the content*
   */
  onNavigate?: (event: NavigateEvent) => void;
  /**
   * called when the set of drawn objects changes — what `render` is keeping.
   * @param keys the keys of the children currently in the document
   */
  onRenderedKeysChange?: (keys: string[]) => void;
};

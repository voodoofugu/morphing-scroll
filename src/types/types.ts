/** a pair by axis: x always first, y second */
export type Pair<T> = [x: T, y: T];
export type Vec2 = Pair<number>;

type Edges = [top: number, right: number, bottom: number, left: number];
type SpacingValue = number | Vec2 | Edges;
type Align = "start" | "center" | "end";
type MinSize = number | "full";
type ObjectSize = number | "full" | "firstChild" | "auto" | "none";

/** how the objects are arranged once their sizes are known */
type ObjectsLayout = "grid" | "masonry" | "flow" | "fill";

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
  | "scroll"
  // `& {}` не даёт литералам выше раствориться в `string` и потерять подсказки
  | (string & {});

/** the argument of `onNavigate` */
export type NavigateEvent = {
  /**
   * `"scroll"` — the content got there on its own: a drag, the wheel, inertia
   */
  reason: NavigateReason;
  axis: "x" | "y";
  from: number;
  to: number;
};

/** the object form of `objects` */
export type ObjectsConfig = {
  /**
   * how the objects are arranged. Leave it out and the sizes say it: a side
   * handed to the objects with `"auto"` is the side the layout measures
   */
  layout?: ObjectsLayout;
  /**
   * one value for both sides, or a pair. `"auto"` hands that side to the
   * object itself. In a pair `undefined` means the same as `"none"`: there is
   * no empty slot to leave, so a computed value has to be able to say it
   */
  size?: ObjectSize | Pair<ObjectSize | undefined>;
  gap?: number | Vec2;
  /** how many lines the objects run in, across the scroll */
  lines?: number;
  /**
   * describe the objects to assistive technology.
   *
   * `"list"` marks the wrapper as a list and every object as one of its
   * items, numbered. It matters most with `render`: only a window of the
   * objects is in the document, so a screen reader would otherwise announce
   * a list of a dozen and give no way to tell where in the real list you are.
   *
   * Left out, nothing is claimed: the objects may be cards, slides or a menu,
   * and calling those a list would describe them wrongly.
   */
  semantics?: "list";
  /**
   * what a group of objects does. A group is named in the child's own `key`,
   * in brackets at the end: `"post-4[news]"` belongs to `news`.
   *
   * `"sticky"` keeps the first object of the group in view for as long as any
   * of its group is: it stays against the leading edge and is pushed out by
   * the group that follows. That first object is the group's heading, so it
   * always says which group you are looking at. It carries `ms-sticky` while
   * it is held there.
   *
   * The same names reach `scrollToObject`, which goes to a group's first
   * object.
   */
  groups?: "sticky";
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

/** the object form of `emptyObjects` */
export type EmptyObjectsConfig = {
  mode: "clear" | "fallback";
  /** what stands in for an empty object; the `fallback` prop when omitted */
  fallback?: React.ReactNode;
  /** start clearing when something matching this selector is clicked */
  clickTrigger?: string | { selector: string; delay?: number };
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
   * A place in the list rather than a place in pixels, which is the one a
   * caller can actually name: with `render` the object may not be in the
   * document at all, and with `objects.size: "auto"` only the library knows
   * where it ended up.
   *
   * `target` is a position in the list, a child's `key`, or the name of a
   * group — written in the key itself, in brackets at the end: a child keyed
   * `"post-4[news]"` is reached by `"post-4"` and by `"news"` alike, and a
   * group goes to its first object. A key wins over a group of the same name.
   *
   * `align` says where in the window it lands: `"start"` by default,
   * `"center"`, or `"end"`.
   */
  scrollToObject: (
    target: number | string,
    options?: {
      duration?: number;
      align?: "start" | "center" | "end";
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
  /** set a custom class name. */
  className?: string;
  /** add custom user content. */
  children?: React.ReactNode;

  // — SCROLL —
  /**
   * change how the scroll behaves and what the progress element is.
   * @default "scroll"
   * @note *the slider modes draw one element per page, so the count follows
   * the content: a long list makes a long strip of them, and past a point it
   * outgrows the scroll it belongs to. There is no cap on purpose — hiding
   * pages would make the progress lie about where you are. They are for a
   * handful of pages; for a list that keeps going, `mode="scroll"` shows the
   * same position in one thumb*
   */
  mode?: "scroll" | "slider" | "sliderMenu";
  /**
   * change the scrolling direction.
   * @default "y"
   */
  direction?: "x" | "y" | "hybrid";
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
   * the content runs in a circle, with no start and no end.
   * @default false
   * @description
   * The same children repeat forever in both directions, and the seam is not
   * visible: the scroll keeps a fixed length and moves the position by one
   * period whenever the window leaves the middle copy — under the window at
   * that moment is the very same content. Nothing grows, so nothing runs into
   * the browser's own limit on how long a scroll can be.
   *
   * The slider modes turn too, counting pages within one turn, and
   * `direction="hybrid"` turns both ways at once.
   * @note *the list is repeated, not referenced: a few copies of every child
   * are mounted at once. `render.mode` cuts that back to the window, so give
   * a long list virtualising*
   * @note *`stickToEnd` has no end to hold onto and is refused*
   * @note *`objects.size: "auto"` waits for its measurements: the circle
   * closes by itself once there is nothing left to measure*
   * @see the README for what the progress element, `edge` and `scrollTo` do
   * inside a turn
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
   * enables automatic scrolling when dragging elements near the edges of the container.
   * @note
   * *Supports attributes:*
   * - *`draggable="true"`*
   * - *`ms-custom-drag`*
   *
   * *Set attribute: `ms-under-drag`*
   */
  autoScrollOnDrag?: boolean;

  // — SIZE —
  /**
   * width and height dimension of scroll area. ( **REQUIRED** )
   * @description
   * - `number` *sets the width and height*
   * - `Size` *width and height as an array*
   * - `"auto"` *for automatic resizing based on the parent element*
   */
  size: number | "auto" | Vec2;
  /**
   * everything about the objects themselves: how big they are, how they sit
   * next to each other, and what to do with the empty ones.
   * @default { size: "none", order: "row" }
   * @description
   * - `layout`: *`"grid"`, `"masonry"`, `"flow"` or `"fill"`. Left out, the
   * sizes say it: the side handed over with `"auto"` is the side the layout
   * measures*
   * - `size`: *a number, a pair for both axes, `"full"` for the size of the
   * scroll, `"firstChild"` to measure the first one, `"auto"` to hand a side
   * to the object itself, or `"none"` to leave it to your own CSS*
   * - `gap`: *space between the objects, one number or `[x, y]`*
   * - `lines`: *how many lines the objects run in, across the scroll*
   * - `align`: *where a short last line sits*
   * - `order`: *which way the list runs through the lines — `"row"` fills a
   * row and moves down, `"column"` fills a column and moves right*
   * - `semantics`: *`"list"` marks the objects up as a list for assistive
   * technology*
   * - `groups`: *`"sticky"` holds a group's first object in view while any of
   * its group is; groups are named in the child's own `key`, in brackets at
   * the end*
   * - `empty`: *`"clear"` removes objects that render nothing, `"fallback"`
   * replaces them with a placeholder*
   * @note *naming the layout is enough on its own: it takes the side it
   * measures, so one number covers the other — and a fill needs no size at
   * all. A `"grid"` cannot measure, so it is the one layout that wants both
   * sides given*
   * @note *the sizes are what `render` counts with, and `"auto"` counts as
   * one: the library measures it and then knows it*
   * @note *pages need one size for all, so `"auto"` is for `mode="scroll"`*
   * @see the README for how each layout arranges its objects
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
   * @description
   * - `wheel`: *allow to scroll by mouse wheel*
   * - `drag`: *allow to scroll by dragging the content*
   * - `keys`: *arrow keys move the scroll while it has focus*
   * - `bar`: *the progress element, plus everything about how it sits*
   * - `arrows`: *add custom arrows*
   * @note
   * - *a name, or a list of names, switches those on: `"wheel"` is the same
   * as `{ wheel: true }`*
   * - *`bar` renders as a thumb or as a slider depending on `mode`*
   * - *`bar: true` with `mode="scroll"` hands the job to the browser's own
   * scrollbar*
   * - *`drag` skips text fields and anything that carries its own drag ([more...](https://www.npmjs.com/package/morphing-scroll))*
   */
  controls?: ControlName | ControlName[] | ControlsConfig;
  /**
   * marks the edges where the content is cut off.
   * @description
   * a place and a signal, not a ready-made gradient: `.ms-edge` is stretched
   * along its side and carries `--ms-edge-visibility` (`0` / `1`). What it
   * looks like is up to your CSS or the node you pass in.
   * @note *author the node once, the way it looks along the top: the library
   * turns it onto the other three sides, swapping the sides of the narrow
   * slots first so a gradient written across a wide strip lands correctly down
   * a tall one*
   * @note *`{ element, size }` names the thickness of the strip too, the way
   * `arrows.size` does — a height at the top and bottom, a width at the sides.
   * Without it the thickness is yours to write in CSS*
   */
  edge?: boolean | React.ReactNode | EdgeConfig;

  // — OPTIMIZATION —
  /**
   * rendering strategy for performance optimization.
   * @descriptions
   * - `mode` — determines the render strategy:
   * - `"lazy"`: *render once when visible*
   * - `"virtual"`: *render only when visible*
   * - `rootMargin`: *distance for loading from the root element*
   * - `deferLoadOnScroll`: *holds new content back while the scroll moves,
   * and lets it in once the scroll settles*
   * - `trackVisibility`: *sets the `--ms-content-visibility` variable on every
   * object box; it needs no `mode` of its own, and without one nothing is
   * dropped — every object stays mounted and simply knows how much of it
   * shows*
   * @note
   * *`render` is not compatible with `objectsSize: "none"`*
   */
  render?:
    | "lazy"
    | "virtual"
    | {
        /** leave it out to keep every object mounted and only watch them */
        mode?: "lazy" | "virtual";
        rootMargin?: SpacingValue;
        deferLoadOnScroll?: boolean;
        trackVisibility?: boolean;
      };
  /** enables React Suspense for children. */
  suspending?: boolean;
  /**
   * element to display during loading or placeholder.
   * @note
   * *Used when:*
   * - *`suspending === true`*
   * - *`render.deferLoadOnScroll === true`*
   * - *`emptyObjects.mode === "fallback"`*
   */
  fallback?: React.ReactNode;

  // — EVENTS —
  /**
   * callback for scroll value.
   * @param left current scroll position on the x-axis.
   * @param top current scroll position on the y-axis.
   * @param max how far each axis can go — the position at its very end, read
   * from the element itself, so it is a position the scroll really reaches.
   * @description
   * The third argument is what turns this into a "load more" signal without a
   * prop for it: how far the end is, is `max` minus the position, and nothing
   * else has to know the length of the content. With `render` or
   * `objects.size: "auto"` nothing else *can* know it.
   * @note *test it with a distance rather than with equality. `max` is a whole
   * number and a scroll position need not be one — on a scaled display it
   * lands on halves — so `max.y === top` can be false at the very end.
   * `max.y - top < 1` is "at the end"; a larger number is "nearly there",
   * which is what a prefetch actually wants*
   * @note *in `loop` the content has no end, and `max` measures the strip of
   * copies rather than a turn*
   */
  onScrollPosition?: (
    left: number,
    top: number,
    max: { x: number; y: number },
  ) => void;
  /**
   * callback for scroll status.
   * @param motion boolean indicating if scrolling is in progress.
   */
  onScrollingChange?: (motion: boolean) => void;
  /**
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
   */
  onNavigate?: (event: NavigateEvent) => void;
  /**
   * callback for keys that are currently rendered inside `MorphScroll`.
   * @param keys array of rendered child keys.
   * @note
   * *Use explicit React keys to receive meaningful names.*
   */
  onRenderedKeysChange?: (keys: string[]) => void;
};

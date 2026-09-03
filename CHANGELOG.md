## [3.0.0] - 2026-09-02

A major pass over the whole library: instance isolation, a batch of fixes,
and an API cleanup. Everything breaking is listed below with what to change.

### Migration

#### Props

| 2.x                                                           | 3.0                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| `type="slider"`                                               | `mode="slider"`                                            |
| `render={{ type: "virtual" }}`                                | `render={{ mode: "virtual" }}`                             |
| `wheel: { changeDirectionKey: "KeyX" }`                       | `wheel: { changeDirectionBtn: "KeyX" }`                     |
| `scrollPosition={{ value, updater }}`                         | `ref.current.scrollTo(value)` — see below                  |
| `scrollPosition={10}`                                         | `initialPosition={10}`, or `scrollTo(10)` for a later move |
| `scrollPosition="end"`                                        | `stickToEnd`                                               |
| `scrollPosition={{ duration: 400 }}`                          | `duration={400}`                                           |
| `edgeGradient="#fff"`                                         | `edge` + your CSS                                          |
| `edgeGradient={{ color, size }}`                              | `edge` + your CSS, or `edge={<Node />}`                    |
| `controls={{ progressElement: X }}`                    | `controls={{ bar: X }}`                             |
| `progressReverse={true}`                                      | `controls={{ bar: { reverse: true } }}`             |
| `scrollBarOnHover={true}`                                     | `controls={{ bar: { showOnHover: true } }}`         |
| `scrollBarEdge={10}`                                          | `controls={{ bar: { trackGap: 10 } }}`              |
| `thumbMinSize={24}`                                           | `controls={{ bar: { thumbMinSize: 24 } }}`          |
| `elementsAlign="center"`                                      | `objects={{ align: "center" }}`                             |
| `elementsDirection="column"`                                  | `objects={{ direction: "column" }}`                         |
| `emptyElements="clear"`                                       | `objects={{ empty: "clear" }}`                              |
| `objectsSize={100}`                                           | `objects={{ size: 100 }}`                                  |
| `gap={10}`                                                    | `objects={{ gap: 10 }}`                                    |
| `crossCount={2}`                                              | `objects={{ crossCount: 2 }}`                              |
| `objectsSize="size"`                                          | `objects={{ size: "full" }}`                               |
| `dragScroll`                                                  | `autoScrollOnDrag`                                         |
| `wrapperMargin={10}`                                          | `wrapper={{ margin: 10 }}`                                 |
| `wrapperMinSize="full"`                                       | `wrapper={{ minSize: "full" }}`                            |
| `wrapperAlign="center"`                                       | `wrapper={{ align: "center" }}`                            |
| `onScrollValue`                                               | `onScrollPosition`                                         |
| `isScrolling`                                                 | `onScrollingChange`                                        |
| `arrows: { contentReduce: true }`                             | `arrows: { reserveSpace: true }`                           |
| `<IntersectionTracker visibleContent>`                        | `<IntersectionTracker>` — that is the only behaviour now   |
| `progressTrigger={{ … }}`                                     | `controls={{ … }}`                                         |
| `progressTrigger={{ content: true }}`                          | `controls={{ drag: true }}`                                |

Everything about the scrollbar now lives inside `controls.bar`, the
same way everything about the arrows already lived inside
`controls.arrows`. Four top-level props are gone, and the names lose
the prefixes they no longer need:

```tsx
controls={{
  wheel: true,
  bar: {
    element: <Thumb />,
    edgeGap: 8,        // new: distance from the side the bar sits on
    trackGap: 10,      // was scrollBarEdge
    reverse: true,     // was progressReverse
    showOnHover: true, // was scrollBarOnHover
    thumbMinSize: 24,
  },
}}
```

`controls` also accepts a name or a list of names —
`"wheel"`, `["wheel", "drag"]`, `"bar"` — which is the same as
`{ wheel: true }` and `{ wheel: true, drag: true }`. The object form is
unchanged.

#### IntersectionTracker only watches now

It used to hide its children until they came into view, and `visibleContent`
turned that off — which is how it was actually used, since the sentinel case
("tell me when this is seen") had to opt out of the hiding first.

Hiding by visibility is what `MorphScroll`'s `render` is for, and it does it
better: it works from positions instead of an observer per element. So the
tracker stopped doing it. `visibleContent` is gone, children are always
rendered, and a sentinel is one prop:

```tsx
<IntersectionTracker onIntersection={loadMore}>{children}</IntersectionTracker>
```

It also stopped re-rendering its subtree every time visibility flipped —
there is no state left in it to change.

#### One box, one prop

Three props described the same internal box, the way four props once
described the scrollbar:

```tsx
wrapper={{ margin: 10, minSize: "full", align: "center" }}
```

Between this, the bar and the objects, the top level goes from 28 props to
20 — and nothing was lost on the way: every one of them is still there, in
the group it was always about.

#### One way to fill an empty object

`emptyObjects` accepted a placeholder three ways — a bare node, the word
`"fallback"` plus the `fallback` prop, and `mode: { fallback }` — and the
type could not tell them apart, because `React.ReactNode` in the union
swallowed the string literals: `emptyObjects="clearr"` compiled, with no
completion for `"clear"` anywhere. One shape now:

```tsx
objects={{ empty: "clear" }}
objects={{ empty: "fallback" }}                                  // uses the fallback prop
objects={{ empty: { mode: "fallback", fallback: <Empty /> } }}   // its own placeholder
objects={{ empty: { mode: "clear", clickTrigger: ".btn" } }}
```

`emptyObjects={<Empty />}` and `mode: { fallback: <Empty /> }` are gone;
both become `{ mode: "fallback", fallback: <Empty /> }`.

#### Names that described something else

Six names pointed away from what they do:

- `progressTrigger` was named after `progressElement`, which is itself gone.
  What the prop holds is everything that can move the scroll — the wheel, the
  keys, a drag, and the two it draws for you, the bar and the arrows. Some of
  them are visible and some are not, but they are all controls, so it is
  `controls`.
- `controls.content` said what gets dragged; its neighbours all say what does
  the dragging. It is `controls.drag`, next to `wheel` and `keys`.
- `dragScroll` was not "scroll by dragging" — that is
  `controls.drag`. It is the autoscroll that runs near the edges
  while you drag an element across the list, so it is `autoScrollOnDrag`.
- `edgeGradient` no longer draws a gradient; it marks the cut-off edges and
  reports them. It is `edge`, next to `bar` and `arrows`.
- `isScrolling` was a callback wearing a predicate's name, sitting beside
  `onScrollValue` and `onRenderedKeysChange`. It is `onScrollingChange`,
  and `onScrollValue` — which reports a position, not a "value" — is
  `onScrollPosition`.
- `arrows.contentReduce` did not say what shrinks or why. The arrows take a
  strip away from the content, so it is `arrows.reserveSpace`.

#### One word per thing

`element` used to mean four different things at once: the scrolling viewport
(`.ms-element`), a child (`elementsAlign`, `emptyElements`), a slider dot
(`.ms-slider-element`) and the node you hand in (`bar.element`). A child is
an **object** everywhere now — the word `.ms-object-box` already used — and
`element` is left to mean only the node you pass:

| 2.x                  | 3.0                |
| -------------------- | ------------------ |
| `.ms-element`        | `.ms-viewport`     |
| `.ms-empty-element`  | `.ms-empty-object` |
| `.ms-slider-element` | `.ms-slider-item`  |

`objectsSize` used `"size"` for "same as the `size` prop" while
`wrapperMinSize` spelled the same idea `"full"`. Both say `"full"` now.

#### Everything about the objects in one place

Six props described the same thing from different sides, all wearing the
prefix that said so. They are one group now, the way `wrapper` and
`controls` already were:

```tsx
objects={{ size: 100, gap: 10 }}

objects={{
  size: [150, 112],
  gap: [10, 20],
  crossCount: 3,
  align: "center",
  direction: "column",
  empty: "clear",
}}
```

Two of them are written in almost every scroll — `size` and `gap` — so the
group is rarely a single key, and `gap` at the top level never said between
what: `edgeGap` and `trackGap` live under `bar`. A grouped prop replaces
rather than merges, so a spread that carries `objects` needs
`objects={{ ...base.objects, crossCount: 2 }}` where two separate props used
to just sit next to each other.

#### Moving the scroll

There are two kinds of thing here, and they used to share one prop. A scroll
has exactly one standing rule — follow the end — and everything else is a
move. So the rule is a prop of its own, `stickToEnd`, the opening position is
`initialPosition` and says in its name that it applies once, the animation
length is `duration` because it was never about a position, and every move is
a command on the `ref`:

```tsx
const scroll = useRef<MorphScrollHandle>(null);

<MorphScroll ref={scroll} size={300}>
  {children}
</MorphScroll>;

scroll.current?.scrollTo(0);
scroll.current?.scrollTo("end", { duration: 0 });
```

Nothing can pull the scroll back any more: a prop that applies once cannot
argue with a command, and `stickToEnd` steps aside as soon as the reader
leaves the end. Unlike it, `scrollTo("end")` always runs.

`scrollPosition={10}` becomes `initialPosition={10}` when it was the opening
position, and a `scrollTo(10)` in an effect when it was driven by state — the
dependency array then says out loud what the prop used to do silently.

#### Classes and attributes

| 2.x                                     | 3.0                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `.ms-arrow-box.active`                  | `.ms-arrow-box.ms-disabled` — **opposite meaning**: it marks the arrow with nowhere to go, and is never set with `loop` |
| `.ms-slider-element.active`             | `.ms-slider-item.ms-active`                                                                                             |
| `.active` while dragging                | `.ms-grabbing`                                                                                                          |
| `.hover` / `.leave` / `.remove`         | `.ms-hover` / `.ms-leave` / `.ms-remove`                                                                                |
| `.ms-edge.top` / `.ms-arrow-box.bottom` | `.ms-edge.ms-top` / `.ms-arrow-box.ms-bottom`                                                                           |
| arrows wrapped in `.ms-arrows`          | arrows are direct children of the root again                                                                            |
| `[wrap-id=".$profile"]`                 | `[ms-wrap-id="profile"]` — the attribute carries your key, not React's path                                             |
| `[data-direction]` on a bar             | `[ms-direction]`                                                                                                        |
| `--edge-visibility`                     | `--ms-edge-visibility`                                                                                                  |
| `--content-visibility`                  | `--ms-content-visibility`                                                                                               |

New: a scroll that is running marks its root with `ms-scrolling`, and a
scrollbar under `bar.showOnHover` carries `--ms-bar-visibility`.

#### Styling you now own

Three things no longer style themselves. Each needs a couple of lines to
look like it did in 2.x.

`bar.showOnHover` reports state instead of writing `opacity`:

```css
.ms-bar {
  opacity: var(--ms-bar-visibility, 1);
  transition: opacity 0.2s ease-in-out;
}
```

`edge` marks the edges instead of drawing a gradient:

```css
.ms-edge {
  opacity: var(--ms-edge-visibility);
  transition: opacity 0.2s ease-in-out;
}
.ms-edge.ms-top,
.ms-edge.ms-bottom {
  height: 40px;
  background: linear-gradient(#fff, transparent);
}
```

`arrows.size` sets the thickness of the `.ms-arrow-box` strip only; the icon
you pass decides its own size.

#### DOM structure

The component root now sets `position: relative` — arrows resolved against
whatever was positioned further up the page before, which is why they could
end up in the wrong place. Each arrow is a direct child of the root; the icon
sits in `.ms-arrow` inside each `.ms-arrow-box`, and an edge's content sits
in `.ms-edge-inner`. Those inner elements carry the rotation and mirroring,
so one icon and one gradient still serve all four sides — the slots
themselves are no longer transformed and can be positioned from CSS.

### Added

- `controls.keys` — the arrow keys move the scroll while it has
  focus. `mode: "step"` turns a page and reports through `onNavigate` as
  `"keys"`; `mode: "pan"` nudges by `step` pixels; `mode: "focus"` moves
  focus to the neighbouring object and the scroll follows it, picking the
  neighbour by geometry so a grid walks its row and drops to the next one
  and focus landing on the `.ms-object-box` itself, to style as one card.
  The object stops an `objects.gap` short of the edge rather than against it, and
  where the objects run out it is `wrapper.margin` that opens instead — out
  of the room the object leaves in the window, so one the size of the window
  lands exactly on the edge.
  Defaults to `"step"` in the slider modes and `"pan"` in `mode="scroll"`,
  takes only the keys of the scrolling axis in those two, and leaves the
  arrows alone inside a text field.
- `stickToEnd` sticks to the bottom by position instead of by the
  direction of the last movement. It followed new content only while a
  reading of "the user was going down" survived, and that reading is wiped
  `SCROLL_END_DELAY` after movement stops — so a slow drag upward, which is
  a drag with pauses in it, lost the guard and threw the reader back to the
  bottom the moment older messages loaded. A fast drag kept it and behaved.
  Now it asks whether the scroll was at the bottom when the content changed,
  which no pause can affect; the scroll's own animation frames no longer
  count as the user leaving.
- `stickToEnd` also takes a pair. In `direction="hybrid"` the axes may want
  different things: `[true, false]` follows the right edge as the content
  grows and leaves the bottom where the reader left it.
- `onNavigate` — one event per page turn, with `reason` (`"arrows"` / `"bar"`
  / `"keys"` / `"scroll"`, or your own from a `ref` command), `axis`, `from`
  and `to`. A turn that was asked for reports at the asking, one event per
  press; a page reached without asking reports on the settle.
  `onScrollPosition` reports continuous movement, so a sound or a haptic hangs
  off `onNavigate` without firing per frame — or per page flown past on the way.
- `ref` with `scrollTo(target, { duration })`, plus `step(side, { reason })`,
  `pan({ x, y }, { reason })` and `moveFocus(side, { reason })` — the moves
  the library makes for its own triggers, named so anything else can make
  them too. `reason` takes any
  string and comes back out of `onNavigate` unchanged, which is how a
  gamepad, a remote or your own hotkeys reach the scroll without the library
  growing a driver for each of them.
- `controls.bar` accepts an object with everything about the
  scrollbar in it. `edgeGap` is new: the distance from the side the bar sits
  on, negative pushes it past the edge.
- Public types: `MorphScrollProps`, `ResizeTrackerProps`,
  `IntersectionTrackerProps`, `MorphScrollHandle`, `ScrollTarget`,
  `ControlName`, `ControlsConfig`, `WheelConfig`,
  `KeysConfig`, `BarConfig`, `ArrowsConfig`, `ObjectsConfig`,
  `WrapperConfig`, `EmptyObjectsConfig`, `NavigateEvent`, `NavigateReason`,
  `Pair`.
- `Pair<T>` is the one way an axis pair is written. `Vec2` is
  `Pair<number>`, and the loose `boolean[]` / `(number | "full")[]` forms
  are gone — an axis pair no longer accepts an array of any length, so
  `wrapperMinSize={[1, 2, 3, 4]}` stops compiling.
- `ControlsConfig` is written out instead of being subtracted from
  the prop with `Exclude<>`, so its shape is readable and its halves have
  names.
- `controls` shorthand.
- `ms-scrolling` on the root while a scroll is running.

### Fixed

- Two scrolls on one page no longer interfere. Scheduled work, gesture
  state, rAF schedulers and the overscroll loop were module-level, so a
  second instance took over the first one's: `isScrolling` stuck on `true`,
  loaded keys not updating, a scrollbar never hiding, a drag cancelled
  mid-gesture, and a second scroll travelling the wrong distance.
- Gestures track `pointerId`. Two fingers on two lists no longer fight, and
  a stray pointer no longer scrolls a list nobody is touching.
- The document cursor lock is reference counted, so unmounting mid-drag no
  longer leaves `cursor: grabbing` on the page forever.
- `controls={{ drag: true, bar: true }}` drags the content again;
  only the native scrollbar itself is excluded.
- `objects.size="firstChild"` with `render` renders at all.
- A scroll inside a scroll no longer moves both at once.
- The rubber band engages at the far edge when the DOM stops short of the
  computed maximum.
- `render.rootMargin` sides are correct on the horizontal axis.
- The wheel no longer takes focus away from an input.
- `onScrollingChange` fires once per scroll, not once per scroll event.
- The wheel over a custom scrollbar follows the current scroll range.
- `render="lazy"` paints the visible items on the first render.
- Server rendering hydrates without an attribute mismatch.
- The wait for scrollable content is bounded instead of spinning forever.
- `console.error` survives the production build.
- An element passed inside a prop — a thumb, an arrow icon — used to be
  frozen at whatever it was on the first render. Elements are hashed by
  content now, so a changed one updates while an inline one still costs
  nothing.
- The horizontal scrollbar named no vertical side and relied on its static
  position.
- A running scroll animation re-aims when its target moves. A chat that
  received a second batch of messages while travelling to the end of the
  first one stopped short of the bottom: the animation lock dropped the new
  request instead of retargeting.
- Both axes animate at once in `direction="hybrid"`; the frame queue keyed
  them together, so only the last of the two requests arrived.
- The wheel over a scrollbar no longer moves the page underneath as well.
- `pan` with `duration: 0` moves in the same frame. It travelled through the
  animation lock and arrived a frame late, so a gamepad stick — which sends
  one every frame — jerked in place instead of moving.
- A position asked for before the content was measured lands. With
  `size="auto"` or `objects.size="firstChild"` the scrollable range is zero for
  the first few frames, so the target was clipped to zero and both
  `initialPosition` and a `scrollTo` from a mount effect did nothing. They now
  wait for a range that can hold them.
- A `gap` given as a pair reached the axes swapped everywhere outside the
  layout itself: a page step along x took the vertical gap and a step along
  y the horizontal one, so the arrows, the keys, a drag along the slider and
  the page numbers in `onNavigate` all counted a step of the wrong length.
  A single number was never affected.
- A slider counted its pages against a viewport of zero before it was
  measured, so `size="auto"` asked for an endless list of dots and threw.
- An axis left empty in a size pair means what `"none"` means. A computed
  `objects.size={[width, tall ? 100 : undefined]}` fell through the check
  that looks for the word, took the general path and lost the axis that was
  given: `[100, undefined]` came out three hundred wide.
- A drag along the slider bar aims at the element under the pointer instead
  of counting how far the pointer travelled. Steps used to land away from
  the element boundaries, a pointer coming back from outside the bar moved
  the scroll straight away, and the flight itself was shorter than a frame —
  so the same drag looked like a scroll one time and a jump the next.

### Changed

- `arrows.reserveSpace` is off by default, where `contentReduce` was on. The
  arrows lie over the content until you ask for the strip, so the setting
  turns something on instead of cancelling it. A 2.x scroll that relied on
  the old default needs `reserveSpace: true` to look the same.
- `objects.size` takes `"each"`: objects keep the size they came with, and
  the library measures it. Which side is handed over decides the layout —
  along the scroll it is a masonry (`[90, "each"]`: fixed columns, each
  object into the shortest one, so the bottom stays even); across it, or on
  both sides, a flow, where objects follow one another with the same gap
  between them and a line ends when the room across runs out — or when
  `crossCount` says it is full, which is what `direction="hybrid"` uses,
  since both ways scroll and nothing else can end a line. `"each"` on its own
  is the short way of saying it about both sides. `align` moves a line that
  did not fill the room across — and that room is the scroll minus
  `wrapper.margin`; `direction` is decided by `"each"` itself, so passing it
  says so instead of being ignored.

  One observer per scroll, not one per object, and an object is watched while
  it is on screen — a picture arriving late moves its neighbours instead of
  leaving the layout wrong. Sizes are remembered by the child's `key`, so
  they survive virtualization; not-yet-measured objects are drawn a batch at
  a time, so five hundred cards do not arrive in one frame. `render` works on
  top of all of it — once the sizes are known there is nothing left to guess.
  Pages need one size for all, so `"each"` is for `mode="scroll"`.
- `onNavigate` reports a page turn when it is asked for, not when the ride
  ends. Three quick presses of an arrow share one ride and used to arrive as
  one event; now they arrive as three, and a drag along the slider reports
  every item it passes. A page reached without asking still reports on the
  settle, as `"scroll"`. An arrow pressed again mid-flight now counts its step
  from where the scroll is heading, so a burst of presses turns a page each
  instead of standing still.
- `controls.drag` drags from buttons and links with a mouse too.
  It stays a click below 2px of movement, and the native drag of links and
  images is suppressed while the gesture runs. Text fields and anything
  carrying its own drag are still left alone.
- The bundle is compiled to ES2020 instead of ES5 — Chrome 80, Safari 14,
  Firefox 74, Edge 80 and up. Downlevelling cost an eighth of the bundle in
  helper functions: 16.0 kB gzipped now against 18.2 kB. An app that targets
  older browsers still gets them: bundlers apply their own target to the
  whole bundle.
- The published types are generated from source, so they cannot drift from
  the implementation.
- `children` is optional on all three components.
- A 2-tuple spacing value is documented as `[x, y]`, which is what it always
  was.

<h2></h2>

## [3.0.0]

A major pass over the whole library: instance isolation, a batch of fixes,
and an API cleanup. Everything breaking is listed below with what to change.

### Migration

#### Props

| 2.x | 3.0 |
| --- | --- |
| `type="slider"` | `mode="slider"` |
| `render={{ type: "virtual" }}` | `render={{ mode: "virtual" }}` |
| `progressTrigger={{ wheel: { changeDirectionKey: "KeyX" } }}` | `changeDirectionBtn: "KeyX"` |
| `scrollPosition={{ value, updater }}` | `ref.current.scrollTo(value)` — see below |
| `edgeGradient="#fff"` | `edgeGradient` + your CSS |
| `edgeGradient={{ color, size }}` | `edgeGradient` + your CSS, or `edgeGradient={<Node />}` |
| `progressTrigger={{ progressElement: X }}` | `progressTrigger={{ bar: X }}` |
| `progressReverse={true}` | `progressTrigger={{ bar: { reverse: true } }}` |
| `scrollBarOnHover` | `progressTrigger={{ bar: { showOnHover: true } }}` |
| `scrollBarEdge={10}` | `progressTrigger={{ bar: { trackGap: 10 } }}` |
| `thumbMinSize={24}` | `progressTrigger={{ bar: { thumbMinSize: 24 } }}` |
| `elementsAlign` | `objectsAlign` |
| `elementsDirection` | `objectsDirection` |
| `emptyElements` | `emptyObjects` |
| `objectsSize="size"` | `objectsSize="full"` |

Everything about the scrollbar now lives inside `progressTrigger.bar`, the
same way everything about the arrows already lived inside
`progressTrigger.arrows`. Four top-level props are gone, and the names lose
the prefixes they no longer need:

```tsx
progressTrigger={{
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

`progressTrigger` also accepts a name or a list of names —
`"wheel"`, `["wheel", "content"]`, `"bar"` — which is the same as
`{ wheel: true }` and `{ wheel: true, content: true }`. The object form is
unchanged.

#### One word per thing

`element` used to mean four different things at once: the scrolling viewport
(`.ms-element`), a child (`elementsAlign`, `emptyElements`), a slider dot
(`.ms-slider-element`) and the node you hand in (`bar.element`). A child is
an **object** everywhere now — the word `objectsSize` and `.ms-object-box`
already used — and `element` is left to mean only the node you pass:

| 2.x | 3.0 |
| --- | --- |
| `.ms-element` | `.ms-viewport` |
| `.ms-empty-element` | `.ms-empty-object` |
| `.ms-slider-element` | `.ms-slider-item` |

`objectsSize` used `"size"` for "same as the `size` prop" while
`wrapperMinSize` spelled the same idea `"full"`. Both say `"full"` now.

#### Repeating the same scroll

`scrollPosition` describes where the scroll is and applies when its value
changes, so it cannot express "go there again". That is what `updater` was
patching. It is now a command on the component `ref`:

```tsx
const scroll = useRef<MorphScrollHandle>(null);

<MorphScroll ref={scroll} size={300}>{children}</MorphScroll>;

scroll.current?.scrollTo(0);
scroll.current?.scrollTo("end", { duration: 0 });
```

Unlike the declarative `"end"`, which backs off when the user has scrolled
away from the bottom, `scrollTo("end")` always runs.

#### Classes and attributes

| 2.x | 3.0 |
| --- | --- |
| `.ms-arrow-box.active` | `.ms-arrow-box.ms-disabled` — **opposite meaning**: it marks the arrow with nowhere to go, and is never set with `loop` |
| `.ms-slider-item.active` | `.ms-slider-item.ms-active` |
| `.active` while dragging | `.ms-grabbing` |
| `.hover` / `.leave` / `.remove` | `.ms-hover` / `.ms-leave` / `.ms-remove` |
| `.ms-edge.top` / `.ms-arrow-box.bottom` | `.ms-edge.ms-top` / `.ms-arrow-box.ms-bottom` |
| arrows wrapped in `.ms-arrows` | arrows are direct children of the root again |
| `[wrap-id]` | `[ms-wrap-id]` |
| `[data-direction]` on a bar | `[ms-direction]` |
| `--edge-visibility` | `--ms-edge-visibility` |
| `--content-visibility` | `--ms-content-visibility` |

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

`edgeGradient` marks the edges instead of drawing a gradient:

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

- `ref` with `scrollTo(target, { duration })`.
- `progressTrigger.bar` accepts an object with everything about the
  scrollbar in it. `edgeGap` is new: the distance from the side the bar sits
  on, negative pushes it past the edge.
- Public types: `MorphScrollProps`, `ResizeTrackerProps`,
  `IntersectionTrackerProps`, `MorphScrollHandle`, `ScrollTarget`,
  `ProgressTriggerName`, `ProgressTriggerConfig`.
- `progressTrigger` shorthand.
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
- `progressTrigger={{ content: true, progressElement: true }}` drags the
  content again; only the native scrollbar itself is excluded.
- `objectsSize="firstChild"` with `render` renders at all.
- A scroll inside a scroll no longer moves both at once.
- The rubber band engages at the far edge when the DOM stops short of the
  computed maximum.
- `render.rootMargin` sides are correct on the horizontal axis.
- The wheel no longer takes focus away from an input.
- `isScrolling` fires once per scroll, not once per scroll event.
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

### Changed

- The published types are generated from source, so they cannot drift from
  the implementation.
- `children` is optional on all three components.
- A 2-tuple spacing value is documented as `[x, y]`, which is what it always
  was.

<h2></h2>

## [2.10.6]

### Added

-

### Changed

- Fix scrollPosition

### Fixed

-

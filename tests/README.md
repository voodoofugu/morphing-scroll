# Tests

Test suite added to lock down current behavior **before** renaming props or
adding mechanics for the next release. The goal is characterization: pin what
the library does today so refactors have a safety net.

## Layout

```
tests/
  setup.ts                 # jsdom globals: ResizeObserver / IntersectionObserver / matchMedia mocks
  helpers/dom.ts           # jsdom layout stubs + pointer/drag dispatch
  unit/
    helpers/               # tier 1 — pure helpers, rAF schedulers, handleArrow, updateKeys
    hooks/                 # tier 1 — useIdent, useUpdate
    components/            # tier 2 — trackers + MorphScroll prop/style/optimization/isolation logic (jsdom)
  e2e/
    fixture/               # minimal Vite app, scenarios via ?scenario=
    scroll.spec.ts         # tier 3 — wheel / arrows / drag / virtualization
    scrollPosition.spec.ts # tier 3 — scrollPosition + sliderMenu snapping
    autoScrollOnDrag.spec.ts     # tier 3 — auto-scroll registry (ms-custom-drag)
    hybrid.spec.ts         # tier 3 — hybrid wheel + changeDirection
```

Current status: **353 unit + 36 e2e green**, 81% statement coverage of `src`
from the unit tier alone — `autoScrollRegistry` and the gesture physics are
covered by Playwright, which this number does not see.
Covered mechanics include:
render `virtual`/`lazy`, `emptyObjects` (clear/fallback), `suspending`,
`edge`, `arrows`, the `bar` scrollbar, `direction`/`crossCount`,
`objectsSize` modes, `gap`/`wrapper.margin`/`wrapper.minSize`/`wrapper.align`/
`objectsAlign`, `bar.reverse`, `onRenderedKeysChange`, `onScrollPosition`,
`onNavigate` (reason/page, one event per gesture), `progressTrigger.keys`,
`ref.step`/`ref.pan` with a caller's own reason, hybrid wheel falling back to
the axis that can move,
`scrollPosition` (number/end), `mode: sliderMenu` snapping, `autoScrollOnDrag`
auto-scroll, hybrid `wheel.changeDirection`, plus the pure algorithms
(`startInertiaScroll`, `overscrollBackAnim`, rAF schedulers, `handleArrow`,
`updateKeys`, `autoScrollRegistry`) and the wheel/thumb/content-drag/arrow
interactions.

### Instance isolation (v3, stage 1)

`MorphScroll.isolation.test.tsx` and `MorphScroll.runtime.test.tsx` pin the
rule that **nothing about a running scroll may live in module scope**. Two
instances on one page must not see each other. They cover:

- the scroll-end task of one instance surviving another instance scrolling
  (shared keytask keys used to swallow it: `isScrolling` stuck on `true`,
  scrollbars stuck visible);
- an in-flight drag surviving a second instance starting its own;
- identical gestures on two instances landing on identical offsets;
- the document cursor lock being reference-counted, released on unmount
  mid-drag, and never released by an unrelated instance unmounting;
- the rAF schedulers / task manager / overscroll loop being built once per
  mount rather than once per render.

`tests/helpers/dom.ts` stubs jsdom layout so pointer gestures behave
deterministically — that is what makes driving two instances at once possible
in tier 2 at all.

### Point fixes (v3, stage 2)

Each of these landed test-first, and the test fails on the old code:

- `render.rootMargin` sides on the horizontal axis (`MorphScroll.optimization`);
- the wheel no longer steals focus from an input (`handleWheel` — the module
  had no tests at all before);
- `onScrollingChange` fires once per burst instead of once per scroll event
  (`MorphScroll.callbacks`);
- the wheel over a custom scrollbar follows the current scroll range
  (`ScrollBar`);
- the wait for scrollable content is bounded (`smoothScroll`);
- server rendering hydrates without an attribute mismatch (`MorphScroll.ssr`).

### Render cost and gestures (v3, stage 3)

`MorphScroll.renderCost.test.tsx` measures what scrolling actually costs,
because scroll position drives render here and the design only holds if the
update stays batched. Measured, and now pinned: every scroll event inside one
frame collapses into a single commit, a burst costs one commit per frame, an
idle scroll commits nothing, and the user's children are not re-rendered while
they stay in view — React bails out on the identical element objects held in
`childrenMap`. These went looking for a render storm and found none.

Gestures now track the `pointerId` that started them, so two fingers on two
lists no longer fight (`MorphScroll.isolation.test.tsx`), and `render="lazy"`
paints the visible items on the first pass instead of the next tick.

### Reported bugs (v3, stage 4)

Six problems came in from real use; each has a test that fails on the old
code, except the last, which was already fixed and is now held in place:

- content drag did nothing next to `bar: true`
  (`MorphScroll.contentDrag`);
- `objectsSize="firstChild"` with `render` rendered nothing at all
  (`MorphScroll.render`);
- a scroll inside a scroll moved both (`MorphScroll.nested`);
- the rubber band never engaged when the DOM stopped short of the computed
  maximum (`MorphScroll.overscroll`) — `stubLayout` had to start clamping
  scroll offsets the way a browser does before the jsdom tier could see it;
- unprefixed classes: the side names on edges and arrows
  (`classNames.test.tsx` now walks the whole tree and fails on any class
  outside `ms-`);
- a menu built out of anchors would not scroll with a finger.

### Still uncovered (candidates for the next pass)
- `handleMouseOrTouch` full flow beyond thumb/content drag (rubber-band, slider
  drag with snapping on release) — needs real `getBoundingClientRect`, so e2e.
- Touch inertia end-to-end (`page.touchscreen` + velocity) — the integrator
  itself is unit-tested; the gesture → inertia handoff is not.
- `wheel.changeDirectionBtn` (keyboard toggle).

## Running

```bash
npm test            # unit (Vitest, jsdom)
npm run test:e2e    # e2e (Playwright, Chromium)
npm run test:all    # both
npm run test:coverage
```

## Why three tiers

MorphScroll's math is driven by **numeric `size`/`objectsSize` props**, not real
measurements — so with explicit sizes, virtualization / edges / arrows /
scrollbar decisions are deterministic in jsdom (tier 2). Anything that needs a
real layout engine — wheel, drag, thumb drag, inertia, arrow paging, slider
snapping, `requestAnimationFrame` animations — can't run in jsdom and lives in
Playwright (tier 3). Pure functions are tier 1.

> Note: the in-app/Electron preview browser throttles `requestAnimationFrame`
> when backgrounded, so rAF-driven scrolling looks frozen there. Real Playwright
> Chromium runs it fine — use `npm run test:e2e`.

## Flagged behaviors (characterized, not yet changed)

These are pinned by tests as they behave **now**. Decide during the rewrite
whether they are intended:

1. **`objectsWrapperHeight` sizes its gap by the wrong axis.**
   The height branch guards on `objectsPerDirection[1]` but multiplies
   `objectsPerDirection[0]` — the width branch uses `[0]` for both. It only
   shows with `render` + an unknown `objectsSize`, which the component already
   warns against, so it is flagged rather than changed: no reproducing case
   yet. (Both `< 1` guards are also dead — `validated()` clamps the values to
   at least 1.)

2. **`wrap-id` stores the raw React path** (`.$item-0`), normalized to the clean
   key only inside `getRenderedKeysFromWrapper`. `onRenderedKeysChange` therefore
   reports clean keys, but the DOM attribute is the raw path — worth keeping in
   mind if anything reads the attribute directly.

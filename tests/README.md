# Tests

Test suite added to lock down current behavior **before** renaming props or
adding mechanics for the next release. The goal is characterization: pin what
the library does today so refactors have a safety net.

## Layout

```
tests/
  setup.ts                 # jsdom globals: ResizeObserver / IntersectionObserver / matchMedia mocks
  unit/
    helpers/               # tier 1 — pure helpers, rAF schedulers, handleArrow, updateKeys
    hooks/                 # tier 1 — useIdent, useUpdate
    components/            # tier 2 — trackers + MorphScroll prop/style/optimization logic (jsdom)
  e2e/
    fixture/               # minimal Vite app, scenarios via ?scenario=
    scroll.spec.ts         # tier 3 — wheel / arrows / drag / virtualization
    scrollPosition.spec.ts # tier 3 — scrollPosition + sliderMenu snapping
    dragScroll.spec.ts     # tier 3 — auto-scroll registry (ms-custom-drag)
    hybrid.spec.ts         # tier 3 — hybrid wheel + changeDirection
```

Current status: **160 unit + 15 e2e green**. Covered mechanics include:
render `virtual`/`lazy`, `emptyElements` (clear/fallback), `suspending`,
`edgeGradient`, `arrows`, `progressElement` scrollbar, `direction`/`crossCount`,
`objectsSize` modes, `gap`/`wrapperMargin`/`wrapperMinSize`/`wrapperAlign`/
`elementsAlign`, `progressReverse`, `onRenderedKeysChange`, `onScrollValue`,
`scrollPosition` (number/end), `type: sliderMenu` snapping, `dragScroll`
auto-scroll, hybrid `wheel.changeDirection`, plus the pure algorithms
(`startInertiaScroll`, `overscrollBackAnim`, rAF schedulers, `handleArrow`,
`updateKeys`, `autoScrollRegistry`) and the wheel/thumb/content-drag/arrow
interactions.

### Still uncovered (candidates for the next pass)
- `handleMouseOrTouch` full flow beyond thumb/content drag (rubber-band, slider
  drag with snapping on release) — needs real `getBoundingClientRect`, so e2e.
- Touch inertia end-to-end (`page.touchscreen` + velocity) — the integrator
  itself is unit-tested; the gesture → inertia handoff is not.
- `type: "slider"` drag variant; `wheel.changeDirectionKey` (keyboard toggle).
- `size: "auto"` (ResizeTracker-driven sizing).

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

1. **`createResizeHandler` — `firstZero` is dead logic.**
   `let firstZero = false` is declared inside the returned handler, so it resets
   every call. Net effect: any `0×0` measurement is always ignored (a collapse
   to zero is never reported). The variable name implies "ignore only the first
   zero", which is not what happens.
   See `tests/unit/helpers/createResizeHandler.test.ts`.

2. **`render="lazy"` paints nothing on the first render.**
   In `renderChild`, a visible item is added to `loaded` but the same pass still
   returns `null` (`if (!wasLoaded) return null`). Items only appear on the next
   render tick. In the app an update tick follows quickly; in isolation the first
   paint is empty.
   See `tests/unit/components/MorphScroll.render.test.tsx`.

3. **`wrap-id` stores the raw React path** (`.$item-0`), normalized to the clean
   key only inside `getRenderedKeysFromWrapper`. `onRenderedKeysChange` therefore
   reports clean keys, but the DOM attribute is the raw path — worth keeping in
   mind if anything reads the attribute directly.

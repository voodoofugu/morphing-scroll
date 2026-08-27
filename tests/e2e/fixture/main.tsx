import React from "react";
import { createRoot } from "react-dom/client";
import { MorphScroll } from "@morphing-scroll/src";
import type { MorphScroll as MorphScrollProps } from "@morphing-scroll/src/types/types";

/**
 * Minimal, deterministic fixtures for Playwright. Scenario is picked from the
 * `?scenario=` query param. Each renders MorphScroll with a fixed size so the
 * layout math is predictable; real browser physics (wheel/drag/arrows/snap)
 * is what these exercise — things jsdom can't do.
 */

const COUNT = 20;
const OBJ = 100;

const makeItems = () =>
  Array.from({ length: COUNT }, (_, i) => (
    <div key={`item-${i}`} className="box" data-testid={`item-${i}`}>
      item {i}
    </div>
  ));

const thumb = <div className="thumb" />;

// Expose the latest scroll offsets for assertions.
const onScrollPosition = (left: number, top: number) => {
  (window as any).__scroll = { left, top };
};

// Every page change, in order, so the reason can be asserted.
const onNavigate = (event: unknown) => {
  const log = ((window as any).__navigate ??= []);
  log.push(event);
};

const scenarios: Record<string, React.ReactElement> = {
  wheel: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      progressTrigger={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  arrows: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      progressTrigger={{
        arrows: { element: <div className="arrow" />, size: 40 },
      }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  thumb: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      progressTrigger={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  contentDrag: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      progressTrigger={{ content: true }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  virtual: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      render="virtual"
      progressTrigger={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  lazy: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      render="lazy"
      progressTrigger={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  sliderMenu: (
    <MorphScroll
      size={300}
      objectsSize={300}
      mode="sliderMenu"
      progressTrigger={{ wheel: true, bar: <div className="dot" /> }}
      onScrollPosition={onScrollPosition}
      onNavigate={onNavigate}
    >
      {makeItems()}
    </MorphScroll>
  ),

  scrollPosNumber: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      scrollPosition={200}
      progressTrigger={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  scrollPosEnd: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      scrollPosition="end"
      progressTrigger={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),
};

// hybrid grid (4 wide) that overflows on both axes.
const hybridItems = () =>
  Array.from({ length: 20 }, (_, i) => (
    <div key={`item-${i}`} className="box" data-testid={`item-${i}`}>
      item {i}
    </div>
  ));

scenarios.hybridWheel = (
  <MorphScroll
    size={300}
    objectsSize={OBJ}
    crossCount={4}
    direction="hybrid"
    progressTrigger={{ wheel: true, bar: thumb }}
    onScrollPosition={onScrollPosition}
  >
    {hybridItems()}
  </MorphScroll>
);

scenarios.hybridChangeDir = (
  <MorphScroll
    size={300}
    objectsSize={OBJ}
    crossCount={4}
    direction="hybrid"
    progressTrigger={{
      wheel: { changeDirection: true },
      bar: thumb,
    }}
    onScrollPosition={onScrollPosition}
  >
    {hybridItems()}
  </MorphScroll>
);

// autoScrollOnDrag: items are draggable handles ([ms-custom-drag]) that trigger the
// auto-scroll registry when dragged toward a container edge.
scenarios.autoScrollOnDrag = (
  <MorphScroll size={300} objectsSize={OBJ} autoScrollOnDrag>
    {Array.from({ length: 20 }, (_, i) => (
      <div key={`item-${i}`} className="box" data-testid={`item-${i}`} ms-custom-drag="">
        item {i}
      </div>
    ))}
  </MorphScroll>
);

// type: "slider" with a draggable bar — dragging along it steps pages once the
// travel passes the size of one slider element.
scenarios.sliderThumbDrag = (
  <MorphScroll
    size={300}
    objectsSize={300}
    mode="slider"
    progressTrigger={{ wheel: true, bar: <div className="dot" /> }}
    onScrollPosition={onScrollPosition}
  >
    {makeItems()}
  </MorphScroll>
);

// autoScrollOnDrag on the horizontal axis, and two containers side by side so a
// drag can travel from one into the other.
scenarios.autoScrollOnDragX = (
  <MorphScroll size={300} objectsSize={OBJ} direction="x" autoScrollOnDrag>
    {Array.from({ length: 20 }, (_, i) => (
      <div
        key={`item-${i}`}
        className="box"
        data-testid={`item-${i}`}
        ms-custom-drag=""
      >
        item {i}
      </div>
    ))}
  </MorphScroll>
);

scenarios.autoScrollOnDragPair = (
  <div style={{ display: "flex", gap: 40 }}>
    <div data-testid="left-host">
      <MorphScroll size={300} objectsSize={OBJ} autoScrollOnDrag>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`item-${i}`}
            className="box"
            data-testid={`left-${i}`}
            ms-custom-drag=""
          >
            left {i}
          </div>
        ))}
      </MorphScroll>
    </div>
    <div data-testid="right-host">
      <MorphScroll size={300} objectsSize={OBJ} autoScrollOnDrag>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={`item-${i}`} className="box" data-testid={`right-${i}`}>
            right {i}
          </div>
        ))}
      </MorphScroll>
    </div>
  </div>
);

// size: "auto" — dimensions come from a ResizeTracker around the whole scroll,
// so the host box decides them rather than a numeric prop.
scenarios.sizeAuto = (
  <div style={{ width: 280, height: 240 }} data-testid="auto-host">
    <MorphScroll
      size="auto"
      objectsSize={OBJ}
      progressTrigger={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  </div>
);

// type: "slider" driven by a content drag — releasing past the threshold
// snaps to the next page instead of stopping wherever the finger let go.
scenarios.sliderDrag = (
  <MorphScroll
    size={300}
    objectsSize={300}
    mode="slider"
    progressTrigger={{ content: true, bar: <div className="dot" /> }}
    onScrollPosition={onScrollPosition}
  >
    {makeItems()}
  </MorphScroll>
);

const params = new URLSearchParams(window.location.search);
const scenario = params.get("scenario") ?? "wheel";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {scenarios[scenario] ?? <div>unknown scenario: {scenario}</div>}
  </React.StrictMode>,
);

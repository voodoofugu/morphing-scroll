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
const onScrollValue = (left: number, top: number) => {
  (window as any).__scroll = { left, top };
};

const scenarios: Record<string, React.ReactElement> = {
  wheel: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      progressTrigger={{ wheel: true, progressElement: thumb }}
      onScrollValue={onScrollValue}
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
      onScrollValue={onScrollValue}
    >
      {makeItems()}
    </MorphScroll>
  ),

  thumb: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      progressTrigger={{ wheel: true, progressElement: thumb }}
      onScrollValue={onScrollValue}
    >
      {makeItems()}
    </MorphScroll>
  ),

  contentDrag: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      progressTrigger={{ content: true }}
      onScrollValue={onScrollValue}
    >
      {makeItems()}
    </MorphScroll>
  ),

  virtual: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      render="virtual"
      progressTrigger={{ wheel: true, progressElement: thumb }}
      onScrollValue={onScrollValue}
    >
      {makeItems()}
    </MorphScroll>
  ),

  lazy: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      render="lazy"
      progressTrigger={{ wheel: true, progressElement: thumb }}
      onScrollValue={onScrollValue}
    >
      {makeItems()}
    </MorphScroll>
  ),

  sliderMenu: (
    <MorphScroll
      size={300}
      objectsSize={300}
      type="sliderMenu"
      progressTrigger={{ wheel: true, progressElement: <div className="dot" /> }}
      onScrollValue={onScrollValue}
    >
      {makeItems()}
    </MorphScroll>
  ),

  scrollPosNumber: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      scrollPosition={200}
      progressTrigger={{ wheel: true, progressElement: thumb }}
      onScrollValue={onScrollValue}
    >
      {makeItems()}
    </MorphScroll>
  ),

  scrollPosEnd: (
    <MorphScroll
      size={300}
      objectsSize={OBJ}
      scrollPosition="end"
      progressTrigger={{ wheel: true, progressElement: thumb }}
      onScrollValue={onScrollValue}
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
    progressTrigger={{ wheel: true, progressElement: thumb }}
    onScrollValue={onScrollValue}
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
      progressElement: thumb,
    }}
    onScrollValue={onScrollValue}
  >
    {hybridItems()}
  </MorphScroll>
);

// dragScroll: items are draggable handles ([ms-custom-drag]) that trigger the
// auto-scroll registry when dragged toward a container edge.
scenarios.dragScroll = (
  <MorphScroll size={300} objectsSize={OBJ} dragScroll>
    {Array.from({ length: 20 }, (_, i) => (
      <div key={`item-${i}`} className="box" data-testid={`item-${i}`} ms-custom-drag="">
        item {i}
      </div>
    ))}
  </MorphScroll>
);

const params = new URLSearchParams(window.location.search);
const scenario = params.get("scenario") ?? "wheel";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {scenarios[scenario] ?? <div>unknown scenario: {scenario}</div>}
  </React.StrictMode>,
);

/**
 * Compile-time guard for the public API surface.
 *
 * Nothing here runs — `npm run typecheck` compiling this file *is* the test.
 * It exists because the props types are now the single source for both the
 * implementation and the published `.d.ts`, so an accidental change to a prop
 * shape, or to what is required, has nowhere else to show up.
 */
import React from "react";

import Morph, {
  MorphScroll,
  ResizeTracker,
  IntersectionTracker,
} from "../../src";
import type { MorphScrollHandle } from "../../src";

export const everyProp = (
  <MorphScroll
    className="custom"
    mode="sliderMenu"
    direction="hybrid"
    scrollPosition={{ value: "end", duration: 300 }}
    onScrollValue={(left, top) => void (left + top)}
    isScrolling={(motion) => void motion}
    onRenderedKeysChange={(keys) => void keys.length}
    size={[300, 200]}
    objectsSize={[100, "size"]}
    crossCount={3}
    gap={[10, 20]}
    wrapperMargin={[5, 5]}
    wrapperMinSize="full"
    wrapperAlign={["center", "end"]}
    elementsAlign="center"
    elementsDirection="column"
    edgeGradient={<span className="fade" />}
    progressTrigger={{
      wheel: { changeDirection: true },
      content: true,
      progressElement: <i />,
      arrows: { element: <b />, size: 40, loop: true },
    }}
    progressReverse={[true, false]}
    scrollBarOnHover
    scrollBarEdge={[4, 8]}
    thumbMinSize={24}
    render={{ mode: "virtual", rootMargin: [0, 100, 0, 100], trackVisibility: true }}
    emptyElements={{ mode: "clear", clickTrigger: { selector: ".x", delay: 100 } }}
    suspending
    fallback={<span />}
    dragScroll
  >
    <div key="a" />
  </MorphScroll>
);

export const triggerShorthand = (
  <>
    <MorphScroll size={100} progressTrigger="wheel" />
    <MorphScroll size={100} progressTrigger={["wheel", "content", "arrows"]} />
  </>
);

// @ts-expect-error only the three trigger names are shorthand
export const badTrigger = <MorphScroll size={100} progressTrigger="thumb" />;

export const shorthands = (
  <MorphScroll size="auto" objectsSize="firstChild" render="lazy" emptyElements="fallback">
    <div key="a" />
  </MorphScroll>
);

export const trackers = (
  <ResizeTracker measure="outer" onResize={(rect) => void rect.width}>
    <IntersectionTracker
      threshold={[0, 0.5, 1]}
      rootMargin={10}
      visibleContent
      onIntersection={(entry) => void entry.isIntersecting}
    >
      <div />
    </IntersectionTracker>
  </ResizeTracker>
);

// the namespace export carries the same components
export const viaNamespace = (
  <Morph.MorphScroll size={100}>
    <div key="k" />
  </Morph.MorphScroll>
);

// children are optional on every component
export const noChildren = (
  <>
    <ResizeTracker />
    <IntersectionTracker />
    <MorphScroll size={100} />
  </>
);

export const imperative = () => {
  const scroll = React.useRef<MorphScrollHandle>(null);

  scroll.current?.scrollTo(0);
  scroll.current?.scrollTo("end");
  scroll.current?.scrollTo([0, "end"], { duration: 0 });
  scroll.current?.scrollTo(null);

  return (
    <MorphScroll ref={scroll} size={100}>
      <div key="k" />
    </MorphScroll>
  );
};

export const noUpdater = (
  <MorphScroll
    size={100}
    // @ts-expect-error scrollPosition lost its updater flag in v3
    scrollPosition={{ value: 10, updater: true }}
  />
);

export const badScrollTo = () => {
  const scroll = React.useRef<MorphScrollHandle>(null);
  // @ts-expect-error scrollTo takes a scroll target, not a DOM node
  scroll.current?.scrollTo(document.body);
};

// @ts-expect-error `size` is the one required prop
export const missingSize = <MorphScroll />;

// @ts-expect-error direction has a closed set of values
export const badDirection = <MorphScroll size={100} direction="diagonal" />;

// @ts-expect-error a 2-tuple spacing value is numbers, not strings
export const badGap = <MorphScroll size={100} gap={["10", "20"]} />;

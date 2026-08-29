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
    onScrollPosition={(left, top) => void (left + top)}
    onScrollingChange={(motion) => void motion}
    onRenderedKeysChange={(keys) => void keys.length}
    size={[300, 200]}
    objectsSize={[100, "full"]}
    crossCount={3}
    gap={[10, 20]}
    wrapper={{ margin: [5, 5], minSize: "full", align: ["center", "end"] }}
    objectsAlign="center"
    objectsDirection="column"
    edge={<span className="fade" />}
    progressTrigger={{
      wheel: { changeDirection: true },
      content: true,
      bar: {
        element: <i />,
        edgeGap: [4, -8],
        trackGap: 6,
        reverse: [true, false],
        showOnHover: true,
        thumbMinSize: 24,
      },
      arrows: { element: <b />, size: 40, loop: true },
    }}
    render={{ mode: "virtual", rootMargin: [0, 100, 0, 100], trackVisibility: true }}
    emptyObjects={{ mode: "clear", clickTrigger: { selector: ".x", delay: 100 } }}
    suspending
    fallback={<span />}
    autoScrollOnDrag
  >
    <div key="a" />
  </MorphScroll>
);

export const triggerShorthand = (
  <>
    <MorphScroll size={100} progressTrigger="wheel" />
    <MorphScroll size={100} progressTrigger={["wheel", "content", "arrows", "bar"]} />
  </>
);

// @ts-expect-error only the four trigger names are shorthand
export const badTrigger = <MorphScroll size={100} progressTrigger="thumb" />;

/*
 * Эти четыре компилировались в 2.x. `React.ReactNode` в объединении съедал
 * литералы, а «пара» была массивом любой длины — опечатка и лишний элемент
 * проходили молча.
 */
// @ts-expect-error a typo in a mode used to be swallowed by ReactNode
export const badEmptyMode = <MorphScroll size={100} emptyObjects="clearr" />;
export const badMinSize = (
  <MorphScroll
    size={100}
    // @ts-expect-error an axis pair takes exactly two values
    wrapper={{ minSize: [1, 2, 3, 4] }}
  />
);
// @ts-expect-error an axis pair takes exactly two values
export const badObjectsSize = <MorphScroll size={100} objectsSize={[1, 2, 3]} />;
export const badReverse = (
  <MorphScroll
    size={100}
    // @ts-expect-error an axis pair takes exactly two values
    progressTrigger={{ bar: { reverse: [true, false, true] } }}
  />
);

/*
 * Команды с `ref` принимают своё имя причины — этим к скроллу подключается
 * устройство, о котором библиотека не знает.
 */
export const commands = (handle: MorphScrollHandle) => {
  handle.step("bottom");
  handle.step("left", { reason: "gamepad" });
  handle.pan({ y: 12 });
  handle.pan({ x: -8, y: 4 }, { duration: 0, reason: "remote" });
  handle.moveFocus("right");
  handle.moveFocus("top", { duration: 0, reason: "gamepad" });
};

export const keysModes = (
  <MorphScroll size={100} progressTrigger={{ keys: { mode: "focus" } }} />
);

export const keysModeIsClosed = (
  <MorphScroll
    size={100}
    // @ts-expect-error a key does one of three things, and "jump" is not one
    progressTrigger={{ keys: { mode: "jump" } }}
  />
);

export const emptyObjectsConfig = (
  <MorphScroll
    size={100}
    emptyObjects={{ mode: "fallback", fallback: <b />, clickTrigger: ".btn" }}
  />
);

export const shorthands = (
  <MorphScroll size="auto" objectsSize="firstChild" render="lazy" emptyObjects="fallback">
    <div key="a" />
  </MorphScroll>
);

export const trackers = (
  <ResizeTracker measure="outer" onResize={(rect) => void rect.width}>
    <IntersectionTracker
      threshold={[0, 0.5, 1]}
      rootMargin={10}
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
  // @ts-expect-error a hybrid target takes exactly two axis values
  scroll.current?.scrollTo([0, 100, "end"]);
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

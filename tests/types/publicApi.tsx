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

/* `"auto"` понимается и одной строкой на обе стороны, и в паре */
export const eachShorthand = (
  <>
    <MorphScroll size={200} objects={{ size: "auto" }} />
    <MorphScroll size={200} objects={{ size: ["auto", "auto"] }} />
    <MorphScroll size={200} objects={{ size: [100, "auto"] }} />
    <MorphScroll size={200} objects={{ size: ["auto", 100] }} />
  </>
);

export const everyProp = (
  <MorphScroll
    className="custom"
    mode="sliderMenu"
    direction="hybrid"
    stickToEnd
    duration={300}
    onScrollPosition={(left, top) => void (left + top)}
    onScrollingChange={(motion) => void motion}
    onRenderedKeysChange={(keys) => void keys.length}
    size={[300, 200]}
    objects={{
      size: [100, "full"],
      gap: [10, 20],
      lines: 3,
      align: "center",
      order: "column",
      empty: { mode: "clear", clickTrigger: { selector: ".x", delay: 100 } },
    }}
    wrapper={{ margin: [5, 5], minSize: "full", align: ["center", "end"] }}
    edge={<span className="fade" />}
    controls={{
      wheel: { changeDirection: true },
      drag: true,
      bar: {
        element: <i />,
        edgeGap: [4, -8],
        trackGap: 6,
        reverse: [true, false],
        showOnHover: true,
        thumbMinSize: 24,
      },
      arrows: { element: <b />, size: 40 },
    }}
    render={{ mode: "virtual", rootMargin: [0, 100, 0, 100], trackVisibility: true }}
    suspending
    fallback={<span />}
    autoScrollOnDrag
  >
    <div key="a" />
  </MorphScroll>
);

export const triggerShorthand = (
  <>
    <MorphScroll size={100} controls="wheel" />
    <MorphScroll size={100} controls={["wheel", "drag", "arrows", "bar"]} />
  </>
);

// @ts-expect-error only the four trigger names are shorthand
export const badTrigger = <MorphScroll size={100} controls="thumb" />;

/*
 * Эти четыре компилировались в 2.x. `React.ReactNode` в объединении съедал
 * литералы, а «пара» была массивом любой длины — опечатка и лишний элемент
 * проходили молча.
 */
export const badEmptyMode = (
  <MorphScroll
    size={100}
    // @ts-expect-error a typo in a mode used to be swallowed by ReactNode
    objects={{ empty: "clearr" }}
  />
);
export const badMinSize = (
  <MorphScroll
    size={100}
    // @ts-expect-error an axis pair takes exactly two values
    wrapper={{ minSize: [1, 2, 3, 4] }}
  />
);
export const badObjectsSize = (
  <MorphScroll
    size={100}
    // @ts-expect-error an axis pair takes exactly two values
    objects={{ size: [1, 2, 3] }}
  />
);
export const badReverse = (
  <MorphScroll
    size={100}
    // @ts-expect-error an axis pair takes exactly two values
    controls={{ bar: { reverse: [true, false, true] } }}
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
  <MorphScroll size={100} controls={{ keys: { mode: "focus" } }} />
);

export const keysModeIsClosed = (
  <MorphScroll
    size={100}
    // @ts-expect-error a key does one of three things, and "jump" is not one
    controls={{ keys: { mode: "jump" } }}
  />
);

export const emptyObjectsConfig = (
  <MorphScroll
    size={100}
    objects={{
      empty: { mode: "fallback", fallback: <b />, clickTrigger: ".btn" },
    }}
  />
);

export const shorthands = (
  <MorphScroll
    size="auto"
    objects={{ size: "firstChild", empty: "fallback" }}
    render="lazy"
  >
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

export const noPositionObject = (
  <MorphScroll
    size={100}
    // @ts-expect-error the opening position is a value, not a settings object
    initialPosition={{ value: 10, sticky: true }}
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
export const badGap = <MorphScroll objects={{ gap: ["10", "20"] }} size={100} />;

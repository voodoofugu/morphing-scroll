import React from "react";

import { MorphScroll } from "@morphing-scroll/src";
import type {
  Align,
  MorphScroll as MorphScrollProps,
  ScrollTarget,
} from "@morphing-scroll/src/types/types";

import Code from "../dashboard/Code";
import ScrollThumb from "../custom/ScrollThumb";

type DemoValue = boolean | number | string;

type Choice = {
  label: string;
  value: DemoValue;
};

type DemoSpec = {
  name: string;
  initial: DemoValue;
  input:
    | { type: "checkbox" }
    | { type: "select"; choices: Choice[] }
    | { type: "range"; min: number; max: number; step?: number };
  props: (value: DemoValue) => MorphScrollProps;
  code: (value: DemoValue) => string;
  children?: React.ReactNode;
  hint?: string;
  remount?: boolean;
  scrollableStage?: boolean;
  showRenderedCount?: boolean;
};

const items = (count = 18, draggable = false) =>
  Array.from({ length: count }, (_, index) => (
    <div
      className={`demo-item tone-${index % 6}`}
      draggable={draggable || undefined}
      key={index}
    >
      <header>
        <b>{String(index + 1).padStart(2, "0")}</b>
        {draggable && <span>drag me</span>}
      </header>
    </div>
  ));

const markers = <span className="slider-progress-dot" />;
const arrow = <span className="arrow-mark">›</span>;
const edge = (
  <span className="playground-edge">
    <span className="playground-edge-fade" />
  </span>
);

const base = (
  overrides: Partial<MorphScrollProps> = {},
): MorphScrollProps => ({
  className: "playground-scroll doc-example-scroll",
  direction: "x",
  size: "auto",
  objects: { size: [104, 70], gap: 8, lines: 2 },
  wrapper: { margin: 12 },
  controls: { wheel: true, drag: true, bar: <ScrollThumb /> },
  children: items(),
  ...overrides,
});

const bool = (value: DemoValue) => value === true;
const num = (value: DemoValue) => Number(value);
const text = (value: DemoValue) => String(value);

function Control({
  spec,
  value,
  setValue,
}: {
  spec: DemoSpec;
  value: DemoValue;
  setValue: React.Dispatch<React.SetStateAction<DemoValue>>;
}) {
  const input = spec.input;

  if (input.type === "checkbox") {
    return (
      <input
        aria-label={spec.name}
        checked={bool(value)}
        onChange={(event) => setValue(event.target.checked)}
        type="checkbox"
      />
    );
  }

  if (input.type === "select") {
    const selected = input.choices.findIndex(
      (choice) => choice.value === value,
    );

    return (
      <select
        aria-label={spec.name}
        onChange={(event) =>
          setValue(input.choices[Number(event.target.value)].value)
        }
        value={selected}
      >
        {input.choices.map((choice, index) => (
          <option key={String(choice.value)} value={index}>
            {choice.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      aria-label={spec.name}
      max={input.max}
      min={input.min}
      onChange={(event) => setValue(Number(event.target.value))}
      step={input.step}
      type="range"
      value={num(value)}
    />
  );
}

function PropDemo({ spec }: { spec: DemoSpec }) {
  const [value, setValue] = React.useState<DemoValue>(spec.initial);
  const [renderedCount, setRenderedCount] = React.useState(0);
  const props = spec.props(value);
  const children = spec.children ?? props.children;

  return (
    <>
      <div className="doc-demo-stage">
        <div
          className={`doc-demo-box${spec.scrollableStage ? " is-scrollable" : ""}`}
        >
          <MorphScroll
            {...props}
            key={spec.remount ? String(value) : undefined}
            onRenderedKeysChange={
              spec.showRenderedCount
                ? (keys) => setRenderedCount(keys.length)
                : props.onRenderedKeysChange
            }
          >
            {children}
          </MorphScroll>
        </div>
      </div>

      <label className="doc-demo-control">
        <Control setValue={setValue} spec={spec} value={value} />
        <output>
          {typeof value === "boolean" ? (value ? "on" : "off") : value}
        </output>
      </label>

      {(spec.hint || spec.showRenderedCount) && (
        <p className="doc-demo-hint">
          {spec.hint}
          {spec.hint && spec.showRenderedCount && " "}
          {spec.showRenderedCount && `Rendered now: ${renderedCount}.`}
        </p>
      )}

      <pre className="doc-demo-code">
        <Code code={spec.code(value)} lang="jsx" />
      </pre>
    </>
  );
}

const define = (spec: DemoSpec) => {
  function LiveDemo() {
    return <PropDemo spec={spec} />;
  }

  return LiveDemo;
};

const alignChoices: Choice[] = ["start", "center", "end"].map((value) => ({
  label: value,
  value,
}));

const mode = define({
  name: "mode",
  initial: "scroll",
  input: {
    type: "select",
    choices: ["scroll", "slider", "sliderMenu"].map((value) => ({
      label: value,
      value,
    })),
  },
  props: (value) => {
    const current = text(value) as MorphScrollProps["mode"];
    return base({
      mode: current,
      controls: {
        wheel: true,
        drag: true,
        bar: current === "scroll" ? <ScrollThumb /> : markers,
      },
    });
  },
  code: (value) => `<MorphScroll {...props} mode="${value}">`,
});

const direction = define({
  name: "direction",
  initial: "x",
  input: {
    type: "select",
    choices: ["x", "y", "hybrid"].map((value) => ({ label: value, value })),
  },
  props: (value) =>
    base({
      direction: text(value) as MorphScrollProps["direction"],
      objects: { size: [92, 62], gap: 8, lines: 3 },
    }),
  code: (value) => `<MorphScroll {...props} direction="${value}">`,
});

const initialPosition = define({
  name: "initialPosition",
  initial: 0,
  input: {
    type: "select",
    choices: [
      { label: "0", value: 0 },
      { label: "160", value: 160 },
      { label: "end", value: "end" },
    ],
  },
  remount: true,
  props: (value) => base({ initialPosition: value as ScrollTarget }),
  code: (value) =>
    `<MorphScroll {...props} initialPosition={${typeof value === "number" ? value : `"${value}"`}}>`,
});

function StickToEndDemo() {
  const [enabled, setEnabled] = React.useState(true);
  const [count, setCount] = React.useState(9);

  return (
    <>
      <div className="doc-demo-stage">
        <div className="doc-demo-box">
          <MorphScroll
            {...base({ stickToEnd: enabled, children: items(count) })}
          />
        </div>
      </div>
      <div className="doc-demo-controls">
        <label className="doc-demo-control">
          <input
            aria-label="stickToEnd"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          <output>{enabled ? "on" : "off"}</output>
        </label>
        <button onClick={() => setCount((current) => current + 1)} type="button">
          add item
        </button>
      </div>
      <pre className="doc-demo-code">
        <Code
          code={`<MorphScroll {...props} stickToEnd={${enabled}}>`}
          lang="jsx"
        />
      </pre>
    </>
  );
}

const autoScrollOnDrag = define({
  name: "autoScrollOnDrag",
  initial: true,
  input: { type: "checkbox" },
  hint: "Drag a card and hold it near either horizontal edge.",
  props: (value) =>
    base({ autoScrollOnDrag: bool(value), children: items(18, true) }),
  code: (value) =>
    `<MorphScroll {...props}${bool(value) ? " autoScrollOnDrag" : ""}>`,
});

const size = define({
  name: "width",
  initial: 420,
  input: { type: "range", min: 220, max: 640, step: 10 },
  scrollableStage: true,
  props: (value) => base({ size: [num(value), 240] }),
  code: (value) => `<MorphScroll {...props} size={[${value}, 240]}>`,
});

const objectsSize = define({
  name: "objects.size",
  initial: 104,
  input: { type: "range", min: 54, max: 180, step: 2 },
  props: (value) =>
    base({ objects: { size: [num(value), 70], gap: 8, lines: 2 } }),
  code: (value) =>
    `<MorphScroll {...props} objects={{ size: [${value}, 70] }}>`,
});

const objectsLines = define({
  name: "objects.lines",
  initial: 2,
  input: { type: "range", min: 1, max: 4 },
  props: (value) =>
    base({ objects: { size: [90, 48], gap: 8, lines: num(value) } }),
  code: (value) =>
    `<MorphScroll {...props} objects={{ lines: ${value} }}>`,
});

const objectsGap = define({
  name: "objects.gap",
  initial: 8,
  input: { type: "range", min: 0, max: 30 },
  props: (value) =>
    base({ objects: { size: [104, 70], gap: num(value), lines: 2 } }),
  code: (value) => `<MorphScroll {...props} objects={{ gap: ${value} }}>`,
});

const objectsAlign = define({
  name: "objects.align",
  initial: "start",
  input: { type: "select", choices: alignChoices },
  props: (value) =>
    base({
      direction: "y",
      children: items(7),
      objects: {
        size: [82, 58],
        gap: 8,
        lines: 4,
        align: text(value) as Align,
      },
    }),
  code: (value) =>
    `<MorphScroll {...props} objects={{ align: "${value}" }}>`,
});

const objectsOrder = define({
  name: "objects.order",
  initial: "row",
  input: {
    type: "select",
    choices: ["row", "column"].map((value) => ({ label: value, value })),
  },
  props: (value) =>
    base({
      direction: "y",
      objects: {
        size: [92, 58],
        gap: 8,
        lines: 3,
        order: text(value) as "row" | "column",
      },
    }),
  code: (value) =>
    `<MorphScroll {...props} objects={{ order: "${value}" }}>`,
});

function EmptyItem() {
  return null;
}

const emptyChildren = Array.from({ length: 12 }, (_, index) =>
  index % 3 === 1 ? (
    <EmptyItem key={index} />
  ) : (
    <div className={`demo-item tone-${index % 6}`} key={index}>
      <header>
        <b>{String(index + 1).padStart(2, "0")}</b>
      </header>
    </div>
  ),
);

const objectsEmpty = define({
  name: "objects.empty",
  initial: "fallback",
  input: {
    type: "select",
    choices: ["fallback", "clear"].map((value) => ({ label: value, value })),
  },
  children: emptyChildren,
  props: (value) =>
    base({
      objects: {
        size: [104, 70],
        gap: 8,
        lines: 2,
        empty: text(value) as "fallback" | "clear",
      },
      fallback: { empty: <span className="empty-fallback">empty</span> },
    }),
  code: (value) =>
    `<MorphScroll {...props} objects={{ empty: "${value}" }}>`,
});

const wrapperMargin = define({
  name: "wrapper.margin",
  initial: 12,
  input: { type: "range", min: 0, max: 40 },
  props: (value) => base({ wrapper: { margin: num(value) } }),
  code: (value) =>
    `<MorphScroll {...props} wrapper={{ margin: ${value} }}>`,
});

const wrapperMinSize = define({
  name: "wrapper.minSize",
  initial: 180,
  input: { type: "range", min: 80, max: 420, step: 10 },
  children: items(2),
  props: (value) =>
    base({
      className: "playground-scroll doc-example-scroll doc-example-wrapper",
      objects: { size: [70, 64], gap: 8, lines: 1 },
      wrapper: { margin: 12, minSize: [num(value), "full"] },
    }),
  code: (value) =>
    `<MorphScroll {...props} wrapper={{ minSize: [${value}, "full"] }}>`,
});

const wrapperAlign = define({
  name: "wrapper.align",
  initial: "start",
  input: { type: "select", choices: alignChoices },
  children: items(2),
  props: (value) =>
    base({
      className: "playground-scroll doc-example-scroll doc-example-wrapper",
      objects: { size: [70, 64], gap: 8, lines: 1 },
      wrapper: { margin: 12, align: text(value) as Align },
    }),
  code: (value) =>
    `<MorphScroll {...props} wrapper={{ align: "${value}" }}>`,
});

const controlsDrag = define({
  name: "controls.drag",
  initial: true,
  input: { type: "checkbox" },
  hint: "Try dragging the content with a mouse or pen.",
  props: (value) =>
    base({ controls: { wheel: true, drag: bool(value), bar: <ScrollThumb /> } }),
  code: (value) =>
    `<MorphScroll {...props} controls={{ drag: ${bool(value)} }}>`,
});

const barNumber = (
  name: "edgeGap" | "trackGap" | "thumbMinSize" | "maxItems",
  initial: number,
  min: number,
  max: number,
) =>
  define({
    name: `controls.bar.${name}`,
    initial,
    input: { type: "range", min, max },
    props: (value) => {
      const slider = name === "maxItems";
      const thumbSize = name === "thumbMinSize";
      return base({
        mode: slider ? "sliderMenu" : "scroll",
        objects: slider
          ? { size: [120, "full"], gap: 8, lines: 1 }
          : thumbSize
            ? { size: [180, 70], gap: 8, lines: 1 }
            : { size: [104, 70], gap: 8, lines: 2 },
        ...(thumbSize && { children: items(120) }),
        controls: {
          wheel: true,
          drag: true,
          bar: {
            element: slider ? markers : <ScrollThumb />,
            [name]: num(value),
          },
        },
      });
    },
    code: (value) =>
      `<MorphScroll {...props} controls={{ bar: { element: <${name === "maxItems" ? "Marker" : "Thumb"} />, ${name}: ${value} } }}>`,
  });

const barBoolean = (name: "reverse" | "showOnHover") =>
  define({
    name: `controls.bar.${name}`,
    initial: true,
    input: { type: "checkbox" },
    hint: name === "showOnHover" ? "Move the pointer out of the scroll." : undefined,
    props: (value) =>
      base({
        controls: {
          wheel: true,
          drag: true,
          bar: { element: <ScrollThumb />, [name]: bool(value) },
        },
      }),
    code: (value) =>
      `<MorphScroll {...props} controls={{ bar: { element: <Thumb />, ${name}: ${bool(value)} } }}>`,
  });

const arrowsElement = define({
  name: "controls.arrows.element",
  initial: true,
  input: { type: "checkbox" },
  props: (value) =>
    base({
      controls: {
        wheel: true,
        drag: true,
        bar: <ScrollThumb />,
        arrows: bool(value) ? { element: arrow } : true,
      },
    }),
  code: (value) =>
    `<MorphScroll {...props} controls={{ arrows: ${bool(value) ? "{ element: <Arrow /> }" : "true"} }}>`,
});

const arrowsSize = define({
  name: "controls.arrows.size",
  initial: 40,
  input: { type: "range", min: 24, max: 84, step: 2 },
  props: (value) =>
    base({
      controls: {
        wheel: true,
        drag: true,
        bar: <ScrollThumb />,
        arrows: { element: arrow, size: num(value) },
      },
    }),
  code: (value) =>
    `<MorphScroll {...props} controls={{ arrows: { element: <Arrow />, size: ${value} } }}>`,
});

const arrowsReserveSpace = define({
  name: "controls.arrows.reserveSpace",
  initial: false,
  input: { type: "checkbox" },
  props: (value) =>
    base({
      controls: {
        wheel: true,
        drag: true,
        bar: <ScrollThumb />,
        arrows: { element: arrow, reserveSpace: bool(value) },
      },
    }),
  code: (value) =>
    `<MorphScroll {...props} controls={{ arrows: { element: <Arrow />, reserveSpace: ${bool(value)} } }}>`,
});

const edgeDemo = define({
  name: "edge.size",
  initial: 32,
  input: { type: "range", min: 12, max: 72, step: 2 },
  props: (value) => base({ edge: { element: edge, size: num(value) } }),
  code: (value) =>
    `<MorphScroll {...props} edge={{ element: <Fade />, size: ${value} }}>`,
});

const renderMode = define({
  name: "render.mode",
  initial: "virtual",
  input: {
    type: "select",
    choices: ["virtual", "lazy"].map((value) => ({ label: value, value })),
  },
  showRenderedCount: true,
  props: (value) =>
    base({
      children: items(80),
      render: text(value) as "virtual" | "lazy",
    }),
  code: (value) => `<MorphScroll {...props} render="${value}">`,
});

const renderRootMargin = define({
  name: "render.rootMargin",
  initial: 100,
  input: { type: "range", min: 0, max: 360, step: 20 },
  showRenderedCount: true,
  props: (value) =>
    base({
      children: items(80),
      render: { mode: "virtual", rootMargin: num(value) },
    }),
  code: (value) =>
    `<MorphScroll {...props} render={{ mode: "virtual", rootMargin: ${value} }}>`,
});

export const liveDemos: Record<string, React.ComponentType> = {
  mode,
  direction,
  initialPosition,
  stickToEnd: StickToEndDemo,
  autoScrollOnDrag,
  size,
  "objects.size": objectsSize,
  "objects.lines": objectsLines,
  "objects.gap": objectsGap,
  "objects.align": objectsAlign,
  "objects.order": objectsOrder,
  "objects.empty": objectsEmpty,
  "wrapper.margin": wrapperMargin,
  "wrapper.minSize": wrapperMinSize,
  "wrapper.align": wrapperAlign,
  "controls.drag": controlsDrag,
  "controls.bar.edgeGap": barNumber("edgeGap", 8, -12, 32),
  "controls.bar.trackGap": barNumber("trackGap", 10, 0, 50),
  "controls.bar.reverse": barBoolean("reverse"),
  "controls.bar.showOnHover": barBoolean("showOnHover"),
  "controls.bar.thumbMinSize": barNumber("thumbMinSize", 30, 12, 100),
  "controls.bar.maxItems": barNumber("maxItems", 6, 1, 10),
  "controls.arrows.element": arrowsElement,
  "controls.arrows.size": arrowsSize,
  "controls.arrows.reserveSpace": arrowsReserveSpace,
  edge: edgeDemo,
  "render.mode": renderMode,
  "render.rootMargin": renderRootMargin,
};

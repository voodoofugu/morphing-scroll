import React from "react";

import { MorphScroll } from "@morphing-scroll/src";

import Code from "../../dashboard/Code";
import ScrollThumb from "../../custom/ScrollThumb";

/*
 * Живой пример к `controls.bar.edgeGap`: вместо картинки из README —
 * настоящий скролл и ползунок значения. Имя файла — путь пропса, по нему
 * страница документации находит пример.
 */
const items = Array.from({ length: 18 }, (_, index) => (
  <div className={`demo-item tone-${index % 6}`} key={index}>
    <header>
      <b>{String(index + 1).padStart(2, "0")}</b>
    </header>
  </div>
));

export default function EdgeGapDemo() {
  const [gap, setGap] = React.useState(8);

  return (
    <>
      {/* `size="auto"` меряет родителя — отступы сцены держит внешняя коробка */}
      <div className="doc-demo-stage">
        <div className="doc-demo-box">
          <MorphScroll
            className="playground-scroll"
            controls={{
              wheel: true,
              drag: true,
              bar: { element: <ScrollThumb />, edgeGap: gap },
            }}
            objects={{ gap: 8 }}
            size="auto"
            wrapper={{ margin: 12 }}
          >
            {items}
          </MorphScroll>
        </div>
      </div>

      <label className="doc-demo-control">
        <span>edgeGap</span>
        <input
          max={32}
          min={-12}
          onChange={(event) => setGap(Number(event.target.value))}
          type="range"
          value={gap}
        />
        <output>{gap}</output>
      </label>

      <pre className="doc-demo-code">
        <Code
          code={`<MorphScroll {...props} controls={{ bar: { element: <Thumb />, edgeGap: ${gap} } }}>`}
          lang="jsx"
        />
      </pre>
    </>
  );
}

import React from "react";
import { MorphScroll } from "morphing-scroll";

import { useFire } from "./fire";
import { spells } from "./spells";

/** the thumb itself: an ordinary element — the canvas sets it on fire */
const Ember = () => <span className="ember" />;

export default function App() {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { onScrollPosition } = useFire(frameRef, canvasRef);

  return (
    <main className="stage">
      <header className="title">
        <h1>Scroll of Fire</h1>
        <p>
          a fireball for a thumb, built with{" "}
          <a href="https://www.npmjs.com/package/morphing-scroll">
            morphing-scroll
          </a>
        </p>
      </header>

      <div className="frame" ref={frameRef}>
        <MorphScroll
          className="book"
          size="auto"
          objects={{ gap: 10 }}
          wrapper={{ margin: [18, 56, 18, 18] }}
          controls={{
            wheel: true,
            drag: true,
            keys: true,
            bar: {
              element: <Ember />,
              edgeGap: 14,
              trackGap: 18,
              thumbMinSize: 40,
            },
          }}
          onScrollPosition={onScrollPosition}
        >
          {spells.map((spell) => (
            <article className="spell" key={spell.id}>
              <header>
                <h2>{spell.name}</h2>
                <span>rank {spell.rank}</span>
              </header>
              <p>{spell.line}</p>
              <small>{spell.school}</small>
            </article>
          ))}
        </MorphScroll>

        {/* the fire lies on top and lets every pointer through */}
        <canvas aria-hidden className="fire" ref={canvasRef} />
      </div>

      <p className="hint">wheel · drag the fireball · drag the list · arrow keys</p>
    </main>
  );
}

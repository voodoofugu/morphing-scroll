import React from "react";

/*
 * The fire is painted on a canvas laid over the scroll. The thumb itself stays
 * an ordinary element — the ember — and every frame the canvas asks it where
 * it is: how fast it travels, whether it is held, whether it just hit an end.
 * None of that is possible with `::-webkit-scrollbar`: a pseudo-element has no
 * position you can read and nothing you can hang a canvas on.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  seed: number;
};

type RGB = [number, number, number];

const TAU = Math.PI * 2;

/** white heat → yellow → orange → red → smoke */
const RAMP: Array<[number, RGB]> = [
  [0, [255, 246, 214]],
  [0.14, [255, 214, 110]],
  [0.3, [255, 168, 44]],
  [0.5, [250, 104, 14]],
  [0.7, [214, 52, 8]],
  [0.86, [128, 22, 4]],
  [1, [40, 6, 2]],
];

const STEPS = 24;
const SPRITE = 64;

const rampAt = (t: number): RGB => {
  for (let index = 1; index < RAMP.length; index++) {
    const [stop, color] = RAMP[index];
    if (t > stop) continue;

    const [from, base] = RAMP[index - 1];
    const k = (t - from) / (stop - from);
    return [0, 1, 2].map((c) =>
      Math.round(base[c] + (color[c] - base[c]) * k),
    ) as RGB;
  }
  return RAMP[RAMP.length - 1][1];
};

/** one soft blob per step of the ramp: an image is far cheaper to draw than a gradient per particle */
const makeSprites = () =>
  Array.from({ length: STEPS }, (_, step) => {
    const [r, g, b] = rampAt(step / (STEPS - 1));
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = SPRITE;

    const ctx = sprite.getContext("2d")!;
    const half = SPRITE / 2;
    const blob = ctx.createRadialGradient(half, half, 0, half, half, half);
    blob.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    blob.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.45)`);
    blob.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, SPRITE, SPRITE);

    return sprite;
  });

const TINTS = Array.from({ length: STEPS }, (_, step) => {
  const [r, g, b] = rampAt(step / (STEPS - 1));
  return `rgb(${r}, ${g}, ${b})`;
});

/** particles die in any order, and with additive blending order is invisible */
const drop = (list: Particle[], index: number) => {
  list[index] = list[list.length - 1];
  list.pop();
};

export function useFire(
  frameRef: React.RefObject<HTMLElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  // where the content stands and which end it rests against, as
  // `onScrollPosition` reports them
  const scroll = React.useRef({ top: 0, edge: null as "start" | "end" | null });

  const onScrollPosition = React.useCallback(
    (_left: number, top: number, max: { x: number; y: number }) => {
      scroll.current.top = top;
      scroll.current.edge = top < 1 ? "start" : max.y - top < 1 ? "end" : null;
    },
    [],
  );

  React.useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!frame || !canvas || !ctx) return;

    const sprites = makeSprites();
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    const flames: Particle[] = [];
    const sparks: Particle[] = [];

    let dpr = 1;
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let last = performance.now();
    let previous: { x: number; y: number } | null = null;
    /** px/s of the ball along the track, smoothed: the pointer arrives in uneven steps */
    let velocity = 0;
    /**
     * px/s of the content. On a long list the ball crawls while the content
     * flies — the wheel should still fan the fire.
     */
    let flow = 0;
    let lastTop = scroll.current.top;
    let heat = 0.3;
    let flameDebt = 0;
    let sparkDebt = 0;
    let lastEdge = scroll.current.edge;
    let raf = 0;

    const burst = (x: number, y: number, side: "start" | "end", force: number) => {
      // sparks bounce back into the track, away from the end they hit
      const away = side === "end" ? -1 : 1;
      const count = Math.round(16 + force * 44);

      for (let index = 0; index < count; index++) {
        sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 520 * (0.4 + force),
          vy: away * (120 + Math.random() * 480) * (0.5 + force),
          age: 0,
          life: 0.5 + Math.random() * 0.9,
          size: 1 + Math.random() * 1.8,
          seed: Math.random() * TAU,
        });
      }
      heat = Math.min(heat + force * 0.6, 2);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      // a hidden tab pauses the loop; coming back must not be one giant step
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const thumb = frame.querySelector<HTMLElement>(".ms-thumb");
      const ember = thumb?.querySelector<HTMLElement>(".ember");
      if (!thumb || !ember || dt <= 0) return;

      const origin = canvas.getBoundingClientRect();
      const ball = ember.getBoundingClientRect();
      const x = ball.left + ball.width / 2 - origin.left;
      const y = ball.top + ball.height / 2 - origin.top;
      const radius = ball.width / 2;

      const dx = previous ? x - previous.x : 0;
      const dy = previous ? y - previous.y : 0;
      previous = { x, y };
      velocity += (dy / dt - velocity) * (1 - Math.exp(-dt * 14));

      const top = scroll.current.top;
      flow += ((top - lastTop) / dt - flow) * (1 - Math.exp(-dt * 10));
      lastTop = top;

      const held = thumb.classList.contains("ms-grabbing");
      const hovered = thumb.matches(":hover");
      const speed = Math.min(Math.abs(velocity) / 1400, 1.2);
      const rush = Math.min(Math.abs(flow) / 4000, 1);
      const target =
        0.32 + speed * 0.9 + rush * 0.6 + (held ? 0.45 : 0) + (hovered ? 0.15 : 0);
      // flares up at once, cools down slowly — like the real thing
      heat += (target - heat) * (1 - Math.exp(-dt * (target > heat ? 8 : 2.5)));

      // a hard stop at either end throws sparks; a soft arrival does not
      const nowEdge = scroll.current.edge;
      if (nowEdge && nowEdge !== lastEdge && Math.abs(velocity) > 350) {
        const rim = nowEdge === "end" ? radius : -radius;
        burst(x, y + rim, nowEdge, Math.min(Math.abs(velocity) / 1500, 1));
      }
      lastEdge = nowEdge;

      const quiet = calm.matches ? 0.35 : 1;

      /*
       * Where the flame streams: up on its own, and away from where the ball
       * is heading. It is born on that side of the ball, so the ball keeps its
       * own colour instead of drowning in a crowd of particles.
       */
      const stream =
        -90 * (0.7 + heat * 0.5) -
        (velocity * 0.22 + Math.sign(flow) * rush * 70) * quiet;
      const side = stream < 0 ? -Math.PI / 2 : Math.PI / 2;

      flameDebt += dt * (30 + heat * 130 + speed * 220) * quiet;
      while (flameDebt >= 1) {
        flameDebt -= 1;
        // spread along this frame's path, so a fast ball leaves no gaps
        const along = Math.random();
        const angle = side + (Math.random() - 0.5) * Math.PI;
        const offset = radius * (0.35 + Math.random() * 0.5);

        flames.push({
          x: x - dx * along + Math.cos(angle) * offset,
          y: y - dy * along + Math.sin(angle) * offset,
          vx: (Math.random() - 0.5) * 30 + Math.cos(angle) * 20,
          vy: stream * (0.6 + Math.random() * 0.8),
          age: 0,
          life: (0.4 + Math.random() * 0.4) * (0.85 + heat * 0.35),
          size: radius * (0.6 + Math.random() * 0.45) * (0.8 + heat * 0.3),
          seed: Math.random() * TAU,
        });
      }

      sparkDebt += dt * (1.5 + heat * heat * 14) * quiet;
      while (sparkDebt >= 1) {
        sparkDebt -= 1;
        const along = Math.random();
        const angle = Math.random() * TAU;

        sparks.push({
          x: x - dx * along + Math.cos(angle) * radius * 0.8,
          y: y - dy * along + Math.sin(angle) * radius * 0.8,
          vx: (Math.random() - 0.5) * 180,
          vy: -(80 + Math.random() * 200) * (0.6 + heat * 0.5) - velocity * 0.3,
          age: 0,
          life: 0.6 + Math.random() * 0.8,
          size: 0.8 + Math.random() * 1,
          seed: Math.random() * TAU,
        });
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "lighter";

      // the glow the ball throws on whatever lies around it
      const reach = radius * (4 + heat * 3);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, reach);
      glow.addColorStop(0, `rgba(255, 120, 30, ${0.16 + heat * 0.14})`);
      glow.addColorStop(1, "rgba(255, 60, 10, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - reach, y - reach, reach * 2, reach * 2);

      for (let index = flames.length - 1; index >= 0; index--) {
        const p = flames[index];
        p.age += dt;
        if (p.age >= p.life) {
          drop(flames, index);
          continue;
        }

        const k = p.age / p.life;
        const drag = Math.exp(-dt * 1.6);
        p.vx = (p.vx + Math.sin(p.seed + p.age * 11) * 90 * dt) * drag;
        p.vy = (p.vy - 30 * dt) * drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        /*
         * Like a real flame, it is nearly clear where it is born and brightest
         * a little above: newborn particles crowd the ball, and at full
         * strength they would add up to a white blob instead of tongues.
         */
        // a fast particle is drawn stretched along its path: round blobs in a
        // fast trail read as a string of beads, stretched ones merge into a tongue
        const pace = Math.hypot(p.vx, p.vy);
        const stretch = 1 + Math.min(pace / 260, 2.2);

        const size = p.size * (1 - k * 0.55);
        // the same light spread over a longer stroke, or the trail burns white
        ctx.globalAlpha =
          (Math.min(k / 0.2, 1) * (1 - k * k) * 0.5) / Math.sqrt(stretch);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));

        // white heat is the ember's own; the flame starts at yellow and keeps it a while
        ctx.drawImage(
          sprites[Math.min(STEPS - 1, Math.floor((0.08 + Math.pow(k, 1.4) * 0.9) * STEPS))],
          -size * stretch,
          -size,
          size * 2 * stretch,
          size * 2,
        );
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      for (let index = sparks.length - 1; index >= 0; index--) {
        const p = sparks[index];
        p.age += dt;
        if (p.age >= p.life) {
          drop(sparks, index);
          continue;
        }

        const k = p.age / p.life;
        const drag = Math.exp(-dt * 0.8);
        // thrown up hot, then gravity wins
        p.vx = (p.vx + Math.sin(p.seed + p.age * 7) * 40 * dt) * drag;
        p.vy = (p.vy + 140 * dt) * drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // a streak, not a dot: a spark is seen as the path it burns
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = TINTS[Math.min(STEPS - 1, Math.floor((0.2 + k * 0.55) * STEPS))];
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [frameRef, canvasRef]);

  return { onScrollPosition };
}

import React from "react";

/*
 * The thumb is a ball of fire: the ball itself is an ordinary element, and the
 * canvas laid over the scroll sets it burning — flames around it, sparks off
 * its rim. Every frame the canvas
 * asks the thumb where it is: how fast it travels, whether it is held, whether
 * it just hit an end. None of that is possible with `::-webkit-scrollbar`: a
 * pseudo-element has no position you can read and nothing you can hang a
 * canvas on.
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

/** white heat → yellow → orange → red → cold */
const RAMP: Array<[number, RGB]> = [
  [0, [255, 248, 224]],
  [0.18, [255, 214, 110]],
  [0.4, [255, 158, 40]],
  [0.65, [238, 86, 12]],
  [0.85, [150, 30, 5]],
  [1, [50, 8, 2]],
];

const STEPS = 24;

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

const SPRITE = 64;
const TAU = Math.PI * 2;

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

/** the soft glow a big spark carries around its head */
const makeHalo = () => {
  const halo = document.createElement("canvas");
  halo.width = halo.height = 32;

  const ctx = halo.getContext("2d")!;
  const blob = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  blob.addColorStop(0, "rgba(255, 200, 110, 0.9)");
  blob.addColorStop(1, "rgba(255, 120, 30, 0)");
  ctx.fillStyle = blob;
  ctx.fillRect(0, 0, 32, 32);

  return halo;
};

/** particles die in any order, and with additive blending order is invisible */
const drop = (list: Particle[], index: number) => {
  list[index] = list[list.length - 1];
  list.pop();
};

const GRAVITY = 520;

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
    const halo = makeHalo();
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
    let previous: number | null = null;
    /** px/s of the ball along the track, smoothed: the pointer arrives in uneven steps */
    let velocity = 0;
    /**
     * px/s of the content. On a long list the ball crawls while the content
     * flies — the wheel should still fan the fire.
     */
    let flow = 0;
    let lastTop = scroll.current.top;
    let heat = 0.3;
    let shownHeat = -1;
    let flameDebt = 0;
    let sparkDebt = 0;
    let wasHeld = false;
    let lastEdge = scroll.current.edge;
    let raf = 0;

    const throwSpark = (x: number, y: number, vx: number, vy: number) => {
      sparks.push({
        x,
        y,
        vx,
        vy,
        age: 0,
        life: 0.35 + Math.random() * 0.5,
        size: 0.8 + Math.random() * 1.3,
        seed: 0,
      });
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
      const cx = ball.left + ball.width / 2 - origin.left;
      const cy = ball.top + ball.height / 2 - origin.top;
      const radius = ball.width / 2;
      /** a point on the ball at that angle, `depth` of the way to its rim */
      const rim = (angle: number, depth = 1) => [
        cx + Math.cos(angle) * radius * depth,
        cy + Math.sin(angle) * radius * depth,
      ];

      const dy = previous === null ? 0 : cy - previous;
      previous = cy;
      velocity += (dy / dt - velocity) * (1 - Math.exp(-dt * 14));

      const position = scroll.current.top;
      flow += ((position - lastTop) / dt - flow) * (1 - Math.exp(-dt * 10));
      lastTop = position;

      const held = thumb.classList.contains("ms-grabbing");
      const hovered = thumb.matches(":hover");
      const speed = Math.min(Math.abs(velocity) / 1400, 1.2);
      const rush = Math.min(Math.abs(flow) / 4000, 1);
      const target =
        0.3 + speed * 0.6 + rush * 0.35 + (held ? 0.45 : 0) + (hovered ? 0.15 : 0);
      // heats up at once, cools down slowly — like the real thing
      heat += (target - heat) * (1 - Math.exp(-dt * (target > heat ? 8 : 2.5)));

      // the ball glows with its heat: the CSS reads it from a variable
      if (Math.abs(heat - shownHeat) > 0.01) {
        ember.style.setProperty("--heat", heat.toFixed(2));
        shownHeat = heat;
      }

      const quiet = calm.matches ? 0.35 : 1;
      const moving = Math.abs(velocity) > 60;
      // sparks leave from the side the ball is moving away from
      const behind = velocity > 0 ? -Math.PI / 2 : Math.PI / 2;
      const back = velocity > 0 ? -1 : 1;

      // a grab strikes the ball
      if (held && !wasHeld) {
        for (let index = 0; index < 14 * quiet; index++) {
          const angle = Math.random() * TAU;
          const [x, y] = rim(angle, 0.8);
          throwSpark(
            x,
            y,
            Math.cos(angle) * (60 + Math.random() * 140),
            Math.sin(angle) * 80 - (60 + Math.random() * 140),
          );
        }
      }
      wasHeld = held;

      // a hard stop at either end throws a shower back into the track
      const edge = scroll.current.edge;
      if (edge && edge !== lastEdge && Math.abs(velocity) > 350) {
        const force = Math.min(Math.abs(velocity) / 1500, 1);
        const away = edge === "end" ? -1 : 1;
        const [, y] = rim(edge === "end" ? Math.PI / 2 : -Math.PI / 2);

        for (let index = 0; index < (12 + force * 28) * quiet; index++) {
          throwSpark(
            cx + (Math.random() - 0.5) * radius * 1.4,
            y,
            (Math.random() - 0.5) * 260 * (0.4 + force),
            away * (120 + Math.random() * 360) * (0.5 + force),
          );
        }
        heat = Math.min(heat + force * 0.6, 2);
      }
      lastEdge = edge;

      /*
       * Where the flame streams: up on its own, and away from where the ball
       * is heading. It is born on that side of the ball, so the ball keeps its
       * own colour instead of drowning in a crowd of particles.
       */
      const stream =
        -90 * (0.7 + heat * 0.5) -
        (velocity * 0.15 + Math.sign(flow) * rush * 50) * quiet;
      const side = stream < 0 ? -Math.PI / 2 : Math.PI / 2;

      flameDebt += dt * (24 + heat * 90 + speed * 110) * quiet;
      while (flameDebt >= 1) {
        flameDebt -= 1;
        // spread along this frame's path, so a fast ball leaves no gaps
        const along = Math.random() * dy;
        const angle = side + (Math.random() - 0.5) * Math.PI;
        const [x, y] = rim(angle, 0.35 + Math.random() * 0.5);

        flames.push({
          x,
          y: y - along,
          vx: (Math.random() - 0.5) * 30 + Math.cos(angle) * 20,
          vy: stream * (0.6 + Math.random() * 0.8),
          age: 0,
          life: (0.4 + Math.random() * 0.4) * (0.85 + heat * 0.35),
          size: radius * (0.55 + Math.random() * 0.4) * (0.8 + heat * 0.25),
          seed: Math.random() * TAU,
        });
      }

      sparkDebt += dt * (1.5 + heat * heat * 12 + speed * 60 + rush * 16) * quiet;
      while (sparkDebt >= 1) {
        sparkDebt -= 1;
        const along = Math.random() * dy;

        if (moving && Math.random() < 0.7) {
          const [x, y] = rim(behind + (Math.random() - 0.5) * Math.PI * 0.8);
          throwSpark(
            x,
            y - along,
            (Math.random() - 0.5) * 110,
            back * (60 + Math.random() * 180) * (0.6 + speed * 0.6) - velocity * 0.2,
          );
        } else {
          /*
           * At rest the ball only crackles: a spark off its rim, flung mostly
           * outwards — past the edge of the frame rather than onto the cards.
           */
          const angle =
            (Math.random() < 0.75 ? 0 : Math.PI) + (Math.random() - 0.5) * Math.PI;
          const [x, y] = rim(angle);
          throwSpark(
            x,
            y - along,
            Math.cos(angle) * (30 + Math.random() * 110),
            Math.sin(angle) * 40 - (30 + Math.random() * 120),
          );
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "lighter";

      // the warm light the ball throws on the cards around it
      const reach = radius * (4 + heat * 3);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach);
      glow.addColorStop(0, `rgba(255, 120, 30, ${0.14 + heat * 0.12})`);
      glow.addColorStop(1, "rgba(255, 60, 10, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - reach, cy - reach, reach * 2, reach * 2);

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

        // a fast particle is drawn stretched along its path: round blobs in a
        // fast trail read as a string of beads, stretched ones merge into a tongue
        const pace = Math.hypot(p.vx, p.vy);
        const stretch = 1 + Math.min(pace / 260, 2.2);

        /*
         * Like a real flame, it is nearly clear where it is born and brightest
         * a little above: at full strength the newborn particles crowding the
         * end would add up to a white blob instead of tongues. The same light
         * spread over a longer stroke is dimmer, or the trail burns white.
         */
        const size = p.size * (1 - k * 0.55);
        ctx.globalAlpha =
          (Math.min(k / 0.2, 1) * (1 - k * k) * 0.5) / Math.sqrt(stretch);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        // white heat is the ball's own; the flame starts at yellow and keeps it a while
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

        // thrown out hot, then they arc down and cool
        const drag = Math.exp(-dt * 0.9);
        p.vx *= drag;
        p.vy = (p.vy + GRAVITY * dt) * drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const k = p.age / p.life;
        const alpha = Math.pow(1 - k, 1.2);

        // a streak, not a dot: a spark is seen as the path it burns
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = TINTS[Math.min(STEPS - 1, Math.floor((0.12 + k * 0.65) * STEPS))];
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // the big ones glow while they are still hot
        if (p.size > 1.5 && k < 0.5) {
          const r = p.size * 3.5;
          ctx.globalAlpha = alpha * 0.5;
          ctx.drawImage(halo, p.x - r, p.y - r, r * 2, r * 2);
        }
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

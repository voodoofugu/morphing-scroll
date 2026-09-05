![logo](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-logo.png)

<h2></h2>

### 〈 Table of contents 〉

- [About](#-about-)
- [Installation](#-installation-)
- [API](#-api-)
- [License](#-license-)

<h2></h2>

### 〈 About 〉

`morphing-scroll` is a `React` library designed to overcome common limitations of native browser scrolling, including:

- Limited design customization
- Inconsistent cross-browser behavior
- Lack of horizontal scrolling support via the mouse wheel

The library includes optimizations for large lists, improving performance and overall scrolling behavior.

<h2></h2>

### 〈 Installation 〉

To install the library, use the following command:

```bash
npm install morphing-scroll
```

Next, import the `MorphScroll` component into your React application:

```tsx
import { MorphScroll } from "morphing-scroll";
```

If you prefer, you can also import the entire library as a single object using the default export:

```tsx
import Morph from "morphing-scroll";
```

Start using the `MorphScroll` component by defining the required `size` prop. For better precision and control, it's recommended to begin by understanding the `objects` and `controls` props, which are explained below.

> **✦ Note:**
>
> - Supports both **ESM** (`import`) and **CommonJS** (`require`) builds.
> - The MorphScroll container can be styled with CSS, but avoid modifying properties that affect the size or positioning of internal elements.
> - Components include identifying attributes and MorphScroll internals elements use the `ms-` prefix for classes and attributes.
> - While a scroll is running its root carries the `ms-scrolling` attribute. Nested scrolls read it to decide whether to take the wheel, and it is available for styling.
> - Write objects, arrays and elements straight into the props — `controls={{ wheel: true }}`, `gap={[10, 20]}`, `controls={{ bar: <Thumb /> }}`. There is no need to wrap them in `useMemo`: MorphScroll compares prop values by content rather than by identity, so a fresh object with the same contents costs nothing. Callbacks are held through refs, so they never invalidate anything either.
> - Three things happen without being asked for, because a scroll that skipped them would be wrong rather than minimal:
>   - content that loads **above** the reader does not push them down — the object they were looking at stays where it was, which is what a browser does for its own scrolling and what this one has to do itself;
>   - on a right-to-left page the scroll keeps counting from the left, where its own geometry is, and hands the page's direction back to your content, so an `rtl` page cannot quietly invert the arithmetic. The horizontal axis is mirrored wherever it is not the one being scrolled, so a vertical grid lays its columns from the right and its scrollbar stands on the left. A horizontal scroll's own direction is not mirrored yet: its zero would have to move to the right edge, which is a different coordinate system rather than a different layout;
>   - when the system asks for less motion, every move the library makes on its own arrives at once instead of animating — a drag still follows the finger, since that is not animation.
> - With DevTools open the scroll can feel slower: the customization keeps the DOM changing, and the browser spends extra work reporting every change to the panel. It is an artefact of being watched — with DevTools closed, which is how the page is actually used, none of that cost exists.

<h2></h2>

### 〈 API 〉

<ul><div>

<details><summary><b>MorphScroll</b>: <em>main component of the library responsible for displaying your data</em></summary>

- #### Props:

<ul><div>

###### **— GENERAL —**

<details><summary><b><code>className</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows you to add additional classes to the component.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} className="custom-class">
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>children</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom content to the component.<br />
Make sure to provide unique keys for each list item, as per React's rules. The <code>MorphScroll</code> component ensures that the cells it generates will use the same keys as your list items, allowing it to render the correct cells for the current list.<br />
Additionally, <code>MorphScroll</code> handles a passed <b>null</b> value the same way as <b>undefined</b>, rendering nothing in both cases.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props}>{children}</MorphScroll>
```

</div></ul></details>

<h2></h2>

###### **— SCROLL —**

<details><summary><b><code>mode</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
mode: "slider"; // or "scroll" | "sliderMenu"
```

<b>Default:</b><br />
"scroll"<br />
<br />
<b>Description:</b><em><br />
defines how the provided <code>bar</code> behaves within <code>controls</code> and how you interact with it.<br />
<br />
<code><b>scroll</b></code>:<br />
the default value and represents a standard scrollbar.<br />
<br />
<code><b>slider</b></code>:<br />
displays distinct elements indicating the number of full scroll steps within the list.<br />
<br />
<code><b>sliderMenu</b></code>:<br />
like <code>slider</code>, but the <code>bar</code> is a menu, and you can provide custom buttons as an array in <code>bar</code>.<br />
<br />
Both draw one element per page, so the count follows the content: a long list makes a long strip of them, and past a point it outgrows the scroll it belongs to. There is no cap on purpose — hiding pages would make the progress lie about where you are. The slider modes are for a handful of pages; for a list that keeps going, <code>mode="scroll"</code> shows the same position in one thumb.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} mode="slider">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-mode.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>direction</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
direction: "x"; // or "y" | "hybrid"
```

<b>Default:</b><br />
"y"<br />
<br />
<b>Description:</b><em><br />
changes the scroll or slider direction based on the provided value.<br />
You can set the value to horizontal, vertical or hybrid positions to customize the component according to your needs.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} direction="x">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-direction.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>initialPosition</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
initialPosition: 10; // or "end" | [x, y] for direction="hybrid"
```

<b>Description:</b><em><br />
where the scroll opens.<br />
<br />
Applied once, without animation, as soon as the content can hold it — a layout that has to be measured is waited for. That is the whole of it: changing the value later does nothing, so the opening position can never take the scroll back from the person using it.<br />
<br />
✦ Note:<br />
every later move is a command on the component <code>ref</code> — <code>scrollTo</code>, <code>step</code>, <code>pan</code>, <code>moveFocus</code>, see below. To follow content as it grows, see <code>stickToEnd</code>.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} initialPosition={100}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-initialPosition.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>stickToEnd</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
stickToEnd: true; // or [x, y] for direction="hybrid"
```

<b>Default:</b><br />
false<br />
<br />
<b>Description:</b><em><br />
keeps the scroll at the end of its content.<br />
<br />
This is a standing rule rather than a move: every time the content grows the scroll follows it, and it opens at the end too. It steps aside the moment the reader scrolls away from the end and picks up again when they come back — a chat that does not fight the person reading its history.<br />
<br />
✦ Note:<br />

<ul>
  <li>in <code>direction="hybrid"</code> both axes follow their own end, and a pair sets them apart: <code>[true, false]</code> follows the right edge and leaves the bottom where the reader left it.</li>
  <li>an explicit <code>scrollTo("end")</code> is the other thing: it always runs, whether or not the reader is at the bottom.</li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} stickToEnd>
  {messages}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-stickToEnd.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>loop</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
loop: true;
```

<b>Default:</b><br />
false<br />
<br />
<b>Description:</b><em><br />
the content runs in a circle: the same children repeat forever in both directions, and there is no first object and no last.<br />
<br />
The seam is not visible, and the strip does not grow. It cannot: a scroll has a length, the browser cuts it off after tens of millions of pixels, and position and inertia lose their footing long before that. So the strip stays a fixed length — a few copies of the content, as many as the window needs — and the circle is made by moving the position instead. The window is kept in the middle copy, and the moment it leaves, the position moves by one period. Under the window at that moment is the very same content, so there is nothing to see.<br />
<br />
With <code>render.mode</code> the objects are still mounted a window at a time, so a hundred turns cost what one costs — but the circle does not need it: it places its copies by coordinate either way, and without it simply mounts them all.<br />
<br />
The slider modes turn in a circle too. Pages are counted within one turn, so the progress element shows as many dots as there really are — not one per copy — and they come back round to the first.<br />
<br />
<code>direction="hybrid"</code> turns in both directions at once: the content repeats to the right and downward alike, the copies lie in a grid, and each axis is brought back to its own middle on its own.<br />
<br />
<code>objects.size: "auto"</code> turns too, only not at once. A period is the length of the content, and that keeps growing while the measurements come in — turning on a period that moves would jolt the layout on every batch. So it waits: until everything is measured this scrolls as usual, and the circle closes by itself once there is nothing left to measure. A long list pays for a full measuring pass before it turns, and if something grows later the position keeps its place within the turn rather than jumping back to the start of it.</em><br />
<br />
<b>Note:</b><em><br />
the list is repeated, not referenced — a few copies of every child are mounted at once. With <code>render.mode</code> only the ones in the window are, and the length of the list stops mattering; without it a long one is paid for several times over. For anything but a handful of objects, give the circle virtualising.</em><br />
<br />
<br />
<b>What changes around it:</b><em><br /></em>
<ul>
  <li><code>edge</code> stays lit on both sides: there really is more content both ways</li>
  <li>the progress element shows the position within one turn, not within the strip, so it cycles instead of jumping — and it appears only when a turn is longer than the window, since a strip that is always longer would otherwise always show one</li>
  <li>dragging its thumb moves the content by the turn the track stands for, so it stays under the finger</li>
  <li>pages divide the turn evenly — no page is longer than the window, so nothing is skipped, and stepping through them all comes back exactly where it started</li>
  <li><code>controls.bar: true</code> is talked out of: the browser draws its own bar over the strip, and the strip is a few copies of the content. Pass an element instead and the bar shows the turn</li>
  <li><code>scrollTo</code> takes a number as a place within the turn and goes there the short way round, whichever side that is</li>
  <li><code>stickToEnd</code> is refused — it drives to an end the circle does not have</li>
</ul>
<b>Example:</b>

```tsx
<MorphScroll {...props} loop render={{ mode: "virtual" }}>
  {slides}
</MorphScroll>
```

<em>Or as an endless carousel, arrows and dots and all:</em>

```tsx
<MorphScroll
  {...props}
  mode="slider"
  loop
  controls={{ arrows: <Arrow />, bar: <Dot /> }}
>
  {slides}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>duration</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
duration: 400;
```

<b>Default:</b><br />
200<br />
<br />
<b>Description:</b><em><br />
how long a move takes, in <b>ms</b>.<br />
<br />
The animation length of every move the scroll makes on its own: an arrow, a key, a focus step, a slider settling after a drag. Commands on the <code>ref</code> take it as their default and can override it per call. <b>0</b> jumps without animating.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} duration={400}>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>ref</code></b> <em>(imperative commands)</em></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
const scroll = useRef<MorphScrollHandle>(null);

<MorphScroll ref={scroll} size={300}>
  {children}
</MorphScroll>;

scroll.current?.scrollTo(0);
scroll.current?.scrollTo("end", { duration: 0 });
```

<b>Description:</b><em><br />
props describe state, methods do something now. <code>initialPosition</code> and <code>stickToEnd</code> are the first kind: where the scroll opens, and what it follows. Everything else is a method — it runs every time it is called, so asking for a position that is already set works.<br />
<br />
<code><b>scrollTo(target, options?)</b></code>:<br />

<ul>
  <li><code>target</code>: the same shape <code>initialPosition</code> takes — a <b>number</b>, <b>"end"</b>, <b>null</b>, or an array of two for <code>direction="hybrid"</code>.</li><br />
  <li><code>options.duration</code>: animation length in <b>ms</b>; <b>0</b> jumps without animating. Defaults to the <code>duration</code> prop.</li>
</ul>
<br />
Unlike <code>stickToEnd</code>, which follows new content only while the scroll is still at the bottom and leaves you alone once you have scrolled up to read, an explicit <code>scrollTo("end")</code> always runs.<br />
<br />
<code><b>scrollToObject(target, options?)</b></code>:<br />
brings one object into view. A place in the list rather than a place in pixels, which is the one you can actually name: with <code>render</code> the object is not in the document, and with <code>objects.size: "auto"</code> only the library knows where it ended up.<br />

<ul>
  <li><code>target</code>: a position in the list (<b>0</b> is the first), a child's <code>key</code>, or the name of a <b>group</b>.</li><br />
  <li><code>options.align</code>: where in the window it lands — <b>"start"</b> by default, <b>"center"</b>, or <b>"end"</b>.</li>
</ul>

<em>A group is written in the key itself, in brackets at the end. There is no prop for it: a key has to be unique anyway, and adding the group to it is cheaper than keeping a second list beside it. A child keyed <code>"post-4[news]"</code> answers to <code>"post-4"</code> and to <code>"news"</code> alike, and a group goes to its first object; a key wins over a group of the same name.</em>

```tsx
<MorphScroll {...props} ref={scroll} render="virtual">
  {posts.map((post) => (
    <Post key={`post-${post.id}[${post.section}]`} {...post} />
  ))}
</MorphScroll>;

scroll.current?.scrollToObject(10);
scroll.current?.scrollToObject("post-4", { align: "center" });
scroll.current?.scrollToObject("news"); // the first post of that section
```

<code><b>step(side, options?)</b></code>:<br />
turns one page toward <b>"top"</b>, <b>"right"</b>, <b>"bottom"</b> or <b>"left"</b> — the same move the arrow buttons make, and it does nothing at the end of the run, unless <code>loop</code> has made it endless.<br />
<br />
<code><b>pan(delta, options?)</b></code>:<br />
nudges the content by <code>{ x, y }</code> pixels. Plain movement, so it shows up in <code>onScrollPosition</code>; it only reaches <code>onNavigate</code> if it settles on a new page of a slider.<br />
<br />
<code><b>moveFocus(side, options?)</b></code>:<br />
moves focus to the neighbouring object and brings it into view — the same move <code>keys: { mode: "focus" }</code> makes, for a device that has no arrow keys. Nothing happens at the edge of the run.<br />
<br />
<code><b>options.reason</b></code>:<br />
any string, handed back untouched by <code>onNavigate</code>. This is how an input the library knows nothing about gets connected: it does not poll gamepads, listen for remotes or own your hotkeys — your code decides what a button means, and the reason carries that meaning through.<br />
</em>

<em>A keyboard needs none of this — <code>controls={{ keys: true }}</code> and the arrow keys work. A gamepad has no events at all, only a snapshot you read per frame, so it needs a loop of your own. The whole of it is fifteen lines:</em>

```tsx
const scroll = React.useRef<MorphScrollHandle>(null);

React.useEffect(() => {
  let frame = 0;

  const tick = () => {
    frame = requestAnimationFrame(tick);

    const pad = navigator.getGamepads().find(Boolean);
    const y = pad?.axes[3] ?? 0;
    if (Math.abs(y) < 0.15) return; // the stick is never quite at rest

    scroll.current?.pan({ y: y * 15 }, { duration: 0, reason: "gamepad" });
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}, []);
```

<em>Poll, read the stick, call <code>pan</code>. Everything in the recipe below is what makes it feel right rather than work at all: distance measured in time so a slow frame travels as far, a step per press instead of per frame, and the d-pad repeating while it is held.</em>

<br />

<details><summary><b>Recipe — a gamepad, in full</b></summary><br /><ul><div>

<em>The stick pans continuously, the d-pad steps once per press. Both call the same two methods.</em>

```tsx
const DEAD_ZONE = 0.15; // what the stick reports while it rests
const PAN_PER_SECOND = 900; // px with the stick pushed all the way
const REPEAT = { first: 400, next: 120 }; // auto-repeat of a held button, ms

function useGamepadScroll(scroll: React.RefObject<MorphScrollHandle | null>) {
  React.useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const held = new Map<number, number>(); // button -> when it fires again

    const DPAD = { 12: "top", 13: "bottom", 14: "left", 15: "right" } as const;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      // a frame can be a long one: count by time, not by number of frames
      const delta = Math.min(now - last, 100) / 1000;
      last = now;

      const pad = navigator.getGamepads().find(Boolean);
      if (!pad) return held.clear();

      // — the right stick: continuous movement —
      const [x, y] = [pad.axes[2] ?? 0, pad.axes[3] ?? 0].map((value) =>
        Math.abs(value) < DEAD_ZONE ? 0 : value,
      );

      if (x || y)
        scroll.current?.pan(
          { x: x * PAN_PER_SECOND * delta, y: y * PAN_PER_SECOND * delta },
          { duration: 0, reason: "gamepad" },
        );

      // — the d-pad: a step per press, not per frame —
      for (const [index, side] of Object.entries(DPAD)) {
        const button = Number(index);

        if (!pad.buttons[button]?.pressed) {
          held.delete(button);
          continue;
        }

        const due = held.get(button);
        if (due === undefined) {
          scroll.current?.step(side, { reason: "gamepad" });
          held.set(button, now + REPEAT.first);
        } else if (now >= due) {
          scroll.current?.step(side, { reason: "gamepad" });
          held.set(button, now + REPEAT.next);
        }
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scroll]);
}
```

<em>Swap <code>step</code> for <code>moveFocus</code> in the d-pad branch and the same loop walks the objects instead of turning pages — a highlight moving card to card, which is what a controller usually wants.</em>

</div></ul></details>

<br />

<details><summary><b>Recipe — the stick, moving through objects instead of panning</b></summary><br /><ul><div>

<em>A stick is a position, not an event, so the discrete move belongs to the crossing: it fires when the stick leaves the centre, and coming back re-arms it. Everything else is the same loop.</em>

```tsx
const THRESHOLD = 0.5;
const aimed = { x: 0, y: 0 }; // where the stick leans right now: -1, 0 or 1

const tilt = (value: number) =>
  value > THRESHOLD ? 1 : value < -THRESHOLD ? -1 : 0;

// inside tick, in place of the stick branch
const next = { x: tilt(pad.axes[2] ?? 0), y: tilt(pad.axes[3] ?? 0) };

for (const axis of ["x", "y"] as const) {
  if (next[axis] === aimed[axis]) continue; // same lean — the step already fired

  aimed[axis] = next[axis];
  if (!next[axis]) continue; // back at the centre — this only re-arms it

  const side =
    axis === "x"
      ? next.x > 0
        ? "right"
        : "left"
      : next.y > 0
        ? "bottom"
        : "top";

  scroll.current?.moveFocus(side, { reason: "gamepad" });
}
```

<em>For auto-repeat while it is held, reach for the same <code>held</code> map the d-pad uses: remember when the next one is due and compare against <code>now</code>.<br />
<br />
Two things this leans on. <code>pan</code> takes <code>duration: 0</code> so the content tracks the stick instead of chasing it through an animation, and the distance is multiplied by elapsed time so a 30fps frame moves as far as two 60fps ones. <code>step</code> is guarded by the <code>held</code> map: <code>buttons[13].pressed</code> is true on every frame the d-pad is down, and stepping per frame would fly through the list.<br />
<br />
Which scroll gets the input is your decision too — the ref you poll is the one that answers. That is the reason polling stays out here: a game already has an input layer and a frame loop, and a loop inside the scroll would have to guess which of several scrolls on the page the stick was aimed at. A remote, a MIDI pedal or your own hotkeys connect exactly the same way; only the reason changes.</em>

</div></ul></details>

<br />

</div></ul></details>

<h2></h2>

<details><summary><b><code>autoScrollOnDrag</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
autoScrollOnDrag: true;
```

<b>Description:</b><em><br />
enables automatic scrolling when dragging elements near the edges of the container.<br />
Scrolling is triggered for elements using the native <code>draggable="true"</code> attribute, or custom drag implementations marked with <code>ms-custom-drag</code>.<br />
<br />
✦ Note:<br />
while auto-scrolling is active, the container receives the <code>ms-under-drag</code> attribute with directional values (<code>left</code>, <code>top</code>, etc.) depending on the active edge. It can be used for styling.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} autoScrollOnDrag>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-autoScrollOnDrag.png)

</div></ul></details>

<h2></h2>

###### **— LAYOUT —**

<details><summary><b><code>size</code></b> REQUIRED</summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
size: 100; // or [100, 70] | "auto"
```

<b>Description:</b><em><br />
sets the width and height of the <code>MorphScroll</code>.<br />
<br />
<code><b>number</b></code>:<br />
sets a fixed size in pixels. It can be 1 number if you want to set the same width and height, or an array of 2 numbers.<br />
<br />
<code><b>"auto"</b></code>:<br />
adds the <code>ResizeTracker</code> component to measure the width and height of the area where <code>MorphScroll</code> is added. The dimensions will automatically adjust when the container changes.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} size={100}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-size.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>objects</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />

```tsx
objects: { size: 100, gap: 10 }
```

  </li>
  <li><b>Advanced</b>:<br />

```tsx
objects: {
  layout: "masonry",
  size: [150, "auto"],
  gap: [10, 20],
  lines: 3,
  align: "center",
  order: "column",
  empty: "clear",
}
```

  </li>
</ul>

<b>Default:</b><br />
{ size: "none", direction: "row" }<br />
<br />
<b>Description:</b><em><br />
everything about the objects themselves: how big they are, how they sit next to each other, and what to do with the ones that render nothing.<br />
<br />
Each object is wrapped in an <code>.ms-object-box</code> of its own — this is what decides the size of that box and how the boxes are arranged.<br />
</em><br />

<details><summary><code><b>layout</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
layout: "masonry"; // or "grid" | "flow" | "fill"
```

<b>Default:</b><br />
"grid", unless a side of <code>size</code> is <b>"auto"</b><br />
<br />
<b>Description:</b><em><br />
how the objects are arranged.<br />
<br />
The layout and the sizes say the same thing from two ends. <b>"auto"</b> hands a side to the object itself, and which side that is settles the arrangement, so a pair of sizes has already said it: <code>[90, "auto"]</code> on a vertical scroll is a masonry. Naming the layout says it in words instead — and then it decides, which means the side it measures needs no size at all:<br />

<ul>
  <li><code><b>"grid"</b></code>: every object the same size, laid in lines. Nothing is measured, so <b>"auto"</b> has no place here and the library says so.</li><br />
  <li><code><b>"masonry"</b></code>: the side along the scroll is the object's own, <code>size</code> gives the other. Each object goes into the shortest line at that moment, so the far edge stays even.</li><br />
  <li><code><b>"flow"</b></code>: the side across the scroll is the object's own, <code>size</code> gives the other. Objects follow one another until the room, or <code>lines</code>, ends the line.</li><br />
  <li><code><b>"fill"</b></code>: both sides are the objects' own, so <code>size</code> is not needed at all. Every object takes the highest place it fits into and nothing hangs under a short neighbour — order gives way to the fit.</li>
</ul>

Which is why one number is enough once the layout is named: it goes to the side the layout does not take.</em><br />
<br />
<b>Example:</b>

```tsx
// a masonry of cards: 90 wide, as tall as each card turns out to be
<MorphScroll {...props} objects={{ layout: "masonry", size: 90, gap: 10 }}>
  {cards}
</MorphScroll>
```

```tsx
// the same thing said in sizes
<MorphScroll {...props} objects={{ size: [90, "auto"], gap: 10 }}>
  {cards}
</MorphScroll>
```

</div></ul></details>

<br />

<details><summary><code><b>size</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
size: 100; // or [100, 70] | "full" | "firstChild" | "auto" | "none"
```

<b>Default:</b><br />
"none"<br />
<br />
<b>Description:</b><em><br />
defines the <b>[width, height]</b> of cells for each of your objects.<br />
<br />
<code>number</code>:<br />
sets a fixed size for your custom objects.<br />
<br />
<code><b>"full"</b></code>:<br />
the dimensions will be taken from <code>size</code>.<br />
<br />
<code><b>"firstChild"</b></code>:<br />
creates a <code>ResizeTracker</code> wrapper for the first child of your list. This wrapper will calculate the size of the first child, and these dimensions will be applied to all cells in the list.<br />
This can be useful if you want to change the size of objects in your list dynamically, e.g., when reducing the size of the user's screen.<br />
<br />
<code><b>"auto"</b></code>:<br />
every object gets the size it asks for, and the library measures it. Which side you hand over settles how the objects are then arranged — that is what <code>layout</code> names in words, and either way of saying it works.<br />
<br />
<code>"auto"</code> on its own says it about both sides at once — the same as <code>["auto", "auto"]</code>.<br />
<br />
Measuring is done by one observer for the whole scroll, not one per object, and an object is watched for as long as it is on screen: a picture that arrives late or a text that changes moves its neighbours, instead of leaving the layout wrong. Sizes are remembered by the child's <code>key</code>, so they survive virtualization. Objects that have not been measured yet are drawn a batch at a time, so a list of five hundred does not arrive in a single frame.<br />
<br />
<code><b>"none"</b></code>:<br />
cells are still created, but <code>MorphScroll</code> does not measure them — they simply wrap your objects and the sizing is left to your CSS. Leaving <code>size</code> out does exactly this, so the word earns its place in a pair, where there is no empty slot to leave: <code>[100, "none"]</code> is a fixed width with the height decided by the content. A computed <code>undefined</code> in that place means the same thing.<br />
<br />
✦ Note:<br />

<ul>
  <li><b>"none"</b> is not compatible with <code>render</code> — and neither is leaving the size out. <b>"auto"</b> is: the library measures the objects, so <code>render</code> has the numbers it needs.</li>
  <li><b>"auto"</b> needs <code>mode="scroll"</code>: pages are all one size, and objects of their own size have no size in common.</li>
  <li>with <code>direction="hybrid"</code> it needs <code>lines</code> — that is the only thing left that can end a row.</li>
  <li>the layout follows the objects, so anything that changes their size while they are on screen repacks them. Reserving space for a late picture (<code>aspect-ratio</code> does it in one line) still saves that repack.</li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ size: [70, 100] }}>
  {children}
</MorphScroll>
```

```tsx
// a masonry of cards: 90 wide, as tall as each card turns out to be
<MorphScroll {...props} objects={{ size: [90, "auto"], gap: 10 }}>
  {cards}
</MorphScroll>
```

```tsx
// a flow of tags: 28 tall, each as wide as its own word
<MorphScroll {...props} objects={{ size: ["auto", 28], gap: 8 }}>
  {tags}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_size.png)

</div></ul></details>

<br />

<details><summary><code><b>lines</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
lines: 2;
```

<b>Description:</b><em><br />
how many lines the objects run in, across the scroll — columns on a vertical scroll, rows on a horizontal one.<br />
<br />
✦ Note:<br />

<ul>
  <li>If you use <b>"x"</b> or <b>"y"</b> for the <code>direction</code> parameter, <code>lines</code> only limits the <b>maximum</b> number of columns or rows.</li>
  <li>If you use <b>"hybrid"</b> for the <code>direction</code> parameter, <code>lines</code> defines the <b>exact</b> number of columns or rows in dependence of <code>direction</code>, but not exceeding the total number of passed elements.</li>
</ul>
</em><br />

<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ lines: 2 }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_lines.png)

</div></ul></details>

<br />

<details><summary><code><b>gap</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
gap: 10; // or [20, 10]
```

<b>Description:</b><em><br />
allows you to set spacing in pixels between list items for rows and columns.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ gap: 10 }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_gap.png)

</div></ul></details>

<br />

<details><summary><code><b>align</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
align: "center"; // or "start" | "end"
```

<b>Default:</b><br />
"start"<br />
<br />
<b>Description:</b><em><br />
where a line that did not fill up sits — the last row of a grid, or the only row of a short list.<br />
<br />
<code>align</code> lines the rows up against the widest one — widest across the scroll, which is the vertical spread on a horizontal scroll just as much as the horizontal one on a vertical scroll. That row is as much room as the content actually needs and has nowhere to move; a row of two small objects leaves a gap beside it, and closing that gap is exactly what <code>align</code> is for. A fill has no rows at all, so each object closes its own gap instead — the one between it and whatever sits past it in that direction, or the edge of the room if nothing does; two objects side by side with room past both of them both move, each by as much as it individually has. <code>"center"</code> stops an object halfway between where the fit first placed it and where <code>"end"</code> would have pushed it. That room, in every case, is the scroll minus <code>wrapper.margin</code>, and nothing moves until every object has been measured, so the layout does not walk back as the sizes arrive.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ align: "center" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_align.png)

</div></ul></details>

<br />

<details><summary><code><b>order</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
order: "row"; // or "column"
```

<b>Default:</b><br />
"row"<br />
<br />
<b>Description:</b><em><br />
changes the order of the provided elements based on the provided value.<br />
<br />
<code>"row"</code> fills a row and moves down, <code>"column"</code> fills a column and moves right. One of the two is what the list already does, and which one depends on where the scroll runs — a vertical scroll lays rows one after another, a horizontal one lays columns. The other asks for the order to be transposed: the first line then takes the first <code>ceil(n / lines)</code> objects, and a masonry asked for it stops looking for the shortest column, trading an even edge for reading straight through. The count is by number and never by size, so nothing jumps as the objects are measured.<br />
<br />
Transposing needs lines to count. A masonry always has them — as many columns as fit, or as many as <code>lines</code> names. A flow has them when <code>lines</code> names them; without it a line ends where the room does, and how many there will be is not knowable in advance. A fill has none at all: it gives the order up for the fit, which is the whole point of handing over both sides. In those two cases the request is not carried out, and the library says so — when you wrote the value yourself, that is: on a horizontal scroll the default <code>"row"</code> is the transposed one, and complaining about a word nobody typed would only be noise.<br />
<br />
<code>direction="hybrid"</code> answers the same request with the axis instead: <code>"row"</code> has <code>lines</code> bound the width and growth run down, <code>"column"</code> bounds the height and growth runs right — which is "the first column first", written as an axis rather than as an order.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ order: "column" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_order.png)

</div></ul></details>

<br />

<details><summary><code><b>semantics</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
semantics: "list";
```

<b>Description:</b><em><br />
describe the objects to assistive technology.<br />
<br />
<b>"list"</b> marks the wrapper as a list and every object as one of its items, numbered. It matters most with <code>render</code>: only a window of the objects is in the document, so a screen reader would otherwise announce a list of a dozen and give no way to tell where in the real list you are. With it, each object carries its own place and the total.<br />
<br />
Left out, nothing is claimed. The objects may be cards, slides or a menu, and calling those a list would describe them wrongly — which is worse than describing them not at all.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} render="virtual" objects={{ size: 100, semantics: "list" }}>
  {rows}
</MorphScroll>
```

</div></ul></details>

<br />

<details><summary><code><b>groups</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
groups: "sticky";
```

<b>Description:</b><em><br />
what a group of objects does.<br />
<br />
A group is named in the child's own <code>key</code>, in brackets at the end: <code>"post-4[news]"</code> belongs to <b>news</b>. There is no prop for the grouping itself — a key has to be unique anyway, and carrying the group in it is cheaper than keeping a second list beside it.<br />
<br />
<b>"sticky"</b> keeps the first object of each group in view for as long as any of its group is: it holds against the leading edge and is pushed out by the group that follows. That first object is the group's heading, so it always says which group you are looking at. While it is held there it carries <code>ms-sticky</code>, which is the hook for a shadow or a background.<br />
<br />
✦ Note:<br />
the same names reach <code>scrollToObject</code>, which goes to a group's first object.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ size: 60, groups: "sticky" }}>
  {contacts.map((one) => (
    <Row key={`c-${one.id}[${one.letter}]`} {...one} />
  ))}
</MorphScroll>
```

```css
.ms-object-box.ms-sticky {
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.15);
}
```

</div></ul></details>

<br />

<details><summary><code><b>empty</b></code></summary><br /><ul><div>
<b>Usage:</b><br />
<ul>
  <li><b>Simple</b>:<br />
  
```tsx
empty: "clear" // or "fallback"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
empty: {
  mode: "clear", // or "fallback" (required)
  fallback: <YourEmptyPlaceholder />, // optional, wins over the fallback prop
  clickTrigger: ".btn-class", // or { selector: ".btn-class"; delay: 100 };
}
```

  </li>
</ul>

<b>Description:</b><em><br />
this option allows you to remove or replace empty list items during the initial render, or trigger this process via a click action<br />
<br />
<code><b>mode</b></code>:<br />

<ul>
  <li><b>"clear"</b> – automatically removes empty objects.</li>
  <li><b>"fallback"</b> – replaces empty objects with a placeholder.</li>
</ul>
<br />
<code><b>fallback</b></code>:<br />
the placeholder for this scroll. Without it the <code>fallback</code> prop is used, so you only need this when one scroll should show something different from the rest.<br />
<br />
<code><b>clickTrigger</b></code>:<br />
use this option if removal should be triggered by a click action.<br />
<ul>
  <li><b>"selector"</b> – CSS selector that triggers the removal.</li>
  <li><b>"delay"</b> – delay before removal ( in <b>ms</b> ).</li>
</ul>
<br />
✦ Note:<br />
<ul>
  <li>The cleanup runs on the initial render, when the number of elements changes, on scroll, and on click if you use <code>clickTrigger</code>.</li>
  <li>If you use <code>clickTrigger</code>:<br />
  - consider increasing <code>delay</code>, since the cleanup may run before removal.<br />
  - the wrapper <code>.ms-object-box</code> also gets the <code>ms-remove</code> class, which you can use e.g. for fade-out animations.</li>
</ul>
</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ empty: "clear" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_empty.png)

</div></ul></details>

</div></ul></details>

<h2></h2>

<details><summary><b><code>wrapper</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
wrapper: {
  margin: 10,      // or [x, y] | [t, r, b, l]
  minSize: "full", // or a number | ["full", 10]
  align: "center", // or "start" | "end" | ["center", "start"]
}
```

<b>Description:</b><em><br />
everything about <b>.ms-objects-wrapper</b>, the box that holds your objects, in one place.<br />
</em><br />

<details><summary><code><b>margin</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
margin: 10; // or [x, y] | [t, r, b, l]
```

<b>Description:</b><em><br />
spacing between the objects and their wrapper, which grows the scrollable area by the same amount.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} wrapper={{ margin: 10 }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapper_margin.png)

</div></ul></details>

<br />

<details><summary><code><b>minSize</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
minSize: "full"; // or a number | ["full", 10]
```

<b>Description:</b><em><br />
the smallest the wrapper may get, applied as <code>min-width</code> / <code>min-height</code>. <b>"full"</b> means the <code>size</code> prop.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} wrapper={{ minSize: "full" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapper_minSize.png)

</div></ul></details>

<br />

<details><summary><code><b>align</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
align: "center"; // or "start" | "end" | ["center", "start"]
```

<b>Default:</b><br />
"start"<br />
<br />
<b>Description:</b><em><br />
where the wrapper sits when it is smaller than <code>size</code>. One value aligns both axes, a pair aligns them separately.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} wrapper={{ align: "center" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapper_align.png)

</div></ul></details>

</div></ul></details>

<h2></h2>

###### **— CONTROLS —**

<details><summary><b><code>controls</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Shorthand</b>:<br />

```tsx
controls: "wheel"; // or ["wheel", "drag", "arrows", "bar"]
```

  </li>
  <li><b>Simple</b>:<br />
  
```tsx
controls: {
  wheel: true,
  drag: true,
  bar: true, // or <ScrollThumbComponent />
  arrows: true, // or <ArrowComponent />
}
```

  </li>
  <li><b>Advanced</b>:<br />

```tsx
controls: {
  wheel: {
    // if direction="hybrid"
    changeDirection: true,
    changeDirectionBtn: "KeyZ" // default "KeyX", "" to disable
  },
  bar: [<Elem1 />, <Elem2 />, <Elem3 />],
  arrows: {
    element: <ArrowComponent />,
    size: 60, // default 40px
    reserveSpace: true,
  }
}
```

  </li>
</ul>

<b>Default:</b><br />
{ wheel: true, keys: true }<br />
<br />
<b>Description:</b><em><br />
everything that can move the scroll lives here: the wheel, the keys and a drag, which are only switched on or off, and the bar and the arrows, which the library also draws for you.<br />
<br />
A name, or an array of names, is shorthand for switching those on: <code>"wheel"</code> is the same as <code>{ wheel: true }</code>, and <code>["wheel", "drag"]</code> the same as <code>{ wheel: true, drag: true }</code>. Reach for the object form when one needs settings, or to pass an element.<br />
<br />
✦ Note:<br />
what you write is <b>added to</b> the default rather than put in its place. The wheel and the keys are how a scroll is worked by default, and naming a bar is not a request to take them away — <code>{ bar: &lt;Thumb /&gt; }</code> gives you a bar on a scroll that still answers the wheel. To take one away, say so: <code>{ wheel: false, bar: &lt;Thumb /&gt; }</code>.<br /></em>

<br />

<details><summary><code><b>wheel</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
wheel: true;
```

<b>Description:</b><em><br />
the wheel over the content moves the scroll.<br />
<br />
Both settings below are for <code>direction="hybrid"</code>, where one wheel has to serve two axes.<br />
<br />
✦ Note:<br />

<ul>
  <li>a wheel notch is reported in pixels, lines or pages depending on the browser, and all three are converted, so one notch travels the same distance everywhere. A sideways gesture on a trackpad drives a horizontal list directly, and a mouse, which has no sideways to give, still drives it with the vertical wheel.</li><br />
  <li>a list that has nowhere left to go hands the wheel outward, to whatever scrolls around it — the same way a native one does, so a list inside a page is not a trap.</li><br />
  <li>the wheel takes focus for the keys to work on, but never from a field being typed in — over an <code>input</code>, <code>textarea</code>, <code>select</code> or anything <code>contenteditable</code> it scrolls and leaves the caret where it is.</li>
</ul>

</em><br />

<details><summary><code><b>changeDirection</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
changeDirection: true;
```

<b>Description:</b><em><br />
the wheel switches the axis it scrolls instead of always taking the same one.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ wheel: { changeDirection: true } }}>
  {children}
</MorphScroll>
```

</div></ul></details>

<br />

<details><summary><code><b>changeDirectionBtn</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
changeDirectionBtn: "KeyZ"; // "" turns it off
```

<b>Default:</b><br />
"KeyX"<br />
<br />
<b>Description:</b><em><br />
a held key switches the axis instead. Pass an empty string to disable it. <a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values">more about keys</a><br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ wheel: { changeDirectionBtn: "KeyZ" } }}
>
  {children}
</MorphScroll>
```

</div></ul></details>

<br />
</div></ul></details>

<br />

<details><summary><code><b>keys</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
keys: true;
```

<b>Description:</b><em><br />
the arrow keys move the scroll while it has focus — clicking it is enough, the viewport is a tab stop.<br />
<br />
✦ Note:<br />
inside an <code>input</code>, <code>textarea</code>, <code>select</code> or anything <code>contenteditable</code> the arrows belong to the text, and the scroll leaves them alone.<br />
</em><br />

<details><summary><code><b>mode</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
mode: "focus"; // or "step" | "pan"
```

<b>Default:</b><br />
<b>"step"</b> in the slider modes, <b>"pan"</b> in <code>mode="scroll"</code><br />
<br />
<b>Description:</b><em><br />
<b>"step"</b> turns a page, the same move the arrow buttons make and reported through <code>onNavigate</code> as <b>"keys"</b>; <b>"pan"</b> nudges the content along by <code>step</code> pixels; <b>"focus"</b> walks the objects.<br />
<br />
<b>"focus"</b> is Tab, but aimed: an arrow moves focus to the neighbouring object — picked by geometry, so a grid walks its row and drops to the next one — and the scroll follows, far enough to bring it into view and no further, leaving the <code>objects.gap</code> or the <code>wrapper.margin</code> that is there.<br />
Focus lands on the <code>.ms-object-box</code> itself, so the highlight is the whole card and there is one thing to style: <code>.ms-object-box:focus</code>. Give a box a <code>tabIndex</code> of your own and the library leaves it alone. The same move from any other device is <code>ref.moveFocus()</code>.<br />
<br />
✦ Note:<br />

<ul>
  <li>in <b>"pan"</b> and <b>"step"</b> only the keys of the scrolling axis are taken; the other two are left alone. <b>"focus"</b> takes all four — a vertical list can still be a grid.</li>
  <li>with <code>render="virtual"</code> the arrows only reach what is mounted — widen <code>render.rootMargin</code> to mount further ahead.</li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ keys: { mode: "focus" } }}>
  {children}
</MorphScroll>
```

</div></ul></details>

<br />

<details><summary><code><b>step</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
step: 40;
```

<b>Default:</b><br />
40<br />
<br />
<b>Description:</b><em><br />
how far one press nudges in <b>"pan"</b>.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ keys: { mode: "pan", step: 80 } }}>
  {children}
</MorphScroll>
```

</div></ul></details>

</div></ul></details>

<br />

<details><summary><code><b>drag</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
drag: true;
```

<b>Description:</b><em><br />
enables interaction by clicking and dragging anywhere within the scrollable content to move it.<br />
<br />
Anything can be dragged from — a menu of buttons, a row of links, a card with a picture in it — because what tells a tap from a scroll is the distance, not what happens to be under the pointer: below 2px it stays a click and the click lands, above it the wrapper drops <code>pointer-events</code> and it does not. The native drag of links and images is suppressed for as long as the gesture runs, so the browser cannot carry one away mid-scroll.<br />
<br />
While the content, a thumb or a slider is being dragged, the element under the pointer carries <code>ms-grabbing</code> — that is the hook for a grabbing cursor.<br />
<br />
A list inside a list takes its own gesture: the drag belongs to the innermost one under the pointer, and the outer stays where it is.<br />
<br />
The drag does not start only where the element has a drag or a caret of its own:<br />

<ul>
  <li><b>text fields</b>: <code>input</code>, <code>textarea</code>, <code>select</code></li><br />
  <li><b>elements with attribute</b>: <code>draggable="true"</code>, <code>contenteditable</code> and custom attribute - <code>ms-custom-drag</code></li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ drag: true }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_drag.png)

</div></ul></details>

<br />

<details><summary><code><b>bar</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
bar: <ScrollThumbComponent />; // or true | an array | an object
```

<b>Description:</b><em><br />
determines how the scroll progress is managed<br />
<br />

<ul>
  <li>When using <code>mode="scroll"</code>, you can provide a custom scroll element. If it's not ready yet, simply set <b>true</b> instead — this will fall back to the browser’s default scrollbar.</li><br />
  <li>When using <code>mode="slider"</code>, a <b>.ms-slider</b> element is automatically generated. It contains multiple <b>ms-slider-item</b> elements that visually represent the scroll progress. One of them will always have the <code>ms-active</code> class depending on the current position. A dot answers a tap and turns to its own page; dragging along the bar still pages as you go.</li><br />
  <li>When using <code>mode="sliderMenu"</code>, everything is the same as with <b>"slider"</b> but you can pass an array of custom buttons to <code>bar</code>. These buttons act as a navigation menu, allowing users to jump to specific sections.</li>
</ul>
<br />
For settings, pass an object instead of the element — the same shape <code>arrows</code> takes:<br />
</em><br />

```tsx
bar: {
  element: <ScrollThumbComponent />,
  edgeGap: 8,        // or [x, y] for direction="hybrid"
  trackGap: 10,
  reverse: true,
  showOnHover: true,
  thumbMinSize: 24,
}
```

<details><summary><code><b>element</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
element: <ScrollThumbComponent />;
```

<b>Description:</b><em><br />
the node the bar is built from. What it becomes depends on <code>mode</code>: in <b>"scroll"</b> it is the thumb that runs along the track, in <b>"slider"</b> it is one dot, repeated for every page, and in <b>"sliderMenu"</b> it is one button of the menu — there an array gives each page its own node, in order.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ bar: <ScrollThumbComponent /> }}>
  {children}
</MorphScroll>
```

</div></ul></details>

<br />

<details><summary><code><b>edgeGap</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
edgeGap: 8; // or [x, y] for direction="hybrid"
```

<b>Description:</b><em><br />
distance between the bar and the side it sits on. A negative value pushes it past that edge — the usual reason to reach for CSS here. It follows <code>reverse</code>, so the gap is always measured from whichever side the bar actually ended up on.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ bar: { element: <Thumb />, edgeGap: 8 } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_bar_edgeGap.png)

</div></ul></details>

<br />

<details><summary><code><b>trackGap</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
trackGap: 10;
```

<b>Description:</b><em><br />
shortens the track by this much at each of its two ends. Not to be confused with <code>edgeGap</code>: this one runs along the track, that one across it.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ bar: { element: <Thumb />, trackGap: 10 } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_bar_trackGap.png)

</div></ul></details>

<br />

<details><summary><code><b>reverse</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
reverse: true;
```

<b>Description:</b><em><br />
put the bar on the opposite side.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ bar: { element: <Thumb />, reverse: true } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_bar_reverse.png)

</div></ul></details>

<br />

<details><summary><code><b>showOnHover</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
showOnHover: true;
```

<b>Description:</b><em><br />
report the bar as idle unless it is hovered, touched or the content is moving. Nothing is styled for you — see the note below.</em><br />

✦ Note:<br />
with <code>showOnHover</code> the library sets <code>--ms-bar-visibility</code> (<b>1</b> active, <b>0</b> idle) and adds <b>.ms-hover</b> / <b>.ms-leave</b>, but styles nothing. It lands on whichever element the mode renders — <b>.ms-bar</b> in <code>mode="scroll"</code>, <b>.ms-slider</b> in the slider modes — so style both if you use both. The bar stays visible until you use the variable:<br />

```css
.ms-bar,
.ms-slider {
  opacity: var(--ms-bar-visibility, 1);
  transition: opacity 0.2s ease-in-out;
}
```

<em>which also means you are not limited to <code>opacity</code>:</em>

```css
.ms-bar {
  transform: scaleX(var(--ms-bar-visibility, 1));
  transition: transform 0.2s ease-in-out;
}
```

<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ bar: { element: <Thumb />, showOnHover: true } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_bar_showOnHover.png)

</div></ul></details>

<br />

<details><summary><code><b>thumbMinSize</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
thumbMinSize: 24;
```

<b>Description:</b><em><br />
the thumb never shrinks below this.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ bar: { element: <Thumb />, thumbMinSize: 24 } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_bar_thumbMinSize.png)

</div></ul></details>

<br />

</div></ul></details>

<br />

<details><summary><code><b>arrows</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
arrows: <ArrowComponent />; // or true | an object
```

<b>Description:</b><em><br />
allows you to add custom arrows to the progress bar.<br />
<br />
Each arrow is a <b>.ms-arrow-box</b> strip along its own side of the scroll; the element you pass sits inside <b>.ms-arrow</b>, which only rotates it. An arrow with nowhere left to go gets the <code>ms-disabled</code> class and no <code>cursor: pointer</code>, so it does not advertise a click that does nothing — under <code>loop</code> there are no dead ends and the class never appears.<br />
</em><br />

<details><summary><code><b>element</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
element: <ArrowComponent />;
```

<b>Description:</b><em><br />
the icon the arrows are made of. Draw it pointing <b>right</b>: that is the one direction you provide, and the library rotates the same element for the other three.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ arrows: { element: <ArrowComponent /> } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_arrows_element.png)

</div></ul></details>

<br />

<details><summary><code><b>size</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
size: 60;
```

<b>Default:</b><br />
40<br />
<br />
<b>Description:</b><em><br />
thickness of the <b>.ms-arrow-box</b> strip. The icon's own size is up to the element you pass.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ arrows: { element: <Arrow />, size: 60 } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_arrows_size.png)

</div></ul></details>

<br />

<details><summary><code><b>reserveSpace</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
reserveSpace: true;
```

<b>Description:</b><em><br />
the arrows take their strip out of the content instead of lying over it, so nothing gets covered. Without it they sit on top, which is the default.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  controls={{ arrows: { element: <Arrow />, reserveSpace: true } }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_arrows_reserveSpace.png)

</div></ul></details>

</div></ul></details>

</div></ul></details>

<h2></h2>

<details><summary><b><code>edge</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
edge: true; // or a node: <MyFade />
```

<b>Description:</b><em><br />
marks the edges where the content is cut off. The library places the slots and reports their state; what they look like is yours.<br />
<br />
Two edges are created for a single-axis <code>direction</code>, four for <code>"hybrid"</code>. Each carries the class <code>.ms-edge</code> plus its side — <code>.ms-top</code>, <code>.ms-right</code>, <code>.ms-bottom</code>, <code>.ms-left</code> — the <code>--ms-edge-visibility</code> variable (<b>1</b> when content is cut off on that side, <b>0</b> when it is not), and <code>.ms-disabled</code> while it is not.<br />
<br />
Passing a node instead of <b>true</b> renders it inside every edge slot, in a <b>.ms-edge-inner</b> wrapper. Author that node once, the way it looks along the top, and the library turns it onto the other three sides — the same bargain as the arrows, where one icon is drawn pointing right rather than four being drawn. The sideways slots get their sides swapped before the turn, so a gradient written across a wide strip lands correctly down a narrow one. The slot itself is never transformed, so your CSS can place it predictably.<br />
<br />
Passing <code>{ element, size }</code> adds the thickness of the strip, the way <code>arrows.size</code> does — a height at the top and bottom, a width at the sides, worked out for you. Without it the thickness is yours to write.<br />
<br />
✦ Note:<br />
an edge has no size and no colour of its own, so nothing shows until you give it some:<br />
</em>

```css
.ms-edge {
  opacity: var(--ms-edge-visibility);
  transition: opacity 0.2s ease-in-out;
}
/* one look for all four: the library turns it and names the thickness */
.ms-edge-inner {
  background: linear-gradient(#fff, transparent);
}
```

```tsx
<MorphScroll {...props} edge={{ element: <Fade />, size: 40 }}>
  {children}
</MorphScroll>
```

<em>Leave <code>size</code> out and the thickness is yours to write — a <b>height</b> on <code>.ms-top</code> and <code>.ms-bottom</code>, a <b>width</b> on <code>.ms-left</code> and <code>.ms-right</code>. Write only one of those pairs and the other stays at zero: present in the DOM, and invisible.</em>

<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} edge>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-edge.png)

</div></ul></details>

<h2></h2>

###### **— OPTIMIZATION —**

<details><summary><b><code>render</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />

```tsx
render: "lazy"; // or "virtual"
```

  </li>
  <li><b>Advanced</b>:<br />

```tsx
render: {
  mode: "lazy", // or "virtual" (required)
  rootMargin: 100, // or [x, y] | [t, r, b, l]
  deferLoadOnScroll: true,
  trackVisibility: true
}
```

  </li>
</ul>

<b>Description:</b><em><br />
this parameter adds a gradual rendering of the content as it enters the viewport.<br />
When used, a container is created for each scrollable object, and its absolute positioning is calculated based on scroll position and area dimensions.</em><br />

<em>✦ Note:<br />
<code>render</code> places objects by counting, so it needs a size it can count with: <code>objects.size: "none"</code> — and leaving the size out, which means the same thing — give it nothing to place.</em><br />
<br />

<details><summary><code><b>mode</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
mode: "lazy"; // or "virtual"
```

<b>Description:</b><em><br />
<b>"lazy"</b> renders an object once it has been seen and keeps it; <b>"virtual"</b> keeps only what is in view and drops the rest.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} render={{ mode: "virtual" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-render_mode.png)

</div></ul></details>

<br />

<details><summary><code><b>rootMargin</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
rootMargin: 100; // or [x, y] | [t, r, b, l]
```

<b>Description:</b><em><br />
how far beyond the viewport an object still counts as visible, in px. Widen it to prepare objects before they are reached.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} render={{ mode: "virtual", rootMargin: 100 }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-render_rootMargin.png)

</div></ul></details>

<br />

<details><summary><code><b>deferLoadOnScroll</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
deferLoadOnScroll: true;
```

<b>Description:</b><em><br />
holds new objects back while the scroll is moving and lets them in once it stops.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} render={{ mode: "lazy", deferLoadOnScroll: true }}>
  {children}
</MorphScroll>
```

</div></ul></details>

<br />

<details><summary><code><b>trackVisibility</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
trackVisibility: true;
```

<b>Description:</b><em><br />
sets the <code>--ms-content-visibility</code> variable on each object box, which is what a fade-in is styled with: <code>opacity: var(--ms-content-visibility);</code>.<br />
<br />
It needs no <code>mode</code> of its own. What stood in the way was never the rendering but the coordinates — they were worked out for the virtual modes alone — and asking to watch now works them out too. Without a <code>mode</code> nothing is dropped: every object stays mounted and simply knows how much of itself shows.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} render={{ trackVisibility: true }}>
  {children}
</MorphScroll>
```

</div></ul></details>

</div></ul></details>

<h2></h2>

<details><summary><b><code>suspending</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
suspending: true;
```

<b>Default:</b><br />
false<br />
<br />
<b>Description:</b><em><br />
wraps every cell in a React <code>Suspense</code> boundary, so a child that suspends — a <code>lazy()</code> component, a data fetch — shows <code>fallback</code> instead of taking the whole tree down with it.<br />
<br />
✦ Not to be confused with <code>render</code>:

<ul>
  <li><code>render</code> decides <b>whether a child is mounted at all</b>, based on whether it is in view. That is MorphScroll's own decision.</li><br />
  <li><code>suspending</code> decides <b>what happens while a mounted child is not ready</b>. That is React's decision, and MorphScroll only provides the boundary.</li>
</ul>

They are unrelated and combine freely — <code>render="virtual"</code> with <code>suspending</code> means only the visible cards are mounted, and each of those shows the fallback until its own data arrives. The one thing they share is <code>fallback</code>, which both use as the placeholder.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} suspending fallback={<Skeleton />}>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>fallback</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
sets the fallback element to display during loading or placeholder.<br />
<br />
It will be used when:

<ul>
  <li><code>suspending</code> is set to <b>true</b>.</li>
  <li><code>render.deferLoadOnScroll</code> is set to <b>true</b>.</li>
  <li><code>objects.empty.mode</code> is set to <b>"fallback"</b> and it carries no <code>fallback</code> of its own.</li> 
</ul>
</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} fallback={<div>Loading...</div>}>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

###### **— EVENTS —**

<details><summary><b><code>onScrollPosition</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
onScrollPosition: (left, top, max) => {};
```

<b>Description:</b><em><br />
runs on every scroll event with the current offsets, and with how far each axis can go.<br />
<br />
That third argument is what makes a "load more" out of this without a prop for it: how far the end is, is <code>max</code> minus the position, and nothing outside the component has to know the length of the content. With <code>render</code> or <code>objects.size: "auto"</code> nothing outside <b>can</b> know it — the objects are not in the document, or their sizes were measured here.<br />
<br />
✦ Note:<br />
in <code>loop</code> the content has no end, and <code>max</code> measures the strip of copies rather than one turn.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props}
  onScrollPosition={(left, top, max) => {
    if (max.y - top < 300) loadMore();
  }}
>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>onScrollingChange</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
accepts a callback function that is triggered whenever the scroll status changes. The callback receives a boolean value, where <code>true</code> indicates that scrolling is in progress, and <code>false</code> indicates that scrolling has stopped. This can be useful for triggering additional actions, such as pausing animations or loading indicators based on the scroll state.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  onScrollingChange={(motion) => {
    console.log(motion ? "Scrolling..." : "Scroll stopped.");
  }}
>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>onNavigate</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
onNavigate: ({ reason, axis, from, to }) => {};
```

<b>Description:</b><em><br />
the discrete half of scrolling: one event per page turn. <code>onScrollPosition</code> reports continuous movement; this one reports the turns, so it is the place to hang a sound, a haptic or an analytics event.<br />
<br />
<code><b>reason</b></code>: what put it there — <b>"arrows"</b>, <b>"bar"</b> (a slider dot or a drag along the bar), <b>"keys"</b>, your own string from a <code>ref</code> command, or <b>"scroll"</b> when the content simply arrived by wheel, drag or inertia.<br />
<br />
✦ Note:<br />

<ul>
  <li>a turn that was asked for reports the moment it is asked for. Three quick presses of an arrow share one ride and still report three times — the count follows the presses, not the animation.</li>
  <li>a turn nobody asked for reports when the scroll settles, as <b>"scroll"</b>.</li>
  <li>one command, one event: a dot click that flies past three pages on its way to the fourth reports the fourth, not all four.</li>
  <li>in <code>mode="scroll"</code> there are no pages to arrive at, so only commands report.</li>
</ul>
</em><br />

<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  onNavigate={({ reason, from, to }) => {
    if (reason !== "scroll") playClick();
    console.log(`${from} -> ${to}`);
  }}
>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>onRenderedKeysChange</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
accepts a callback function that receives the keys of all currently rendered elements. Use explicit React <code>key</code> values on children to receive meaningful names; otherwise React-generated keys are returned.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  onRenderedKeysChange={(keys) => {
    console.log("Rendered keys:", keys);
  }}
>
  {children}
</MorphScroll>
```

</div></ul></details>
  
</div></ul>
</details>

<h2></h2>

<details><summary><b>ResizeTracker</b>: <em>component that monitors changes to an element’s size</em></summary>

- #### Props:

<ul><div>

<details><summary><b><code>className</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add additional classes to the component.</em><br />
<br />
<b>Example:</b>

```tsx
<ResizeTracker className="custom-class">{children}</ResizeTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>children</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom content to the component.</em><br />
<br />
<b>Example:</b>

```tsx
<ResizeTracker>{children}</ResizeTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>style</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom inline styles.</em><br />
<br />
<b>Example:</b>

```tsx
<ResizeTracker style={{ backgroundColor: "yellow" }}>{children}</ResizeTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>measure</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
measure: "outer"; // or "inner" | "all"
```

<b>Default:</b><br />
"inner"<br />
<br />
<b>Description:</b><em><br />
determines what is being measured by automatically applying inline styles that affect width and height.<br />
<br />
<code><b>"inner"</b></code>:<br />
sets <code>width: "max-content"</code> and <code>height: "max-content"</code>, measuring the size of child elements.<br />
<br />
<code><b>"outer"</b></code>:<br />
measures the parent element by setting <code>minWidth: "100%"</code> and <code>minHeight: "100%"</code>.<br />
<br />
<code><b>"all"</b></code>:<br />
value combines the styles of both <code>"inner"</code> and <code>"outer"</code>, allowing measurement of both the parent and child elements.<br />
<br />
✦ Note: <br />
Be cautious when overriding styles via the <code>style</code> prop, as it may interfere with the styles applied by <code>measure</code>, leading to unexpected behavior.</em><br />
<br />
<b>Example:</b>

```tsx
<ResizeTracker measure="all">{children}</ResizeTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>onResize</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
callback function that is triggered whenever the observed element's dimensions change.<br />
The function receives an object of type <b>Partial<DOMRectReadOnly></b> that containing updated size properties.</em><br />
<br />
<b>Example:</b>

```tsx
<ResizeTracker
  onResize={(rect) => {
    console.log("New size:", rect);
  }}
>
  {children}
</ResizeTracker>
```

</div></ul></details>

<h2></h2>

</div></ul>

- #### Links:

  [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

</details>

<h2></h2>

<details><summary><b>IntersectionTracker</b>: <em>component for tracking the intersection of an element with the viewport</em></summary>

- #### Props:

<ul><div>

<details><summary><b><code>className</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add additional classes to the component.</em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker className="custom-class">{children}</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>children</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom content to the component.</em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker>{children}</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>style</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom inline styles.</em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker style={{ backgroundColor: "yellow" }}>
  {children}
</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>root</code></b></summary><br /><ul><div>
<b>Default:</b><br />
null (browser window)<br />
<br />
<b>Description:</b><em><br />
specifies the element that serves as the bounding box for the intersection observation. 
If provided, it must be an ancestor of the observed element.</em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker root={document.getElementById("observer-container")}>
  {children}
</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>rootMargin</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
rootMargin: 10; // or [x, y] | [t, r, b, l]
```

<b>Description:</b><em><br />
defines an offset around the root element, expanding or shrinking the observed area.</em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker rootMargin={10}>{children}</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>threshold</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
threshold: 0.5; // or [0, 0.5, 1]
```

<b>Default:</b><br />
0<br />
<br />
<b>Description:</b><em><br />
specifies at what percentage of the observed element’s visibility the callback <code>onIntersection</code> should be executed.<br />
<br />
✦ Note:<br />

<ul>
  <li>A value of <code>0</code> means the callback fires when any part of the element appears, while <code>1</code> means the element must be fully visible.</li>
  <li>An array (e.g., <code>[0, 0.5, 1]</code>) triggers the callback multiple times at different visibility levels.</li>
</ul></em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker threshold={0.5}>{children}</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>onIntersection</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
callback function that is called when the observed element enters or leaves the viewport or the area defined by the <code>root</code> property. This can be used to load new list items for <code>MorphScroll</code>.<br />
<br />
✦ Note:<br />
<code>entry</code> is an object of type <b>IntersectionObserverEntry</b> that provides details about the intersection state, including:<br />
<ul>
  <li><code>boundingClientRect</code>: bounding rectangle of the element relative to the viewport.</li>
  <li><code>intersectionRatio</code>: percentage of the element that is visible in the viewport.</li>
  <li><code>intersectionRect</code>: intersection rectangle between the element and the viewport.</li>
  <li><code>rootBounds</code>: bounding rectangle of the root element relative to the viewport.</li>
  <li><code>target</code>: observed element.</li>
  <li><code>time</code>: timestamp when the intersection state changed.</li>
</ul></em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker
  onIntersection={(entry) => {
    if (entry.isIntersecting) loadMoreItems();
  }}
>
  {children}
</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

</div></ul>

- #### Links:

  [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

</details>

</div></ul>

<h2></h2>

### 〈 License 〉

- [MIT](./publish/LICENSE)

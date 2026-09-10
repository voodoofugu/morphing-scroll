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
> - Ships **ESM** and **CommonJS** builds.
> - Style the container as you like, but leave properties that size or position the internals alone.
> - Internals carry the `ms-` prefix. A moving scroll marks its root with `ms-scrolling` — nested scrolls read it to decide about the wheel, and so can your CSS.
> - Props are compared by content, so inline objects, arrays and elements need no `useMemo`; callbacks are held in refs.
> - Two things are done for you: content loading **above** the reader does not push them down, and a system request for less motion turns the library's own animations into jumps.
> - A combination that cannot work is reported once as a `[MS n]` warning (`n` tells one scroll from another) and the scroll keeps running; only a missing `size` throws.
> - DevTools makes it feel slower — the DOM keeps changing and every change is reported to the panel. Closed, that cost does not exist.
> - The API is final: **3.0** is what it will stay.

<h2></h2>

### 〈 API 〉

<ul><div>

<details><summary><b>MorphScroll</b>: <em>main component of the library responsible for displaying your data</em></summary>

- #### Props:

<ul><div>

###### **— GENERAL —**

<details><summary><b><code>className</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
adds your own classes to the outermost element. Inside it the library nests <b>.ms-content</b>, then <b>.ms-viewport</b> — the element that actually scrolls — then <b>.ms-objects-wrapper</b> holding one <b>.ms-object-box</b> per child. Style them if you need to, but leave what sizes or positions them to the library.</em><br />
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
the default — a thumb running along a track.<br />
<br />
<code><b>slider</b></code>:<br />
a carousel: one element per page, and everything lands on them — a wheel notch turns a page, a drag settles on the nearest one. The strip is a handle: it is dragged along, and a press on it does nothing.<br />
<br />
<code><b>sliderMenu</b></code>:<br />
the same pages and the same turns, but the strip is a menu: a press on an element turns to its page, and there is nothing to drag.<br />
<br />
So what tells them apart is the gesture the strip answers — dragged or pressed — and the cursor says which. Both take an array in <code>bar</code>, one node per page, so the elements themselves are yours either way: page dots that are only dragged along, or the same dots as a menu.<br />
<br />
Both draw one element per page, so a long list makes a long strip of them and past a point it outgrows the scroll. There is no cap on purpose: hiding pages would make the progress lie. The slider modes are for a handful of pages; for a list that keeps going, <code>mode="scroll"</code> shows the same position in one thumb.<br />
<br />
A page is one window, so content that does not divide into whole windows ends on a short one: the last turn stops against the end rather than on a page of its own. Nothing breaks — the turns stay reversible — but the last two are spaced unevenly. Sizing the objects so a whole number fills the window, or handing them the window with <code>objects.size: "full"</code>, keeps every page equal.</em><br />
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

<details><summary><b><code>fromRight</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
fromRight: true;
```

<b>Default:</b><br />
false<br />
<br />
<b>Description:</b><em><br />
the list begins at the right and runs leftwards.<br />
<br />
The first object stands at the right, and a horizontal scroll opens there — so its bar starts at the right and travels left as you read on. A slider's pages run the same way: the first page's dot is the right one, and the strip reads from there. A vertical list lays its columns from the right and puts its bar on the left, where a browser puts its own.<br />
<br />
It is asked for rather than taken from the page: a widget often reads the other way round from what surrounds it, and asking the environment costs a style recalculation on every render.<br />
<br />
✦ Note:<br />

<ul>
  <li>the objects themselves are left alone. Turning the list around is about order, not about how a card looks inside — that part is yours.</li><br />
  <li>positions are counted from the start of the list either way, so <code>scrollTo(0)</code> reaches the first object whichever way it runs and <code>onScrollPosition</code> reports the same number for the same place. Only the element's own <code>scrollLeft</code> still counts from its left edge, where the start of the list is its largest value.</li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} fromRight>
  {children}
</MorphScroll>
```

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
The strip does not grow: a few copies of the content are mounted, the window is kept in the middle one, and the moment it leaves, the position moves by one period. Under the window at that moment is the same content, so the seam is never seen.<br />
<br />
<code>render.mode</code> still mounts a window at a time, so a hundred turns cost what one costs; the circle does not need it — it places copies by coordinate either way — but a long list does.<br />
<br />
The slider modes turn too: pages are counted within one turn, so the progress element shows as many dots as there really are, and they come back round to the first.<br />
<br />
<code>direction="hybrid"</code> turns both ways at once — the copies lie in a grid, and each axis returns to its own middle.<br />
<br />
A period is the exact length of the content, so the circle needs a size it can count. A side left to your CSS cannot be counted — once the copies exist, measuring the box measures the copies — and the circle says so and stays open.<br />
<br />
<code>objects.size: "auto"</code> turns as well, only not at once: the period is the content's length, and that keeps growing while measurements arrive. So it scrolls as usual until everything is measured and closes the circle then. If something grows later, the position keeps its place within the turn.</em><br />
<br />
<b>Note:</b><em><br />
the list is repeated, not referenced — a few copies of every child are mounted at once. With <code>render.mode</code> only the ones in the window are, and the length of the list stops mattering; without it a long one is paid for several times over. For anything but a handful of objects, give the circle virtualising.</em><br />

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

<br />

<b>Example:</b>

```tsx
<MorphScroll {...props} loop>
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
brings one object into view. A place in the list rather than a place in pixels, which is the one you can actually name: with <code>render</code> the object is not in the document, and with <code>objects.size: "auto"</code> only the library knows where it ended up<br />

<ul>
  <li><code>target</code>: a place in the list counted from <b>one</b>, a child's <code>key</code>, or the name of a <b>group</b> — which a child names on itself, <code>ms-group="news"</code>.</li><br />
  <li><code>options.align</code>: where in the window it lands — <b>"start"</b> by default, <b>"center"</b>, or <b>"end"</b>. A pair aligns the axes apart under <code>direction="hybrid"</code>: <code>["center", "start"]</code>.</li>
</ul>

<br />

<em>A group is an attribute read straight off the child — nothing to pass on, nothing to switch on. A group resolves to its first object, and a key wins over a group of the same name.<br />
<br />
An aligned object does not stand against the edge of the window: it stops short of it by whatever is really in that place. Another object beyond it means the <code>objects.gap</code> the two hold between them; where the objects run out there is no gap left, and there it is <code>wrapper.margin</code>. So the ends agree with themselves — <code>scrollToObject(1, { align: "start" })</code> arrives exactly where <code>scrollTo(0)</code> does, and the last object with <b>"end"</b> where <code>scrollTo("end")</code> does. <code>moveFocus</code> and <code>keys: { mode: "focus" }</code> bring an object to an edge by the same rule.<br />
<br />
<code>align</code> asks, the range answers: an object near either end of an axis cannot be moved off it, so all three values land in the same place there — the first object sits at the start whatever you ask for. In a grid that is per axis, and a section starting in the first column is at the start of the horizontal one.</em>

```tsx
<MorphScroll {...props} ref={scroll} render="virtual">
  {posts.map((post) => (
    <Post key={`post-${post.id}`} ms-group={post.section} {...post} />
  ))}
</MorphScroll>;

scroll.current?.scrollToObject(10); // the tenth, counted from one
scroll.current?.scrollToObject("news"); // the first post of that section
scroll.current?.scrollToObject("post-4", { align: "center" }); // with align
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

<em>Poll, read the stick, call <code>pan</code>. Two things worth knowing when you build it out: multiply the distance by elapsed time, so a slow frame travels as far as two quick ones; and guard a button press with a timestamp of your own, because <code>buttons[13].pressed</code> is true on every frame it is held and a <code>step</code> per frame flies through the list. Swap <code>step</code> for <code>moveFocus</code> and the same loop walks the objects instead of turning pages.<br />
<br />
Which scroll gets the input is your decision too — the ref you poll is the one that answers. That is why the polling stays out here: a loop inside the scroll would have to guess which of several the stick was aimed at. A remote, a MIDI pedal or your own hotkeys connect the same way; only the reason changes.</em>

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
{ order: "row" }<br />
<br />
<b>Description:</b><em><br />
everything about the objects themselves: how big they are, how they sit next to each other, and what to do with the ones that render nothing.<br />
<br />
Each object is wrapped in an <code>.ms-object-box</code> of its own — this is what decides the size of that box and how the boxes are arranged.<br />
<br />
Where a box stands is the library's to say, and it says it with <code>transform</code>. A CSS <b>animation</b> on <code>.ms-object-box</code> that touches <code>transform</code> wins over that — keyframes outrank an inline style — and every object collapses into one place. Animate what is inside the box, or animate <code>opacity</code> alone.<br />
</em><br />

<details><summary><code><b>size</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
size: 100; // or [100, 70] | [100, "auto"] | "full" | "firstChild" | "auto"
```

<b>Default:</b><br />
an unnamed <code>size</code> does not stand aside — it answers for the objects, and the answer follows the scroll: across it an object takes all the room there is, along it the size is its own.<br />

<ul>
  <li><code>direction="y"</code> — <b>["full", "auto"]</b>: a row the width of the scroll, as tall as its own content.</li><br />
  <li><code>direction="x"</code> — <b>["auto", "full"]</b>: a column the height of the scroll, as wide as its own content.</li><br />
  <li><code>direction="hybrid"</code> — <b>"auto"</b>: both sides are the object's own, because both axes move and neither bounds a line. That leaves the count to <code>lines</code>, which is <b>1</b> there unless you raise it.</li><br />
  <li><code>mode="slider"</code> or <b>"sliderMenu"</b> — <b>"full"</b>: a page is the window, so the object is too. The mode answers before the direction does.</li>
</ul>

Every one of those can be counted, so <code>render</code>, <code>loop</code> and <code>trackVisibility</code> work with nothing named at all.<br />
<br />
One case is left alone: <code>lines</code> above <b>1</b> on a single axis. That is a grid of as many tracks as you named, each as wide as its content — your CSS decides those widths, nothing can count them, and <code>render</code> stays off until you name a size. It is the only such case left.<br />
<br />
<b>Description:</b><em><br />
defines the <b>[width, height]</b> of cells for each of your objects.<br />
<br />
<code><b>number</b></code>:<br />
sets a fixed size for your custom objects.<br />
<br />
<code><b>"full"</b></code>:<br />
the object takes all the room it has — the <code>size</code> of the scroll, less <code>wrapper.margin</code>, which is the space the objects live inside. Taking the whole window instead would put the object past it by exactly those margins.<br />
<br />
<code><b>"firstChild"</b></code>:<br />
creates a <code>ResizeTracker</code> wrapper for the first child of your list. This wrapper will calculate the size of the first child, and these dimensions will be applied to all cells in the list.<br />
This can be useful if you want to change the size of objects in your list dynamically, e.g., when reducing the size of the user's screen.<br />
<br />
<code><b>"auto"</b></code>:<br />
every object gets the size it asks for, and the library measures it. Which side you hand over settles how the objects are then arranged: the side along the scroll is a <b>masonry</b> — fixed columns, each object into the shortest one; the side across it, or both, is a <b>flow</b> — objects fill a line one after another, and a new line starts when the room runs out or when <code>lines</code> says it is full.<br />
<br />
One observer measures the whole scroll, and an object is watched while it is on screen: a picture that arrives late moves its neighbours instead of leaving the layout wrong. Sizes are remembered by the child's <code>key</code>, so they survive virtualization, and unmeasured objects are drawn a batch at a time.<br />
<br />
<b>a side left out of a pair</b>:<br />
it is the same as <b>"auto"</b> — the object decides that side and the library measures it. <code>[100, "auto"]</code> and <code>[100, undefined]</code> are one and the same: a hundred across, the content deciding along.<br />
<br />
There is no way to ask the library not to measure a side, and there was no point in one: what it measures is your CSS either way, and declining to measure only switched off <code>render</code>, <code>loop</code> and <code>trackVisibility</code> without handing the layout anywhere.<br />
<br />
✦ Note:<br />

<ul>
  <li><b>"auto"</b> works with <code>render</code>: the library measures the side and then knows it. The only size it cannot count is the grid above — <code>lines</code> without a size.</li>
  <li><b>"auto"</b> needs <code>mode="scroll"</code>: pages are all one size, and objects of their own size have no size in common.</li>
  <li>with <code>direction="hybrid"</code> the line is ended by <code>lines</code> and nothing else: there is no window across to wrap against. It is <b>1</b> unless you raise it — a column of objects each its own width, which scrolls sideways as far as the widest one.</li>
  <li>the layout follows the objects, so anything that changes their size while they are on screen repacks them. Reserving space for a late picture (<code>aspect-ratio</code> does it in one line) still saves that repack.</li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ size: [70, 100] }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_size.png)

</div></ul></details>

<h2></h2>

<details><summary><code><b>lines</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
lines: 2;
```

<b>Default:</b><br />
as many as the room across allows — and <b>1</b> under <code>direction="hybrid"</code>, where there is no room to ask<br />
<br />
<b>Description:</b><em><br />
how many lines the objects run in, across the scroll — columns on a vertical scroll, rows on a horizontal one.<br />
<br />
✦ Note:<br />

<ul>
  <li>with <code>direction="x"</code> or <b>"y"</b> it only <b>limits</b> the count: the window already ends a line, and this ends it sooner.</li>
  <li>with <b>"hybrid"</b> it <b>is</b> the count, and the only one — there is no window across to wrap against. Unwritten it is <b>1</b>: a single line of objects, which is why raising it is the only direction it goes.</li>
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

<h2></h2>

<details><summary><code><b>gap</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
gap: 10; // or [20, 10]
```

<b>Description:</b><em><br />
space between the objects, in pixels. One number holds both ways; a pair is <b>[x, y]</b> — sideways first, as everywhere else in the library.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ gap: 10 }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_gap.png)

</div></ul></details>

<h2></h2>

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
Rows line up against the widest one, so a short row has spare space beside it and <code>align</code> decides where that space goes. Where the whole block sits in the window is a different question, and <code>wrapper.align</code> answers it. Nothing moves until every object is measured.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ align: "center" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_align.png)

</div></ul></details>

<h2></h2>

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
<code>"row"</code> fills a row and moves down, <code>"column"</code> fills a column and moves right. One of the two is what the scroll already does — a vertical one lays rows, a horizontal one lays columns; the other transposes, and the first line then takes the first <code>ceil(n / lines)</code> objects. A masonry asked to transpose stops looking for the shortest column, trading an even edge for reading straight through. The count is by number, never by size, so nothing jumps as the objects are measured.<br />
<br />
Transposing needs a known number of lines: a masonry always has one, a flow only when <code>lines</code> names it. Without it the request is dropped, with a warning if you wrote the value yourself.<br />
<br />
In <code>direction="hybrid"</code> the same request is an axis: <code>"row"</code> has <code>lines</code> bound the width and growth run down, <code>"column"</code> bounds the height and growth runs right.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objects={{ order: "column" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objects_order.png)

</div></ul></details>

<h2></h2>

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
  <li><b>"fallback"</b> – replaces empty objects with <code>fallback.empty</code>.</li>
</ul>
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

<h2></h2>

<details><summary><code><b>minSize</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
minSize: "full"; // or a number | ["full", 10]
```

<b>Description:</b><em><br />
the smallest the wrapper may get, applied as <code>min-width</code> / <code>min-height</code>. A <b>number</b> is that floor in pixels; <b>"full"</b> is all the room there is — the <code>size</code> of the scroll, less <code>wrapper.margin</code>.<br />
<br />
Useful where the content may be shorter than the scroll and the box has to stay put anyway — a background that must not shrink, a bar that has to keep its place.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} wrapper={{ minSize: "full" }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapper_minSize.png)

</div></ul></details>

<h2></h2>

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
    changeDirectionBtn: "KeyX" // default ["ShiftLeft", "ShiftRight"], [] to disable
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
what you write <b>replaces</b> the default rather than adding to it. <code>{ wheel: true, keys: true }</code> is what an unwritten prop means; write anything and that is the whole set — <code>{ bar: &lt;Thumb /&gt; }</code> is a bar and nothing else, <code>{ wheel: true, bar: &lt;Thumb /&gt; }</code> is a bar and the wheel.<br />
<br />
Worth remembering that arrow keys come from <code>keys</code> — a scroll with none of it is worked by the pointer alone.<br /></em>

<br />

<details><summary><code><b>wheel</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
wheel: true;
```

<b>Default:</b><br />
true, <em>while <code>controls</code> is not written at all</em><br />
<br />
<b>Description:</b><em><br />
the wheel over the content moves the scroll. An unwritten <code>controls</code> carries it, because a scroll nothing can move is almost never what was meant; once you write the prop, name it if you want it.<br />
<br />
In the slider modes it turns pages instead of carrying pixels: one notch, one page, the same step an arrow takes — over the content and over the strip alike. A gesture on a trackpad is dozens of events, so turns are spaced; otherwise a single flick would fly through the list.<br />
<br />
At the very end the wheel goes outward, to a scroll around this one or to the page — but not in the same instant. While it is still being turned it stays here, the way a native scroll keeps it; without that the page below moves in the very frame the list runs out.<br />
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
in <code>direction="hybrid"</code>, gives the wheel to the x axis — a mouse has no sideways nudge of its own, and without this such a scroll is worked only by the trackpad or the bar. One axis has nothing to switch to, so this needs <code>"hybrid"</code> and says so otherwise.<br />
<br />
The other axis is then <b>Shift</b> away, see <code>changeDirectionBtn</code>. Without <code>changeDirection</code> nothing is taken over: the wheel moves y, a trackpad moves both, and <b>Shift</b> + wheel moves x — that last one is the browser's own doing, and it works here with no prop at all.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ wheel: { changeDirection: true } }}>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><code><b>changeDirectionBtn</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
changeDirectionBtn: "KeyX"; // or ["ShiftLeft+KeyX", "AltLeft"], [] turns it off
```

<b>Default:</b><br />
["ShiftLeft", "ShiftRight"]<br />
<br />
<b>Description:</b><em><br />
while one of these keys is held, the wheel goes back to the other axis. <b>Shift</b> by default — the key a browser already scrolls sideways with, so the gesture is the one people know. Needs <code>changeDirection</code>: on its own the wheel is not taken over, and there is nothing to hand back.<br />
<br />
A <a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values"><code>KeyboardEvent.code</code></a>, or a list of them. The list is <b>any of these</b>; <code>"+"</code> joins codes into one combination, so <code>["ShiftLeft+KeyX"]</code> waits for both and <code>["ShiftLeft", "AltLeft"]</code> answers either. A modifier has one code per side, which is why the default names both. An empty list turns it off.<br />
<br />
✦ Note:<br />
a modifier arrives with the wheel event itself, so it works wherever the pointer is. Any other key is read from the keyboard, and a keyboard is only heard while the scroll has focus — a combination that mixes the two needs the scroll focused.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ wheel: { changeDirectionBtn: "KeyZ" } }}>
  {children}
</MorphScroll>
```

</div></ul></details>

</div></ul></details>

<h2></h2>

<details><summary><code><b>keys</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
keys: true;
```

<b>Default:</b><br />
true, <em>while <code>controls</code> is not written at all</em><br />
<br />
<b>Description:</b><em><br />
the arrow keys move the scroll while it has focus — clicking it is enough, the viewport is a tab stop. A native scroll obeys the arrows once it has focus, and a keyboard user reaching a list that cannot be moved is a dead end, so an unwritten <code>controls</code> carries this. Write <code>controls</code> yourself and it is yours to name.<br />
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
<b>"step"</b> turns a page, the same move the arrow buttons make and reported through <code>onNavigate</code> as <b>"keys"</b>;<br />
<b>"pan"</b> nudges the content along by <code>step</code> pixels;<br />
<b>"focus"</b> walks the objects.<br />
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

<h2></h2>

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

<h2></h2>

<details><summary><code><b>drag</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
drag: true;
```

<b>Description:</b><em><br />
enables interaction by clicking and dragging anywhere within the scrollable content to move it.<br />
<br />
A tap is told from a scroll by distance, not by what is under the pointer: below 2px it stays a click and the click lands, above it the wrapper drops <code>pointer-events</code> and it does not. So anything can be dragged from — buttons, links, a card with a picture. The native drag of links and images is suppressed while the gesture runs.<br />
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

<h2></h2>

<details><summary><code><b>bar</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
bar: <ScrollThumbComponent />; // or true | an array | an object
```

<b>Description:</b><em><br />
determines how the scroll progress is managed<br />
<br />

<ul>
  <li>With <code>mode="scroll"</code> you pass your own thumb; <b>true</b> falls back to the browser's own scrollbar. The element you pass sits inside <b>.ms-thumb</b>, which is the part that moves and is sized along the track — leave its own size and position to the library and style what is inside it.</li><br />
  <li>With <code>mode="slider"</code> a <b>.ms-slider</b> element is generated, holding one <b>ms-slider-item</b> per page; the one under the current position carries <code>ms-active</code>. The strip is dragged along and pages as you go.</li><br />
  <li>With <code>mode="sliderMenu"</code> the strip is the same, but pressed rather than dragged: an element turns to its own page.</li>
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
the node the bar is built from. What it becomes depends on <code>mode</code>: in <b>"scroll"</b> it is the thumb that runs along the track, and in the slider modes it is one page marker, repeated for every page — an array gives each page its own node, in order.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} controls={{ bar: <ScrollThumbComponent /> }}>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

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
<MorphScroll {...props} controls={{ bar: { element: <Thumb />, edgeGap: 8 } }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_bar_edgeGap.png)

</div></ul></details>

<h2></h2>

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

<h2></h2>

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

<h2></h2>

<details><summary><code><b>showOnHover</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
showOnHover: true;
```

<b>Description:</b><em><br />
report the bar as idle unless it is hovered, touched or the content is moving. Nothing is styled for you — see the note below.</em><br />

✦ Note:<br />
with <code>showOnHover</code> the library sets <code>--ms-bar-visibility</code> (<b>1</b> active, <b>0</b> idle) and adds <b>.ms-hover</b> / <b>.ms-leave</b>, but styles nothing. It lands on whatever the mode renders — <b>.ms-bar</b> or <b>.ms-slider</b> — so style both if you use both. The bar stays visible until you use the variable:<br />

```css
.ms-slider {
  opacity: var(--ms-bar-visibility, 1);
  transition: opacity 0.2s ease-in-out;
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

<h2></h2>

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

</div></ul></details>

<h2></h2>

<details><summary><code><b>arrows</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
arrows: <ArrowComponent />; // or true | an object
```

<b>Description:</b><em><br />
allows you to add custom arrows to the progress bar.<br />
<br />
Each arrow is a <b>.ms-arrow-box</b> strip along its own side; the element you pass sits inside <b>.ms-arrow</b>, which only rotates it. An arrow with nowhere left to go gets <code>ms-disabled</code> and no <code>cursor: pointer</code> — under <code>loop</code> there are no dead ends, so the class never appears.<br />
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
<MorphScroll {...props} controls={{ arrows: { element: <ArrowComponent /> } }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_arrows_element.png)

</div></ul></details>

<h2></h2>

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
<MorphScroll {...props} controls={{ arrows: { element: <Arrow />, size: 60 } }}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-controls_arrows_size.png)

</div></ul></details>

<h2></h2>

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
Passing a node instead of <b>true</b> renders it inside every slot, in a <b>.ms-edge-inner</b> wrapper. Author it once, the way it looks along the top, and the library turns it onto the other three sides; the sideways slots get their sides swapped first, so a gradient written across a wide strip lands correctly down a narrow one. The slot itself is never transformed, so your CSS can place it predictably.<br />
<br />
Passing <code>element.size</code> sets the strip's thickness the way <code>arrows.size</code> does — a height at the top and bottom, a width at the sides. Without it the thickness is yours to write.<br />
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

<em>Leave <code>size</code> out and the thickness is yours to write — a <b>height</b> on <code>.ms-top</code> and <code>.ms-bottom</code>, a <b>width</b> on <code>.ms-left</code> and <code>.ms-right</code>.</em>

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
  deferLoadOnScroll: true
}
```

  </li>
</ul>

<b>Description:</b><em><br />
this parameter adds a gradual rendering of the content as it enters the viewport.<br />
When used, a container is created for each scrollable object, and its absolute positioning is calculated based on scroll position and area dimensions.</em><br />

<em>✦ Note:<br />
<code>render</code> places objects by counting, and an unnamed <code>objects.size</code> answers for them — so it works with nothing else named. The one size it cannot count is <code>objects.lines</code> above <b>1</b> without a size: that grid's track widths are your CSS's to decide, and it is said once in the console.<br />
<br />
A window also hides how long the list is, so the markup says it instead: with a <code>mode</code> set, the wrapper is a list and every object an item numbered against the real total. Without a window every object is in the document and a screen reader counts them itself; a slider is never called a list either, since its dots already say where you are.</em><br />
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

<h2></h2>

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

<h2></h2>

<details><summary><code><b>deferLoadOnScroll</b></code></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
deferLoadOnScroll: true;
```

<b>Description:</b><em><br />
delays the loading of new objects while scrolling and loads them as soon as scrolling stops.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} render={{ mode: "lazy", deferLoadOnScroll: true }}>
  {children}
</MorphScroll>
```

</div></ul></details>

</div></ul></details>

<h2></h2>

<details><summary><b><code>trackVisibility</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
trackVisibility: true;
```

<b>Default:</b><br />
false<br />
<br />
<b>Description:</b><em><br />
reports how much of every object shows, through <code>--ms-content-visibility</code> on its <code>.ms-object-box</code> — <b>0</b> out of sight, <b>1</b> whole, a fraction in between. That is what a fade is styled with: <code>opacity: var(--ms-content-visibility);</code><br />
<br />
Nothing is styled for you and nothing is dropped: the objects stay mounted and simply know where they are. It goes with <code>render</code> and without it alike — the two are different questions, which is why they are different props.<br />
<br />
✦ Note:<br />

<ul>
  <li>the ratio is counted against the window itself, so <code>render.rootMargin</code> does not widen it: an object preloaded past the edge reports <b>0</b> until it truly shows.</li>
  <li>counted by place, so it needs an <code>objects.size</code> that can be counted — the same one <code>render</code> needs.</li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} trackVisibility>
  {children}
</MorphScroll>
```

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

They are unrelated and combine freely — <code>render="virtual"</code> with <code>suspending</code> means only the visible cards are mounted, and each of those shows the fallback until its own data arrives. The one thing they share is <code>fallback</code>, whose <code>loading</code> half both use.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} suspending fallback={<Loader />}>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>fallback</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />

```tsx
fallback: <div>Loading...</div>;
```

  </li>
  <li><b>Advanced</b>:<br />

```tsx
fallback: {
  loading: <Loader />, // optional
  empty: <div>Empty!</div>, // optional
}
```

  </li>
</ul>

<b>Description:</b><em><br />
what stands in for an object that is not showing. There are two such occasions, and a node passed on its own stands in for both:<br />

<ul>
  <li><b>an object on its way</b> — <code>suspending</code> while a child suspends, and <code>render.deferLoadOnScroll</code> while the scroll is moving.</li><br />
  <li><b>an object that rendered nothing</b> — under <code>objects.empty: "fallback"</code>.</li>
</ul>

<br />

Tell them apart by naming them. A spinner where the data is on its way and a word where there is none to come reads better than one node doing both jobs.<br />
<br />
✦ Note:<br />

<ul>
  <li><code>empty</code> is a refinement, not a separate set: leaving it out is not turning it off, and the one you did name stands in there too.</li>
  <li>naming neither is still fine — under <code>objects.empty: "fallback"</code> with <code>render</code> an empty <code>.ms-empty-object</code> holds the box: the window counts objects by the piece, and one dropping out would pull everything below it up.</li>
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
That third argument is what makes a "load more" out of this without a prop for it: the distance to the end is <code>max</code> minus the position. With <code>render</code> or <code>objects.size: "auto"</code> nothing outside <b>can</b> know it — the objects are not in the document, or their sizes were measured here.<br />
<br />
✦ Note:<br />

<ul>
  <li>measure with a distance, not with equality. <code>max</code> is read off the element, where the sizes are whole numbers while the position need not be: under browser zoom the two drift apart by a fraction of a pixel, and the position can even read past <code>max</code>. <code>max.y - top &lt; 1</code> is "at the end" — and a "load more" wants a wider reach than that anyway, so it is the natural way to write it.</li>
  <li>in <code>loop</code> the content has no end, and <code>max</code> measures the strip of copies rather than one turn.</li>
</ul>
</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
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
runs whenever the scroll starts or stops, with <b>true</b> while it moves and <b>false</b> once it settles — the hook for pausing an animation or showing a loading state.</em><br />
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
<code><b>reason</b></code>: what put it there — <b>"arrows"</b>, <b>"bar"</b> (a slider dot or a drag along the bar), <b>"keys"</b>, <b>"wheel"</b> (a notch over a slider, which turns a page), your own string from a <code>ref</code> command, or <b>"scroll"</b> when the content simply arrived by drag or inertia.<br />
<br />
✦ Note:

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

</div></ul></details>

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

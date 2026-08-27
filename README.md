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

Start using the `MorphScroll` component by defining the required `size` prop. For better precision and control, it's recommended to begin by understanding the `objectsSize` and `progressTrigger` props, which are explained below.

> **✦ Note:**
>
> - Supports both **ESM** (`import`) and **CommonJS** (`require`) builds.
> - The MorphScroll container can be styled with CSS, but avoid modifying properties that affect the size or positioning of internal elements.
> - Components include identifying attributes and MorphScroll internals elements use the `ms-` prefix for classes and attributes.
> - While a scroll is running its root carries the `ms-scrolling` attribute. Nested scrolls read it to decide whether to take the wheel, and it is available for styling.
> - Write objects, arrays and elements straight into the props — `progressTrigger={{ wheel: true }}`, `gap={[10, 20]}`, `progressTrigger={{ bar: <Thumb /> }}`. There is no need to wrap them in `useMemo`: MorphScroll compares prop values by content rather than by identity, so a fresh object with the same contents costs nothing. Callbacks are held through refs, so they never invalidate anything either.
> - Due to frequent DOM updates for customization, performance may decrease when DevTools are open, as the browser needs extra resources to track changes.
> - ! This library is currently under development. APIs and behavior may change in future releases.

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
Additionally, <code>MorphScroll</code> handles a passed <b>null</b> value the same way as <b>undefined</b>, rendering nothing in both cases.<br />
</em><br />
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
defines how the provided <code>bar</code> behaves within <code>progressTrigger</code> and how you interact with it.<br />
<br />
<code><b>scroll</b></code>:<br />
the default value and represents a standard scrollbar.<br />
<br />
<code><b>slider</b></code>:<br />
displays distinct elements indicating the number of full scroll steps within the list.<br />
<br />
<code><b>sliderMenu</b></code>:<br />
like <code>slider</code>, but the <code>bar</code> is a menu, and you can provide custom buttons as an array in <code>bar</code>.<br />
</em><br />
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
size: "x"; // or "y" | "hybrid"
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

<details><summary><b><code>scrollPosition</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />
  
```tsx
scrollPosition: 10 // or "end" | null | array if direction="hybrid"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
scrollPosition: {
  value: 10; // or "end" | null | array if direction="hybrid"
  duration: 400;
}
```

  </li>
</ul>

<b>Default:</b><br />
{ duration: 200 }<br />
<br />
<b>Description:</b><em><br />
allows you to set custom scroll values.<br />
<br />
<code><b>value</b></code>:<br />

<ul>
  <li><b>number</b> - Sets position to a specific value.</li>
  <li><b>"end"</b> - Sets position to the end of the list.</li>
</ul>
You can also provide an array of two values to specific positions ( e.g., [ x, y ] axes ) for hybrid directions.</code><br />
<br />
<code><b>duration</b></code>:<br />
property determines the animation speed for scrolling in <b>ms</b>.<br />
<br />
✦ Note:<br />
<code>scrollPosition</code> describes <b>where the scroll is</b>, so it only reacts when the value changes. To run the same scroll again — back to the top twice, for instance — call <code>scrollTo</code> on the component <code>ref</code>, see below.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} scrollPosition={100}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-scrollPosition.png)

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
props describe state, methods do something now. <code>scrollPosition</code> is the first kind: it applies when its value changes. <code>scrollTo</code> is the second: it runs every time it is called, so asking for a position that is already set works.<br />
<br />
<code><b>scrollTo(target, options?)</b></code>:<br />

<ul>
  <li><code>target</code>: same shape as <code>scrollPosition.value</code> — a <b>number</b>, <b>"end"</b>, <b>null</b>, or an array of two for <code>direction="hybrid"</code>.</li><br />
  <li><code>options.duration</code>: animation length in <b>ms</b>; <b>0</b> jumps without animating. Defaults to the <code>scrollPosition</code> duration.</li>
</ul>

Unlike the declarative <b>"end"</b>, which backs off if the user has scrolled away from the bottom, an explicit <code>scrollTo("end")</code> always runs.<br />
</em>

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
while auto-scrolling is active, the container receives the <code>ms-under-drag</code> attribute with directional values (<code>left</code>, <code>top</code>, etc.) depending on the active edge. It can be used for styling.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} autoScrollOnDrag>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-autoScrollOnDrag.png)

</div></ul></details>

<h2></h2>

###### **— SIZE —**

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

<details><summary><b><code>objectsSize</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
objectsSize: 100; // or [100, 70] | "full" | "firstChild" | "none"
```

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
<code><b>"none"</b></code>:<br />
cells will still be created, but <code>MorphScroll</code> will not calculate their sizes-they will simply wrap your objects.<br />
<br />
✦ Note:<br />
<b>"none"</b> is not compatible with <code>render</code>.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objectsSize={[70, 100]}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objectsSize.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>crossCount</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
defines the number of <b>columns</b> or <b>rows</b>.<br />
<br />
✦ Note:<br />
<ul>
  <li>If you use <b>"x"</b> or <b>"y"</b> for the <code>direction</code> parameter, <code>crossCount</code> only limits the <b>maximum</b> number of columns or rows.</li>
  <li>If you use <b>"hybrid"</b> for the <code>direction</code> parameter, <code>crossCount</code> defines the <b>exact</b> number of columns or rows in dependence of the <code>objectsDirection</code>, but not exceeding the total number of passed elements.</li>
</ul></em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} crossCount={2}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-crossCount.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>gap</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
gap: 10; // or [20, 10]
```

<b>Description:</b><em><br />
allows you to set spacing in pixels between list items for rows and columns.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} gap={10}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-gap.png)

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
<br />
<code><b>margin</b></code>:<br />
spacing between the objects and their wrapper, which grows the scrollable area by the same amount.<br />
</em>

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapperMargin.png)

<em><code><b>minSize</b></code>:<br />
the smallest the wrapper may get, applied as <code>min-width</code> / <code>min-height</code>. <b>"full"</b> means the <code>size</code> prop.<br />
</em>

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapperMinSize.png)

<em><code><b>align</b></code>:<br />
where the wrapper sits when it is smaller than <code>size</code>. Defaults to <b>"start"</b>. One value aligns both axes, a pair aligns them separately.<br />
</em>

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapperAlign.png)

<b>Example:</b>

```tsx
<MorphScroll {...props} wrapper={{ margin: 10, align: "center" }}>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

###### **— LAYOUT —**

<details><summary><b><code>objectsAlign</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
objectsAlign: "center"; // or "start" | "end"
```

<b>Default:</b><br />
"start"<br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objectsAlign="center">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objectsAlign.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>objectsDirection</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
objectsDirection: "row"; // or "column"
```

<b>Default:</b><br />
"row"<br />
<br />
<b>Description:</b><em><br />
changes the order of the provided elements based on the provided value.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} objectsDirection="column">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-objectsDirection.png)

</div></ul></details>

<h2></h2>

###### **— PROGRESS —**

<details><summary><b><code>progressTrigger</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Shorthand</b>:<br />

```tsx
progressTrigger: "wheel"; // or ["wheel", "content", "arrows", "bar"]
```

  </li>
  <li><b>Simple</b>:<br />
  
```tsx
progressTrigger: {
  wheel: true,
  content: true,
  bar: true, // or <ScrollThumbComponent />
  arrows: true, // or <ArrowComponent />
}
```

  </li>
  <li><b>Advanced</b>:<br />

```tsx
progressTrigger: {
  wheel: {
    // if direction="hybrid"
    changeDirection: true,
    changeDirectionBtn: "KeyZ" // default "KeyX", "" to disable
  },
  bar: [<Elem1 />, <Elem2 />, <Elem3 />],
  arrows: {
    element: <ArrowComponent />,
    size: 60, // default 40px
    reserveSpace: true;
    loop: true,
  }
}
```

  </li>
</ul>

<b>Default:</b><br />
{ wheel: true }<br />
<br />
<b>Description:</b><em><br />
this is one of the most important properties, allowing you to define how users interact with the progress bar and customize its appearance.<br />
<br />
A name, or an array of names, is shorthand for switching those triggers on: <code>"wheel"</code> is the same as <code>{ wheel: true }</code>, and <code>["wheel", "content"]</code> the same as <code>{ wheel: true, content: true }</code>. Reach for the object form when a trigger needs settings, or to pass an element.<br />
<br />
<code><b>wheel</b></code>:<br />
determines whether the progress bar responds to mouse wheel scrolling<br />
If you use <code>direction="hybrid"</code>, you can use:<br />

<ul>
  <li><code>changeDirection</code>: allows switching the scroll direction with the mouse wheel.</li><br />
  <li><code>changeDirectionBtn</code>: enables switching the scroll direction by pressing a specific key.<br />
  To disable this behavior, pass an empty string.<br />
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values">more about keys</a></li>
</ul>
<br />
<code><b>content</b></code>:<br />
enables interaction by clicking and dragging anywhere within the scrollable content to move it.<br />
By using <code>content</code> drag scrolling will not work in these cases:<br />

<ul>
  <li><b>interactive elements</b>: <code>input</code>, <code>textarea</code>, <code>select</code>, <code>button</code>, <code>a</code></li><br />
  <li><b>elements with attribute</b>: <code>draggable="true"</code>, <code>contenteditable</code> and custom attribute - <code>ms-custom-drag</code></li>
</ul>
<br />
<code><b>bar</b></code>:<br />
determines how the scroll progress is managed<br />
<br />
<ul>
  <li>When using <code>mode="scroll"</code>, you can provide a custom scroll element. If it's not ready yet, simply set <b>true</b> instead — this will fall back to the browser’s default scrollbar.</li><br />
  <li>When using <code>mode="slider"</code>, a <b>.ms-slider</b> element is automatically generated. It contains multiple <b>ms-slider-item</b> elements that visually represent the scroll progress. One of them will always have the <code>ms-active</code> class depending on the current position.</li><br />
  <li>When using <code>mode="sliderMenu"</code>, everything is the same as with <b>"slider"</b> but you can pass an array of custom buttons to <code>bar</code>. These buttons act as a navigation menu, allowing users to jump to specific sections.</li>
</ul>
<br />

For settings, pass an object instead of the element — the same shape <code>arrows</code> takes:

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

<ul>
  <li><code>element</code>: what the bar is made of. An array feeds one node per slider element.</li><br />
  <li><code>edgeGap</code>: distance between the bar and the side it sits on. A negative value pushes it past that edge — the usual reason to reach for CSS here. It follows <code>reverse</code>, so the gap is always measured from whichever side the bar actually ended up on.</li><br />
  <li><code>trackGap</code>: shortens the track by this much at each of its two ends. Not to be confused with <code>edgeGap</code>: this one runs along the track, that one across it.</li>

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-scrollBarEdge.png)
<br />
  <li><code>reverse</code>: put the bar on the opposite side.</li>

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-progressReverse.png)
<br />
  <li><code>showOnHover</code>: report the bar as idle unless it is hovered, touched or the content is moving. Nothing is styled for you — see the note below.</li>

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-scrollBarOnHover.png)
<br />
  <li><code>thumbMinSize</code>: the thumb never shrinks below this.</li>

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-thumbMinSize.png)
</ul>

<br />
✦ Note:<br />
with <code>showOnHover</code> the library sets <code>--ms-bar-visibility</code> (<b>1</b> active, <b>0</b> idle) on <b>.ms-bar</b> and adds <b>.ms-hover</b> / <b>.ms-leave</b>, but styles nothing. The bar stays visible until you use the variable:<br />

```css
.ms-bar {
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
<br />
<br />
<code><b>arrows</b></code>:<br />
allows you to add custom arrows to the progress bar<br />
<br />
<ul>
  <li><code>element</code>: the custom arrow element.</li><br />
  <li><code>size</code>: thickness of the <b>.ms-arrow-box</b> strip. The icon's own size is up to the element you pass.</li><br />
  <li><code>reserveSpace</code>: this parameter reduces the size of the scroll content by the arrow size.</li><br />
  <li><code>loop</code>: enables infinite scrolling.</li>
</ul><br />
The component root is positioned, so each arrow sits against it instead of resolving against whatever is positioned further up the page. Each <b>.ms-arrow-box</b> is a strip along its side and carries no transform; the icon inside sits in <b>.ms-arrow</b>, which only turns it — no size is imposed there, the element you pass decides its own. Author the icon pointing <b>right</b> and the library rotates it for the other three.<br />
<br />
An arrow with nowhere to go is not given <code>cursor: pointer</code>, so it does not advertise a click that does nothing.<br />
<br />
An arrow that has nowhere left to scroll gets the <code>ms-disabled</code> class, the same way <b>.ms-edge</b> does. With <code>loop</code> there are no dead ends, so the class is never set.<br />
While the content, a thumb or a slider is being dragged, the element under the pointer carries <code>ms-grabbing</code>.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  progressTrigger={{
    wheel: true,
    bar: <div className="your-scroll-thumb" />,
  }}
>
  {children}
</MorphScroll>
```

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
Passing a node instead of <b>true</b> renders it inside every edge slot, in a <b>.ms-edge-inner</b> wrapper. That wrapper is mirrored — <code>scaleY(-1)</code> at the bottom, <code>scaleX(-1)</code> on the left — so a single gradient authored once serves both ends of an axis instead of four. The slot itself is never transformed, so your CSS can size and place it predictably.<br />
<br />
✦ Note:<br />
an edge has no size and no colour of its own, so nothing shows until you give it some:<br />
</em>

```css
.ms-edge {
  opacity: var(--ms-edge-visibility);
  transition: opacity 0.2s ease-in-out;
}
.ms-edge.ms-top,
.ms-edge.ms-bottom {
  height: 40px;
  background: linear-gradient(#fff, transparent);
}
```

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
render: "lazy" // or "virtual"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
render: {
  mode: "lazy", // or "virtual" (required)
  rootMargin: 100, // or [x, y] | [t, r, b, l]
  stopLoadOnScroll: true,
  trackVisibility: true
}
```

  </li>
</ul>

<b>Description:</b><em><br />
this parameter adds a gradual rendering of the content as it enters the viewport.<br />
When used, a container is created for each scrollable object, and its absolute positioning is calculated based on scroll position and area dimensions.<br />
<br />
<code><b>mode</b></code>:

<ul>
  <li><b>"lazy"</b> - render once when visible.</li>
  <li><b>"virtual"</b> - render only when visible.</li>
</ul>
<br />
<code><b>rootMargin</b></code>:<br />
controls the threshold for loading content. It is the distance for loading from the root element (<b>.ms-viewport</b>) in px.<br />
<br />
<code><b>stopLoadOnScroll</b></code>:<br />
controls whether to stop loading content when scrolling.<br />
<br />
<code><b>trackVisibility</b></code>:<br />
sets the <code>--ms-content-visibility</code> variable for list item wrapper styles, which is very useful for styling such as <code>opacity: var(--ms-content-visibility);</code>.<br />
<br />
✦ Note:<br />
<code>render</code> is not compatible with <code>objectsSize: "none"</code>.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} render="virtual">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-render.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>emptyObjects</code></b></summary><br /><ul><div>
<b>Usage:</b><br />
<ul>
  <li><b>Simple</b>:<br />
  
```tsx
emptyObjects: "clear" // or "fallback"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
emptyObjects: {
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
<b>Example:</b>

```tsx
<MorphScroll {...props} emptyObjects="clear">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-emptyObjects.png)

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

They are unrelated and combine freely — <code>render="virtual"</code> with <code>suspending</code> means only the visible cards are mounted, and each of those shows the fallback until its own data arrives. The one thing they share is <code>fallback</code>, which both use as the placeholder.<br />
</em><br />
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
  <li><code>render.stopLoadOnScroll</code> is set to <b>true</b>.</li>
  <li><code>emptyObjects.mode</code> is set to <b>"fallback"</b> and it carries no <code>fallback</code> of its own.</li> 
</ul>
</em><br />
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
<b>Description:</b><em><br />
accepts a callback function that is triggered on every scroll event. The callback receives the current scroll top and left position as a <b>number</b>. The return value of the callback can be used to determine custom behavior based on the scroll value.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props}
  onScrollPosition={
    (left, top) => console.log("Scroll position:", left, top),
  }
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
the discrete half of scrolling: fires once when the scroll comes to rest on a page it was not on before. <code>onScrollPosition</code> reports continuous movement; this one reports the landing, so it is the place to hang a sound, a haptic or an analytics event.<br />
<br />
<code><b>reason</b></code>: what put it there — <b>"arrows"</b>, <b>"bar"</b> (a slider dot or a bar drag), or <b>"scroll"</b> when the content simply arrived by wheel, drag or inertia.<br />
<br />
✦ Note:<br />
<ul>
  <li>one gesture, one event: a dot click that flies past three pages on its way to the fourth reports the fourth, not all four.</li>
  <li>in <code>mode="scroll"</code> there are no pages to land on, so only the arrows report.</li>
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
allows to add additional classes to the component.<br />
</em><br />
<b>Example:</b>

```tsx
<ResizeTracker className="custom-class">{children}</ResizeTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>children</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom content to the component.<br />
</em><br />
<b>Example:</b>

```tsx
<ResizeTracker>{children}</ResizeTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>style</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom inline styles.<br />
</em><br />
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
The function receives an object of type <b>Partial<DOMRectReadOnly></b> that containing updated size properties.<br />
</em><br />
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
allows to add additional classes to the component.<br />
</em><br />
<b>Example:</b>

```tsx
<IntersectionTracker className="custom-class">{children}</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>children</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom content to the component.<br />
</em><br />
<b>Example:</b>

```tsx
<IntersectionTracker>{children}</IntersectionTracker>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>style</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
allows to add custom inline styles.<br />
</em><br />
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
If provided, it must be an ancestor of the observed element.<br />
</em><br />
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
defines an offset around the root element, expanding or shrinking the observed area.<br />
</em><br />
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
</ul></em>
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
</ul></em>
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

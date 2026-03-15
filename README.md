![logo](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-logo.png)

<h2></h2>

### 〈 Table of contents 〉

- [About](#-about-)
- [Installation](#-installation-)
- [API](#-api-)
- [License](#-license-)

<h2></h2>

### 〈 About 〉

`morphing-scroll` is a `React` library originally created to address common limitations of the native browser scrollbar, including:

- Design customization constraints
- Cross-browser compatibility
- Lack of horizontal scrolling support via mouse wheel

Over time, the library evolved to include numerous optimizations for handling large lists, significantly improving performance and flexibility.

All features are described below through the available components and their corresponding props.

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
> `MorphScroll` supports both **ESM** (`import`) and **CommonJS** (`require`) builds.
>
> This library is currently under development. APIs and behavior may change in future releases.

<h2></h2>

### 〈 API 〉

<ul><div>

<details><summary><b>MorphScroll</b>: <em>main component of the library responsible for displaying your data</em></summary>

- #### Props:

<ul><div>

###### **— GENERAL SETTINGS —**

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

###### **— SCROLL SETTINGS —**

<details><summary><b><code>type</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
type: "slider"; // or "scroll" | "sliderMenu"
```

<b>Default:</b><br />
"scroll"<br />
<br />
<b>Description:</b><em><br />
defines how the provided <code>progressElement</code> behaves within <code>progressTrigger</code> and how you interact with it.<br />
<br />
<code><b>scroll</b></code>:<br />
the default value and represents a standard scrollbar.<br />
<br />
<code><b>slider</b></code>:<br />
displays distinct elements indicating the number of full scroll steps within the list.<br />
<br />
<code><b>sliderMenu</b></code>:<br />
like <code>slider</code>, but the <code>progressElement</code> is a menu, an you can provide custom buttons as an array in the <code>progressElement</code>.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} type="slider">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-type.png)

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
changes the scroll or slider type direction based on the provided value.<br />
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
scrollPosition: 10; // or "end" | null | array if direction="hybrid"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
scrollPosition: {
  value: 10; // or "end" | null | array if direction="hybrid"
  duration: 400;
  updater: true;
}
```

  </li>
</ul>

<b>Default:</b><br />
{ duration: 200; updater: false }<br />
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
<code><b>updater</b></code>:<br />
property is a helper for the <code>value</code>. When setting the same scroll value repeatedly, React does not register the update and you can use it to force an update</em><br />
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

<details><summary><b><code>onScrollValue</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
accepts a callback function that is triggered on every scroll event. The callback receives the current scroll top and left position as a <b>number</b>. The return value of the callback can be used to determine custom behavior based on the scroll value.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props}
  onScrollValue={
    (left, top) => console.log("Scroll position:", left, top),
  }
>
  {children}
</MorphScroll>
```

</div></ul></details>
  
<h2></h2>

<details><summary><b><code>isScrolling</code></b></summary><br /><ul><div>
<b>Description:</b><em><br />
accepts a callback function that is triggered whenever the scroll status changes. The callback receives a boolean value, where <code>true</code> indicates that scrolling is in progress, and <code>false</code> indicates that scrolling has stopped. This can be useful for triggering additional actions, such as pausing animations or loading indicators based on the scroll state.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  isScrolling={(motion) => {
    console.log(motion ? "Scrolling..." : "Scroll stopped.");
  }}
>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

###### **— VISUAL SETTINGS —**

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
objectsSize: 100; // or [100, 70] | "size" | "firstChild" | "none"
```

<b>Description:</b><em><br />
defines the <b>[width, height]</b> of cells for each of your objects.<br />
<br />
<code>number</code>:<br />
sets a fixed size for your custom objects.<br />
<br />
<code><b>"size"</b></code>:<br />
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
  <li>If you use <b>"hybrid"</b> for the <code>direction</code> parameter, <code>crossCount</code> defines the <b>exact</b> number of columns or rows in dependence of the <code>elementsDirection</code>, but not exceeding the total number of passed elements.</li>
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

<details><summary><b><code>wrapperMargin</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
wrapperMargin: 10; // or [v, h] | [t, r, b, l]
```

<b>Description:</b><em><br />
defines the spacing between the list items and their wrapper, effectively increasing the width or height of the scrollable area.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} wrapperMargin={10}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapperMargin.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>wrapperMinSize</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />
  
```tsx
wrapperMinSize: 10; // or "full"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
// if direction="hybrid"
wrapperMinSize: [
  "full",
  10,
] // or one value for both sides
```

  </li>
</ul>

<b>Description:</b><em><br />
defines the minimum height or width of the <b>.ms-objects-wrapper</b>, to which CSS properties like <code>min-height</code> or <code>min-width</code> will be applied.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} wrapperMinSize={"full"}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapperMinSize.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>wrapperAlign</code></b></summary><br /><ul><div> 
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />
  
```tsx
wrapperAlign: "center"; // or "start" | "end"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
wrapperAlign: [
  "center",
  "start",
] // or one value for both axes
```

  </li>
</ul>

<b>Default:</b><br />
"start"<br />
<br />
<b>Description:</b><em><br />
aligns the <b>.ms-objects-wrapper</b>, which contains all the provided elements, relative to the scroll or the <code>size</code>.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} wrapperAlign="center">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-wrapperAlign.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>elementsAlign</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
elementsAlign: "center"; // or "start" | "end"
```

<b>Default:</b><br />
"start"<br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} elementsAlign="center">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-elementsAlign.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>elementsDirection</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
elementsDirection: "row"; // or "column"
```

<b>Default:</b><br />
"row"<br />
<br />
<b>Description:</b><em><br />
changes the order of the provided elements based on the provided value.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} elementsDirection="column">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-elementsDirection.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>edgeGradient</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />
  
```tsx
edgeGradient: true; // or "#fff"
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
edgeGradient: {
  color: "#fff",
  size: 60, // default 40px
}
```

  </li>
</ul>

<b>Description:</b><em><br />
parameter creates several edge elements responsible for darkening the edges of the scroll when it overflows.<br />
<br />
<code><b>color</b></code>:<br />
property accepts any valid color format.
If you provide it, the library will generate a gradient transitioning from the custom color to transparent.
If you provide just <b>true</b>, the edge elements will have no color, allowing for custom styling via CSS class <code>.ms-edge</code>.<br />
<br />
<code><b>size</b></code>:<br />
property changes the height of the edges for the horizontal and the width of the edges for the vertical.<br />
<br />
If the edge element is inactive, it gets the <code>"ms-disabled"</code> class.<br />
Also, each edge element gets the <code>--edge-visibility</code> variable in the styles with value 0 or 1.
</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  edgeGradient={{ color: "rgba(0, 0, 0, 0.5)", size: 60 }}
>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-edgeGradient.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>progressTrigger</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

<ul>
  <li><b>Simple</b>:<br />
  
```tsx
progressTrigger: {
  wheel: true,
  content: true,
  progressElement: true, // or <ScrollThumbComponent />
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
    changeDirectionKey: "someKay" // default "KeyX"
  },
  progressElement: [<Elem1 />, <Elem2 />, <Elem3 />],
  arrows: {
    element: <ArrowComponent />,
    size: 60, // default 40px
    contentReduce: true;
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
<code><b>wheel</b></code>:<br />
determines whether the progress bar responds to mouse wheel scrolling<br />
If you use <code>direction="hybrid"</code>, you can use:<br />

<ul>
  <li><code>changeDirection</code>: allows switching the scroll direction with the mouse wheel.</li><br />
  <li><code>changeDirectionKey</code>: enables switching the scroll direction by pressing a specific key.<br />
  To disable this behavior, pass an empty string.<br />
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values">more about keys</a></li>
</ul>
<br />
<code><b>content</b></code>:<br />
enables interaction by clicking and dragging anywhere within the scrollable content to move it.<br />
By using <code>content</code> drag scrolling will not work in these cases:<br />
interactive elements:<br />
<code>input</code>, <code>textarea</code>, <code>select</code>, <code>button</code>, <code>a</code><br />
elements with attribute:<br />
<code>[draggable="true"]</code>, <code>[contenteditable]</code> and custom attribute - <code>[data-custom-drag]</code><br />
<br />
<code><b>progressElement</b></code>:<br />
determines how the scroll progress is managed<br />
<br />
<ul>
  <li>When using <code>type="scroll"</code>, you can provide a custom scroll element. If it's not ready yet, simply set <b>true</b> instead — this will fall back to the browser’s default scrollbar.</li><br />
  <li>When using <code>type="slider"</code>, a <b>.ms-slider</b> element is automatically generated. It contains multiple <b>ms-slider-element</b> elements that visually represent the scroll progress. One of them will always have the <code>active</code> class depending on the current position.</li><br />
  <li>When using <code>type="sliderMenu"</code>, everything is the same as with <b>"slider"</b> but you can pass an array of custom buttons to <code>progressElement</code>. These buttons act as a navigation menu, allowing users to jump to specific sections.</li>
</ul>
<br />
<code><b>arrows</b></code>:<br />
allows you to add custom arrows to the progress bar<br />
<br />
<ul>
  <li><code>element</code>: the custom arrow element.</li><br />
  <li><code>size</code>: adds a custom size to the <b>.ms-arrow-box</b>.</li><br />
  <li><code>contentReduce</code>: this parameter reduces the size of the scroll content by the arrow size.</li><br />
  <li><code>loop</code>: enables infinite scrolling.</li>
</ul><br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll
  {...props}
  progressTrigger={{
    wheel: true,
    progressElement: <div className="your-scroll-thumb" />,
  }}
>
  {children}
</MorphScroll>
```

</div></ul></details>

<h2></h2>

<details><summary><b><code>progressReverse</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
progressReverse: true; // or [true, false] if direction="hybrid"
```

<b>Description:</b><em><br />
this parameter changes the position of the progress bar in the opposite direction and depends on the <code>direction</code> property.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} progressReverse>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-progressReverse.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>scrollBarOnHover</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
scrollBarOnHover: true;
```

<b>Description:</b><em><br />
this parameter controls the visibility of the progress bar regardless of the <code>type</code> value.<br />
When you use it, the <b>"hover"</b> class is applied to the <b>.ms-bar</b> when the cursor is over it (or the finger touches it on touchscreens), and <b>"leave"</b> is applied when it is no longer hovered. This allows you to easily customize its appearance on interaction.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} scrollBarOnHover>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-scrollBarOnHover.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>scrollBarEdge</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
scrollBarEdge: 10; // or [10, 20] for control each bar if direction="hybrid"
```

<b>Description:</b><em><br />
defines the margin (in <b>px</b>) applied to the edges of the scroll bar, effectively reducing its size.<br />
<br />
✦ Note:<br />
this parameter is only used when <code>type="scroll"</code> is set.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} scrollBarEdge={10}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-scrollBarEdge.png)

</div></ul></details>

<h2></h2>

<details><summary><b><code>thumbMinSize</code></b></summary><br /><ul><div>
<b>Default:</b><br />
30px<br />
<br />
<b>Description:</b><em><br />
if the scrollable content is long, this option sets the minimum size (in <b>px</b>) of the scroll bar thumb automatically.<br />
<br />
✦ Note:<br />
this parameter is only used when <code>type="scroll"</code> is set.<br />
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} thumbMinSize={40}>
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-thumbMinSize.png)

</div></ul></details>

<h2></h2>

###### **— OPTIMIZATIONS —**

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
  type: "lazy", // or "virtual" (required)
  rootMargin: 100, // or [v, h] | [t, r, b, l]
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
<code><b>type</b></code>:

<ul>
  <li><b>"lazy"</b> - render once when visible.</li>
  <li><b>"virtual"</b> - render only when visible.</li>
</ul>
<br />
<code><b>rootMargin</b></code>:<br />
controls the threshold for loading content. It is the distance for loading from the root element (<b>.ms-element</b>) in px.<br />
<br />
<code><b>stopLoadOnScroll</b></code>:<br />
controls whether to stop loading content when scrolling.<br />
<br />
<code><b>trackVisibility</b></code>:<br />
sets the <code>--content-visibility</code> variable for list item wrapper styles, which is very useful for styling such as <code>opacity: var(--content-visibility);</code>.<br />
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

<details><summary><b><code>emptyElements</code></b></summary><br /><ul><div>
<b>Usage:</b><br />
<ul>
  <li><b>Simple</b>:<br />
  
```tsx
emptyElements: "clear"; // or "fallback" | <FallbackComponent />
```

  </li>
  <li><b>Advanced</b>:<br />
  
```tsx
emptyElements: {
  mode: "clear", // or "fallback" | <FallbackComponent /> (required)
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
  <li><b>"clear"</b> – automatically removes empty elements.</li>
  <li><b>"fallback"</b> – replaces empty elements with the value from the <code>fallback</code> props.</li>
  <li><b>{ fallback: React.ReactNode }</b> – allows you to override the default <code>fallback</code> content for this instance.</li>
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
  - the wrapper <code>.ms-object-box</code> also gets the <code>remove</code> class, which you can use e.g. for fade-out animations.</li>
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} emptyElements="clear">
  {children}
</MorphScroll>
```

![banner](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/src/assets/banner-emptyElements.png)

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
adds React Suspense to the MorphScroll component for async rendering.</em><br />
<br />
<b>Example:</b>

```tsx
<MorphScroll {...props} suspending>
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
  <li><code>emptyElements.mode</code> is set to <b>"fallback"</b>.</li> 
</ul>
</em><br />
<b>Example:</b>

```tsx
<MorphScroll {...props} fallback={<div>Loading...</div>}>
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
rootMargin: 10; // or [v, h] | [t, r, b, l]
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

<details><summary><b><code>visibleContent</code></b></summary><br /><ul><div>
<b>Usage:</b><br />

```tsx
visibleContent: true;
```

<b>Default:</b><br />
false<br />
<br />
<b>Description:</b><em><br />
if set to <b>true</b>, the tracked elements will always be visible, regardless of their actual intersection status.<br />
This is useful for testing purposes or when using the <code>onIntersection</code> callback, ensuring that it reliably triggers whenever the element enters the viewport, even if all elements are already visible.</em><br />
<br />
<b>Example:</b>

```tsx
<IntersectionTracker visibleContent>{children}</IntersectionTracker>
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

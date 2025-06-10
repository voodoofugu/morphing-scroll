![logo](https://drive.google.com/uc?export=view&id=1mpb5TAElX3Xla4sGFISp4bQMu0zuNJaa "logo")

<h2></h2>

### 〈♦ Table of contents 〉

- [About](#-about-)
- [Installation](#-installation-)
- [MorphScroll](#-morphscroll-)
- [ResizeTracker](#-resizetracker-)
- [IntersectionTracker](#-intersectiontracker-)
- [API](#-api-)

<h2></h2>

### 〈♦ About 〉

`morphing-scroll` is a `React` library designed to optimize the rendering of data lists. It leverages virtual rendering and lazy loading to handle large datasets efficiently, significantly enhancing performance. The library also resolves cross-browser inconsistencies in scroll element rendering by replacing them with custom ones. Additionally, it provides convenient horizontal scrolling with flexible content movement options.

<h2></h2>

### 〈♦ Installation 〉

To install the library, use the following command:

```bash
npm install morphing-scroll
```

<h2></h2>

### 〈♦ MorphScroll 〉

`MorphScroll` is the main component of the library responsible for displaying your data.

- ### Props:

  <div>

  #### GENERAL SETTINGS:

    <details>
      <summary><b><code>className</code></b>: <em>Additional classes for the component.</em></summary><br />
      <ul>
        <b>Type:</b> string<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter allows you to apply custom CSS classes to the <code>MorphScroll</code> component, enabling further customization and styling to fit your design needs.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          className="your-class"
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>children</code></b>: <em>Custom user content.</em></summary><br />
      <ul>
        <b>Type:</b> React.ReactNode<br />
        <br />
        <b>Description:</b> <em><br />
        This is where you can pass your list elements.<br />
        Make sure to provide unique keys for each list item, as per React's rules. The <code>MorphScroll</code> component ensures that the cells it generates will use the same keys as your list items, allowing it to render the correct cells for the current list.<br />
        Additionally, <code>MorphScroll</code> handles a passed <mark>null</mark> value the same way as <mark>undefined</mark>, rendering nothing in both cases.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll {...props} >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

  #### SCROLL SETTINGS:

    <details>
      <summary><b><code>type</code></b>: <em>Type of progress element.</em></summary><br />
      <ul>
        <b>Type:</b> "scroll" | "slider" | "sliderMenu"<br />
        <br />
        <b>Default:</b> "scroll"<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter defines how the provided <code>progressElement</code> behaves within <code>progressTrigger</code> and how you interact with it.<br />
        <br />
        <mark>scroll</mark> - This is the default value and represents a standard scrollbar.<br />
        <br />
        <mark>slider</mark> - It displays distinct elements indicating the number of full scroll steps within the list.<br />
        <br />
        <mark>sliderMenu</mark> - It behaves like a <code>slider</code>, but now the <code>progressElement</code> is a menu, an you can provide custom buttons as an array in the <code>progressElement</code>.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          type="slider"
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>direction</code></b>: <em>Scrolling direction.</em></summary><br />
      <ul>
        <b>Type:</b> "x" | "y" | "hybrid"<br />
        <br />
        <b>Default:</b> "y"<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter changes the scroll or slider type direction based on the provided value.<br />
        You can set the value to horizontal, vertical or hybrid positions to customize the component according to your needs.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          direction="x"
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>scrollPosition</code></b>: <em>Scroll position and animation duration settings.</em></summary><br />
      <ul>
        <b>Type:</b> {<br />
            value: number | "end" | (number | "end")[];<br />
            duration?: number;<br />
            updater?: boolean;<br />
        }<br />
        <br />
        <b>Default:</b> { duration: 200; updater: false }<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter allows you to set custom scroll values.<br />
        <br />
        <code>value</code>:<br />
        <ul>
          <li><mark>number</mark> - Sets the scroll position to a specific value.</li>
          <li><mark>"end"</mark> - Scrolls to the bottom of the list upon loading, which is useful for scenarios like chat message lists. When new elements are appended to the list, the scroll position will update automatically. However, to prevent unwanted scrolling when adding elements to the beginning of the list, this property will not trigger.</li>
        </ul>
        <br />
        <code>duration</code>:<br />
        This property determines the animation speed for scrolling in ms.<br />
        <br />
        <code>updater</code>:<br />
        This property is a helper for the <code>value</code> property. When setting the same scroll value repeatedly (e.g., clicking a button to scroll to the top), React does not register the update. To force an update, toggle updater within setState, e.g.,<br />
        <code>setScroll((prev) => ({ ...prev, value: 0, updater: <b>!prev.updater</b> }))</code></em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          scrollPosition={{ value: 100; duration: 100 }}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>onScrollValue</code></b>: <em>Callback for scroll value.</em></summary><br />
      <ul>
        <b>Type:</b> ( left: number, top: number ) => void<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter accepts a callback function that is triggered on every scroll event. The callback receives the current scroll top and left position as a number. The return value of the callback can be used to determine custom behavior based on the scroll value.<br />
        <br />
        ✦ Note:<br />
        <code>left</code> can be used for x direction, <code>top</code> for y direction and both for hybrid directions.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          onScrollValue={
            (left, top) => {
              if (top > 100)
                console.log("Scroll position:", left, top);
            },
          }
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>
      
    <h2></h2>

    <details>
      <summary><b><code>isScrolling</code></b>: <em>Callback function for scroll status.</em></summary><br />
      <ul>
        <b>Type:</b> ( motion: boolean ) => void<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter accepts a callback function that is triggered whenever the scroll status changes. The callback receives a boolean value, where <code>true</code> indicates that scrolling is in progress, and <code>false</code> indicates that scrolling has stopped. This can be useful for triggering additional actions, such as pausing animations or loading indicators based on the scroll state.</em><br />
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

    </ul></details>

    <h2></h2>

  #### VISUAL SETTINGS:

    <details>
      <summary><b><code>size</code> (required)</b>: <em>[width, height] of <b>MorphScroll</b>.</em></summary><br />
      <ul>
        <b>Type:</b><br /> number | number[] | "auto"<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter sets the width and height of the <code>MorphScroll</code>.<br />
        <br />
        <mark>number</mark> - Sets a fixed size for the <code>MorphScroll</code>. It can be 1 number if you want to set the same width and height, or an array of 2 numbers in pixels.<br />
        <br />
        <mark>"auto"</mark> - Adds the <code>ResizeTracker</code> component to measure the width and height of the area where <code>MorphScroll</code> is added. The dimensions will automatically adjust when the container changes.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          size={[100, 400]}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>objectsSize</code></b>: <em>[width, height] of cells for each object.</em></summary><br />
      <ul>
        <b>Type:</b><br />
        number | "none" | "firstChild"<br />
        | (number | "none" | "firstChild")[]<br />
        <br />
        <b>Default:</b> If you don't provide any value, the default value will be taken from <code>size</code><br />
        <br />
        <b>Description:</b> <em><br />
        This parameter defines the [width, height] of cells for each of your objects.<br />
        <br />
        <mark>number</mark> - Sets a fixed size for your custom objects.<br />
        <br />
        <mark>"none"</mark> - Cells will still be created, but <code>MorphScroll</code> will not calculate their sizes-they will simply wrap your objects.<br />
        <br />
        <mark>"firstChild"</mark> - Creates a <code>ResizeTracker</code> wrapper for the first child of your list. This wrapper will calculate the size of the first child, and these dimensions will be applied to all cells in the list.<br />
        <br />
        ✦ Note:<br />
        <ul>
          <li>All types can be used as 1 value, or an array of 2 values.</li>
          <li><mark>"none"</mark> is not compatible with <code>render={{ type: "virtual" }}</code>.</li>
        </ul></em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          objectsSize={[80, 80]}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>crossCount</code></b>: <em>Number of cells in each direction.</em></summary><br />
      <ul>
        <b>Type:</b> number<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter defines the number of <b>columns</b> (when <code>direction="y"</code> or <code>direction="hybrid"</code> with <code>elementsDirection="column"</code>) or <b>rows</b> (when <code>direction="x"</code> or <code>direction="hybrid"</code> with <code>elementsDirection="row"</code>).<br />
        <br />
        ✦ Note:<br />
        <ul>
          <li>If you use <mark>"x"</mark> or <mark>"y"</mark> for the <code>direction</code> parameter, <code>crossCount</code> only limits the <b>maximum</b> number of columns or rows.</li>
          <li>If you use <mark>"hybrid"</mark> for the <code>direction</code> parameter, <code>crossCount</code> defines the <b>exact</b> number of columns or rows in dependence of the <code>elementsDirection</code>, but not exceeding the total number of passed elements.</li>
        </ul></em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          crossCount={3}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>gap</code></b>: <em>Gap between cells.</em></summary><br />
      <ul>
        <b>Type:</b> number | number[]<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter allows you to set spacing between list items both horizontally and vertically.<br />
        <br />
        ✦ Note:<br />
        It can be 1 number or an array of 2 or 4 numbers in pixels.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          gap={10}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>wrapperMargin</code></b>: <em>Margin for the <b>objectsWrapper</b>.</em></summary><br />
      <ul>
        <b>Type:</b> number | number[]<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter defines the spacing between the list items and their wrapper, effectively increasing the width or height of the scrollable area.<br />
        <br />
        ✦ Note:<br />
        Can be 1 number or an array of 2 or 4 numbers in pixels.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          wrapperMargin={10}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>wrapperMinSize</code></b>: <em>Minimum height or width of the <b>objectsWrapper</b>.</em></summary><br />
      <ul>
        <b>Type:</b> number | "full" | (number | "full")[]<br /><br />
        <b>Description:</b> <em><br />
        This parameter defines the minimum height or width of the <b>objectsWrapper</b>, to which CSS properties like <code>min-height</code> or <code>min-width</code> will be applied.<br />
        <br />
        ✦ Note:<br />
        Can be used as 1 value, or an array of 2 values.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          wrapperMinSize={"full"}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>wrapperAlign</code></b>: <em>[horizontal, vertical] aligns your content when it is smaller than the <code>size</code>.</em></summary><br /> 
      <ul>
        <b>Type:</b><br />
        "start" | "center" | "end"<br />
        | ("start" | "center" | "end")[]<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter aligns the <b>objectsWrapper</b>, which contains all the provided elements, relative to the scroll or the <code>size</code>.<br />
        <br />
        ✦ Note:<br />
        Can be used as 1 value, or an array of 2 values.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          contentAlign={["center", "center"]}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>elementsAlign</code></b>: <em>Aligns the objects within the <b>objectsWrapper</b>.</em></summary><br />
      <ul>
        <b>Type:</b> "start" | "center" | "end"<br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          elementsAlign="center"
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>elementsDirection</code></b>: <em>Direction of the provided elements.</em></summary><br />
      <ul>
        <b>Type:</b> "row" | "column"<br />
        <br />
        <b>Default:</b> "row"<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter changes the order of the provided elements based on the provided value.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          elementsDirection="column"
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>edgeGradient</code></b>: <em>Gradient when scrolling overflows.</em></summary><br />
      <ul>
        <b>Type:</b> boolean | { color?: string; size?: number }<br />
        <br />
        <b>Default:</b> When using without <code>size</code>, the default value is 40px<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter creates two edge elements responsible for darkening the edges of the scroll when it overflows.<br />
        <br />
        <code>color</code> :<br />
        The property accepts any valid color format.
        If you provide it, the library will generate a gradient transitioning from the custom color to transparent.
        If you provide just <mark>true</mark>, the edge elements will have no color, allowing for custom styling via CSS classes.<br />
        <br />
        <code>size</code> :<br />
        The property changes the height for horizontal and width for vertical <b>edge</b>.</em><br />
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

    </ul></details>

    <h2></h2>

  #### PROGRESSBAR:

    <details>
      <summary><b><code>progressTrigger</code></b>: <em>Triggers for the progress bar.</em></summary><br />
      <ul>
        <b>Type:</b> {<br />
          wheel?: boolean;<br />
          content?: boolean;<br />
          progressElement?: boolean | React.ReactNode | React.ReactNode[];<br />
          arrows?: boolean | { size?: number; element?: React.ReactNode };<br />
        }<br />
        <br />
        <b>Default:</b> { wheel: true }<br />
        <br />
        <b>Description:</b> <em><br />
        This is one of the most important properties, allowing you to define how users interact with the progress bar and customize its appearance.<br />
        <br />
        <code>wheel</code> :<br />
        This parameter determines whether the progress bar responds to mouse wheel scrolling.<br />
        <br />
        <code>content</code> :<br />
        This parameter enables interaction by clicking and dragging anywhere within the scrollable content to move it.<br />
        <br />
        <code>progressElement</code> :<br />
        This parameter determines how the scroll progress is managed.<br />
        <br />
        <ul>
          <li>When using <code>type="scroll"</code>, you can provide a custom scroll element. If it's not ready yet, simply set <mark>true</mark> instead — this will fall back to the browser’s default scrollbar.</li>
          <li>When using <code>type="slider"</code>, a <b>sliderBar</b> element is automatically generated. It contains multiple <b>sliderElem</b> elements that visually represent the scroll progress. One of them will always have the <code>active</code> class depending on the current position.</li>
          <li>When using <code>type="sliderMenu"</code>, everything is the same as with <mark>"slider"</mark> but you can pass an array of custom buttons to <code>progressElement</code>. These buttons act as a navigation menu, allowing users to jump to specific sections.</li>
        </ul>
        <br />
        <code>arrows</code> :<br />
        This parameter allows you to add custom arrows to the progress bar. You can either specify a <code>size</code> for the arrows and provide a custom element.<br />
        <br />
        ✦ Note:<br />
        <code>progressTrigger</code> can only create or provide your elements, but you must make the design for them yourself.</em><br />
        <br />
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

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>progressReverse</code></b>: <em>Reverse the progress bar position.</em></summary><br />
      <ul>
        <b>Type:</b> boolean | boolean[]<br />
        <br />
        <b>Default:</b> false<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter changes the position of the progress bar based on the direction property.<br />
        <br />
        <ul>
          <li>If <code>direction="x"</code>, the progress bar appears on the left by default and moves to the right when set to <mark>true</mark>.</li>
          <li>If <code>direction="y"</code>, the progress bar appears at the bottom by default and moves to the top when set to <mark>true</mark>.</li>
          <li>If <code>direction="hybrid"</code>, both horizontal and vertical progress bars are used with the same logic as above. And in this case, you can also pass an array of booleans to control each bar individually.</li>
        </ul></em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          progressReverse
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>scrollBarOnHover</code></b>: <em>Hover visibility of the <b>progressBar</b>.</em></summary><br />
      <ul>
        <b>Type:</b> boolean<br />
        <br />
        <b>Default:</b> false<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter controls the visibility of the progress bar regardless of the <code>type</code> value.<br />
        When you use it, the <b>"hover"</b> class is applied to the <b>scrollBar</b> when the cursor is over it (or the finger touches it on touchscreens), and <b>"leave"</b> is applied when it is no longer hovered. This allows you to easily customize its appearance on interaction.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          scrollBarOnHover
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

  #### OPTIMIZATIONS:

    <details>
      <summary><b><code>render</code></b>: <em>Types of rendering for optimization.</em></summary><br />
      <ul>
        <b>Type:</b> {<br />
          type: "lazy" | "virtual";<br />
          rootMargin?: number | number[];<br />
          stopLoadOnScroll?: boolean;<br />
          }<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter defines the rendering type for optimization.<br />
        <br />
        <code>type</code>:<br />
        <ul>
          <li>With <mark>"lazy"</mark>, containers are created but do not load content until they enter the viewport. The content is not deleted when it leaves the viewport.</li>
          <li>With <mark>"virtual"</mark>, a container is created for each scrollable object, and its absolute positioning is calculated based on <code>scrollTop</code> and scroll area dimensions. Rendering is dynamically adjusted according to the scroll position.</li>
        </ul>
        <br />
        <code>rootMargin</code>:<br />
        This property controls the threshold for loading content. It can be a single number or an array of 2 ( horizontal/vertical ) or 4 ( top/right/bottom/left ) numbers. It works like the distance for loading from the root element ( <b>scrollElement</b> ) in pixels.<br />
        <br />
        <code>stopLoadOnScroll</code>:<br />
        This property controls whether to stop loading content when the user scrolls.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          render={{ type: "virtual" }}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>emptyElements</code></b>: <em>Handling of empty scroll elements.</em></summary><br />
      <ul>
        <b>Type:</b> {<br />
        mode: "clear" | "fallback" | { fallback: React.ReactNode };<br />
        clickTrigger?: { selector: string; delay?: number };<br />
        }<br />
        <br />
        <b>Description:</b> <em><br />
        This option will allow you to delete or replace empty list items during the first rendering, or to start this process by clicking.<br />
        <br />
        <code>mode</code> :<br />
        <ul>
          <li><mark>"clear"</mark> – automatically removes empty elements.</li>
          <li><mark>"fallback"</mark> – replaces empty elements with the value from the <code>fallback</code> props.</li>
          <li><mark>{ fallback: React.ReactNode }</mark> – if you need a different element than in <code>fallback</code> to replace empty elements, you can use this option.</li>
        </ul>
        <br />
        <code>clickTrigger</code> :<br />
        In case if elements are removed via a click action, use this option. It accepts an object with a <code>selector</code> ( such as a delete button’s class ) and <code>delay</code> ( in <code>ms</code> ) to wait before removing the elements.<br />
        <br />
        ✦ Note:<br />
        <ul>
          <li>The cleanup will start on the initial render, when the number of passed elements changes, on scroll, and on click if you use <code>clickTrigger</code>.</li>
          <li>If you are using <code>clickTrigger</code> but there are no changes, you may need to increase the <code>delay</code> value, since the cleanup function is triggered when your item has not yet been deleted.</li>
        </ul>
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          emptyElements={{
            mode: "clear",
            clickTrigger: { selector: ".close-button" },
          }}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>suspending</code></b>: <em>Adds React Suspense.</em></summary><br />
      <ul>
        <b>Type:</b> boolean<br />
        <br />
        <b>Default:</b> false<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter adds React Suspense to the MorphScroll component for asynchronous rendering.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          suspending
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>fallback</code></b>: <em>Fallback element.</em></summary><br />
      <ul>
        <b>Type:</b> React.ReactNode<br />
        <br />
        <b>Description:</b> <em><br />
        This parameter sets the fallback element for custom element. It will be used for <code>emptyElements</code> in <code>mode: "fallback"</code> or when <code>suspending</code> is enabled.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <MorphScroll
          {...props}
          fallback={<div>Loading...</div>}
        >
          {children}
        </MorphScroll>
        ```

    </ul></details>
    
  </div>

<h2></h2>

### 〈♦ ResizeTracker 〉

`ResizeTracker` is a React component that monitors changes to an element’s size. It provides updated dimensions via a render-prop function whenever the observed element is resized.

- ### Props:

  <div>

    <details>
      <summary><b><code>children</code></b>: <em>Render-prop function for size updates and adding content.</em></summary><br />
      <ul>
        <b>Type:</b> (rect: DOMRectReadOnly) => React.ReactNode<br />
        <br />
        <b>Description:</b> <em><br />
        Instead of a standard <code>children</code> prop, this component uses a <b>render-prop function</b> to pass size updates to its children. You can use it similarly to a regular <code>children</code> prop inside the component.<br />
        <br />
        The function receives an object of type <code>DOMRectReadOnly</code> with the following properties:
        <ul>
          <li><code>x</code> - The X-coordinate of the top-left corner of the element.</li>
          <li><code>y</code> - The Y-coordinate of the top-left corner of the element.</li>
          <li><code>width</code> - The width of the observed element’s content box.</li>
          <li><code>height</code> - The height of the observed element’s content box.</li>
          <li><code>top</code> - The distance from the top of the element to its parent's top. Equal to <code>y</code>.</li>
          <li><code>left</code> - The distance from the left of the element to its parent's left. Equal to <code>x</code>.</li>
          <li><code>right</code> - The distance from the left of the parent to the right edge of the element (<code>left</code> + <code>width</code>).</li>
          <li><code>bottom</code> - The distance from the top of the parent to the bottom edge of the element (<code>top</code> + <code>height</code>).</li>
        </ul><br />
        <br />
        ⚠ This is a non-standard prop that you might be used to using this is render-prop function receiving the container's size.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <ResizeTracker {...props} >
          {(rect) => (
            <p>
              Width: {rect.width}, Height: {rect.height}
            </p>
          )}
        </ResizeTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>style</code></b>: <em>Applies inline styles to the container.</em></summary><br />
      <ul>
        <b>Type:</b> React.CSSProperties<br />
        <br />
        <b>Example:</b>

        ```tsx
        <ResizeTracker style={{ backgroundColor: "blue" }}>
          {(rect) => (
            // content
          )}
        </ResizeTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>measure</code></b>: <em>Defines the measurement strategy.</em></summary><br />
      <ul>
        <b>Type:</b> "inner" | "outer" | "all"<br />
        <br />
        <b>Default:</b> "inner"<br />
        <br />
        <b>Description:</b><br />
        <em>This prop determines what is being measured by automatically applying inline styles that affect width and height.<br />
        <br />
        - The default value <code>"inner"</code> sets <code>width: "max-content"</code> and <code>height: "max-content"</code>, measuring the size of child elements.<br />
        - The <code>"outer"</code> value measures the parent element by setting <code>minWidth: "100%"</code> and <code>minHeight: "100%"</code>.<br />
        - The <code>"all"</code> value combines the styles of both <code>"inner"</code> and <code>"outer"</code>, allowing measurement of both the parent and child elements.<br />
        <br />
        ✦ Note: Be cautious when overriding styles via the <code>style</code> prop, as it may interfere with the styles applied by <code>measure</code>, leading to unexpected behavior.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <ResizeTracker measure="all">
          {(rect) => (
            // content
          )}
        </ResizeTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>onResize</code></b>: <em>Callback triggered on size changes.</em></summary><br />
      <ul>
        <b>Type:</b> (rect: Partial<DOMRectReadOnly>) => void<br />
        <br />
        <b>Description:</b><br />
        <em>A callback function that is triggered whenever the observed element's dimensions change.<br />
        The function receives an object containing the updated size properties.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <ResizeTracker
          onResize={(rect) => {
            console.log("New size:", rect);
          }}
        >
          {(rect) => (
            // content
          )}
        </ResizeTracker>
        ```

    </ul></details>

    <h2></h2>

  </div>

- ### Link:

  [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

<h2></h2>

### 〈♦ IntersectionTracker 〉

`IntersectionTracker` is a React component for tracking the intersection of an element with the viewport.

- ### Props:

  <div>

    <details>
      <summary><b><code>children</code></b>: <em>Custom user content.</em></summary><br />
      <ul>
        <b>Type:</b> React.ReactNode<br />
        <br />
        <b>Example:</b>

        ```tsx
        <IntersectionTracker>{children}</IntersectionTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>style</code></b>: <em>Applies inline styles to the container.</em></summary><br />
      <ul>
        <b>Type:</b> React.CSSProperties<br />
        <br />
        <b>Example:</b>

        ```tsx
        <IntersectionTracker style={{ backgroundColor: "blue" }}>
          {children}
        </IntersectionTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>root</code></b>: <em>Defines the observation area.</em></summary><br />
      <ul>
        <b>Type:</b> Element | null<br />
        <br />
        <b>Default:</b> null (window)<br />
        <br />
        <b>Description:</b> <em><br />
        Specifies the element that serves as the bounding box for the intersection observation. 
        If provided, it must be an ancestor of the observed element.<br />
        <br />
        If set to <code>null</code> (default), the window is used as the observation area.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <IntersectionTracker root={document.getElementById("root")}>
          {children}
        </IntersectionTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>rootMargin</code></b>: <em>Sets the margin around the root element.</em></summary><br />
      <ul>
        <b>Type:</b> number | number[]<br />
        <br />
        <b>Description:</b> <em><br />
        Defines an offset around the root element, expanding or shrinking the observed area.<br />
        <br />
        Accepts a single number or an array for fine-tuned control:<br />
        <ul>
          <li>A <b>single number</b> sets the same margin on all sides.</li>
          <li>A <b>two-value array</b> <code>[topBottom, leftRight]</code> applies margins vertically and horizontally.</li>
          <li>A <b>four-value array</b> <code>[top, right, bottom, left]</code> allows full control over each side.</li>
        </ul>
        <br />
        Margins are converted to <code>px</code> values internally.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <IntersectionTracker
          rootMargin={10}
          // rootMargin={[10, 20]}
          // rootMargin={[10, 20, 10, 20]}
        >
          {children}
        </IntersectionTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>threshold</code></b>: <em>Defines when the callback is triggered.</em></summary><br />
      <ul>
        <b>Type:</b> number | number[]<br />
        <br />
        <b>Description:</b> <em><br />
        .Specifies at what percentage of the observed element’s visibility the callback should be executed.<br />
        <br />
        <ul>
          <li>A <b>single number</b> (e.g., <code>0.5</code>) triggers when that fraction of the element is visible.</li>
          <li>A <b>array of numbers</b> (e.g., <code>[0, 0.5, 1]</code>) triggers the callback multiple times at different visibility levels.</li>
        </ul>
        <br />
        A value of <code>0</code> means the callback fires when any part of the element appears, while <code>1</code> means the element must be fully visible.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <IntersectionTracker
          threshold={0.5}
          // threshold={[0, 0.5, 1]}
        >
          {children}
        </IntersectionTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>visibleContent</code></b>: <em>Makes all elements always visible.</em></summary><br />
      <ul>
        <b>Type:</b> boolean<br />
        <br />
        <b>Default:</b> false<br />
        <br />
        <b>Description:</b> <em><br />
        If set to `true`, the tracked elements will always be visible, regardless of their actual intersection status.
        <br />
        This can be useful for testing purposes or when using the <code>onVisible</code> callback, ensuring it continues to trigger whenever the element enters the viewport.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <IntersectionTracker visibleContent>{children}</IntersectionTracker>
        ```

    </ul></details>

    <h2></h2>

    <details>
      <summary><b><code>onVisible</code></b>: <em>Callback function triggered when the element becomes visible.</em></summary><br />
      <ul>
        <b>Type:</b> (key: string) => void<br />
        <br />
        <b>Description:</b> <em><br />
        A callback function that is invoked when the observed element enters the viewport or the defined observation area.<br />
        <br />
        The callback receives the <code>key</code> of the first child element as a parameter.<br />
        This can be useful for lazy loading, analytics tracking, animations, or any other action that needs to be triggered when an element becomes visible.<br />
        <br />
        ✦ Note:<br />
        Instead of checking if <code>key</code> equals the element’s key name, use <code>includes</code> for verification. React may modify key names by prefixing them with special characters like <code>.$</code>, making direct equality checks unreliable and more expensive 💵.</em><br />
        <br />
        <b>Example:</b>

        ```tsx
        <IntersectionTracker
          onVisible={(key) => {
            if (key.includes("elementId")) {
              // do something
            }
          }}
        >
          {children}
        </IntersectionTracker>
        ```

    </ul></details>

    <h2></h2>

  </div>

- ### Link:

  [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

<h2></h2>

### 〈♦ API 〉

- `MorphScroll`: React component that optimizes the rendering of data lists.
- `ResizeTracker`: React component that monitors changes to an element’s size.
- `IntersectionTracker`: React component for tracking element visibility in the viewport.

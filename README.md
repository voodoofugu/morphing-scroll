![logo](https://drive.google.com/uc?export=view&id=1mpb5TAElX3Xla4sGFISp4bQMu0zuNJaa "logo")

## 〈♦ Table of contents 〉

- [About](#-about-)
- [Installation](#-installation-)
- [MorphScroll](#-morphscroll-)
- [ResizeTracker](#-resizetracker-)
- [IntersectionTracker](#-intersectiontracker-)
- [API](#-api-)

## 〈♦ About 〉

`morphing-scroll` is a `React` library designed to optimize the rendering of data lists. It leverages virtual rendering and lazy loading to handle large datasets efficiently, significantly enhancing performance. The library also resolves cross-browser inconsistencies in scroll element rendering by replacing them with custom ones. Additionally, it provides convenient horizontal scrolling with flexible content movement options.

## 〈♦ Installation 〉

To install the library, use the following command:

```bash
npm install morphing-scroll
```

## 〈♦ MorphScroll 〉

`MorphScroll` is the main component of the library responsible for displaying your data.

- ### Props:

  #### GENERAL SETTINGS:

  <details>
    <summary><strong><code>className</code></strong> : <em>Additional classes for the component.</em></summary><br />
    <ul>
      <strong>Type:</strong> string<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter allows you to apply custom CSS classes to the <code>MorphScroll</code> component, enabling further customization and styling to fit your design needs.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        className="your-class"
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>children</code></strong> : <em>Custom user content.</em></summary><br />
    <ul>
      <strong>Type:</strong> React.ReactNode<br />
      <br />
      <strong>Description:</strong> <em><br />
      This is where you can pass your list elements.<br />
      Make sure to provide unique keys for each list item, as per React's rules. The <code>MorphScroll</code> component ensures that the cells it generates will use the same keys as your list items, allowing it to render the correct cells for the current list.<br />
      Additionally, <code>MorphScroll</code> handles a passed <code>null</code> value the same way as <code>undefined</code>, rendering nothing in both cases.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        // props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  #### SCROLL SETTINGS:

  <details>
    <summary><strong><code>type</code></strong> : <em>Type of progress element.</em></summary><br />
    <ul>
      <strong>Type:</strong> "scroll" | "slider"<br />
      <br />
      <strong>Default:</strong> "scroll"<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter defines how the provided <code>progressElement</code> behaves within <code>progressTrigger</code> and how you interact with it.<br />
      With the default <code>type="scroll"</code>, it functions as a typical scrollbar. However, with <code>type="slider"</code>, it displays distinct elements indicating the number of full scroll steps within the list.<br />
      For More details, refer to <code>progressTrigger/progressElement</code>.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        type="slider"
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>direction</code></strong> : <em>Scrolling direction.</em></summary><br />
    <ul>
      <strong>Type:</strong> "x" | "y"<br />
      <br />
      <strong>Default:</strong> "y"<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter changes the scroll or slider type direction based on the provided value.<br />
      You can set it to horizontal or vertical to customize the component according to your needs.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        direction="x"
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>scrollTop</code></strong> : <em>Scroll position and animation duration.</em></summary><br />
    <ul>
      <strong>Type:</strong> {<br />
          value: number | "end";<br />
          duration?: number;<br />
          updater?: boolean;<br />
      }<br />
      <br />
      <strong>Default:</strong> { value: 0; duration: 200; updater: false }<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter allows you to set custom scroll values.<br />
      <br />
      The <code>value</code> property accepts numerical pixel values.<br />
      The <code>"end"</code> option scrolls to the bottom of the list upon loading, which is useful for scenarios like chat message lists. When new elements are appended to the list, the scroll position will update automatically. However, to prevent unwanted scrolling when adding elements to the beginning of the list, this property will not trigger.<br />
      <br />
      The <code>duration</code> property determines the animation speed for scrolling in ms.</em><br />
      <br />
      The <code>updater</code> property is a helper for the <code>value</code> property. When setting the same scroll value repeatedly (e.g., clicking a button to scroll to the top), React does not register the update. To force an update, toggle updater within setState, e.g.,<br />
      <code>setScroll((prev) => ({ ...prev, value: 0, updater: !prev.updater }))</code></em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        scrollTop={{ value: 100; duration: 100 }}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>stopLoadOnScroll</code></strong> : <em>Stop loading when scrolling.</em></summary><br />
    <ul>
      <strong>Type:</strong> boolean<br />
      <br />
      <strong>Default:</strong> false<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter helps optimize list performance during scrolling. When set to <code>true</code>, new items will not load while the list is being scrolled and will only load after scrolling stops. This can be particularly useful for lists with a large number of items.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        stopLoadOnScroll
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>onScrollValue</code></strong> : <em>Callback for scroll value.</em></summary><br />
    <ul>
      <strong>Type:</strong> (scroll: number) => void<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter accepts a callback function that is triggered on every scroll event. The callback receives the current scroll position as a number. The return value of the callback can be used to determine custom behavior based on the scroll value.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        onScrollValue={
          (scroll) => {
            console.log("Scroll position:", scroll);
            return scroll > 100;
          },
        }
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>
    
  ##

  <details>
    <summary><strong><code>isScrolling</code></strong> : <em>Callback function for scroll status.</em></summary><br />
    <ul>
      <strong>Type:</strong> (motion: boolean) => void<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter accepts a callback function that is triggered whenever the scroll status changes. The callback receives a boolean value, where <code>true</code> indicates that scrolling is in progress, and <code>false</code> indicates that scrolling has stopped. This can be useful for triggering additional actions, such as pausing animations or loading indicators based on the scroll state.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        isScrolling={(motion) => {
          console.log(motion ? "Scrolling..." : "Scroll stopped.");
        }}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  #### VISUAL SETTINGS:

  <details>
    <summary><strong><code>size</code></strong> : <em>MorphScroll width and height.</em></summary><br />
    <ul>
      <strong>Type:</strong> number[]<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter sets the width and height of the <code>MorphScroll</code> component as an array of two numbers. These values help define the visual container for the scrollable area.<br />
      *The values are specified following the <code>width/height</code> rule in pixels, regardless of the <code>direction</code>.<br />
      <br />
      If this parameter is not specified, <code>MorphScroll</code> will use the <code>ResizeTracker</code> component to measure the width and height of the area where <code>MorphScroll</code> is added. The dimensions will automatically adjust when the container changes.<br />
      *See the <code>ResizeTracker</code> section for more details.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        size={[100, 400]}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>objectsSize</code> (required)</strong> : <em>Required: Size of cells for each object.</em></summary><br />
    <ul>
      <strong>Type:</strong> (number | "none" | "firstChild")[]<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter is the only required one. It defines the size of cells for each of your objects. <code>ObjectsSize</code> use an array of values.<br />
      *The values are specified following the <code>width/height</code> rule, regardless of the <code>direction</code>.<br />
      <br />
      If you pass <code>"none"</code>, cells will still be created, but <code>MorphScroll</code> will not calculate their sizes-they will simply wrap your objects. In this case, for example, you won’t be able to use the <code>infiniteScroll</code> feature, as it requires specific cell sizes for absolute positioning.. However, this is not a drawback if you are building something like a chat or a news feed, where the content can have varying heights, and it’s better to load new content as the user approaches the end of the existing list.<br />
      <br />
      If you specify the value <code>"firstChild"</code>, a <code>ResizeTracker</code> wrapper will be created for the first child of your list. This wrapper will calculate the size of the first child, and these dimensions will be applied to all cells in the list.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        objectsSize={[40, 40]}
        // objectsSize={["none", "none"]}
        // objectsSize={["firstChild", "firstChild"]}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>gap</code></strong> : <em>Gap between cells.</em></summary><br />
    <ul>
      <strong>Type:</strong> number[] | number<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter allows you to set spacing between list items both horizontally and vertically. You can provide a single value, which will apply to both directions, or an array of two numbers to define separate spacing values.<br />
      *The values are specified following the <code>horizontal/vertical</code> rule in pixels, regardless of the <code>direction</code>.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        gap={10}
        // gap={[10, 10]}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>padding</code></strong> : <em>Padding for the <code>objectsWrapper</code>.</em></summary><br />
    <ul>
      <strong>Type:</strong> number[] | number<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter defines the spacing between the list items and their wrapper, effectively increasing the width or height of the scrollable area. You can provide a single number, which will apply to all sides, or an array of two or four numbers to specify spacing for specific directions.<br />
      <br />
      *This parameter accepts either a single number or an array of numbers.<br />
      If a two-number array is provided, the values follow the <code>horizontal/vertical</code> rule.<br />
      If a four-number array is provided, the values follow the <code>top/right/bottom/left</code> rule.<br />
      All values are in pixels and apply regardless of the <code>direction</code>.<br />
      <br />
      *Important: this is not a CSS property, even though its name might suggest otherwise. It specifically refers to modifying the width and height of the scrollable wrapper, affecting the dimensions of the scrollable area.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        padding={10}
        // padding={[10, 10]}
        // padding={[10, 10, 10, 10]}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>contentAlign</code></strong> : <em>Aligns the content when it is smaller than the MorphScroll <code>size</code>.</em></summary><br />
    <ul>
      <strong>Type:</strong> [<br />
          "start" | "center" | "end",<br />
          "start" | "center" | "end"<br />
      ]<br />
      <strong>Description:</strong> <em><br />
      This parameter aligns the `objectsWrapper`, which contains all the provided elements, relative to the scroll or the `size`.<br />
      <br />
      *Important: only takes effect when `objectsWrapper` is smaller than the scroll container.<br />
      <br />
      *The values are specified following the horizontal/vertical rule, regardless of the direction.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        contentAlign={["center", "center"]}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>elementsAlign</code></strong> : <em>Aligns the objects within the <code>objectsWrapper</code>.</em></summary><br />
    <ul>
      <strong>Type:</strong> "start" | "center" | "end"<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter aligns the provided custom objects within the `objectsWrapper`.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        elementsAlign="center"
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>edgeGradient</code></strong> : <em>Gradient when scrolling overflows.</em></summary><br />
    <ul>
      <strong>Type:</strong> boolean | { color?: string; size?: number }<br />
      <br />
      <strong>Default:</strong> When using true or color, the default size will be 40<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter creates two edge elements responsible for darkening the edges of the scroll when it overflows.<br />
      <br />
      The color property accepts any valid color format. If specified, the library will generate a gradient transitioning from the custom color to transparent. If omitted, the edge elements will have no color, allowing for custom styling via CSS classes.<br />
      <br />
      The size property, measured in pixels, adjusts the dimensions of the edge elements.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        edgeGradient={{ color: "rgba(0, 0, 0, 0.5)" }}
        // edgeGradient={{ color: "rgba(0, 0, 0, 0.5)", size: 20 }}
        // edgeGradient
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>progressReverse</code></strong> : <em>Reverse the progress bar position.</em></summary><br />
    <ul>
      <strong>Type:</strong> boolean<br />
      <br />
      <strong>Default:</strong> false<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter changes the position of the progress bar based on the direction property.<br />
      <br />
      If direction="x", the progress bar will be positioned on the left by default or on the right when progressReverse is active.<br />
      <br />
      If direction="y", the progress bar will be positioned at the top by default or at the bottom when progressReverse is active.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        progressReverse
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>progressVisibility</code></strong> : <em>Visibility of the progress bar.</em></summary><br />
    <ul>
      <strong>Type:</strong> "visible" | "hover" | "hidden"<br />
      <br />
      <strong>Default:</strong> "visible"<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter controls the visibility of the progress bar regardless of the <code>type</code> value.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        progressVisibility="hover"
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>objectsWrapFullMinSize</code></strong> : <em>Sets the <code>min-height</code> CSS property of the <code>objectsWrapper</code> to match the height of the MorphScroll.</em></summary><br />
    <ul>
      <strong>Type:</strong> boolean<br /><br />
      <strong>Default:</strong> false<br /><br />
      <strong>Description:</strong> <em><br />
      -</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        objectsWrapFullMinSize
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  #### PROGRESS AND RENDERING:

  <details>
    <summary><strong><code>progressTrigger</code></strong> : <em>Triggers for the progress bar.</em></summary><br />
    <ul>
      <strong>Type:</strong> {<br />
        wheel?: boolean;<br />
        content?: boolean;<br />
        progressElement?: boolean | React.ReactNode;<br />
        arrows?: boolean | { size?: number; element?: React.ReactNode };<br />
      }<br />
      <br />
      <strong>Default:</strong> { wheel: true }<br />
      <br />
      <strong>Description:</strong> <em><br />
      This is one of the most important parameters, allowing you to define how users interact with the progress bar and customize its appearance.<br />
      <br />
      The <code>wheel</code> property determines whether the progress bar responds to mouse wheel scrolling.<br />
      The <code>content</code> property enables interaction by clicking and dragging anywhere within the scrollable content to move it.<br />
      The <code>progressElement</code> property defines whether the progress bar is controlled by a custom element. If your custom scroll element is not ready yet, you can simply pass <code>true</code>, which will display the browser's default scrollbar when <code>type="scroll"</code> is used. Alternatively, if <code>type="slider"</code> is set, a <code>sliderBar</code> element will be created, containing multiple <code>sliderElem</code> elements representing progress. Depending on the position, one of these elements will always have the <code>active</code> class.<br />
      </em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        progressTrigger={{
          wheel: true,
          progressElement: <div className="your-scroll-thumb" />,
        }}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>render</code></strong> : <em>Types of rendering for optimization.</em></summary><br />
    <ul>
      <strong>Type:</strong><br />
        | { type: "default" }<br />
        | { type: "lazy"; rootMargin?: number | number[]; onVisible?: () => void }<br />
        | { type: "virtual"; rootMargin?: number | number[] }<br />
      <br />
      <strong>Default:</strong> { type: "default" }<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter defines the rendering type for optimization.<br />
      The <code>type</code> property can be set to <code>default</code>, <code>lazy</code> or <code>virtual</code>.<br />
      <br />
      With <code>default</code>, no optimizations are applied.<br />
      With <code>lazy</code>, containers are created but do not load content until they enter the viewport. The <code>rootMargin</code> property controls the threshold for loading, and the <code>onVisible</code>callback function can be used to trigger actions when a container becomes visible for each scrollable object.<br />
      <br />
      With <code>virtual</code>, a container is created for each scrollable object, and its absolute positioning is calculated based on <code>scrollTop</code> and scroll area dimensions. Rendering is dynamically adjusted according to the scroll position. The <code>rootMargin</code> property can also be used to extend the rendering area.<br />
      <br />
      *The <code>rootMargin</code> property accepts either a single number or an array of numbers.<br />
      If a two-number array is provided, the values follow the <code>horizontal/vertical</code> rule.<br />
      If a four-number array is provided, the values follow the <code>top/right/bottom/left</code> rule.<br />
      All values are in pixels and apply regardless of the <code>direction</code>.<br /></em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        render={{ type: "virtual" }}
        // render={{
        //   type: "lazy",
        //   rootMargin: [0, 100],
        //   onVisible: () => console.log("visible"))
        // }}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>emptyElements</code></strong> : <em>Handling of empty scroll elements.</em></summary><br />
    <ul>
      <strong>Type:</strong><br />
        | {
            mode: "clear";
            clickTrigger?: { selector: string; delay?: number };
          }<br />
        | {
            mode: "fallback";
            element?: React.ReactNode;
            clickTrigger?: { selector: string; delay?: number };
          }<br /><br />
      <strong>Description:</strong> <em><br />
      If certain components might return nothing during rendering, this parameter helps manage them. The check and subsequent replacement with a fallback element or removal occur after the scroll elements are rendered. Due to this, when dynamically displaying elements in different <code>render</code> modes, you may notice slight position shifts during fast scrolling, as empty elements are removed, causing subsequent elements to reposition.<br />
      <br />
      <code>mode: "clear"</code> – automatically removes empty elements, eliminating unnecessary gaps in the scroll list.<br />
      <br />
      <code>clickTrigger</code> – if elements are removed via a click action, this property ensures cleanup is triggered accordingly. It accepts an object with a <code>selector</code> (such as a delete button’s class) and an optional <code>delay</code> (a delay in milliseconds to accommodate animations or complex removals).<br />
      <br />
      <code>mode: "fallback"</code> – replaces empty elements with a specified fallback component. By default, it uses the <code>fallback</code> props value, but you can also pass a separate placeholder element via the <code>element</code> property.<br />
      <br />
      *For clarification, the cleanup will occur on the initial render, when the number of passed elements changes, on scroll, and on click if you use <code>clickTrigger</code>.</em><br />
      <br />
      <strong>Example:</strong>

      ```tsx
      <MorphScroll
        emptyElements={{
          mode: "clear",
          clickTrigger: { selector: ".close-button" },
        }}
        // emptyElements={{
        //   mode: "fallback",
        //   clickTrigger: {
        //     selector: ".close-button",
        //     delay: 100,
        //   },
        // }}
        // another props
      >
        {children}
      </MorphScroll>
      ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>suspending</code></strong> : <em>Adds React Suspense.</em></summary><br />
    <ul>
      <strong>Type:</strong> boolean<br />
      <br />
      <strong>Default:</strong> false<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter adds React Suspense to the MorphScroll component for asynchronous rendering.</em><br />
      <br />
      <strong>Example:</strong>

  ```tsx
  <MorphScroll
    suspending
    // another props
  >
    {children}
  </MorphScroll>
  ```

    </ul>
  </details>

  ##

  <details>
    <summary><strong><code>fallback</code></strong> : <em>Fallback element.</em></summary><br />
    <ul>
      <strong>Type:</strong> React.ReactNode<br />
      <br />
      <strong>Description:</strong> <em><br />
      This parameter sets the fallback element for custom element. It will be used for <code>emptyElements</code> in <code>mode: "fallback"</code> or when <code>suspending</code> is enabled.</em><br />
      <br />
      <strong>Example:</strong>

  ```tsx
  <MorphScroll
    fallback={<div>Loading...</div>}
    // another props
  >
    {children}
  </MorphScroll>
  ```

    </ul>
  </details>

## 〈♦ ResizeTracker 〉

`ResizeTracker` is a React component that monitors changes to an element’s size. It provides updated dimensions via a render-prop function whenever the observed element is resized.

- ### Props:

  <details>
    <summary><strong><code>children</code></strong> : <em>⚠This is a non-standard prop that you might be used to using this is render-prop function receiving the container's size.</em></summary><br />
    <ul>
      <strong>Type:</strong> (rect: DOMRectReadOnly) => React.ReactNode<br />
      <br />
      <strong>Description:</strong> <em><br />
      Instead of a standard <code>children</code> prop, this component uses a <strong>render-prop function</strong> to pass size updates to its children. You can use it similarly to a regular <code>children</code> prop inside the component.<br />
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
      </ul></em><br />
      <br />
      <strong>Example:</strong>

  ```tsx
  <ResizeTracker
  // another props
  >
    {(rect) => (
      <p>
        Width: {rect.width}, Height: {rect.height}
      </p>
    )}
  </ResizeTracker>
  ```

    </ul>

  </details>

  ##

  <details>
    <summary><strong><code>style</code></strong> : <em>Applies inline styles to the container.</em></summary><br />
    <ul>
      <strong>Type:</strong> React.CSSProperties<br />
      <br />
      <strong>Example:</strong>

  ```tsx
  <ResizeTracker style={{ backgroundColor: "blue" }}>
    {(rect) => (
      // content
    )}
  </ResizeTracker>
  ```

    </ul>

  </details>

  ##

  <details>
    <summary><strong><code>measure</code></strong> : <em>Defines the measurement strategy.</em></summary><br />
    <ul>
      <strong>Type:</strong> "inner" | "outer" | "all"<br />
      <br />
      <strong>Default:</strong> "inner"<br />
      <br />
      <strong>Description:</strong><br />
      <em>This prop determines what is being measured by automatically applying inline styles that affect width and height.<br />
      <br />
      - The default value <code>"inner"</code> sets <code>width: "max-content"</code> and <code>height: "max-content"</code>, measuring the size of child elements.<br />
      - The <code>"outer"</code> value measures the parent element by setting <code>minWidth: "100%"</code> and <code>minHeight: "100%"</code>.<br />
      - The <code>"all"</code> value combines the styles of both <code>"inner"</code> and <code>"outer"</code>, allowing measurement of both the parent and child elements.<br />
      <br />
      ⚠<strong>Note:</strong> Be cautious when overriding styles via the <code>style</code> prop, as it may interfere with the styles applied by <code>measure</code>, leading to unexpected behavior.</em><br />
      <br />
      <strong>Example:</strong>

  ```tsx
  <ResizeTracker measure="all">
    {(rect) => (
      // content
    )}
  </ResizeTracker>
  ```

    </ul>

  </details>

  ##

  <details>
    <summary><strong><code>onResize</code></strong> : <em>Callback triggered on size changes.</em></summary><br />
    <ul>
      <strong>Type:</strong> (rect: Partial<DOMRectReadOnly>) => void<br />
      <br />
      <strong>Description:</strong><br />
      <em>A callback function that is triggered whenever the observed element's dimensions change.<br />
      The function receives an object containing the updated size properties.</em><br />
      <br />
      <strong>Example:</strong>

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

    </ul>

  </details>

## 〈♦ IntersectionTracker 〉

`IntersectionTracker` -.

- ### Props:

  <details>
    <summary><strong><code>!</code></strong> : <em>!.</em></summary><br />
    <ul>
      <strong>Type:</strong> !<br />
      <br />
      <strong>Description:</strong> <em><br />
      !.</em><br />
      <br />
      <strong>Example:</strong>

  ```tsx
  <IntersectionTracker
  // another props
  >
    {children}
  </IntersectionTracker>
  ```

    </ul>

  </details>

## 〈♦ API 〉

- `MorphScroll`: .
- `ResizeTracker`: -.
- `IntersectionTracker`: -.

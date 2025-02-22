![logo](https://drive.google.com/uc?export=view&id=1mpb5TAElX3Xla4sGFISp4bQMu0zuNJaa "logo")

## 〈♦ Table of contents 〉

- [About](#-about-)
- [Installation](#-installation-)
- [MorphScroll](#-morph_scroll-)
- [ResizeTracker](#-resizet_racker-)
- [IntersectionTracker](#-intersection_tracker-)
- [More](#-More-)
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

### Props:

- #### GENERAL SETTINGS:

  - **`className`:** _Additional classes for the component._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
    <strong>Type:</strong> string<br />
    <br />
    <strong>Description:</strong> <em><br />
    This parameter allows you to apply custom CSS classes to the <code>MorphScroll</code> component, enabling further customization and styling to fit your design needs.✨</em><br />
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

    </details>
    <h2>

  - **`children` (required):** _Custom user content._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>

  <h2>

- #### SCROLL SETTINGS:

  - **`type`:** _Type of progress element._
      <details>
      <summary><strong><em>more</em></strong></summary>
    <br />
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

      </details>
      <h2>

  - **`direction`:** _Scrolling direction._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`scrollTop`:** _Scroll position and animation duration._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`stopLoadOnScroll`:** _Stop loading when scrolling._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`onScrollValue`:** _Callback for scroll value._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`isScrolling`:** _Callback function for scroll status._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>

  <h2>

- #### VISUAL SETTINGS:

  - **`size`:** _MorphScroll width and height._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`objectsSize` (required):** _Required: Size of cells for each object._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`gap`:** _Gap between cells._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`padding`:** _Padding for the `objectsWrapper`._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`contentAlign`:** _Aligns the content when it is smaller than the MorphScroll `size`._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`elementsAlign`:** _Aligns the objects within the `objectsWrapper`._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`edgeGradient`:** _Edge gradient._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`progressReverse`:** _Reverse the progress bar position._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`progressVisibility`:** _Visibility of the progress bar._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`objectsWrapFullMinSize`:** _Sets the `min-height` CSS property of the `objectsWrapper` to match the height of the MorphScroll._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
    <strong>Type:</strong> boolean<br />
    <br />
    <strong>Default:</strong> false<br />
    <br />
    <strong>Description:</strong> <em><br />
    .</em><br />
    <br />
    <strong>Example:</strong>

    ```tsx
    <MorphScroll
    // another props
    >
      {children}
    </MorphScroll>
    ```

    </details>

  <h2>

- #### PROGRESS AND RENDERING:

  - **`progressTrigger`:** _Triggers for the progress bar._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`render`:** _Types of rendering for optimization._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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
      // render={{ type: "lazy", rootMargin: [0, 100], onVisible: () => console.log("visible")) }}
      // another props
    >
      {children}
    </MorphScroll>
    ```

    </details>
    <h2>

  - **`emptyElements`:** _Handling of empty scroll elements._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
    <strong>Type:</strong><br />
      | {
          mode: "clear";
          clickTrigger?: { selector: string; delay?: number };
        }<br />
      | {
          mode: "fallback";
          element?: React.ReactNode;
          clickTrigger?: { selector: string; delay?: number };
        }<br />
    <br />
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

    </details>
    <h2>

  - **`suspending`:** _Adds React Suspense._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <br />
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

    </details>
    <h2>

  - **`fallback`:** _Fallback element._
    <details>
    <summary><strong><em>more</em></strong></summary>
    <ul>
      <br />
      <li>
        <strong>Type:</strong> React.ReactNode<br />
      </li>
      <br />
      <li>
        <strong>Description:</strong> <em><br />
        This parameter sets the fallback element for custom element. It will be used for <code>emptyElements</code> in <code>mode: "fallback"</code> or when <code>suspending</code> is enabled.</em>
      </li>
      <br />
      <li>
        <strong>Example:</strong>

    ```tsx
    <MorphScroll
      fallback={<div>Loading...</div>}
      // another props
    >
      {children}
    </MorphScroll>
    ```

      </li>
    </ul>

    </details>

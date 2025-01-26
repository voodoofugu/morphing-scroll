<div align="center" style="height: 282px;">
  <img src="https://drive.google.com/uc?export=view&id=1zaKS3ZOVpeVEY2xcwZmUhdYuRBGBzZRR" alt="logo"/>
</div>

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

##### GENERAL SETTINGS:

- **`className`:** _Additional classes for the component._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> string<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  This parameter allows you to apply custom CSS classes to the <code>MorphScroll</code> component, enabling further customization and styling to fit your design needs.✨</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
    className="my-class"
    // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`children` (required):** _Custom user content._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> React.ReactNode<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  This is where you can pass your list elements.<br />
  Make sure to provide unique keys for each list item, as per React's rules. The <code>MorphScroll</code> component ensures that the cells it generates will use the same keys as your list items, allowing it to render the correct cells for the current list.<br />
  Additionally, <code>MorphScroll</code> handles a passed <code>null</code> value the same way as <code>undefined</code>, rendering nothing in both cases.</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

##### SCROLL SETTINGS:

- **`type`:** _Type of progress element._
    <details>
    <summary><strong>More:</strong></summary>
    <br />
    <strong>‣ Type:</strong> "scroll" | "slider"<br />
    <br />
    <strong>‣ Default:</strong> "scroll"<br />
    <br />
    <strong>‣ Description:</strong> <em><br />
    This parameter defines how the provided <code>progressElement</code> behaves within <code>progressTrigger</code> and how you interact with it.<br />
    With the default <code>type="scroll"</code>, it functions as a typical scrollbar. However, with <code>type="slider"</code>, it displays distinct elements indicating the number of full scroll steps within the list.<br />
    For More details, refer to <code>progressTrigger/progressElement</code>.</em><br />
    <br />
    <strong>‣ Example:</strong>

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

- **`scrollTop`:** _Scroll position and animation duration._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> { value: number | "end"; duration?: number }<br />
  <br />
  <strong>‣ Default:</strong> { value: 1; duration: 200 }<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  The default value for <code>value</code> is set to 1 to prevent sudden scrolling to the start of the list, especially when loading new elements at the top of the MorphScroll. The value <code>"end"</code> scrolls to the end of the list upon loading and is useful when adding new items to the bottom of the list and will not work when adding new items to the top.<br />
  The <code>duration</code> parameter specifies the scrolling speed for the <code>scrollTop</code> values. This parameter is optional and you can only use `value'.</em><br />
  <br />
  <strong>‣ Example:</strong>

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
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> boolean<br />
  <br />
  <strong>‣ Default:</strong> false<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  This parameter helps optimize list performance during scrolling. When set to <code>true</code>, new items will not load while the list is being scrolled and will only load after scrolling stops. This can be particularly useful for lists with a large number of items.</em><br />
  <br />
  <strong>‣ Example:</strong>

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
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (scroll: number) => void<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  This parameter accepts a callback function that is triggered on every scroll event. The callback receives the current scroll position as a number. The return value of the callback can be used to determine custom behavior based on the scroll value.</em><br />
  <br />
  <strong>‣ Example:</strong>

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
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (motion: boolean) => void<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  This parameter accepts a callback function that is triggered whenever the scroll status changes. The callback receives a boolean value, where <code>true</code> indicates that scrolling is in progress, and <code>false</code> indicates that scrolling has stopped. This can be useful for triggering additional actions, such as pausing animations or loading indicators based on the scroll state.</em><br />
  <br />
  <strong>‣ Example:</strong>

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

##### VISUAL SETTINGS:

- **`size`:** _MorphScroll width and height._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> number[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  This parameter sets the width and height of the <code>MorphScroll</code> component as an array of two numbers. These values help define the visual container for the scrollable area.<br />
  *The values are specified following the <code>width/height</code> rule in pixels, regardless of the <code>direction</code>.<br />
  <br />
  If this parameter is not specified, <code>MorphScroll</code> will use the <code>ResizeTracker</code> component to measure the width and height of the area where <code>MorphScroll</code> is added. The dimensions will automatically adjust when the container changes. See the <code>ResizeTracker</code> section for more details.</em><br />
  <br />
  <strong>‣ Example:</strong>

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
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`gap`:** _Gap between cells._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`padding`:** _Padding for the `objectsWrapper`._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`direction`:** _Scrolling direction._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`contentAlign`:** _Aligns the content when it is smaller than the MorphScroll `size`._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`elementsAlign`:** _Aligns the objects within the `objectsWrapper`._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`edgeGradient`:** _Edge gradient._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`progressReverse`:** _Reverse the progress bar direction._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`progressVisibility`:** _Visibility of the progress bar._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`objectsWrapFullMinSize`:** _Sets the `min-height` CSS property of the `objectsWrapper` to match the height of the MorphScroll._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

##### PROGRESS AND RENDERING:

- **`progressTrigger`:** _Triggers for the progress bar._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`lazyRender`:** _Lazy rendering of objects._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`infiniteScroll`:** _Infinite scrolling._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`rootMargin`:** _Margin expansion for object rendering._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`suspending`:** _Adds React Suspense._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

- **`fallback`:** _Fallback element for error handling._
  <details>
  <summary><strong>More:</strong></summary>
  <strong>‣ Type:</strong> (number | "none" | "firstChild")[]<br />
  <br />
  <strong>‣ Description:</strong> <em><br />
  .</em><br />
  <br />
  <strong>‣ Example:</strong>

  ```tsx
  <MorphScroll
  // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  <h2>

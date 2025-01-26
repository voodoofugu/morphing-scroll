<div align="center" style="height: 282px;">
  <img src="https://drive.google.com/uc?export=view&id=1zaKS3ZOVpeVEY2xcwZmUhdYuRBGBzZRR" alt="logo"/>
</div>

## 〈♦ Table of contents 〉

- [About](#-about-)
- [Installation](#-installation-)
- [MorphScroll](#-morph_scroll-)
- [ResizeTracker](#-resizet_racker-)
- [IntersectionTracker](#-intersection_tracker-)
- [More](#-more-)
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

- **`className`:** _Additional classes for the component._<br />
  <details>
  <summary>more:</summary>
  <strong>type:</strong> string<br />
  <strong>example:</strong>

  ```tsx
  <MorphScroll
    className="my-class"
    // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>
  ###

- **`children` (required):** _Custom user content._
  <details>
  <summary>more:</summary>
  <strong>type:</strong> React.ReactNode<br />
  <strong>example:</strong>

  ```tsx
  <MorphScroll
  // your props
  >
    {children}
  </MorphScroll>
  ```

  </details>

- **`type`:** _Type of progress element._<br />
  <details>
  <summary>more:</summary>
  <strong>type:</strong> "scroll" | "slider"<br />
  <strong>default:</strong> "scroll"<br />
  <strong>example:</strong>

  ```tsx
  <MorphScroll
    type="slider"
    // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>

- **`scrollTop`:** _Scroll position and animation duration._
  <details>
  <summary>more:</summary>
  <strong>type:</strong> { value: number | "end"; duration?: number }<br />
  <strong>default:</strong> { value: 1; duration: 200 }<br />
  <strong>description:</strong> <em><br />
  The default value for <code>value</code> is set to 1 to prevent sudden scrolling to the start of the list, especially when loading new elements at the top of the MorphScroll. The value <code>"end"</code> scrolls to the end of the list upon loading and is useful when adding new items to the bottom of the list and will not work when adding new items to the top.<br />
  The <code>duration</code> parameter specifies the scrolling speed for the <code>scrollTop</code> values. This parameter is optional and you can only use `value'.</em><br />
  <strong>example:</strong>

  ```tsx
  <MorphScroll
    scrollTop={{ value: 100; duration: 100 }}
    // another props
  >
    {children}
  </MorphScroll>
  ```

  </details>

- **`stopLoadOnScroll`:** _Stop loading when scrolling._

- **`onScrollValue`:** _Callback for scroll value._
  <details>
  <summary>example:</summary>
    onScrollValue={[
     (scroll) => scroll > 200 && console.log("scroll > 200")
    ]}
  </details>

- **`isScrolling`:** _Callback function for scroll status._

- **`size`:** _MorphScroll width and height._

- **`objectsSize` (required):** _Required: Size of cells for each object._

- **`gap`:** _Gap between cells._

- **`padding`:** _Padding for the `objectsWrapper`._

- **`direction`:** _Scrolling direction._

- **`contentAlign`:** _Aligns the content when it is smaller than the MorphScroll `size`._

- **`elementsAlign`:** _Aligns the objects within the `objectsWrapper`._

- **`edgeGradient`:** _Edge gradient._

- **`progressReverse`:** _Reverse the progress bar direction._

- **`progressVisibility`:** _Visibility of the progress bar._

- **`objectsWrapFullMinSize`:** _Sets the `min-height` CSS property of the `objectsWrapper` to match the height of the MorphScroll._

- **`progressTrigger`:** _Triggers for the progress bar._

- **`lazyRender`:** _Lazy rendering of objects._

- **`infiniteScroll`:** _Infinite scrolling._

- **`rootMargin`:** _Margin expansion for object rendering._

- **`suspending`:** _Adds React Suspense._
- **`fallback`:** _Fallback element for error handling._

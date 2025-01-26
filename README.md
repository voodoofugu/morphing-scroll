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

- #### **`className`:**<br />

  <hr>

  _Additional classes for the component._<br />
  **type:** string<br />
  **example:**

  ```tsx
  <MorphScroll className="my-class" />
  ```

- **`children` (required):**<br />
  _Custom user content._
  **type:** React.ReactNode

- **`type`:**<br />
  _Type of progress element._<br />
  **type:** "scroll" | "slider"<br />
  **default:** "scroll"

- **`scrollTop`:**<br />
  _Scroll position and animation duration._

- **`stopLoadOnScroll`:**<br />
  _Stop loading when scrolling._

- **`onScrollValue`:**<br />
  _Callback for scroll value._
  <details>
  <summary>example:</summary>
    onScrollValue={[
     (scroll) => scroll > 200 && console.log("scroll > 200")
    ]}
  </details>

- **`isScrolling`:**<br />
  _Callback function for scroll status._

- **`size`:**<br />
  _MorphScroll width and height._

- **`objectsSize` (required):**<br />
  _Required: Size of cells for each object._

- **`gap`:**<br />
  _Gap between cells._

- **`padding`:**<br />
  _Padding for the `objectsWrapper`._

- **`direction`:**<br />
  _Scrolling direction._

- **`contentAlign`:**<br />
  _Aligns the content when it is smaller than the MorphScroll `size`._

- **`elementsAlign`:**<br />
  _Aligns the objects within the `objectsWrapper`._

- **`edgeGradient`:**<br />
  _Edge gradient._

- **`progressReverse`:**<br />
  _Reverse the progress bar direction._

- **`progressVisibility`:**<br />
  _Visibility of the progress bar._

- **`objectsWrapFullMinSize`:**<br />
  _Sets the `min-height` CSS property of the `objectsWrapper` to match the height of the MorphScroll._

- **`progressTrigger`:**<br />
  _Triggers for the progress bar._

- **`lazyRender`:**<br />
  _Lazy rendering of objects._

- **`infiniteScroll`:**<br />
  _Infinite scrolling._

- **`rootMargin`:**<br />
  _Margin expansion for object rendering._

- **`suspending`:**<br />
  _Adds React Suspense._
- **`fallback`:**<br />
  _Fallback element for error handling._

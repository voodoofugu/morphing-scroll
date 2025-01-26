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

- **`className`:**<br />
  Additional classes for the component.<br />
  type: string
- **`children`:**<br />
  Custom user content.
  type: React.ReactNode
- **`type`:**<br />
  Type of progress element.<br />
  type: "scroll" | "slider"
  default: "scroll"
- **`scrollTop`:**<br />
  Scroll position and animation duration.
- **`stopLoadOnScroll`:**<br />
  Stop loading when scrolling.
- **`onScrollValue`:**<br />
  Callback for scroll value.
  <details>
  <summary>example:</summary>
    onScrollValue={[
     (scroll) => scroll > 200 && console.log("scroll > 200")
    ]}
  </details>
- **`isScrolling`:**<br />
  Callback function for scroll status.
- **`size`:**<br />
  MorphScroll width and height.
- **`objectsSize`:** ◄ REQUIRED ►<br />
  Required: Size of cells for each object.
- **`gap`:**<br />
  Gap between cells.
- **`padding`:**<br />
  Padding for the `objectsWrapper`.
- **`direction`:**<br />
  Scrolling direction.
- **`contentAlign`:**<br />
  Aligns the content when it is smaller than the MorphScroll `size`.
- **`elementsAlign`:**<br />
  Aligns the objects within the `objectsWrapper`.
- **`edgeGradient`:**<br />
  Edge gradient.
- **`progressReverse`:**<br />
  Reverse the progress bar direction.
- **`progressVisibility`:**<br />
  Visibility of the progress bar.
- **`objectsWrapFullMinSize`:**<br />
  Sets the `min-height` CSS property of the `objectsWrapper` to match the height of the MorphScroll.
- **`progressTrigger`:**<br />
  Triggers for the progress bar.
- **`lazyRender`:**<br />
  Lazy rendering of objects.
- **`infiniteScroll`:**<br />
  Infinite scrolling.
- **`rootMargin`:**<br />
  Margin expansion for object rendering.
- **`suspending`:**<br />
  Adds React Suspense.
- **`fallback`:**<br />
  Fallback element for error handling.

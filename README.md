<div align="center">
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

- **className (required):** Additional class for the component.

<details>

### <summary>Props:</summary>

- **className (required):** Additional class for the component.
- **children:** Child elements.
- **type:** Type of progress element.
- **scrollTop:** Scroll position and animation duration.
- **stopLoadOnScroll:** Stop loading when scrolling.
- **onScrollValue:** Callback for scroll value.

  <details>

  <summary>Example:</summary>
    onScrollValue={[
     (scroll) => scroll > 200 && console.log("scroll > 200")
    ]}

  </details>

- **isScrolling:** Callback function for scroll status.
- **size:** MorphScroll width and height.
- **objectsSize:** Required: Size of cells for each object.
- **gap:** Gap between cells.
- **padding:** Padding for the `objectsWrapper`.
- **direction:** Scrolling direction.
- **contentAlign:** Aligns the content when it is smaller than the MorphScroll `size`.
- **elementsAlign:** Aligns the objects within the `objectsWrapper`.
- **edgeGradient:** Edge gradient.
- **progressReverse:** Reverse the progress bar direction.
- **progressVisibility:** Visibility of the progress bar.
- **objectsWrapFullMinSize:** Sets the `min-height` CSS property of the `objectsWrapper` to match the height of the MorphScroll.
- **progressTrigger:** Triggers for the progress bar.
- **lazyRender:** Lazy rendering of objects.
- **infiniteScroll:** Infinite scrolling.
- **rootMargin:** Margin expansion for object rendering.
- **suspending:** Adds React Suspense.
- **fallback:** Fallback element for error handling.

</details>

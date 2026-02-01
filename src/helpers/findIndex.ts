const findFirstVisibleIndex = (
  direction: "x" | "y" | "hybrid",
  data: {
    elementTop: number;
    elementBottom: number;
    left: number;
    right: number;
  }[],
  scrollStart: number,
) => {
  let l = 0;
  let r = data.length - 1;
  let res = data.length;
  while (l <= r) {
    const m = (l + r) >> 1;
    const itemEnd = direction === "x" ? data[m].right : data[m].elementBottom;
    if (itemEnd >= scrollStart) {
      res = m;
      r = m - 1;
    } else {
      l = m + 1;
    }
  }
  return res;
};

const findLastVisibleIndex = (
  direction: "x" | "y" | "hybrid",
  data: {
    elementTop: number;
    elementBottom: number;
    left: number;
    right: number;
  }[],
  scrollEnd: number,
) => {
  let l = 0;
  let r = data.length - 1;
  let res = -1;
  while (l <= r) {
    const m = (l + r) >> 1;
    const itemStart = direction === "x" ? data[m].left : data[m].elementTop;
    if (itemStart <= scrollEnd) {
      res = m;
      l = m + 1;
    } else {
      r = m - 1;
    }
  }
  return res;
};

export { findFirstVisibleIndex, findLastVisibleIndex };

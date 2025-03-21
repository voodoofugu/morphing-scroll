const numOrArrFormat = (
  v?: number | number[],
  r?: boolean
): number[] | undefined => {
  if (v === undefined) return;
  if (typeof v === "number") return [v, v, v, v];
  if (v.length === 2) {
    return r ? [v[0], v[1], v[0], v[1]] : [v[1], v[0], v[1], v[0]];
  }
  if (v.length === 4) {
    return r ? [v[1], v[0], v[3], v[2]] : v;
  }
  return;
};

export default numOrArrFormat;

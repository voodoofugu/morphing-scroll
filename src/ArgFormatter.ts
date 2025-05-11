const ArgFormatter = <T extends number | string>(
  value: T | T[],
  reverse?: boolean
): T[] => {
  let arr: T[] = [];

  if (Array.isArray(value)) {
    if (value.length === 2) arr = [value[1], value[0], value[1], value[0]];
    if (value.length === 4) arr = [value[0], value[1], value[2], value[3]];
  } else arr = [value, value, value, value];

  if (reverse) return [arr[1], arr[0], arr[3], arr[2]];

  return arr;
};

export default ArgFormatter;

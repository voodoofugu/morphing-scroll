const argsFormatter = <T extends number | string>(
  value: T | T[],
  reverse: boolean = false,
  itemsCount?: number
): T[] => {
  let arr: T[] = [];

  if (Array.isArray(value)) {
    if (value.length === 2) {
      arr = [value[1], value[0], value[1], value[0]];
    } else arr = [...value];
  } else arr = [value, value, value, value];

  if (reverse) arr = [arr[1], arr[0], arr[3], arr[2]];

  if (itemsCount) {
    const newArr: T[] = [];

    for (let i = 0; i < itemsCount; i++) {
      newArr.push(arr[i % 4]);
    }
    arr = newArr;
  }

  return arr;
};

export default argsFormatter;

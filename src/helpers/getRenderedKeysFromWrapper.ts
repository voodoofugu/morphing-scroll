import CONST from "../constants";

const areKeysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

// убираем лишние символы добавленные react
const formatRenderedKey = (key: string) => {
  const explicitKeyStart = key.lastIndexOf(":$");

  // если ключ создан react просто вернём его
  if (explicitKeyStart === -1) return key;

  // если ключ передан пользователем корректно вернём его
  return key
    .slice(explicitKeyStart + 2)
    .replace(/=0/g, "=")
    .replace(/=2/g, ":");
};

const getRenderedKeysFromWrapper = (wrapper: HTMLDivElement | null) => {
  if (!wrapper) return [];

  return Array.from(wrapper.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];

    const key = child.getAttribute(CONST.WRAP_ATR);
    return key ? [formatRenderedKey(key)] : [];
  });
};

export { getRenderedKeysFromWrapper, areKeysEqual };

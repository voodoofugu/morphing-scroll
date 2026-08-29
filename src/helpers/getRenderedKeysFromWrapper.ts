import CONST from "../constants";

const areKeysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

const getRenderedKeysFromWrapper = (wrapper: HTMLDivElement | null) => {
  if (!wrapper) return [];

  return Array.from(wrapper.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];

    // атрибут уже несёт пользовательский ключ, см. helpers/childKey
    const key = child.getAttribute(CONST.WRAP_ATR);
    return key ? [key] : [];
  });
};

export { getRenderedKeysFromWrapper, areKeysEqual };

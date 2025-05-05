import React from "react";

import { MorphScrollT } from "./types";

import { CONST } from "./constants";

const updateEmptyElementKeys = (
  customScrollRef: () => NodeListOf<Element>,
  emptyElementKeysString: React.MutableRefObject<string>,
  render: Exclude<MorphScrollT["render"], undefined>,
  callBack: () => void
) => {
  const getWrapIds = (filterFn?: (el: Element) => boolean): string[] => {
    return Array.from(customScrollRef())
      .filter(filterFn || (() => true))
      .map((el) => el.getAttribute(CONST.WRAP_ATR))
      .filter(Boolean) as string[];
  };

  // const removeKeysFromPath = (
  //   path: string,
  //   keysToRemove: string[]
  // ): string => {
  //   const pathSet = new Set(path.split("/"));
  //   keysToRemove.forEach((key) => pathSet.delete(key));
  //   return Array.from(pathSet).join("/");
  // };

  // const allKeys = getWrapIds();
  const emptyKeysRaw = getWrapIds((el) => el.children.length === 0);

  // const allKeysStr = allKeys.join("/");
  const emptyKeysFiltered =
    render.type !== "lazy"
      ? emptyKeysRaw
      : emptyKeysRaw.filter((key) => key.includes("visible"));

  const emptyKeysStr = emptyKeysFiltered.join("/");
  // const fullKeysStr = removeKeysFromPath(allKeysStr, emptyKeysFiltered);
  // const diffKeys = removeKeysFromPath(
  //   emptyElementKeysString.current,
  //   fullKeysStr.split("/")
  // );

  if (!emptyElementKeysString.current) {
    emptyElementKeysString.current = emptyKeysStr;
  } else {
    if (
      emptyKeysStr &&
      !emptyElementKeysString.current.includes(emptyKeysStr)
    ) {
      emptyElementKeysString.current += `/${emptyKeysStr}`;
    }

    // if (diffKeys) {
    //   emptyElementKeysString.current = removeKeysFromPath(
    //     emptyElementKeysString.current,
    //     diffKeys.split("/")
    //   );
    // }
  }

  callBack();
};

const updateEmptyKeysClick = (
  event: React.MouseEvent,
  scrollTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  emptyElements: Exclude<MorphScrollT["emptyElements"], undefined>,
  callBack: () => void
) => {
  if (!emptyElements?.clickTrigger?.selector) return;

  const target = event.target as HTMLElement;
  const closeSelector = target.closest(emptyElements.clickTrigger.selector);

  if (closeSelector) {
    scrollTimeout.current && clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      callBack();
    }, emptyElements.clickTrigger.delay);
  }
};

export { updateEmptyElementKeys, updateEmptyKeysClick };

import React from "react";

import { MorphScrollT } from "../types/types";

import { CONST } from "../constants";

const updateEmptyElementKeys = (
  customScrollRef: () => NodeListOf<Element>,
  emptyElementKeysString: React.MutableRefObject<string>,
  render: MorphScrollT["render"],
  callBack: () => void
) => {
  const getWrapIds = (filterFn?: (el: Element) => boolean): string[] => {
    return Array.from(customScrollRef())
      .filter(filterFn || (() => true))
      .map((el) => el.getAttribute(CONST.WRAP_ATR))
      .filter(Boolean) as string[];
  };

  // попытка реализации появления скрытых элементов то есть ключей
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
    render?.type !== "lazy"
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
  setManagedTimeout: (id: string, callback: () => void, delay: number) => void,
  emptyElements: Exclude<MorphScrollT["emptyElements"], undefined>,
  callBack: () => void
) => {
  if (!emptyElements?.clickTrigger?.selector) return;

  const target = event.target as HTMLElement;
  const closeSelector = target.closest(emptyElements.clickTrigger.selector);

  if (closeSelector) {
    setManagedTimeout(
      "emptyKeys-anim",
      () => {
        callBack();
      },
      emptyElements.clickTrigger.delay || 0
    );
  }
};

export { updateEmptyElementKeys, updateEmptyKeysClick };

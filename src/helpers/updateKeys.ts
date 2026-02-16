import React from "react";

import { setTask } from "./taskManager";

import CONST from "../constants";

const updateLoadedElementsKeys = (
  customScrollRef: HTMLDivElement,
  objectsKeys: React.MutableRefObject<{
    loaded: Set<string>;
    empty: Set<string> | null;
  }>,
  callBack: () => void,
  renderType?: "lazy" | "virtual",
) => {
  const walker = document.createTreeWalker(
    customScrollRef,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        return node instanceof Element && node.hasAttribute(CONST.WRAP_ATR)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    },
  );

  let currentNode = walker.nextNode();

  while (currentNode) {
    const el = currentNode as Element;
    const id = el.getAttribute(CONST.WRAP_ATR);

    if (id) {
      const isEmpty = el.children.length === 0;

      // empty keys
      if (isEmpty) {
        if (!objectsKeys.current.empty) objectsKeys.current.empty = new Set();
        objectsKeys.current.empty.add(id);
      }

      // loaded keys
      // в virtual режиме НЕ добавляем пустые элементы
      if (!(renderType === "virtual" && isEmpty))
        objectsKeys.current.loaded.add(id);
    }

    currentNode = walker.nextNode();
  }

  callBack();
};

const updateEmptyKeysClick = (
  event: React.MouseEvent,
  clickTrigger: string | { selector: string; delay?: number },
  callBack: () => void,
) => {
  const { selector, delay = 0 } =
    typeof clickTrigger === "string"
      ? { selector: clickTrigger }
      : clickTrigger;
  const target = event.target as HTMLElement;
  if (!target.closest(selector)) return;

  const parentWrapper = target.closest<HTMLElement>(`[${CONST.WRAP_ATR}]`);

  if (parentWrapper) parentWrapper.classList.add("remove");

  setTask(() => {
    if (parentWrapper) parentWrapper.classList.remove("remove");
    callBack();
  }, delay);
};

export { updateLoadedElementsKeys, updateEmptyKeysClick };

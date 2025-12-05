import React from "react";

import { setTask } from "../helpers/taskManager";

import { CONST } from "../constants";

const updateLoadedElementsKeys = (
  customScrollRef: HTMLDivElement,
  objectsKeys: React.MutableRefObject<{
    loaded: string[];
    empty: string[] | null;
  }>,
  callBack: () => void,
  renderType?: "lazy" | "virtual"
) => {
  const { allIds, emptyKeysRaw } = (() => {
    const allIds: string[] = [];
    const emptyKeysRaw: string[] = [];

    // createTreeWalker быстрый итератор по всем дочерним элементам
    const walker = document.createTreeWalker(
      customScrollRef, // мы обходим сам корневой контейнер
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (node instanceof Element && node.hasAttribute(CONST.WRAP_ATR)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      const el = currentNode as Element;
      const id = el.getAttribute(CONST.WRAP_ATR);
      if (id) {
        allIds.push(id);
        if (el.children.length === 0) emptyKeysRaw.push(id);
      }
      currentNode = walker.nextNode();
    }

    return { allIds, emptyKeysRaw };
  })();

  const mergedLoadedObjects = new Set(objectsKeys.current?.loaded);
  allIds.forEach((id) => mergedLoadedObjects.add(id));

  let emptyKeys = null;
  if (objectsKeys.current?.empty) {
    const mergedEmptyKeys = new Set(objectsKeys.current.empty);
    emptyKeysRaw.forEach((id) => mergedEmptyKeys.add(id));
    emptyKeys = Array.from(mergedEmptyKeys);
  }

  objectsKeys.current = {
    // для loaded если "lazy" объединяем все ключи
    loaded:
      renderType === "lazy"
        ? Array.from(mergedLoadedObjects)
        : allIds.map((id) => id),
    empty: emptyKeys,
  };

  callBack();
};

const updateEmptyKeysClick = (
  event: React.MouseEvent,
  clickTrigger: string | { selector: string; delay?: number },
  callBack: () => void
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

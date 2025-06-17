import React from "react";

import { MorphScrollT } from "../types/types";

import { CONST } from "../constants";

const updateLoadedElementsKeys = (
  customScrollRef: HTMLDivElement,
  loadedObjects: React.MutableRefObject<(string | null)[]>,
  currentObjects: React.MutableRefObject<(string | null)[]>,
  emptyElementKeysString: React.MutableRefObject<(string | null)[] | null>,
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
        if (id.includes("visible")) allIds.push(id);
        if (el.children.length === 0) emptyKeysRaw.push(id);
      }
      currentNode = walker.nextNode();
    }

    return { allIds, emptyKeysRaw };
  })();

  function normalizeId(id: string): string {
    return id.replace(/\s*visible\s*$/, "").trim();
  }

  currentObjects.current = allIds.map((id) => normalizeId(id));

  const mergedLoadedObjects = new Set(loadedObjects.current);
  allIds.forEach((id) => mergedLoadedObjects.add(id.split(" ")[0])); // убираем visible
  loadedObjects.current = Array.from(mergedLoadedObjects);

  if (emptyElementKeysString.current) {
    const mergedEmptyKeys = new Set(emptyElementKeysString.current);
    emptyKeysRaw.forEach((id) =>
      renderType === "lazy"
        ? id.includes("visible") && mergedEmptyKeys.add(normalizeId(id))
        : mergedEmptyKeys.add(normalizeId(id))
    );
    emptyElementKeysString.current = Array.from(mergedEmptyKeys);
  }

  callBack();
};

const updateEmptyKeysClick = (
  event: React.MouseEvent,
  setManagedTimeout: (id: string, callback: () => void, delay: number) => void,
  clickTrigger: { selector: string; delay?: number },
  callBack: () => void
) => {
  const target = event.target as HTMLElement;
  const closeSelector = target.closest(clickTrigger.selector);

  if (closeSelector) {
    setManagedTimeout(
      "emptyKeys-anim",
      () => {
        callBack();
      },
      clickTrigger.delay || 0
    );
  }
};

export { updateLoadedElementsKeys, updateEmptyKeysClick };

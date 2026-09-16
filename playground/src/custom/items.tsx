import React from "react";

import type { Settings } from "../dashboard/settings";
import { eachPair } from "../dashboard/settings";
import { clamp } from "../utils";

export function sizeFor(index: number, settings: Settings) {
  const { eachMin, eachMax, eachStep, eachSeed } = settings;

  let h = Math.imul(index + 1, 2654435761) ^ Math.imul(eachSeed + 1, 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = ((h ^ (h >>> 13)) >>> 0) / 4294967296;

  const step = Math.max(1, eachStep);
  const lo = Math.min(eachMin, eachMax);
  const hi = Math.max(eachMin, eachMax);
  const steps = Math.max(1, Math.floor((hi - lo) / step) + 1);

  /*
   * Берём старшие биты, а не остаток: у мультипликативного хеша младшие
   * коррелируют, и на коротком диапазоне соседние индексы попадали в одно и
   * то же число — все объекты выходили одной ширины.
   */
  return lo + Math.min(steps - 1, Math.floor(h * steps)) * step;
}

/*
 * Перетаскивание объектов — жест приложения, не библиотеки. Объект помечен
 * `ms-custom-drag`, чтобы прокрутка за него не бралась, а край подхватывает
 * `autoScrollOnDrag` — это ровно то, ради чего он есть.
 */
export function buildItems(
  settings: Settings,
  order: number[],
  onGrab?: (id: number, event: React.PointerEvent) => void,
  dragging?: number | null,
) {
  const each = settings.objectsSizeMode === "auto";
  const pair = eachPair(settings) as ["auto" | number, "auto" | number];

  /*
   * Группу объект называет на себе, атрибутом: по этому имени к ней ходит
   * `scrollToObject`. Здесь секции нарезаны ровными кусками — этого хватает,
   * чтобы увидеть, как оно себя ведёт.
   */
  const section = (index: number) =>
    settings.sectionSize > 0
      ? `s${Math.floor(index / settings.sectionSize) + 1}`
      : null;

  return order.map((id) => {
    const index = id;
    const number = index + 1;
    const group = section(index);
    const tone = index % 6;
    const isTall = settings.variableItems && index % 7 === 0;
    const isWide = settings.variableItems && index % 11 === 0;
    const eachSize = each
      ? {
          ...(pair[0] === "auto" && { width: sizeFor(index, settings) }),
          ...(pair[1] === "auto" && { height: sizeFor(index * 31 + 7, settings) }),
        }
      : undefined;

    return (
      <article
        className={[
          "demo-item",
          `tone-${tone}`,
          isTall ? "is-tall" : "",
          isWide ? "is-wide" : "",
          dragging === id ? "is-dragging" : "",
        ].join(" ")}
        data-item={id}
        key={`item-${number}`}
        {...(group ? { "ms-group": group } : {})}
        onPointerDown={onGrab ? (event) => onGrab(id, event) : undefined}
        style={eachSize}
        {...(onGrab ? { "ms-custom-drag": "" } : {})}
      >
        <header>
          <b>{number.toString().padStart(2, "0")}</b>
          <span>
            {group ??
              (index % 3 === 0
                ? "content"
                : index % 3 === 1
                  ? "media"
                  : "task")}
          </span>
        </header>
        <p>
          {index % 2 === 0
            ? "Resize, scroll and render behavior"
            : "Useful for lazy and virtual checks"}
        </p>
        {settings.interactiveItems && (
          <button className="item-action" type="button">
            action
          </button>
        )}
      </article>
    );
  });
}

export function buildProgressMenu(count: number) {
  const length = clamp(Math.ceil(count / 2), 8, 140);

  return Array.from({ length }, (_, index) => (
    <button className="slider-menu-button" key={`menu-${index}`} type="button">
      {index + 1}
    </button>
  ));
}

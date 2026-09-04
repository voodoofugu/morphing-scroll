import { describe, it, expect, vi } from "vitest";

import createSizeStore from "@morphing-scroll/src/helpers/createSizeStore";
import { resizeObservers } from "../../setup";

const boxOf = () => {
  const el = document.createElement("div");
  document.body.appendChild(el);

  return el;
};

const latest = () => resizeObservers[resizeObservers.length - 1];

describe("createSizeStore", () => {
  /*
   * В круге тот же ребёнок лежит в каждой копии, и у одного ключа оказывается
   * несколько боксов разом. Следить надо за всеми: иначе новый бокс вытеснял
   * бы прежний, а уход любого стирал бы замер, которым живут остальные.
   */
  it("следит за всеми боксами одного ключа, а не за последним", () => {
    const store = createSizeStore(() => {});
    const ref = store.refFor("a");

    const one = boxOf();
    const two = boxOf();

    ref(one);
    ref(two);

    const observer = latest();

    expect(observer.observe).toHaveBeenCalledTimes(2);
    // прежний не снят с наблюдения ради нового
    expect(observer.unobserve).not.toHaveBeenCalled();

    store.destroy();
  });

  it("уход одной копии не снимает наблюдение с оставшихся", async () => {
    const notify = vi.fn();
    const store = createSizeStore(notify);
    const ref = store.refFor("a");

    const one = boxOf();
    const two = boxOf();

    ref(one);
    ref(two);

    // одна копия ушла из документа — React зовёт ref с null, не говоря какая
    one.remove();
    ref(null);

    const observer = latest();

    expect(observer.unobserve).toHaveBeenCalledTimes(1);
    expect(observer.unobserve).toHaveBeenCalledWith(one);

    // оставшаяся всё ещё приносит размеры
    observer.emit({ width: 120, height: 40 }, two);
    await Promise.resolve();

    expect(store.get("a")).toEqual([120, 40]);

    store.destroy();
  });

  it("когда ушли все, ключ снимается целиком", () => {
    const store = createSizeStore(() => {});
    const ref = store.refFor("a");

    const one = boxOf();
    const two = boxOf();

    ref(one);
    ref(two);

    one.remove();
    two.remove();
    ref(null);

    const observer = latest();

    expect(observer.unobserve).toHaveBeenCalledTimes(2);

    store.destroy();
  });
});

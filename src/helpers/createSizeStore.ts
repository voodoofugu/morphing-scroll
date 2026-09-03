type Store = {
  /** measured size of an object, by its key */
  get: (key: string) => [number, number] | undefined;
  /** how many objects have a size already */
  readonly size: number;
  /** goes up on every change — a dependency that never lies */
  readonly version: number;
  /**
  * a `ref` for this object's box — the same function every time, so React
  * attaches it once instead of on every render
  */
  refFor: (key: string) => (el: Element | null) => void;
  /** the list changed — forget everything that is no longer in it */
  keep: (keys: Set<string>) => void;
  /** everything has to be measured again: the cell size changed under them */
  clear: () => void;
  destroy: () => void;
};

/*
 * Один наблюдатель на скролл, а не по одному на объект.
 *
 * `ResizeObserver` умеет следить за множеством элементов и приносит их
 * пачкой в один вызов; тысяча наблюдателей на тысячу карточек — это тысяча
 * подписок и тысяча срабатываний, ради одного и того же ответа.
 *
 * Измеренное запоминается по ключу ребёнка, а не по элементу: элемент
 * виртуализация выбросит и создаст заново, ключ переживёт и то и другое.
 */
const createSizeStore = (notify: () => void): Store => {
  const sizes = new Map<string, [number, number]>();
  let version = 0;
  const keyOf = new WeakMap<Element, string>();
  const watched = new Map<string, Element>();
  const refs = new Map<string, (el: Element | null) => void>();

  let pending = false;

  /*
   * Ответ приходит по одному элементу, а перекладывать колонки надо один раз
   * на всю пачку: первый кадр меряет сразу многих, и каждый из них двигал бы
   * всех, кто ниже.
   */
  const schedule = () => {
    if (pending) return;
    pending = true;

    queueMicrotask(() => {
      pending = false;
      notify();
    });
  };

  const observer =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver((entries) => {
          let learned = false;

          for (const entry of entries) {
            const key = keyOf.get(entry.target);
            if (key === undefined) continue;

            const box = entry.borderBoxSize?.[0];
            const width = box ? box.inlineSize : entry.contentRect.width;
            const height = box ? box.blockSize : entry.contentRect.height;

            // ноль — это «ещё не разложилось», а не измеренный ноль
            if (!(width > 0) && !(height > 0)) continue;

            const known = sizes.get(key);
            if (known && known[0] === width && known[1] === height) continue;

            sizes.set(key, [width, height]);
            version += 1;
            learned = true;
          }

          if (learned) schedule();
        });

  return {
    get: (key) => sizes.get(key),

    get size() {
      return sizes.size;
    },

    get version() {
      return version;
    },

    /*
     * Следим, пока объект в DOM, а не «до первого замера»: содержимое живое —
     * догрузилась картинка, сменился текст, — и раскладка, посчитанная по
     * старому размеру, разъезжается. Лишних срабатываний это не приносит:
     * `ResizeObserver` молчит, пока размер не менялся, а ответы всё равно
     * собираются в одну пачку.
     *
     * Функция на ключ одна и та же: React снимает и вешает ссылку заново
     * каждый раз, как она поменялась, а это отписка и подписка на каждый
     * рендер — на ровном месте.
     *
     * `null` приходит, когда бокс ушёл из DOM: отпускаем, иначе наблюдатель
     * держал бы ссылку на элемент, которого уже нет.
     */
    refFor: (key) => {
      let ref = refs.get(key);
      if (ref) return ref;

      ref = (el) => {
        if (!observer) return;

        const old = watched.get(key);

        if (!el) {
          if (old) observer.unobserve(old);
          watched.delete(key);

          return;
        }

        if (old === el) return;
        if (old) observer.unobserve(old);

        keyOf.set(el, key);
        watched.set(key, el);
        observer.observe(el);
      };

      refs.set(key, ref);

      return ref;
    },

    keep: (alive) => {
      for (const key of [...sizes.keys()])
        if (!alive.has(key) && sizes.delete(key)) version += 1;

      for (const [key, el] of [...watched])
        if (!alive.has(key)) {
          observer?.unobserve(el);
          watched.delete(key);
        }

      for (const key of [...refs.keys()]) if (!alive.has(key)) refs.delete(key);
    },

    /*
     * Стёрли измеренное — надо и померить заново, а ссылки React заново не
     * дёрнет: они те же самые. Поэтому наблюдение не снимаем, только забываем
     * числа; `ResizeObserver` пришлёт их следующим кадром сам.
     */
    clear: () => {
      if (!sizes.size) return;

      sizes.clear();
      version += 1;

      for (const el of watched.values()) {
        observer?.unobserve(el);
        observer?.observe(el);
      }
    },

    destroy: () => {
      observer?.disconnect();
      sizes.clear();
      watched.clear();
      refs.clear();
    },
  };
};

export default createSizeStore;
export type { Store as SizeStore };

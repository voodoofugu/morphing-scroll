type Store = {
  /** measured size of an object, by its key */
  get: (key: string) => [number, number] | undefined;
  /** how many objects have a size already */
  readonly size: number;
  /** goes up on every change — a dependency that never lies */
  readonly version: number;
  /** watch this box until its size is known, then stop watching it */
  watch: (el: Element | null, key: string) => void;
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

            /*
             * Измерили — отписываемся. Дальше объект живёт по записанному
             * размеру, и его собственные шевеления никого не двигают: иначе
             * картинка, догрузившаяся внутри карточки, перекладывала бы весь
             * столбец на каждом кадре загрузки.
             */
            observer?.unobserve(entry.target);
            watched.delete(key);
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

    watch: (el, key) => {
      if (!el || !observer) return;
      if (sizes.has(key)) return;
      if (watched.get(key) === el) return;

      const old = watched.get(key);
      if (old) observer.unobserve(old);

      keyOf.set(el, key);
      watched.set(key, el);
      observer.observe(el);
    },

    keep: (alive) => {
      for (const key of [...sizes.keys()])
        if (!alive.has(key) && sizes.delete(key)) version += 1;

      for (const [key, el] of [...watched])
        if (!alive.has(key)) {
          observer?.unobserve(el);
          watched.delete(key);
        }
    },

    clear: () => {
      // версия меняется и от снятого наблюдения: перерисовка вернёт его назад
      if (sizes.size || watched.size) version += 1;
      sizes.clear();
      for (const el of watched.values()) observer?.unobserve(el);
      watched.clear();
    },

    destroy: () => {
      observer?.disconnect();
      sizes.clear();
      watched.clear();
    },
  };
};

export default createSizeStore;
export type { Store as SizeStore };

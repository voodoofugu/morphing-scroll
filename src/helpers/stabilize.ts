import React from "react";

// утилита стабилизирующая значения превращая их в хеши из 32-битных чисел
export function stabilize(...args: unknown[]): number[] {
  const cache = new WeakMap<object, number>();

  /*
   * Хеш — это dependency React, поэтому разные формы обязаны иметь свои
   * границы. Без тегов `{ changeDirection: false }`, `[false]` и
   * `false` все давали `3`; effect не видел новый проп и оставлял старый
   * listener. FNV-смешивание здесь нужно не для криптографии, а чтобы
   * каждый уровень добавлял тип, длину, ключи и значения.
   */
  const mix = (hash: number, value: number) =>
    Math.imul(hash ^ value, 0x01000193) >>> 0;
  const textHash = (value: string) => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i++)
      hash = mix(hash, value.charCodeAt(i));
    return hash;
  };
  const tags = {
    number: 0x11,
    bigint: 0x12,
    string: 0x13,
    array: 0x21,
    set: 0x22,
    map: 0x23,
    mapEntry: 0x24,
    object: 0x25,
    react: 0x26,
    cycle: 0x27,
    unknown: 0x28,
  } as const;
  const numberBuffer = new ArrayBuffer(8);
  const numberView = new DataView(numberBuffer);

  const hashValue = (val: unknown): number => {
    if (val === null) return 1;
    if (typeof val === "boolean") return val ? 2 : 3;
    if (typeof val === "undefined") return 4;
    if (typeof val === "function") return 5; // для функций лучше использовать ref паттерн
    if (typeof val === "number") {
      numberView.setFloat64(0, val);
      return mix(
        mix(tags.number, numberView.getUint32(0)),
        numberView.getUint32(4),
      );
    }
    if (typeof val === "bigint") return mix(tags.bigint, textHash(String(val)));
    if (typeof val === "string") return mix(tags.string, textHash(val));

    if (typeof val !== "object") return tags.unknown;

    const known = cache.get(val);
    if (known !== undefined) return known;

    /* Маркер ставим до обхода, чтобы цикличная ссылка не ушла в рекурсию. */
    cache.set(val, tags.cycle);
    const finish = (hash: number) => {
      cache.set(val, hash);
      return hash;
    };

    /*
     * React-элемент хешируем по содержимому, а не по ссылке.
     *
     * Раньше он давал константу, и получалось, что переданный внутрь пропа
     * элемент — иконка стрелки, бегунок — уже никогда не обновлялся: хеш не
     * менялся, memo не пересчитывался, в DOM оставался первый вариант. По
     * ссылке тоже нельзя: элемент, написанный прямо в пропсах, создаётся
     * заново на каждый рендер и сбрасывал бы всю мемоизацию.
     *
     * Обходим только `type`, `key` и `props` — общий обход объекта утащил бы
     * за собой служебные поля React, среди которых есть циклические ссылки.
     */
    if (React.isValidElement(val)) {
      const el = val as React.ReactElement<Record<string, unknown>> & {
        type: unknown;
      };
      const type = el.type;
      const typeHash =
        typeof type === "string"
          ? hashValue(type)
          : hashValue(
              (type as { displayName?: string; name?: string })?.displayName ??
                (type as { name?: string })?.name ??
                "anonymous",
            );

      return finish(
        mix(
          mix(mix(tags.react, typeHash), hashValue(el.key)),
          hashValue(el.props),
        ),
      );
    }

    if (Array.isArray(val)) {
      let hash = mix(tags.array, val.length);
      for (let i = 0; i < val.length; i++) hash = mix(hash, hashValue(val[i]));
      return finish(hash);
    }

    if (val instanceof Set) {
      const arr = Array.from(val)
        .map(hashValue)
        .sort((a, b) => a - b);
      return finish(arr.reduce(mix, mix(tags.set, arr.length)));
    }

    if (val instanceof Map) {
      const arr = Array.from(val.entries())
        .map(([key, value]) =>
          mix(mix(tags.mapEntry, hashValue(key)), hashValue(value)),
        )
        .sort((a, b) => a - b);
      return finish(arr.reduce(mix, mix(tags.map, arr.length)));
    }

    const entries = Object.entries(val as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    let objectHash = mix(tags.object, entries.length);
    for (const [key, value] of entries) {
      objectHash = mix(objectHash, hashValue(key));
      objectHash = mix(objectHash, hashValue(value));
    }

    return finish(objectHash);
  };

  return args.map(hashValue);
}

export default stabilize;

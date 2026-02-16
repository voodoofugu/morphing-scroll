import React from "react";

// утилита стабилизирующая значения превращая их в хеши из 32-битных чисел
export function stabilize(...args: unknown[]): number[] {
  const cache = new WeakMap<object, number>();

  const hashValue = (val: unknown): number => {
    if (val === null) return 1;
    if (typeof val === "boolean") return val ? 2 : 3;
    if (typeof val === "number" || typeof val === "bigint")
      return Number(val) | 0;
    if (typeof val === "string") {
      let h = 0;
      for (let i = 0; i < val.length; i++)
        h = (h * 31 + val.charCodeAt(i)) >>> 0;
      return h;
    }
    if (typeof val === "undefined") return 4;
    if (typeof val === "function") return 5;
    if (React.isValidElement(val)) return 6;

    if (Array.isArray(val)) {
      let h = 0;
      for (let i = 0; i < val.length; i++)
        h = (h * 31 + hashValue(val[i])) >>> 0;
      return h;
    }

    if (val instanceof Set) {
      const arr = Array.from(val)
        .map(hashValue)
        .sort((a, b) => a - b);
      return arr.reduce((acc, v) => (acc * 31 + v) >>> 0, 0);
    }

    if (val instanceof Map) {
      const arr = Array.from(val.entries())
        .map(([k, v]) => (hashValue(k) * 31 + hashValue(v)) >>> 0)
        .sort((a, b) => a - b);
      return arr.reduce((acc, v) => (acc * 31 + v) >>> 0, 0);
    }

    if (typeof val === "object" && val !== null) {
      if (cache.has(val)) return cache.get(val)!;

      const entries = Object.entries(val as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => hashValue(v));
      const objHash = entries.reduce((acc, v) => (acc * 31 + v) >>> 0, 0);
      cache.set(val, objHash);
      return objHash;
    }

    return 7; // unknown type
  };

  return args.map(hashValue);
}

export default stabilize;

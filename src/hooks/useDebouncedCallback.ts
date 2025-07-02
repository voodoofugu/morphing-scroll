import { useEffect, useMemo } from "react";

// Тип для DebouncedFunction с методом cancel

type DebounceMode = number | "requestFrame";

type DebouncedFunction<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: DebounceMode
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (delay === "requestFrame") {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        fn(...args);
        rafId = null;
      });
    } else {
      if (timeout !== null) clearTimeout(timeout);
      timeout = setTimeout(() => {
        fn(...args);
        timeout = null;
      }, delay);
    }
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return debounced;
}

// Hook
export default function useDebouncedCallback<
  T extends (...args: any[]) => void
>(callback: T, delay: DebounceMode): DebouncedFunction<T> {
  const debounced = useMemo(() => debounce(callback, delay), [delay, callback]);

  useEffect(() => {
    return () => {
      debounced.cancel();
    };
  }, [debounced]);

  return debounced;
}

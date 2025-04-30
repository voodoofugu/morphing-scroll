import { useEffect, useMemo } from "react";

// Тип для DebouncedFunction с методом cancel
type DebouncedFunction<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// Хук
export default function useDebouncedCallback<
  T extends (...args: any[]) => void
>(callback: T, delay: number): DebouncedFunction<T> {
  const debounced = useMemo(
    () => debounce(((...args) => callback(...args)) as T, delay),
    [delay]
  );

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      debounced.cancel();
    };
  }, [debounced]);

  return debounced;
}

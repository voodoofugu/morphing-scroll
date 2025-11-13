// useDebouncedCallback.ts
import { useRef, useCallback, useEffect } from "react";
import { setTask, cancelTask, cancelAllTasks } from "../helpers/taskManager";

type DebounceMode = number | "requestFrame";
type DebouncedFunction<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & { cancel: () => void };

// Генератор уникальных ID для дебаунса
let autoIdCounter = 0;
const generateId = () => `deb_${autoIdCounter++}`;

function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: DebounceMode,
  id?: string
): DebouncedFunction<T> {
  const localIdRef = useRef(id || generateId());

  const debounced = useCallback(
    ((...args: Parameters<T>) => {
      const currentId = localIdRef.current;

      cancelTask(currentId);
      setTask(() => callback(...args), delay, currentId);
    }) as DebouncedFunction<T>,
    [callback, delay]
  );

  debounced.cancel = () => {
    const currentId = localIdRef.current;
    cancelTask(currentId);
  };

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => debounced.cancel();
  }, [debounced]);

  return debounced;
}

export default useDebouncedCallback;

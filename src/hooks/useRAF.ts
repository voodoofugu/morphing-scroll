import { useRef, useCallback, useEffect } from "react";

// для по-кадрового вызова
function useRAF() {
  const rafRef = useRef<number | null>(null);

  const scheduleRAF = useCallback((fn?: () => void) => {
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      fn?.();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return scheduleRAF;
}

export default useRAF;

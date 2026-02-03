import { useRef, useCallback, useState, useEffect } from "react";

import useUpdate from "./useUpdate";

// hook для точного покадрового вызова обновлений
function useScheduleUpdate(updateFn?: () => void, force = true) {
  // ref
  const rafRef = useRef<number | null>(null);

  // hook
  const forceUpdate = useUpdate();

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateFn?.();
      force && forceUpdate();
    });
  }, [updateFn]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return scheduleUpdate;
}

export default useScheduleUpdate;

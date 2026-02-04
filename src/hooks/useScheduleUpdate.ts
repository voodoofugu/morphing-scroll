import { useRef, useCallback, useEffect } from "react";

import useUpdate from "./useUpdate";

// hook для точного покадрового вызова обновлений
function useScheduleUpdate(args?: { fn?: () => void; reRender?: boolean }) {
  // - ref -
  const rafRef = useRef<number | null>(null);

  // - hook -
  const forceUpdate = useUpdate();

  // - vars -
  const scheduleUpdate = useCallback(() => {
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      args?.fn?.();
      args?.reRender && forceUpdate();
    });
  }, [args?.fn, args?.reRender, forceUpdate]);

  // - effects -
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // - return -
  return scheduleUpdate;
}

export default useScheduleUpdate;

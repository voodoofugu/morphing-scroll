import { useRef } from "react";

/**
 * A value built once per component instance.
 *
 * `useMemo` will not do: React is free to drop its cache and build the value
 * again. What lives here is the scroll's runtime — the rAF schedulers, the
 * task manager, the state of a gesture — and it has to survive every
 * re-render.
 */
function useConst<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);

  if (ref.current === null) ref.current = factory();

  return ref.current;
}

export default useConst;

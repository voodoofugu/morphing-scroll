import { useRef } from "react";

/**
 * Значение, создаваемое один раз на инстанс компонента.
 *
 * `useMemo` для этого не годится: React вправе выбросить его кеш и пересоздать
 * значение. Здесь же речь о рантайме скролла — планировщиках rAF, менеджере
 * задач, состоянии жеста, — который обязан пережить любой ре-рендер.
 */
function useConst<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);

  if (ref.current === null) ref.current = factory();

  return ref.current;
}

export default useConst;

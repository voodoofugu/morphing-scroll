import React from "react";

/**
 * A callback that never changes identity, and always calls the latest one it
 * was given.
 *
 * Props written straight into JSX are a new function on every render. Anything
 * that keeps such a function alive — a `ResizeObserver`, an
 * `IntersectionObserver`, a listener — would be torn down and rebuilt every
 * time the parent renders, which is exactly when the callback is written that
 * way. Holding it in a ref decouples the two: the subscription outlives the
 * render, the behaviour does not go stale.
 */
function useEvent<Args extends unknown[], Result>(
  fn: ((...args: Args) => Result) | undefined,
): (...args: Args) => Result | undefined {
  const ref = React.useRef(fn);

  /*
   * Обновляем после коммита, а не в теле: в теле это побочный эффект фазы
   * рендера, и React вправе такой рендер выбросить — тогда в ссылке осталась
   * бы функция из дерева, которого нет.
   */
  React.useLayoutEffect(() => {
    ref.current = fn;
  });

  return React.useCallback((...args: Args) => ref.current?.(...args), []);
}

export default useEvent;

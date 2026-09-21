import React from "react";

/** та же граница, на которой раскладка дашборда меняется в `dashboard.css` */
const WIDE = "(min-width: 1081px)";

/**
 * Широкая раскладка: панель слева, стенд справа, обе колонки во всю высоту
 * окна. Узкая ставит их друг под друга, и высота у страницы становится
 * своя — от этого зависит, кому прокручиваться.
 */
function useWideLayout() {
  const [wide, setWide] = React.useState(() => window.matchMedia(WIDE).matches);

  React.useEffect(() => {
    const query = window.matchMedia(WIDE);
    const onChange = () => setWide(query.matches);

    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return wide;
}

export default useWideLayout;

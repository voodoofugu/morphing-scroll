import React from "react";

import ChromeScroll from "../shell/ChromeScroll";
import useWideLayout from "../shell/useWideLayout";

/**
 * Колонка настроек.
 *
 * Пока она стоит слева отдельной колонкой, высота у неё своя — и едет она
 * сама. В узком окне колонки нет: панель ложится в поток над стендом, и
 * страницу целиком везёт браузер, как обычную, — своя прокрутка внутри
 * только отняла бы у панели высоту.
 */
function ControlPanel({ children }: { children: React.ReactNode }) {
  const wide = useWideLayout();

  if (!wide) return <aside className="control-panel">{children}</aside>;

  /*
   * Всё содержимое панели — один объект для прокрутки: разделов много, но
   * везёт она их вместе, и считать каждый отдельно ей незачем.
   */
  return (
    <ChromeScroll className="control-panel is-scrolled" wrapper={{ margin: 14 }}>
      <div className="panel-body">{children}</div>
    </ChromeScroll>
  );
}

export default ControlPanel;

import React from "react";

import Prism from "prismjs";
import "prismjs/components/prism-jsx";

/**
 * Подсветка для двух языков панели.
 *
 * Prism сам экранирует текст, который разбирает, поэтому размеченную строку
 * можно отдавать как есть: в неё попадает только то, что стенд сгенерировал.
 * Цвета берутся из токенов темы — см. `.token` в `dashboard.css`.
 */
function Code({ code, lang }: { code: string; lang: "css" | "jsx" }) {
  const html = React.useMemo(
    () => Prism.highlight(code, Prism.languages[lang], lang),
    [code, lang],
  );

  return (
    <code
      className={`language-${lang}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default Code;

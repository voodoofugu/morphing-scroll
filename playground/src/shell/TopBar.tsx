import React from "react";

import logo from "@morphing-scroll/src/assets/morphing-scroll.svg";

import type { Theme } from "../dashboard/settings";

/**
 * Общая шапка документации и дашборда: одно меню на обе страницы, чтобы из
 * любой можно было уйти в другую. Адреса относительные — документация лежит
 * на `/docs/`, дашборд в корне.
 */
const themes = ["system", "light", "dark"] as const;

/** один и тот же рассказ о библиотеке, на двух языках */
const article = {
  en: "https://dev.to/voodoofugu/the-story-of-morphing-scroll-my-npm-library-1agb",
  ru: "https://habr.com/ru/articles/1084664/",
};

/**
 * Статья одной кнопкой: языки прячутся под ней, а не занимают два места в
 * меню. Закрывается сама — нажатием мимо и клавишей Esc, как и положено
 * всплывающему.
 */
function ArticleMenu() {
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="top-article" ref={box}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((shown) => !shown)}
        type="button"
      >
        article
      </button>

      {open && (
        <div className="top-article-menu" role="menu">
          <a href={article.en} hrefLang="en" role="menuitem">
            en
          </a>
          <a href={article.ru} hrefLang="ru" role="menuitem">
            ru
          </a>
        </div>
      )}
    </div>
  );
}

function TopBar({
  page,
  theme,
  onTheme,
}: {
  page: "docs" | "playground";
  theme: Theme;
  onTheme: (theme: Theme) => void;
}) {
  const here = page === "docs";

  return (
    <header className="top-bar">
      <a className="top-brand" href={here ? "#/" : "#"}>
        {/* знак красим сами: форму берём маской, цвет — из темы */}
        <span
          className="top-mark"
          style={{ "--mark": `url("${logo}")` } as React.CSSProperties}
        />
        morphing-scroll
      </a>

      <nav className="top-links">
        <a aria-current={here ? "page" : undefined} href={here ? "#/" : "docs/"}>
          docs
        </a>
        <a aria-current={here ? undefined : "page"} href={here ? "../" : "#"}>
          playground
        </a>
        <a href="https://www.npmjs.com/package/morphing-scroll">npm</a>
        <a href="https://github.com/voodoofugu/morphing-scroll">github</a>
        <ArticleMenu />
      </nav>

      <div className="top-theme">
        {themes.map((name) => (
          <button
            aria-pressed={theme === name}
            key={name}
            onClick={() => onTheme(name)}
            type="button"
          >
            {name}
          </button>
        ))}
      </div>
    </header>
  );
}

export default TopBar;

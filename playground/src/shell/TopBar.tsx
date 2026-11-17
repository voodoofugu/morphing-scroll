import React from "react";

import logo from "@morphing-scroll/src/assets/morphing-scroll.svg";
import packageInfo from "../../../package.json";

import type { Theme } from "../dashboard/settings";

/**
 * Общая шапка документации и дашборда: одно меню на обе страницы, чтобы из
 * любой можно было уйти в другую. Адреса относительные: документация лежит в
 * корне сайта, дашборд — в `/playground/`.
 */
const themes = ["system", "light", "dark"] as const;

/** Сегментированный выбор темы поддерживает клик, клавиатуру и перетаскивание. */
function ThemeControl({
  theme,
  onTheme,
}: {
  theme: Theme;
  onTheme: (theme: Theme) => void;
}) {
  const control = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const selectAt = (clientX: number) => {
    const bounds = control.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;

    const offset = Math.max(
      0,
      Math.min(bounds.width - 1, clientX - bounds.left),
    );
    const index = Math.min(
      themes.length - 1,
      Math.floor(offset / (bounds.width / themes.length)),
    );
    onTheme(themes[index]);
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  return (
    <div
      aria-label="Color theme"
      className="top-theme"
      data-dragging={dragging || undefined}
      onLostPointerCapture={() => setDragging(false)}
      onPointerCancel={stopDragging}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        selectAt(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging) selectAt(event.clientX);
      }}
      onPointerUp={stopDragging}
      ref={control}
    >
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
      <div className="top-bar-inner">
        <a className="top-brand" href={here ? "#/" : "../"}>
          {/* знак красим сами: форму берём маской, цвет — из темы */}
          <span
            className="top-mark"
            style={{ "--mark": `url("${logo}")` } as React.CSSProperties}
          />
          <span>morphing-scroll</span>
          <span className="top-version">v{packageInfo.version}</span>
        </a>

        <nav className="top-links">
          <a aria-current={here ? "page" : undefined} href={here ? "#/" : "../"}>
            docs
          </a>
          <a
            aria-current={here ? undefined : "page"}
            href={here ? "playground/" : "#"}
          >
            playground
          </a>
        </nav>

        <ThemeControl onTheme={onTheme} theme={theme} />
      </div>
    </header>
  );
}

export default TopBar;

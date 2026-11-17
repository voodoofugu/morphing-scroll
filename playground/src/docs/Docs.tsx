import React from "react";

import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";

import type {
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
} from "@morphing-scroll/src/types/types";
import docs from "virtual:ms-docs";
import readme from "virtual:ms-readme";
import type { ReadmeNode } from "virtual:ms-readme";

import { STORAGE_KEY } from "../dashboard/settings";
import type { Theme } from "../dashboard/settings";
import ChromeScroll from "../shell/ChromeScroll";
import TopBar from "../shell/TopBar";
import { liveDemos } from "./demos";
import { splitExampleHtml } from "./splitExampleHtml";

/*
 * Документация — это README, показанный удобнее: текст разделов приходит из
 * него готовым HTML (`plugins/readme.ts`), здесь только навигация, поиск и
 * живые примеры. Примеры собраны по пути пропса в `demos.tsx` и заменяют
 * статический код и баннер внутри раздела Example; README при этом остаётся
 * самодостаточным на GitHub.
 *
 * Прокрутки на странице — свои: библиотека о них и рассказывает, так что и
 * дерево слева, и текст справа едут на `MorphScroll`.
 */
const demoOf = (node: ReadmeNode) =>
  node.component === "MorphScroll" ? liveDemos[node.path] : undefined;

const hrefOf = (node: ReadmeNode) =>
  node.kind === "component"
    ? `#/${node.name}`
    : `#/${node.component}/${node.path}`;

/** все разделы по адресу: компоненты, их пропсы и параметры */
const byHref = new Map<string, ReadmeNode>();
const allProps: ReadmeNode[] = [];
const index = (node: ReadmeNode) => {
  byHref.set(hrefOf(node), node);
  if (node.kind === "prop") allProps.push(node);
  node.children.forEach(index);
};
readme.api.forEach(index);

/** цепочка от компонента до раздела — для хлебных крошек */
const trail = (node: ReadmeNode) => {
  const parts = node.path ? node.path.split(".") : [];
  const chain = [byHref.get(`#/${node.component}`)!];
  parts.forEach((_, depth) => {
    const found = byHref.get(
      `#/${node.component}/${parts.slice(0, depth + 1).join(".")}`,
    );
    if (found) chain.push(found);
  });
  return chain;
};

const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Одна строка для карточки: у компонента — его подпись, у пропса MorphScroll —
 * подсказка из типов, у остальных — начало описания из README. На самой
 * странице пропса её нет: там читают полный текст.
 */
const leadOf = (node: ReadmeNode) => {
  if (node.kind === "component") return node.note;
  if (node.component === "MorphScroll" && docs[node.path])
    return docs[node.path].text;

  const text = plain(node.body);
  const start = text.indexOf("Description:");
  const from = start === -1 ? text : text.slice(start + "Description:".length);
  const sentence = from.trim().match(/^[^.]*[.]?/)?.[0] ?? "";
  return sentence.length > 140 ? `${sentence.slice(0, 139)}…` : sentence;
};

/** `код` в коротких строках карточек */
const inline = (text: string) =>
  text
    .split(/(`[^`]+`)/)
    .map((part, key) =>
      part.startsWith("`") ? <code key={key}>{part.slice(1, -1)}</code> : part,
    );

function useRoute() {
  const [hash, setHash] = React.useState(() => window.location.hash || "#/");

  React.useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return hash;
}

/** тему выбирают здесь же, а хранится она там же, где у дашборда */
function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "{}",
      ).theme;
      return stored === "light" || stored === "dark" ? stored : "system";
    } catch {
      return "system";
    }
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, theme }));
    } catch {
      // нет доступа к хранилищу — выбор живёт до перезагрузки
    }
  }, [theme]);

  return [theme, setTheme] as const;
}

/** HTML раздела из README, с подсветкой кода */
function Body({ html }: { html: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) Prism.highlightAllUnder(ref.current);
  }, [html]);

  return (
    <div
      className="doc-body"
      dangerouslySetInnerHTML={{ __html: html }}
      ref={ref}
    />
  );
}

function Cards({ nodes }: { nodes: ReadmeNode[] }) {
  return (
    <div className="doc-cards">
      {nodes.map((node) => (
        <a className="doc-card" href={hrefOf(node)} key={hrefOf(node)}>
          <span className="doc-card-name">
            {node.name}
            {demoOf(node) && <span className="doc-live">live</span>}
          </span>
          <span className="doc-card-lead">{inline(leadOf(node))}</span>
        </a>
      ))}
    </div>
  );
}

/** пропсы по группам README: GENERAL, SCROLL, LAYOUT… */
function Groups({ nodes }: { nodes: ReadmeNode[] }) {
  const groups = nodes.reduce<Array<[string, ReadmeNode[]]>>((list, node) => {
    const last = list[list.length - 1];
    if (last && last[0] === node.group) last[1].push(node);
    else list.push([node.group, [node]]);
    return list;
  }, []);

  return (
    <>
      {groups.map(([group, members]) => (
        <section className="doc-group" key={group || "props"}>
          <h2>{group ? group.toLowerCase() : "props"}</h2>
          <Cards nodes={members} />
        </section>
      ))}
    </>
  );
}

function Overview() {
  return (
    <article className="doc-page">
      <h1 className="doc-title">morphing-scroll</h1>
      <p className="doc-lead">
        A React scroll you can make look like anything — and turn into a slider,
        a menu or a virtualised list.
      </p>
      <Cards nodes={readme.api} />
      {readme.sections.map((section) => (
        <section className="doc-group" key={section.title}>
          <h2>{section.title.toLowerCase()}</h2>
          <Body html={section.body} />
        </section>
      ))}
    </article>
  );
}

function Page({ node }: { node: ReadmeNode }) {
  const Demo = demoOf(node);
  const example = Demo ? splitExampleHtml(node.body) : null;
  const chain = trail(node);

  return (
    <article className="doc-page">
      <nav aria-label="breadcrumbs" className="doc-crumbs">
        <a href="#/">docs</a>
        {chain.slice(0, -1).map((step) => (
          <React.Fragment key={hrefOf(step)}>
            <span aria-hidden="true">›</span>
            <a href={hrefOf(step)}>{step.name}</a>
          </React.Fragment>
        ))}
      </nav>

      <h1 className="doc-title">
        {node.name}
        {node.note && node.kind === "prop" && (
          <span className="doc-badge">{node.note}</span>
        )}
      </h1>
      {node.kind === "component" && node.note && (
        <p className="doc-lead">{node.note}</p>
      )}

      <Body html={example?.before ?? node.body} />

      {Demo && example && (
        <section className="doc-example">
          <p className="doc-example-title">
            <b>Example:</b>
          </p>
          <div aria-label="live example" className="doc-demo">
            <Demo />
          </div>
        </section>
      )}

      {example?.after && <Body html={example.after} />}

      {node.kind === "component" ? (
        <Groups nodes={node.children} />
      ) : (
        node.children.length > 0 && (
          <section className="doc-group">
            <h2>parameters</h2>
            <Cards nodes={node.children} />
          </section>
        )
      )}
    </article>
  );
}

function Tree({
  nodes,
  current,
  expanded,
  onToggle,
}: {
  nodes: ReadmeNode[];
  current: string;
  expanded: ReadonlyMap<string, boolean>;
  onToggle: (href: string, open: boolean) => void;
}) {
  return (
    <ul>
      {nodes.map((node) => {
        const href = hrefOf(node);
        /*
         * Мы на этой ветке, если читаем её саму или что-то внутри неё. Ветка
         * с открытым вложенным параметром тоже помечена, но иначе: `page` —
         * это сама страница, `true` — «вы здесь, но глубже». Пустого значения
         * у `aria-current` в ARIA нет, из токенов это ближайший.
         */
        const inside =
          current.startsWith(`${href}.`) || current.startsWith(`${href}/`);
        const hasChildren = node.children.length > 0;
        const routeOpen = current === href || inside;
        const open = hasChildren && (expanded.get(href) ?? routeOpen);
        const isCurrent = current === href;

        return (
          <li key={href}>
            <div
              className={`docs-tree-row${hasChildren ? " has-children" : ""}${inside ? " is-ancestor" : ""}${isCurrent ? " is-current" : ""}`}
            >
              <span className="docs-tree-link">
                <a
                  aria-current={isCurrent ? "page" : inside || undefined}
                  href={href}
                >
                  {node.name}
                </a>
              </span>
              {hasChildren && (
                <button
                  aria-expanded={open}
                  aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`}
                  className="docs-tree-toggle"
                  onClick={() => onToggle(href, open)}
                  type="button"
                />
              )}
            </div>
            {hasChildren && (
              <div
                aria-hidden={!open}
                className="docs-tree-branch"
                data-open={open || undefined}
                ref={(node) => {
                  if (!node) return
                  if (open) node.removeAttribute('inert')
                  else node.setAttribute('inert', '')
                }}
              >
                <div>
                  <Tree
                    current={current}
                    expanded={expanded}
                    nodes={node.children}
                    onToggle={onToggle}
                  />
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Footer({
  elementRef,
}: {
  elementRef: React.Ref<HTMLElement>;
}) {
  return (
    <footer className="site-footer" ref={elementRef}>
      <div className="site-footer-inner">
        <div>
          <span>© {new Date().getFullYear()} voodoofugu</span>
        </div>
        <nav aria-label="Project links">
          <a href="https://www.npmjs.com/package/morphing-scroll">npm</a>
          <a href="https://github.com/voodoofugu/morphing-scroll">github</a>
          <a href="https://dev.to/voodoofugu/the-story-of-morphing-scroll-my-npm-library-1agb">article · en</a>
          <a href="https://habr.com/ru/articles/1084664/">article · ru</a>
          <a href="https://resume.voodoofugu.com/?lang=ru">author</a>
        </nav>
      </div>
    </footer>
  );
}

function Docs() {
  const route = useRoute();
  const [theme, setTheme] = useTheme();
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<Map<string, boolean>>(
    () => new Map(),
  );
  const page = React.useRef<MorphScrollHandle>(null);
  const navigation = React.useRef<HTMLElement>(null);
  const footer = React.useRef<HTMLElement>(null);
  const shell = React.useRef<HTMLDivElement>(null);
  const keepNavigationStill = React.useCallback<
    NonNullable<MorphScrollProps["onScrollPosition"]>
  >((_left, top, _max, overscroll) => {
    navigation.current?.style.setProperty(
      "--docs-scroll-offset",
      `${top - overscroll.y}px`,
    );
    if (navigation.current && footer.current && shell.current) {
      const headerHeight =
        Number.parseFloat(
          getComputedStyle(shell.current).getPropertyValue("--top-bar-height"),
        ) || 59;
      const navigationTop = headerHeight + 24;
      const availableHeight = Math.max(
        0,
        footer.current.getBoundingClientRect().top - navigationTop,
      );
      navigation.current.style.setProperty(
        "--docs-nav-available",
        `${availableHeight}px`,
      );
    }
    shell.current?.toggleAttribute("data-scrolled", top > 8);
  }, []);

  // новый раздел читают с начала
  React.useEffect(() => {
    page.current?.scrollTo(0, { duration: 0 });
    setExpanded(new Map());
  }, [route]);

  const node = byHref.get(route);
  const found = query.trim()
    ? allProps.filter((prop) =>
        `${prop.component} ${prop.path}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : null;
  const toggle = (href: string, open: boolean) => {
    setExpanded((current) => {
      const next = new Map(current);
      next.set(href, !open);
      return next;
    });
  };

  return (
    <div className="docs" ref={shell}>
      <TopBar onTheme={setTheme} page="docs" theme={theme} />

      <div className="docs-shell">
        <main className="docs-main">
          <ChromeScroll
            controls={{ keys: true }}
            onScrollPosition={keepNavigationStill}
            ref={page}
          >
            <div className="docs-content">
              <div className="docs-body">
                <aside className="docs-nav" ref={navigation}>
          <input
            aria-label="search props"
            className="docs-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search props"
            type="search"
            value={query}
          />

          <div className="docs-nav-scroll">
            <ChromeScroll
              controls={{ keys: true, bar: { trackGap: -4 } }}
              wrapper={{ margin: [1, 14, 0, 1] }}
            >
              {found ? (
                <ul className="docs-found">
                  {found.map((prop) => (
                    <li key={hrefOf(prop)}>
                      <a href={hrefOf(prop)} onClick={() => setQuery("")}>
                        {prop.path}
                        <small>{prop.component}</small>
                      </a>
                    </li>
                  ))}
                  {found.length === 0 && (
                    <li className="docs-none">nothing found</li>
                  )}
                </ul>
              ) : (
                <nav aria-label="contents" className="docs-tree">
                  <div className={`docs-tree-row${route === "#/" ? " is-current" : ""}`}>
                    <span className="docs-tree-link">
                      <a
                        aria-current={route === "#/" ? "page" : undefined}
                        href="#/"
                      >
                        overview
                      </a>
                    </span>
                  </div>
                  <Tree
                    current={route}
                    expanded={expanded}
                    nodes={readme.api}
                    onToggle={toggle}
                  />
                </nav>
              )}
            </ChromeScroll>
          </div>
                </aside>
              <div className="docs-page-slot">
                {node ? <Page node={node} /> : <Overview />}
              </div>
              </div>
              <Footer elementRef={footer} />
            </div>
          </ChromeScroll>
        </main>
      </div>
    </div>
  );
}

export default Docs;

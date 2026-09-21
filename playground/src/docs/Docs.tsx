import React from "react";

import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";

import type { MorphScrollHandle } from "@morphing-scroll/src/types/types";
import docs from "virtual:ms-docs";
import readme from "virtual:ms-readme";
import type { ReadmeNode } from "virtual:ms-readme";

import { STORAGE_KEY } from "../dashboard/settings";
import type { Theme } from "../dashboard/settings";
import ChromeScroll from "../shell/ChromeScroll";
import TopBar from "../shell/TopBar";

/*
 * Документация — это README, показанный удобнее: текст разделов приходит из
 * него готовым HTML (`plugins/readme.ts`), здесь только навигация, поиск и
 * живые примеры. Пример лежит в `demos/` под путём пропса и встаёт на место
 * картинки из README; нет примера — остаётся картинка.
 *
 * Прокрутки на странице — свои: библиотека о них и рассказывает, так что и
 * дерево слева, и текст справа едут на `MorphScroll`.
 */
const demos = import.meta.glob<{ default: React.ComponentType }>(
  "./demos/*.tsx",
  { eager: true },
);

const demoOf = (node: ReadmeNode) =>
  node.component === "MorphScroll"
    ? demos[`./demos/${node.path}.tsx`]?.default
    : undefined;

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
function Body({ html, hideBanners }: { html: string; hideBanners?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) Prism.highlightAllUnder(ref.current);
  }, [html]);

  return (
    <div
      className={`doc-body${hideBanners ? " has-demo" : ""}`}
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

      {Demo && (
        <section aria-label="live example" className="doc-demo">
          <Demo />
        </section>
      )}

      <Body hideBanners={!!Demo} html={node.body} />

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

function Tree({ nodes, current }: { nodes: ReadmeNode[]; current: string }) {
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
        const open = node.kind === "component" || current === href || inside;

        return (
          <li key={href}>
            <a
              aria-current={current === href ? "page" : inside || undefined}
              href={href}
            >
              {node.name}
            </a>
            {open && node.children.length > 0 && (
              <Tree current={current} nodes={node.children} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Docs() {
  const route = useRoute();
  const [theme, setTheme] = useTheme();
  const [query, setQuery] = React.useState("");
  const page = React.useRef<MorphScrollHandle>(null);

  // новый раздел читают с начала
  React.useEffect(() => {
    page.current?.scrollTo(0, { duration: 0 });
  }, [route]);

  const node = byHref.get(route);
  const found = query.trim()
    ? allProps.filter((prop) =>
        `${prop.component} ${prop.path}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : null;

  return (
    <div className="docs">
      <TopBar onTheme={setTheme} page="docs" theme={theme} />

      <div className="docs-shell">
        <aside className="docs-nav">
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
              wrapper={{ margin: [0, 14, 0, 0] }}
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
                  <a
                    aria-current={route === "#/" ? "page" : undefined}
                    href="#/"
                  >
                    overview
                  </a>
                  <Tree current={route} nodes={readme.api} />
                </nav>
              )}
            </ChromeScroll>
          </div>
        </aside>

        <main className="docs-main">
          <ChromeScroll
            controls={{ keys: true }}
            ref={page}
            wrapper={{ margin: [24, 18, 96, 0] }}
          >
            {node ? <Page node={node} /> : <Overview />}
          </ChromeScroll>
        </main>
      </div>
    </div>
  );
}

export default Docs;

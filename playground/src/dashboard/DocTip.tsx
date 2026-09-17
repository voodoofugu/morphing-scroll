import React from "react";

import docs from "virtual:ms-docs";

/**
 * Подсказки берутся из JSDoc самих типов — то же описание, что видно в
 * редакторе. Плашка на странице одна: имена пропсов помечены `data-doc`, а
 * что показать, решает один слушатель на документе.
 */
const OPEN_DELAY = 400;
/** подсказка уже открыта — соседнее имя показывает своё почти сразу */
const SWITCH_DELAY = 90;
const CLOSE_DELAY = 120;
/** отступ плашки от имени и от краёв окна */
const GAP = 8;

const TIP_ID = "doc-tip";

/** путь до описания собирается по дороге: `controls` → `bar` → `edgeGap` */
export const DocPathContext = React.createContext("");

export function useDocPath(name: string) {
  const parent = React.useContext(DocPathContext);
  if (!name) return undefined;

  const path = parent ? `${parent}.${name}` : name;
  return docs[path] ? path : undefined;
}

/** имя параметра: с описанием — подчёркнутое и всплывающее, без — просто текст */
export function DocLabel({ name }: { name: string }) {
  const path = useDocPath(name);

  return (
    <span className={path ? "doc-trigger" : undefined} data-doc={path}>
      {name}
    </span>
  );
}

/** `код` и **жирное** из JSDoc — разметка там markdown */
const inline = (text: string) =>
  text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, index) => {
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**")) return <b key={index}>{part.slice(2, -2)}</b>;
    return part;
  });

export default function DocTips() {
  const [shown, setShown] = React.useState<{
    key: string;
    rect: DOMRect;
  } | null>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef(0);
  const trigger = React.useRef<Element | null>(null);

  React.useEffect(() => {
    const stop = () => window.clearTimeout(timer.current);
    const later = (run: () => void, delay: number) => {
      stop();
      timer.current = window.setTimeout(run, delay);
    };

    const hide = () => {
      stop();
      trigger.current?.removeAttribute("aria-describedby");
      trigger.current = null;
      setShown(null);
    };

    const show = (node: Element, delay: number) => {
      const key = node.getAttribute("data-doc");
      if (!key || !docs[key]) return;

      later(() => {
        trigger.current?.removeAttribute("aria-describedby");
        node.setAttribute("aria-describedby", TIP_ID);
        trigger.current = node;
        setShown({ key, rect: node.getBoundingClientRect() });
      }, delay);
    };

    const target = (event: Event) =>
      (event.target as HTMLElement | null)?.closest?.("[data-doc]") ?? null;

    const onOver = (event: PointerEvent) => {
      // пальцем плашку не поймать, да и незачем: нажатие раскрывает карточку
      if (event.pointerType !== "mouse") return;

      const node = target(event);
      if (node === trigger.current) return stop();
      if (!node) return later(hide, CLOSE_DELAY);

      show(node, trigger.current ? SWITCH_DELAY : OPEN_DELAY);
    };

    const onFocus = (event: FocusEvent) => {
      const node = target(event);
      // нажатие мышью фокус тоже даёт, но подсказку тогда никто не просил
      if (node?.matches(":focus-visible")) show(node, 0);
      else hide();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };

    // прокрутка уводит имя из-под плашки; ту, что ещё не показалась, не трогаем
    const onScroll = () => {
      if (trigger.current) hide();
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", hide);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", hide);

    return () => {
      stop();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  React.useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;

    // верхний слой: панель настроек прокручивается и обрезала бы плашку
    const popover = typeof tip.showPopover === "function";

    if (!shown) {
      if (popover) {
        try {
          tip.hidePopover();
        } catch {
          // плашка и так закрыта
        }
      } else tip.hidden = true;
      return;
    }

    if (popover) {
      try {
        tip.showPopover();
      } catch {
        // плашка и так открыта
      }
    } else tip.hidden = false;

    // размеры знает только открытая плашка, поэтому место считаем после показа
    const box = tip.getBoundingClientRect();
    const under = shown.rect.bottom + GAP;
    const over = shown.rect.top - GAP - box.height;

    const top =
      under + box.height <= window.innerHeight - GAP
        ? under
        : over >= GAP
          ? over
          : Math.max(GAP, window.innerHeight - GAP - box.height);

    const left = Math.max(
      GAP,
      Math.min(shown.rect.left, window.innerWidth - GAP - box.width),
    );

    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  }, [shown]);

  const doc = shown ? docs[shown.key] : undefined;

  return (
    <div className="doc-tip" id={TIP_ID} popover="manual" ref={tipRef} role="tooltip">
      {shown && doc && (
        <>
          <b className="doc-tip-path">{shown.key}</b>
          <p>{inline(doc.text)}</p>
          {doc.default && (
            <p className="doc-tip-default">default: {inline(doc.default)}</p>
          )}
        </>
      )}
    </div>
  );
}

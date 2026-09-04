import React from "react";
import { createRoot } from "react-dom/client";
import { MorphScroll } from "@morphing-scroll/src";
import type {
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
} from "@morphing-scroll/src/types/types";

/**
 * Minimal, deterministic fixtures for Playwright. Scenario is picked from the
 * `?scenario=` query param. Each renders MorphScroll with a fixed size so the
 * layout math is predictable; real browser physics (wheel/drag/arrows/snap)
 * is what these exercise — things jsdom can't do.
 */

const COUNT = 20;
const OBJ = 100;

const makeItems = () =>
  Array.from({ length: COUNT }, (_, i) => (
    <div key={`item-${i}`} className="box" data-testid={`item-${i}`}>
      item {i}
    </div>
  ));

const thumb = <div className="thumb" />;

// Expose the latest scroll offsets for assertions.
const onScrollPosition = (left: number, top: number) => {
  (window as any).__scroll = { left, top };
  // весь путь, а не только его конец: по нему видно, ехали мы или перескочили
  ((window as any).__trail ??= []).push(top);
};

// Every page change, in order, so the reason can be asserted.
const onNavigate = (event: unknown) => {
  const log = ((window as any).__navigate ??= []);
  log.push(event);
};

const scenarios: Record<string, React.ReactElement> = {
  wheel: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  arrows: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      controls={{
        arrows: { element: <div className="arrow" />, size: 40 },
      }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  /*
   * Одна колонка — чтобы страниц хватило на серию нажатий: в три ряда
   * содержимое кончается на второй странице, и считать было бы нечего.
   */
  arrowsBurst: (
    <MorphScroll objects={{ size: OBJ, crossCount: 1 }}
      size={300}
      controls={{
        arrows: { element: <div className="arrow" />, size: 40 },
      }}
      onScrollPosition={onScrollPosition}
      onNavigate={onNavigate}
    >
      {makeItems()}
    </MorphScroll>
  ),

  /*
   * Стрелки забрали место под себя, и содержимое ровно во внешний размер:
   * листать есть куда — окно уже, — но только если считать по окну.
   */
  arrowsReserved: (
    <MorphScroll
      objects={{ size: [40, 60] }}
      size={[120, 60]}
      direction="x"
      mode="slider"
      render="virtual"
      controls={{
        arrows: {
          element: <div className="arrow" />,
          reserveSpace: true,
          loop: true,
        },
      }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems().slice(0, 3)}
    </MorphScroll>
  ),

  thumb: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  contentDrag: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      controls={{ drag: true }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  virtual: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      render="virtual"
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  lazy: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      render="lazy"
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  keys: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      controls={{ keys: { mode: "pan", step: 60 }, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  keysStep: (
    <MorphScroll objects={{ size: 300 }}
      size={300}
      mode="slider"
      controls={{ keys: true, bar: <div className="dot" /> }}
      onScrollPosition={onScrollPosition}
      onNavigate={onNavigate}
    >
      {makeItems()}
    </MorphScroll>
  ),

  sliderMenu: (
    <MorphScroll objects={{ size: 300 }}
      size={300}
      mode="sliderMenu"
      controls={{ wheel: true, bar: <div className="dot" /> }}
      onScrollPosition={onScrollPosition}
      onNavigate={onNavigate}
    >
      {makeItems()}
    </MorphScroll>
  ),

  initialPosNumber: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      initialPosition={200}
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),

  stickToEnd: (
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      stickToEnd
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  ),
};

// hybrid grid (4 wide) that overflows on both axes.
const hybridItems = () =>
  Array.from({ length: 20 }, (_, i) => (
    <div key={`item-${i}`} className="box" data-testid={`item-${i}`}>
      item {i}
    </div>
  ));

scenarios.hybridWheel = (
  <MorphScroll objects={{ size: OBJ, crossCount: 4 }}
    size={300}
    direction="hybrid"
    controls={{ wheel: true, bar: thumb }}
    onScrollPosition={onScrollPosition}
  >
    {hybridItems()}
  </MorphScroll>
);

scenarios.hybridChangeDir = (
  <MorphScroll objects={{ size: OBJ, crossCount: 4 }}
    size={300}
    direction="hybrid"
    controls={{
      wheel: { changeDirection: true },
      bar: thumb,
    }}
    onScrollPosition={onScrollPosition}
  >
    {hybridItems()}
  </MorphScroll>
);

// autoScrollOnDrag: items are draggable handles ([ms-custom-drag]) that trigger the
// auto-scroll registry when dragged toward a container edge.
scenarios.autoScrollOnDrag = (
  <MorphScroll objects={{ size: OBJ }} size={300} autoScrollOnDrag>
    {Array.from({ length: 20 }, (_, i) => (
      <div key={`item-${i}`} className="box" data-testid={`item-${i}`} ms-custom-drag="">
        item {i}
      </div>
    ))}
  </MorphScroll>
);

// type: "slider" with a draggable bar — dragging along it steps pages once the
// travel passes the size of one slider element.
scenarios.sliderThumbDrag = (
  <MorphScroll objects={{ size: 300 }}
    size={300}
    mode="slider"
    controls={{ wheel: true, bar: <div className="dot" /> }}
    onScrollPosition={onScrollPosition}
    onNavigate={onNavigate}
  >
    {makeItems()}
  </MorphScroll>
);

// autoScrollOnDrag on the horizontal axis, and two containers side by side so a
// drag can travel from one into the other.
scenarios.autoScrollOnDragX = (
  <MorphScroll objects={{ size: OBJ }} size={300} direction="x" autoScrollOnDrag>
    {Array.from({ length: 20 }, (_, i) => (
      <div
        key={`item-${i}`}
        className="box"
        data-testid={`item-${i}`}
        ms-custom-drag=""
      >
        item {i}
      </div>
    ))}
  </MorphScroll>
);

scenarios.autoScrollOnDragPair = (
  <div style={{ display: "flex", gap: 40 }}>
    <div data-testid="left-host">
      <MorphScroll objects={{ size: OBJ }} size={300} autoScrollOnDrag>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`item-${i}`}
            className="box"
            data-testid={`left-${i}`}
            ms-custom-drag=""
          >
            left {i}
          </div>
        ))}
      </MorphScroll>
    </div>
    <div data-testid="right-host">
      <MorphScroll objects={{ size: OBJ }} size={300} autoScrollOnDrag>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={`item-${i}`} className="box" data-testid={`right-${i}`}>
            right {i}
          </div>
        ))}
      </MorphScroll>
    </div>
  </div>
);

// size: "auto" — dimensions come from a ResizeTracker around the whole scroll,
// so the host box decides them rather than a numeric prop.
scenarios.sizeAuto = (
  <div style={{ width: 280, height: 240 }} data-testid="auto-host">
    <MorphScroll objects={{ size: OBJ }}
      size="auto"
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
  </div>
);

// type: "slider" driven by a content drag — releasing past the threshold
// snaps to the next page instead of stopping wherever the finger let go.
scenarios.sliderDrag = (
  <MorphScroll objects={{ size: 300 }}
    size={300}
    mode="slider"
    controls={{ drag: true, bar: <div className="dot" /> }}
    onScrollPosition={onScrollPosition}
  >
    {makeItems()}
  </MorphScroll>
);

/*
 * Страница нарочно длиннее окна: колесо над баром двигало её вместе с
 * содержимым скролла — браузер отдавал прокрутку ближайшему предку.
 */
scenarios.barWheel = (
  <>
    <MorphScroll objects={{ size: OBJ }}
      size={300}
      controls={{ wheel: true, bar: thumb }}
      onScrollPosition={onScrollPosition}
    >
      {makeItems()}
    </MorphScroll>
    <div style={{ height: "150vh" }} />
  </>
);

/*
 * Стрелки водят фокус по объектам, а прокрутка идёт за ним. Сетка нарочно в
 * два столбца: шаг вбок должен работать и в вертикальном списке.
 */
scenarios.keysFocus = (
  <MorphScroll objects={{ size: 100, crossCount: 2 }}
    size={300}
    controls={{ keys: { mode: "focus" } }}
    onScrollPosition={onScrollPosition}
  >
    {makeItems()}
  </MorphScroll>
);

/*
 * Столбец с зазором и полями обёртки: объект, доехавший до края окна, должен
 * встать с отступом, а последний — открыть поле целиком.
 */
scenarios.keysFocusSpaced = (
  <MorphScroll objects={{ size: OBJ, gap: [0, 20], crossCount: 1 }}
    size={300}
    wrapper={{ margin: 40 }}
    controls={{ keys: { mode: "focus" } }}
    onScrollPosition={onScrollPosition}
  >
    {makeItems()}
  </MorphScroll>
);

/*
 * Позиция, выставленная командой из эффекта на монтировании: в этот момент
 * контент ещё не измерен, и вопрос ровно в том, дождётся ли команда.
 */
const tallItems = () =>
  Array.from({ length: COUNT }, (_, i) => (
    <div key={`item-${i}`} className="box" style={{ height: OBJ }}>
      item {i}
    </div>
  ));

function CommandOnMount({ measured }: { measured?: boolean }) {
  const ref = React.useRef<MorphScrollHandle>(null);

  React.useEffect(() => {
    ref.current?.scrollTo(600);
  }, []);

  const scroll = (
    <MorphScroll objects={{ size: measured ? "firstChild" : OBJ, crossCount: 1 }}
      ref={ref}
      size={measured ? "auto" : 300}
      onScrollPosition={onScrollPosition}
    >
      {measured ? tallItems() : makeItems()}
    </MorphScroll>
  );

  return measured ? (
    <div style={{ width: 280, height: 300 }}>{scroll}</div>
  ) : (
    scroll
  );
}

scenarios.commandOnMount = <CommandOnMount />;
scenarios.commandOnMountMeasured = <CommandOnMount measured />;

/*
 * Размер объектов не задан: высоту знает только вёрстка. Команда всё равно
 * должна доехать — библиотека меряет обёртку сама.
 */
function CommandOnNone() {
  const ref = React.useRef<MorphScrollHandle>(null);

  return (
    <div style={{ width: 220, height: 80 }}>
      <MorphScroll
        objects={{ size: [178, "none"] }}
        ref={ref}
        size={[198, 68]}
        wrapper={{ margin: [10, 0] }}
        controls={{ bar: thumb }}
        onScrollPosition={onScrollPosition}
      >
        <div data-testid="none-text" style={{ width: 178 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <p key={`p-${i}`} style={{ margin: 0, lineHeight: "18px" }}>
              line {i}
            </p>
          ))}
        </div>
      </MorphScroll>
      <button
        data-testid="go-end"
        onClick={() => ref.current?.scrollTo("end", { duration: 0 })}
      >
        end
      </button>
    </div>
  );
}

scenarios.commandOnNone = <CommandOnNone />;

/*
 * Кладка: высоты знает только вёрстка, колонки складывает библиотека.
 * Высоты нарочно неровные и повторяются по кругу, чтобы порядок колонок
 * можно было проверить руками.
 */
const MASONRY = [40, 90, 60, 120, 30, 70, 50, 110, 80, 100];

scenarios.masonry = (
  <MorphScroll
    objects={{ size: [90, "each"], gap: 10 }}
    size={[200, 300]}
    controls={{ wheel: true }}
    onScrollPosition={onScrollPosition}
  >
    {Array.from({ length: 20 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        data-testid={`card-${i}`}
        style={{ height: MASONRY[i % MASONRY.length] }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Поток по вертикали: ширину карточки выбирает сама, высота задана. Строка
 * набирается, пока следующая помещается в 200.
 */
scenarios.flowRow = (
  <MorphScroll
    objects={{ size: ["each", 40], gap: 10 }}
    size={[200, 300]}
    controls={{ wheel: true }}
  >
    {Array.from({ length: 12 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{ width: [60, 110, 80, 40][i % 4], height: "100%" }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* Обе стороны за объектом: строка становится толщиной с самый толстый в ней */
scenarios.flowFree = (
  <MorphScroll
    objects={{ size: "each", gap: 10 }}
    size={[200, 300]}
    controls={{ wheel: true }}
  >
    {Array.from({ length: 12 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{
          width: [60, 110, 80, 40][i % 4],
          height: [30, 70, 50, 90][i % 4],
        }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* Поток по горизонтали: колонка набирается вниз, потом начинается следующая */
scenarios.flowColumn = (
  <MorphScroll
    objects={{ size: [70, "each"], gap: 10 }}
    size={[300, 200]}
    direction="x"
    controls={{ wheel: true }}
  >
    {Array.from({ length: 12 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{ width: "100%", height: [40, 90, 60, 30][i % 4] }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Перестановка объектов: ключи переезжают вместе с ними, значит и размеры
 * должны переехать — иначе после переноса объект встанет по чужому.
 */
function Reordered() {
  const [order, setOrder] = React.useState([0, 1, 2, 3]);
  const heights = [40, 120, 60, 90];

  return (
    <div style={{ width: 220, height: 300 }}>
      <MorphScroll objects={{ size: [90, "each"], gap: 10 }} size={[200, 300]}>
        {order.map((id) => (
          <div
            key={`card-${id}`}
            className="box"
            data-testid={`card-${id}`}
            style={{ height: heights[id] }}
          >
            {id}
          </div>
        ))}
      </MorphScroll>
      <button
        data-testid="shuffle"
        onClick={() => setOrder([3, 0, 2, 1])}
        type="button"
      >
        shuffle
      </button>
    </div>
  );
}

scenarios.eachReorder = <Reordered />;

/* Заполнение: обе стороны за объектом, дырок под низкими быть не должно */
scenarios.fillFree = (
  <MorphScroll objects={{ size: "each", gap: 10 }} size={[200, 300]}>
    {[
      [90, 40],
      [90, 120],
      [90, 50],
      [90, 30],
      [90, 60],
      [90, 20],
    ].map(([w, h], i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{ width: w, height: h }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* Заполнение с выравниванием: блок целиком уходит к дальнему краю области */
scenarios.fillAlign = (
  <MorphScroll
    objects={{ size: "each", gap: 10, align: "end" }}
    size={[300, 300]}
  >
    {[
      [80, 40],
      [80, 60],
      [80, 30],
    ].map(([w, h], i) => (
      <div key={`card-${i}`} className="box" style={{ width: w, height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Тот же случай заполнения, что и fillAlignRows, но с горизонтальной
 * прокруткой — оси зеркально поменяны местами (высота/ширина), числа те же.
 * Кладка и поток для direction="x" уже проверены; заполнение с обеими
 * сторонами "each" при isX=true до сих пор не гонялось живьём ни разу.
 */
scenarios.fillAlignRowsX = (
  <MorphScroll
    objects={{ size: "each", gap: 10, align: "end" }}
    size={[300, 200]}
    direction="x"
  >
    {[
      [50, 80],
      [50, 80],
      [40, 190],
    ].map(([w, h], i) => (
      <div key={`card-${i}`} className="box" style={{ width: w, height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Тот самый случай: A и B бок о бок оставляют справа заметное место, C ниже
 * занял почти всю ширину сам. Сдвиг всего блока мерил бы по C и почти не
 * трогал бы ряд A/B — каждый должен дотолкаться до края независимо.
 */
scenarios.fillAlignRows = (
  <MorphScroll
    objects={{ size: "each", gap: 10, align: "end" }}
    size={[200, 300]}
  >
    {[
      [80, 50],
      [80, 50],
      [190, 40],
    ].map(([w, h], i) => (
      <div key={`card-${i}`} className="box" style={{ width: w, height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* Поля обёртки: перенос должен считать место за их вычетом, а не всё окно */
scenarios.flowMargin = (
  <MorphScroll
    objects={{ size: ["each", 40], gap: 10 }}
    wrapper={{ margin: [30, 0] }} // [x, y] — по 30 слева и справа
    size={[200, 300]}
  >
    {Array.from({ length: 8 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{ width: [60, 50, 40, 30][i % 4], height: "100%" }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* Выравнивание строки, когда она не заняла всё место поперёк */
scenarios.flowAlign = (
  <MorphScroll
    objects={{ size: ["each", 40], gap: 10, align: "end" }}
    size={[200, 300]}
  >
    {Array.from({ length: 4 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{ width: [60, 50, 40, 30][i % 4], height: "100%" }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* Карточка, которая выросла уже после замера: раскладка должна это заметить */
function Growing() {
  const [tall, setTall] = React.useState(false);

  return (
    <div style={{ width: 220, height: 300 }}>
      <MorphScroll objects={{ size: [90, "each"], gap: 10 }} size={[200, 300]}>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`card-${i}`}
            className="box"
            data-testid={`card-${i}`}
            style={{ height: i === 0 && tall ? 160 : 40 }}
          >
            {i}
          </div>
        ))}
      </MorphScroll>
      <button data-testid="grow" onClick={() => setTall(true)} type="button">
        grow
      </button>
    </div>
  );
}

scenarios.eachGrows = <Growing />;

/* Поток: в обе стороны едет, границу строки задаёт crossCount */
scenarios.gridHybrid = (
  <MorphScroll
    objects={{ size: "each", crossCount: 3, gap: 10 }}
    size={[240, 200]}
    direction="hybrid"
    controls={{ wheel: true }}
  >
    {Array.from({ length: 9 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{
          // шире первая строка: колонка должна встать по ней, а не по последней
          width: [50, 90, 70][i % 3] + (i < 3 ? 20 : 0),
          height: [40, 80, 60][Math.floor(i / 3) % 3],
        }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * hybrid со счётом и известной шириной: колонок ровно столько, сколько
 * назвали, и каждый уходит в самую короткую — дырок под низкими соседями
 * поток по тому же счёту не закрывает, а кладка закрывает.
 */
scenarios.masonryHybrid = (
  <MorphScroll
    objects={{ size: [90, "each"], crossCount: 2, gap: 10 }}
    size={[200, 300]}
    direction="hybrid"
    controls={{ wheel: true }}
  >
    {[40, 80, 50, 30].map((h, i) => (
      <div key={`card-${i}`} className="box" style={{ height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Круг: шесть объектов по 60 с зазором 10 — период 420, окно 300, значит три
 * копии и лента в 1260. Открывается со средней копии, то есть с 420.
 */
scenarios.loopY = (
  <MorphScroll
    objects={{ size: [180, 60], gap: 10 }}
    size={[200, 300]}
    loop
    render={{ mode: "virtual" }}
    controls={{ wheel: true }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Круг из страниц: шесть страниц по 300 без зазора — оборот 1800, копий три.
 * Точек слайдера должно быть шесть, по обороту, а не восемнадцать по ленте.
 */
scenarios.loopSlider = (
  <MorphScroll
    objects={{ size: 300 }}
    size={300}
    mode="slider"
    loop
    render={{ mode: "virtual" }}
    controls={{ drag: true, arrows: <b />, bar: <div className="dot" /> }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`page-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Тот же круг, но с зазором: оборот 1920 на окно 300 — не кратно, и место
 * внутри оборота уже не совпадает с местом в ленте.
 */
scenarios.loopSliderGap = (
  <MorphScroll
    objects={{ size: 300, gap: 20 }}
    size={300}
    mode="slider"
    loop
    render={{ mode: "virtual" }}
    controls={{ drag: true, bar: <div className="dot" /> }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`page-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Круг по обеим осям: два в ряд по 90 с зазором 10 — оборот вширь 200; три
 * ряда по 60 — оборот ввысь 210. Окно меньше обоих, значит копий по три на
 * сторону, и ложатся они решёткой три на три.
 */
scenarios.loopHybrid = (
  <MorphScroll
    objects={{ size: [90, 60], gap: 10, crossCount: 2 }}
    size={[150, 160]}
    direction="hybrid"
    loop
    render={{ mode: "virtual" }}
    controls={{ wheel: true }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Круг из объектов, которые меряют себя сами. Высоты 40, 80, 50, 30 с зазором
 * 10 — оборот 210, но узнать его можно только после замера: до тех пор это
 * обычная прокрутка.
 */
scenarios.loopEach = (
  <MorphScroll
    objects={{ size: ["each", "each"], gap: 10, crossCount: 1 }}
    size={[200, 150]}
    loop
    render={{ mode: "virtual" }}
    controls={{ wheel: true }}
  >
    {[40, 80, 50, 30].map((h, i) => (
      <div key={`card-${i}`} className="box" style={{ width: 120, height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Тот же круг из своих размеров, но без виртуализации: копии смонтированы
 * все, и у каждого ключа в документе по три бокса разом. Хранилище размеров
 * должно следить за всеми — иначе размонтирование одной копии стирает замер,
 * которым живут остальные.
 */
scenarios.loopEachPlain = (
  <MorphScroll
    objects={{ size: ["each", "each"], gap: 10, crossCount: 1 }}
    size={[200, 150]}
    loop
    controls={{ wheel: true }}
  >
    {[40, 80, 50, 30].map((h, i) => (
      <div key={`card-${i}`} className="box" style={{ width: 120, height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Круг со стрелками: шаг — окно, и на каком-то из шагов он неизбежно
 * приходится на стык. Плавная прокрутка едет по своим числам, а перенос
 * меняет позицию под ней — если цель не сдвинуть следом, шаг не состоится.
 */
scenarios.loopArrows = (
  <MorphScroll
    objects={{ size: [180, 60], gap: 10 }}
    size={[200, 150]}
    loop
    render={{ mode: "virtual" }}
    duration={80}
    controls={{ arrows: <b /> }}
    onScrollPosition={onScrollPosition}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Круг с бегунком: дорожка показывает оборот, значит и ход бегунка должен
 * переводиться в оборот. Считай его по всей ленте — контент убежит втрое.
 */
scenarios.loopThumb = (
  <MorphScroll
    objects={{ size: [180, 60], gap: 10 }}
    size={[200, 300]}
    loop
    render={{ mode: "virtual" }}
    controls={{ bar: thumb }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* круг под управлением ref: то же число дважды должно ехать оба раза */
const LoopCommand = () => {
  const ref = React.useRef<MorphScrollHandle>(null);

  return (
    <>
      <button data-testid="to-100" onClick={() => ref.current?.scrollTo(100)}>
        100
      </button>
      <button data-testid="to-300" onClick={() => ref.current?.scrollTo(300)}>
        300
      </button>
      <MorphScroll
        ref={ref}
        objects={{ size: [180, 60], gap: 10 }}
        size={[200, 150]}
        loop
        render={{ mode: "virtual" }}
        duration={0}
        controls={{ wheel: true }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`card-${i}`} className="box">
            {i}
          </div>
        ))}
      </MorphScroll>
    </>
  );
};

scenarios.loopCommand = <LoopCommand />;

/*
 * Круг впритык: четыре объекта по 60 с зазором 10 дают оборот 280, и окно
 * ровно 280. Тогда край ленты совпадает с границей средней копии — то
 * единственное место, где резиновость вообще могла бы сработать в круге.
 */
scenarios.loopTight = (
  <MorphScroll
    objects={{ size: [180, 60], gap: 10 }}
    size={[200, 280]}
    loop
    render={{ mode: "virtual" }}
    controls={{ drag: true }}
  >
    {Array.from({ length: 4 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Страницы по кругу при hybrid: два слайдера, у каждого свой оборот. Оборот
 * ввысь нарочно не кратен окну — 350 при окне 200, — там и всплывает разница
 * между «сколько страниц влезло» и «сколько их в обороте».
 */
scenarios.loopSliderHybrid = (
  <MorphScroll
    objects={{ size: [180, 60], gap: 10, crossCount: 4 }}
    size={[200, 210]}
    direction="hybrid"
    mode="slider"
    loop
    render={{ mode: "virtual" }}
    controls={{ drag: true, bar: <div className="dot" /> }}
  >
    {Array.from({ length: 40 }, (_, i) => (
      <div key={`page-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* край одним узлом: библиотека сама разворачивает его по четырём сторонам */
scenarios.edgeTurns = (
  <MorphScroll
    objects={{ size: [90, 60], gap: 10 }}
    size={[200, 200]}
    direction="hybrid"
    render={{ mode: "virtual" }}
    edge={{
      element: <div style={{ width: "100%", height: "100%" }} />,
      size: 24,
    }}
    controls={{ wheel: true }}
  >
    {Array.from({ length: 20 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Слайдер по кругу, где страница не равна объекту: объекты по 260 с зазором
 * 20 дают оборот 1400, а страница — окно с зазором, 320. Сетка страниц ленты
 * с оборотом не совпадает, и снап после перетаскивания это видно.
 */
scenarios.loopSliderDrag = (
  <MorphScroll
    objects={{ size: 260, gap: 20 }}
    size={300}
    mode="slider"
    loop
    render={{ mode: "virtual" }}
    duration={0}
    controls={{ drag: true, bar: <div className="dot" /> }}
  >
    {Array.from({ length: 5 }, (_, i) => (
      <div key={`page-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* круг без виртуализации: копии стоят по координатам, но смонтированы все */
scenarios.loopPlain = (
  <MorphScroll
    objects={{ size: [180, 60], gap: 10 }}
    size={[200, 300]}
    loop
    controls={{ wheel: true }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* тот же круг, но тащим его пальцем: у инерции своя отметка, и её тоже несёт */
scenarios.loopDrag = (
  <MorphScroll
    objects={{ size: [180, 60], gap: 10 }}
    size={[200, 300]}
    loop
    render={{ mode: "virtual" }}
    controls={{ drag: true }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* тот же круг вбок: период тот же, ходит по left */
scenarios.loopX = (
  <MorphScroll
    objects={{ size: [60, 180], gap: 10 }}
    size={[300, 200]}
    direction="x"
    loop
    render={{ mode: "virtual" }}
    controls={{ wheel: true }}
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={`card-${i}`} className="box">
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Строка толщиной с самый толстый оставляет под низкими пусто, и следующие
 * поднимаются туда — порядок при этом остаётся построчным. Размеры подобраны
 * так, чтобы поднялись трое из шести, и каждый на своё.
 */
scenarios.compactRows = (
  <MorphScroll
    objects={{ size: "each", crossCount: 2, gap: 10 }}
    size={[300, 400]}
    controls={{ wheel: true }}
  >
    {[
      [100, 80],
      [120, 30],
      [90, 40],
      [110, 60],
      [80, 50],
      [100, 20],
    ].map(([w, h], i) => (
      <div key={`card-${i}`} className="box" style={{ width: w, height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * objects.direction: "column" — порядок идёт вдоль прокрутки. Кладка при этом
 * перестаёт искать самую короткую колонку: первая забирает первые ceil(6 / 2)
 * объектов, вторая остальные. Числа посчитаны вручную.
 */
scenarios.columnOrder = (
  <MorphScroll
    objects={{ size: [170, "each"], crossCount: 2, gap: 10, direction: "column" }}
    size={[360, 300]}
    controls={{ wheel: true }}
  >
    {[40, 80, 50, 30, 60, 20].map((h, i) => (
      <div key={`card-${i}`} className="box" style={{ height: h }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Та же просьба при горизонтальной прокрутке: подряд там идут столбцы, значит
 * переставляет порядок уже "row". Числа зеркальны columnOrder.
 */
scenarios.rowOrderX = (
  <MorphScroll
    objects={{ size: ["each", 170], crossCount: 2, gap: 10, direction: "row" }}
    size={[300, 360]}
    direction="x"
    controls={{ wheel: true }}
  >
    {[40, 80, 50, 30, 60, 20].map((w, i) => (
      <div key={`card-${i}`} className="box" style={{ width: w }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * Тот же порядок в потоке: пять объектов по два в строке — три строки, и
 * собираются они из столбцов, а не из подряд идущих.
 */
scenarios.columnOrderFlow = (
  <MorphScroll
    objects={{ size: ["each", 60], crossCount: 2, gap: 10, direction: "column" }}
    size={[300, 300]}
    controls={{ wheel: true }}
  >
    {[30, 40, 50, 60, 70].map((w, i) => (
      <div key={`card-${i}`} className="box" style={{ width: w, height: "100%" }}>
        {i}
      </div>
    ))}
  </MorphScroll>
);

/*
 * objects.direction для hybrid: "column" меняет местами, что ограничивает
 * crossCount — вместо ширины строки высоту столбца, рост уходит вправо.
 * Числа те же, что у gridHybrid, только оси зеркалом.
 */
scenarios.columnHybrid = (
  <MorphScroll
    objects={{ size: "each", crossCount: 3, gap: 10, direction: "column" }}
    size={[240, 200]}
    direction="hybrid"
    controls={{ wheel: true }}
  >
    {Array.from({ length: 9 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{
          height: [50, 90, 70][i % 3] + (i < 3 ? 20 : 0),
          width: [40, 80, 60][Math.floor(i / 3) % 3],
        }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/* много карточек: проверяем, что первый кадр не монтирует их все разом */
scenarios.masonryMany = (
  <MorphScroll
    objects={{ size: [90, "each"], gap: 10 }}
    size={[200, 300]}
    controls={{ wheel: true }}
  >
    {Array.from({ length: 500 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        style={{ height: MASONRY[i % MASONRY.length] }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

scenarios.masonryVirtual = (
  <MorphScroll
    objects={{ size: [90, "each"], gap: 10 }}
    size={[200, 300]}
    render="virtual"
    controls={{ wheel: true }}
    onScrollPosition={onScrollPosition}
  >
    {Array.from({ length: 60 }, (_, i) => (
      <div
        key={`card-${i}`}
        className="box"
        data-testid={`card-${i}`}
        style={{ height: MASONRY[i % MASONRY.length] }}
      >
        {i}
      </div>
    ))}
  </MorphScroll>
);

/** то же самое, но декларативно — для сравнения */
scenarios.positionOnMountMeasured = (
  <div style={{ width: 280, height: 300 }}>
    <MorphScroll objects={{ size: "firstChild", crossCount: 1 }}
      size="auto"
      initialPosition={600}
      onScrollPosition={onScrollPosition}
    >
      {tallItems()}
    </MorphScroll>
  </div>
);

/*
 * Слайдер из объектов во весь размер окна и с зазором — как галерея картинок.
 * Места вокруг объекта нет, значит и отступа при переходе быть не должно:
 * страница обязана встать ровно по краю.
 */
scenarios.keysFocusFull = (
  <MorphScroll objects={{ size: "full", gap: 20 }}
    size={300}
    direction="x"
    mode="slider"
    controls={{ keys: { mode: "focus" }, bar: <div className="dot" /> }}
    onScrollPosition={onScrollPosition}
  >
    {makeItems()}
  </MorphScroll>
);

/** тот же список, но управляемый снаружи — как это делал бы геймпад */
function FocusRig() {
  const ref = React.useRef<MorphScrollHandle>(null);

  React.useEffect(() => {
    (window as any).__ms = ref.current;
  }, []);

  return (
    <MorphScroll objects={{ size: 100, crossCount: 2 }}
      ref={ref}
      size={300}
      onScrollPosition={onScrollPosition}
      onNavigate={onNavigate}
    >
      {makeItems()}
    </MorphScroll>
  );
}

scenarios.focusCommand = <FocusRig />;

const params = new URLSearchParams(window.location.search);
const scenario = params.get("scenario") ?? "wheel";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {scenarios[scenario] ?? <div>unknown scenario: {scenario}</div>}
  </React.StrictMode>,
);

/*
 * Сколько объектов доехало до первого кадра. Снаружи это не поймать: пока
 * тест успеет спросить, пачки уже разъедутся — а вопрос именно про первый.
 */
const countFirstFrame = () => {
  const boxes = document.querySelectorAll(".ms-object-box").length;

  // React коммитит не в том же кадре, что и render — ждём первого, где кто-то есть
  if (!boxes) {
    requestAnimationFrame(countFirstFrame);
    return;
  }

  (window as unknown as { __firstFrame: number }).__firstFrame = boxes;
};

requestAnimationFrame(countFirstFrame);

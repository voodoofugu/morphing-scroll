const CONST = {
  WRAP_ATR: "ms-wrap-id", // Attribute for identifying scroll wrappers
  BAR_AXIS_ATR: "ms-direction", // which axis a bar belongs to
  BAR_VISIBILITY_VAR: "--ms-bar-visibility", // 0/1 while controls.bar.showOnHover is on
  EDGE_VISIBILITY_VAR: "--ms-edge-visibility", // 0/1 when content is cut off at an edge
  // отличает копию контента в круге от оригинала; наружу не выходит
  LOOP_KEY_SEP: "\u0000loop\u0000",
  CONTENT_VISIBILITY_VAR: "--ms-content-visibility", // 0..1 while trackVisibility is on
  /*
   * Шагов у доли видимости. Тысячная убирает заметные ступени у больших
   * объектов, но по-прежнему не отдаёт в CSS сырой субпиксельный шум.
   */
  VISIBILITY_STEPS: 1000,
  /*
   * За какую сторону окна объект уходит — тоже при trackVisibility. Стоит
   * только та сторона, которая его режет: сколько именно срезано, говорит
   * доля видимости, а это — куда.
   */
  OUTSIDE_CLASS: "ms-outside-", // + top | right | bottom | left
  /** the group a child names on itself; `scrollToObject` takes that name */
  GROUP_ATR: "ms-group",
  /*
   * Место объекта в списке — то же число, которое берёт `scrollToObject`, и
   * считается оно так же, с единицы, как и `:nth-child()`. Сам `:nth-child()`
   * тут не помощник: он считает боксы в документе, а при виртуализации их
   * горстка, и пятый по счёту может быть сотым в списке.
   */
  CHILD_ATR: "ms-child",
  SCROLLING_ATR: "ms-scrolling", // present on the root while a scroll is running
  LERP_FACTOR: 0.4, // Interpolation factor for smooth scrolling (0-1)
  DIFF_THRESHOLD: 2.5, // Minimum distance to stop animation (pixels)
  WHEEL_DIRECT_MAX_DELTA: 40, // pixel deltas at or below this follow a trackpad directly
  WHEEL_BURST_GAP: 120, // ms — after this pause a wheel device is classified again
  SCROLL_END_DELAY: 200, // Delay before marking scroll as ended (ms)
  /*
   * У края скролл отдаёт колесо наружу не сразу: пока его крутят, оно ещё
   * его. Так ведёт себя нативная прокрутка — иначе страница под списком
   * трогается ровно в тот кадр, в котором список кончился, и это резко.
   */
  WHEEL_HANDOVER_DELAY: 200, // ms — тишина, после которой колесо уходит наружу
  /*
   * Слайдер листает колесом: одно деление — одна страница. Пока страница
   * едет, следующие деления не считаем, иначе трекпад пролетает список
   * насквозь — у него на один жест приходятся десятки событий.
   */
  SLIDER_WHEEL_LOCK: 180, // ms
  /*
   * Стрелка едет со скоростью натива: Chromium доводит шаг примерно за столько
   * же, а удержанная клавиша копит цель, а не начинает каждый шаг заново.
   */
  KEY_PAN_DURATION: 120, // ms
  /*
   * Сколько должен пройти палец или мышь, прежде чем решено, чей это жест:
   * вдоль оси — наш, поперёк — того, кто снаружи.
   */
  AXIS_DECIDE_PX: 6,
  END_STICK_THRESHOLD: 16, // px — на таком расстоянии от конца скролл всё ещё «внизу»
  SCROLL_READY_MAX_FRAMES: 60, // Frames to wait for the content to become scrollable
  SCROLL_READY_STILL_FRAMES: 5, // Frames of an unchanged range that end that wait
  SLIDER_AIM_DURATION: 120, // ms — перелёт к пункту, в который целится жест по бару
  MEASURE_BATCH: 30, // objects.size: "auto" — сколько неизмеренных рисуем за раз

  // инерция для прокрутки
  MIN_VELOCITY: 0.05, // px/ms
  MIN_DISTANCE: 12, // px
  INERTIA_FRICTION: 0.0021, // меньше сопротивления: быстрый touch-бросок не ощущается вязким
  INERTIA_MIN_VELOCITY: 0.02, // порог остановки
  INERTIA_EDGE_DAMPING: 0.4, // демпфирование у краёв
  INERTIA_RELEASE_TIMEOUT: 80, // ms — максимум пауза между движением и отпусканием
  INERTIA_BOOST_EXP: 0.98, // почти линейная скорость: жест остаётся выразительным без резкого разгона

  // - spring-bounce -
  RUBBER_STIFFNESS: 0.22, // доля viewport, к которой асимптотически тянется rubber-band
  BOUNCE_MIN_OVERSCROLL: 96, // маленький scroll всё ещё даёт заметное растяжение
  BOUNCE_MAX_OVERSCROLL: 220, // большой scroll не превращает растяжение в длинный перелёт
  BOUNCE_OVERSCROLL_RATIO: 0.24, // размерозависимый visual-предел
  MICRO_DAMPENING: 0.6, // добавляется при смене направления растяжения
  OVERSCROLL_BACK_DURATION: 220, // ms — мягкое возвращение после растяжения
  OVERSCROLL_MOMENTUM_SPRING: 180, // s^-2 — пружина после столкновения touch-инерции с краем
  OVERSCROLL_MOMENTUM_DAMPING: 24, // s^-1 — гасит пружину до первого возврата без дрожания
  MIN_THRESHOLD_SIZE: 440, // px — нижняя база нелинейного сопротивления
};

export default CONST;

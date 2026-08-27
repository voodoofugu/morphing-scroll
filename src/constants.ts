const CONST = {
  WRAP_ATR: "ms-wrap-id", // Attribute for identifying scroll wrappers
  BAR_AXIS_ATR: "ms-direction", // which axis a bar belongs to
  BAR_VISIBILITY_VAR: "--ms-bar-visibility", // 0/1 while progressTrigger.bar.showOnHover is on
  EDGE_VISIBILITY_VAR: "--ms-edge-visibility", // 0/1 when content is cut off at an edge
  CONTENT_VISIBILITY_VAR: "--ms-content-visibility", // 0..1 while render.trackVisibility is on
  SCROLLING_ATR: "ms-scrolling", // present on the root while a scroll is running
  LERP_FACTOR: 0.4, // Interpolation factor for smooth scrolling (0-1)
  DIFF_THRESHOLD: 2.5, // Minimum distance to stop animation (pixels)
  SCROLL_OFFSET: 2, // Adjustment offset for scroll boundary calculation
  SCROLL_END_DELAY: 200, // Delay before marking scroll as ended (ms)
  SCROLL_READY_MAX_FRAMES: 60, // Frames to wait for the content to become scrollable

  // инерция для прокрутки
  MIN_VELOCITY: 0.05, // px/ms
  MIN_DISTANCE: 12, // px
  INERTIA_FRICTION: 0.0025, // сила торможения (меньше → дольше катится, своего рода сила трения)!
  INERTIA_MIN_VELOCITY: 0.02, // порог остановки
  INERTIA_EDGE_DAMPING: 0.4, // демпфирование у краёв
  INERTIA_RELEASE_TIMEOUT: 80, // ms — максимум пауза между движением и отпусканием
  INERTIA_BOOST_EXP: 0.92, // кривая усиления (>0.7 и <1 даёт «пружину»)
  INERTIA_MIN_START: 0.2, // минимальный старт, чтобы не «умирало»

  // - spring-bounce -
  RUBBER_STIFFNESS: 0.14, // чем меньше тем сильнее пружина
  BOUNCE_MAX_OVERSCROLL: 150, // ограничение растяжения (px)
  MICRO_DAMPENING: 0.6, // добавляется при смене направления растяжения
  OVERSCROLL_BACK_DURATION: 140, // ms — время возвращения после растяжения
  MIN_THRESHOLD_SIZE: 600, // px — размер viewport scroll, при котором включается эффект пружины
};

export default CONST;

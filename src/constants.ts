const CONST = {
  WRAP_ATR: "wrap-id", // Attribute for identifying scroll wrappers
  LERP_FACTOR: 0.4, // Interpolation factor for smooth scrolling (0-1)
  DIFF_THRESHOLD: 2.5, // Minimum distance to stop animation (pixels)
  SCROLL_OFFSET: 2, // Adjustment offset for scroll boundary calculation
  DEBOUNCE_DELAY: 33, // Debounce delay for frequent operations (ms)
  SCROLL_END_DELAY: 200, // Delay before marking scroll as ended (ms)

  // инерция для прокрутки
  MIN_VELOCITY: 0.05, // px/ms
  INERTIA_FRAME_SCALE: 16, // px/ms → px/frame
  MIN_DISTANCE: 12, // px
  INERTIA_FRICTION: 0.004, // сила торможения (меньше → дольше катится, своего рода сила трения)!
  INERTIA_MIN_VELOCITY: 0.3, // порог остановки
  INERTIA_EDGE_DAMPING: 0.4, // TODO наверно убрать для реализации резинки контента (демпфирование у краёв)
  INERTIA_RELEASE_TIMEOUT: 80, // ms — максимум пауза между движением и отпусканием
  INERTIA_BOOST_EXP: 0.85, // кривая усиления (>0.7 и <1 даёт «пружину»)
  INERTIA_MAX_SPEED: 80, // максимальная px/frame
  INERTIA_MIN_START: 1.2, // минимальный старт, чтобы не «умирало»
};

export default CONST;

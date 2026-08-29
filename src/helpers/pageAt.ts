/**
 * Страница, на которой стоит позиция по одной оси.
 *
 * Одна формула на всех: по ней стрелка считает, куда листнуть, и по ней же
 * `onNavigate` решает, сменилась ли страница. Раньше это было бы двумя
 * похожими, но чуть разными вычислениями.
 */
const pageAt = (position: number, viewport: number, gap: number) => {
  const step = viewport + gap;

  return step > 0 ? Math.max(0, Math.round(position / step)) : 0;
};

export default pageAt;

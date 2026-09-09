/*
 * Подвести объект к краю окна вплотную мало: место рядом есть, и оно должно
 * быть видно. Но взять его надо оттуда, где оно действительно лежит — иначе
 * одна и та же команда оставляет то поле обёртки в середине списка, где
 * никакого поля нет, то зазор у крайнего объекта, за которым зазору не с чем
 * стоять.
 *
 * Правило одно на все команды, которые подводят объект к краю: за объектом
 * стоит ещё один — значит между ними лежит зазор объектов; объект крайний —
 * значит за ним поле обёртки, и больше ничего.
 *
 * Отсюда же следует, что края сходятся сами собой: у первого объекта
 * `"start"` приезжает туда же, куда `scrollTo(0)`, а у последнего `"end"` —
 * туда, где список кончается.
 *
 * У замкнутой в круг оси крайнего объекта нет вовсе: за каждым стоит
 * следующий, и поле обёртки там не встречается никогда.
 */

/** дробные размеры дают доли пикселя, край от них не перестаёт быть краем */
const TOUCHING = 0.5;

/**
 * The space an object keeps between itself and the edge of the window — the
 * one that is really in that place. Another object beyond it means the gap
 * they hold between them; past the outermost object there is no gap left,
 * and there it is the wrapper's margin.
 *
 * @param before how much content lies before the object along this axis
 * @param after and how much after it
 * @param margin the wrapper's own margins, at the start of the axis and at
 * its end — the same order `before` and `after` are given in
 * @param endless an axis running in a circle, where no object is the
 * outermost one and the margin is never what stands beyond
 */
const edgePads = (
  before: number,
  after: number,
  gap: number,
  margin: [start: number, end: number],
  endless = false,
): [start: number, end: number] =>
  endless
    ? [gap, gap]
    : [before > TOUCHING ? gap : margin[0], after > TOUCHING ? gap : margin[1]];

export default edgePads;

/*
 * The list is only something to scroll through — the fireball is the point.
 * It is long on purpose: the thumb takes its length from the ratio of window
 * to content, and a long book is what shrinks it down to the size of a ball.
 */
const names = [
  "Ember Step", "Cinder Veil", "Ash Whisper", "Kindle", "Pyre Lance",
  "Scorch Ward", "Blaze Crown", "Soot Bloom", "Spark Chain", "Char Mark",
  "Smoulder", "Flare Knot", "Hearthlight", "Wildfire", "Coal Heart",
  "Firebrand", "Sunforge", "Molten Oath", "Tinder Song", "Ember Rain",
  "Lantern Eye", "Furnace Gate", "Candle Hex", "Phoenix Down",
];

const ranks = ["I", "II", "III", "IV", "V"];

const schools = ["evocation", "conjuration", "abjuration", "illusion"];

const lines = [
  "Leaves a warm trail wherever you walk.",
  "Hides you in a curtain of drifting sparks.",
  "Speaks in the crackle of a dying fire.",
  "Lights what you touch, and nothing else.",
  "A spear of white heat, thrown in a straight line.",
  "Turns the first blow into smoke.",
  "Burns brighter the faster you move.",
  "Grows a flower of ash in your palm.",
];

export const spells = ranks.flatMap((rank, tier) =>
  names.map((name, index) => ({
    id: `${name}-${rank}`,
    name,
    rank,
    school: schools[(index + tier) % schools.length],
    line: lines[(index + tier * 3) % lines.length],
  })),
);

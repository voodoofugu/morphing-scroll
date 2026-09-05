/*
 * `React.Children.toArray` подмешивает в ключ путь по дереву: `key="profile"`
 * приезжает как ".$profile", вложенный — как ".0:$profile", а "=" и ":"
 * внутри самого ключа экранируются в "=0" и "=2".
 *
 * Внутри это неважно, но ключ уходит наружу — в атрибут `ms-wrap-id` и в
 * `onRenderedKeysChange`, — и там пользователь должен видеть тот ключ,
 * который написал сам. Разворачиваем один раз, на входе.
 */
const childKey = (key: string) => {
  const unescape = (value: string) =>
    value.replace(/=0/g, "=").replace(/=2/g, ":");

  // вложенный путь: ".0:$Key"
  const nested = key.lastIndexOf(":$");
  if (nested !== -1) return unescape(key.slice(nested + 2));

  // корневой путь: ".$Key"
  if (key.startsWith(".$")) return unescape(key.slice(2));

  // ключа не было — React выдал позицию, разворачивать нечего
  return key;
};

export default childKey;

/*
 * Группа объекта, если она названа в его ключе.
 *
 * Отдельного пропа под группы нет: ключ и так обязан быть уникальным, и
 * дописать к нему название группы в скобках дешевле, чем вести рядом второй
 * список. `"news-3[news]"` — объект `news-3` из группы `news`.
 */
const groupKey = (key: string) => {
  const named = /\[([^[\]]+)\]$/.exec(key);

  return named ? named[1] : null;
};

export { groupKey };

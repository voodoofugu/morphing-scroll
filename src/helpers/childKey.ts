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

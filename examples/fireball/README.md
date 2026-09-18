# Scroll of Fire

A scrollbar thumb of hot metal that burns and throws sparks — a demo for [morphing-scroll](https://www.npmjs.com/package/morphing-scroll).

[**See it live**](https://voodoofugu.github.io/morphing-scroll/fireball/) · [Edit the code on StackBlitz](https://stackblitz.com/github/voodoofugu/morphing-scroll/tree/main/examples/fireball?file=src%2Ffire.ts)

Scroll it with the wheel, drag the thumb, drag the list or use the arrow keys. The flame trails behind the bar and the metal sparks as it moves; it flares when you grab it, burns brighter the faster the list moves, and throws a shower of sparks when it hits an end.

## How it works

- **The thumb is an ordinary element.** `controls.bar.element` takes `<HotBar />`, a bar of hot metal drawn in CSS. The library gives it its length from the ratio of window to content, moves it, and marks it with `ms-grabbing` while it is held.
- **The fire is a canvas laid over the scroll.** Every frame it finds `.ms-thumb` and reads where the bar is: its speed sets the length of the trail and the number of sparks, `ms-grabbing` makes it flare, and `onScrollPosition` tells which end the bar has just hit. The heat goes back to the bar as a CSS variable, so the metal glows brighter too.
- **Nothing here fights the library.** The canvas lets every pointer through, and the scroll stays a real scroll: the wheel, touch, keys and dragging all work as usual.

None of this can be done with `::-webkit-scrollbar` or `scrollbar-color`: a pseudo-element has no position to read and nothing to hang a canvas on.

| file | what is in it |
| --- | --- |
| `src/App.tsx` | the scroll and the hot bar |
| `src/fire.ts` | the fire: flames, sparks and the glow |
| `src/styles.css` | the bar, the groove it runs in, the page |

## Run it locally

```bash
npm install
npm run dev
```

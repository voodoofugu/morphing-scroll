# Fireball thumb

A scrollbar thumb made of fire — a demo for [morphing-scroll](https://www.npmjs.com/package/morphing-scroll).

[**See it live**](https://voodoofugu.github.io/morphing-scroll/fireball/) · [Edit the code on StackBlitz](https://stackblitz.com/github/voodoofugu/morphing-scroll/tree/main/examples/fireball)

Scroll it with the wheel, drag the fireball, drag the list or use the arrow keys. The fire trails behind the ball, flares when you grab it, burns brighter the faster the list moves, and throws sparks when it hits an end.

## How it works

- **The thumb is an ordinary element.** `controls.bar.element` takes `<Ember />`, a ball drawn in CSS. The library moves and sizes the `.ms-thumb` box around it and marks it with `ms-grabbing` while it is held.
- **The fire is a canvas laid over the scroll.** Every frame it finds `.ms-thumb` and reads where the ember is: its speed sets the length of the trail, `ms-grabbing` makes it flare, and `onScrollPosition` tells which end the ball has just hit.
- **Nothing here fights the library.** The canvas lets every pointer through, and the scroll stays a real scroll: the wheel, touch, keys and dragging all work as usual.

None of this can be done with `::-webkit-scrollbar` or `scrollbar-color`: a pseudo-element has no position to read and nothing to hang a canvas on.

| file | what is in it |
| --- | --- |
| `src/App.tsx` | the scroll and the ember |
| `src/fire.ts` | the fire: particles, sparks and the glow |
| `src/styles.css` | the ember, the groove it runs in, the page |

## Run it locally

```bash
npm install
npm run dev
```

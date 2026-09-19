# The story of morphing-scroll, my npm library

I want to tell you about my npm library — my second npm project, and the most complex one I've built so far. I won't dig deep into the code: this is the story of how and why it came to be.

![A designer at his desk, looking at a sketch of a scrollbar](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-01.png)

## Introduction

Around 2015 I landed my first job as a UI/UX designer. I drew interfaces for mobile and desktop apps in Sketch, which everyone used back then, on a Mac the company gave me, and I was genuinely happy about it. Things went well: I followed the iOS and Android guidelines, and whenever an app idea resonated with me, I tried to give the design a little extra — filling the interface with my own illustrations (I'm an artist by training) and unusual takes on individual elements. Sometimes it turned out pretty well.

But there was one element whose changes never made it through — the scrollbar. The developers I handed my mockups to really didn't like it when I touched it, and they said so plainly. The scrollbar, and its thumb in particular, was a dark forest you'd better not wander into. And every time I heard "that can't be done", I felt like that guy happily drawing little clouds on buttons to pop music while the developer suffers, trying to carry the artistic vision over into code. That's exactly where a UI mockup and the final product go their separate ways.

![The designer and a grumpy grey scrollbar thumb, with a "no" sign between them](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-02.png)

## Growing into code

Time went by, and bit by bit I started not only drawing mockups but also building them in React. I sank deeper and deeper into development — until one day I came face to face with my old enemy: the browser scrollbar. That's when I felt firsthand the damage thousands of developers had taken, smashing designers' work against the rocks of the impossible.

So what's wrong with it, and which limitations am I talking about? Let's talk about the very curses that doom innocent developers to suffering.

![The designer, now writing React at his laptop](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-03.png)

### Curse one — "The Tower of Babel"

Long ago everyone spoke one language, everyone understood each other, and nobody had heard of cross-platform woes. Then browser makers, with no single specification or standard, started doing the same thing in different ways. As a result, the same element looks slightly different depending on what you opened the page in.

![Four browser windows with four different scrollbars in front of the Tower of Babel](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-04.png)

### Curse two — "Deprivation"

This element barely lends itself to customization, and what little there is hardly counts as change: a color via CSS and three width options. There's also `::-webkit-scrollbar`, but that's just a paint job: you simply can't put your own element in place of the thumb — one with animation, or one that reacts to movement. All a designer is left with is a sense of helplessness. Strange, isn't it? An element users see on every page, and you can barely style it.

![A gloomy monitor on a rainy evening, showing a plain grey scrollbar](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-05.png)

## Throwing down the gauntlet

And so, armed with JS and React, in 2023 I decided to take on these plagues. I didn't fully realize how long and thorny the road ahead would be, but the prize was worth it: somewhere in the distance I could see that dream UI where, instead of a dull grey thumb, you can put your own — any shape and style, glowing on hover, growing when pressed, whatever you like. Even a fireball instead of a thumb — I have to be able to do that. Why all these limits?!

![The designer climbing a rocky mountain, fist raised](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-06.png)

## The fight

The goal was clear, but I had no way to reach it yet. I wanted the library to work right out of the box. With what I knew, I could write a React component, and that was a decent start, but styling was still an open question: the default styles had to ship with the component. I could have rendered a `<style>` tag into the HTML on mount, but that's unreliable, so the styles had to live inside the component — and the answer turned out to be as simple as it gets: inline styles. I'm not a fan of inline styles, but here they solved a whole layer of problems in one go: the styling was always in place, exactly where it was needed. It forced me to think the scrollbar's parts through carefully and to answer implementation questions along the way. It was also clear that I wouldn't manage without TypeScript: at some point I simply wouldn't be able to maintain the project. Well then, the stack is set — let's build.

![The designer holding a sword and a shield with the React logo](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-07.png)

### Round one — "The Mix"

In the first version I tried to put together a strange mix: the browser's own scrolling with its thumb hidden and my element in its place. It could only scroll vertically and horizontally — and the horizontal one was really just a rotated vertical one. Very quickly I hit a wall of limitations and realized I'd have to write everything myself — both the scroll event handling and the motion animation. On top of that, I needed scrolling along both axes at once. It became clear that this implementation wasn't serious and looked more like first steps to find my direction. I already knew what to do next, but I was a bit burned out, so I took a break to think it all over and come back with fresh energy.

![The designer tinkering with a scrollbar with a screwdriver](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-08.png)

### Round two — "All by myself"

When I sat down to write the second version, I had a much better idea of what the library should do and what it would take. I dug deeper into development and into building the internal mechanics, and things started to work out. But the longer I worked, the more ideas came to me, and the "what else could it do" list grew impressively long. For example, I realized that what I'd written could easily turn the component into a slider as well as a scroll — so I added that mode, and with it arrows and a separate page-turn animation. And from my experience with lists I knew it needed both lazy rendering (an object appears once you scroll to it, and stays) and virtualization (only what's visible lives in the DOM).

At some point the hardest part wasn't having the mechanics, but getting them to live together.

A simple example. A page has a horizontal strip of cards, and the page itself scrolls vertically. A user puts a finger on the strip and moves it — whose gesture is it? If the finger goes sideways, it belongs to the strip; if it goes down, to the page, and that has to be decided within the first few pixels of movement, before the person notices anything. And what if they're dragging the strip's thumb instead of the cards? Then the gesture belongs to the strip alone, and the page must not move a single pixel. Each rule on its own is simple, but the mouse, the finger, the wheel, the keyboard, nested scrolls and sliders start arguing with each other — and most of my time went into settling those arguments.

All of this was driving me crazy and called for an enormous number of checks and tests. Every time I decided I'd done everything I could, I'd come up with something cool I immediately wanted to add — and that started to get on my nerves. That's how the library grew, and the API stopped being coherent. I burned out again and took a break.

![The designer fighting a hydra whose heads are scrollbar thumbs](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-09.png)

### Round three — "Order"

Getting started on the third version was hard: a lot had piled up, but I had to put things in order and rework the API. This is where I brought AI into the development, so as not to miss anything during the rework and to cover the code with tests — otherwise, fixing one thing, I'd inevitably break another. And at last a final API I was happy with dawned on the horizon, and the tests were done. A few new features made it in, too: a tile layout of differently sized items, infinite scrolling, and a list that starts on the right — for languages that read right to left.

I'll add that the name wasn't chosen by chance: the component can behave in completely different ways and not even look like a scroll at all — it's all up to your imagination.

At the time of writing, the library is on its third version, and the API is stable.

![The designer forging a new scrollbar on an anvil, helped by a small robot](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-10.png)

## Wrapping up

It all worked out, but along the way the library made me answer a lot of questions about how a scroll should behave and what it should be able to do.

Reading this, you might wonder: why go to all this trouble over a single element, and who needs it? Use the library if you want to build something unusual rather than what the browser gives you by default. It'll also come in handy for game developers — there are hardly any standard solutions there.

One more thing from me: if you've ever been scared of an evil dragon you didn't feel qualified enough to face, but that keeps getting in your way — try challenging it the next time you meet. At the very least you'll gain new knowledge and skills. At best, you'll make the world a little friendlier, or just more interesting.

I'd also like to thank my colleagues for their patience while I was rolling this library out in production.

You can read the docs [on GitHub](https://github.com/voodoofugu/morphing-scroll), and build your own scroll and grab the ready-made code [in the playground](https://voodoofugu.github.io/morphing-scroll/).

Good luck, and happy coding!

![The designer giving a thumbs up](https://raw.githubusercontent.com/voodoofugu/morphing-scroll/refs/heads/main/article/imgs/article-img-11.png)

P.S. And here's that very [fireball instead of a thumb](https://voodoofugu.github.io/morphing-scroll/fireball/).

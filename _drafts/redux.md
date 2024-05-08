---
layout: post
title: Redux.js and the Limits of Abstraction
tags: programming
---

I mentioned in a code review for some framework-y code recently that the author should be careful to avoid accidentally reinventing [Redux.js](https://reduxjs.org) (henceforth, just "Redux"), which is a library I love to hate. During this review, I was struck by a thought and finally able to articulate why:

Redux is a _design pattern_, not a library.

The core of Redux maps directly onto, and is usually implemented by, language-level features:[^1]

- reducers: switch + object spread
- actions: discriminated unions (a language-level feature in TypeScript)
- action creators: object literals/constructors
- middleware: higher-order functions/decorators
- store: just... a plain object

[^1]: The only core Redux component missing from this list is selectors, which do not correspond directly to a language-level feature, but "composable memoized pure function" is not exactly a novel idea.

Redux-the-library doesn't actually _do_ anything significant, instead, it just assigns roles and new names to existing language features. Indeed, when Dan Abramov was still involved in it, one of his frequent selling points was that it was just so simple, [cite] enough that if you wanted you could even implement it yourself... [cite]

...which is exactly what you're supposed to do with a design pattern. Have you ever seen a library for the visitor pattern? [look for one] No: a design pattern doesn't have enough meat on the bones to be a library. A design pattern doesn't save work, abstract away complexity or add expressivity. A design pattern just tells you how to structure your code. This is what it's like to use Redux-the-library.

Redux-the-pattern is hard to criticize because it doesn't offer much. Yes: we all agree that pure functions are more testable and that mutating inputs is usually a bad idea.

The badness that leads to all the hate comes from the ecosystem around Redux-the-library. I suspect a lot of the involved people had never heard the phrases "state transition", "pure function" or "copy on write" before and thought that Redux (both pattern and library) was some kind of watershed innovation rather than a textbook example of what those things mean when applied to idiomatic JavaScript. They missed that _Redux-the-library was competing against the host language_ rather than complementing it, that it was _taking away useful expressivity_ from the things it renamed. They built layer upon layer, middlewares and thunks and sagas and action creator creators, most of which was also just design patterns in disguise, all of it using only the crippled sub-language blessed by Redux-the-library.[^2]

[^2]: Nobody in the ecosystem seemed to notice that the only way to open source any of the layers they built in-house was to strip them of all usefulness and publish a bunch of tiny wrapper functions that collectively got some new flashy marketing name. After all, you can't open source _your_ action creators, but you can open source, uh, a function that makes functions that put all their arguments into an object literal.

And having constructed this towering monument to abstraction, what does one have to show for it? Boilerplate little different from dozens of purpose-built methods on a mutable global singleton, which is incidentally what you would have written if you didn't apply Redux-the-pattern. Except that this version is smeared across dozens of files and several libraries.

The moral of the story is that one needs to be judicious with abstraction, and that generalization is not worth pursuing merely on its own merits.

// TODO

The TypeScript type definitions [link] for Redux are _so spectacularly vague and overengineered_ that they almost seem like a parody of static type systems, but also, serve as an indication that maybe the system being described has become so general as to become useless.

{% include next-previous.html %}

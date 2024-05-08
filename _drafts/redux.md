---
layout: post
title: Redux.js Isn't a Library
tags: programming
---

I mentioned in a code review for some framework-y code recently that the author should be careful to avoid accidentally reinventing [Redux](https://reduxjs.org), which is a library I love to hate. I hate it for all the usual reasons \[which are?\], but during this code review was finally able to articulate why:

Redux is a _design pattern_, not a library.

The core of the library maps directly onto, and is usually implemented by, language-level features:[^1]

- reducers: switch + object spread
- actions: discriminated unions (a language-level feature in TypeScript)
- action creators: object literals/constructors
- middleware: higher-order functions/decorators
- store: just... a plain object

[^1]: The only core Redux component missing from this list is selectors, which do not correspond directly to a language-level feature, but "composable memoized pure function" is not exactly a novel idea.

Redux-the-library doesn't actually _do_ anything significant, instead, it just assigns roles and new names to existing language features. Indeed, when Dan Abramov was still involved in it, one of his frequent selling points was that it was just _so simple_. [cite] You could even implement it yourself! [cite]

...which is exactly what you're supposed to do with a design pattern. Have you ever seen a library for the visitor pattern? No, because such a thing doesn't make sense. A design pattern doesn't have enough meat on the bones to be a library.

I think the reason Redux is bad is because people had never heard the phrases "state transition", "pure function" or "copy on write" thought that Redux was some kind of incredible innovation rather than a oversimplified textbook example of what those things mean when applied to idiomatic JavaScript. So they built layer upon layer, middlewares and thunks and

{% include next-previous.html %}

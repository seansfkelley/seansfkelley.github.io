---
layout: post
title: Redux and the Limits of Abstraction
tags: programming
---

TODO: https://www.red-gate.com/simple-talk/opinion/opinion-pieces/bad-carma/

I mentioned in a code review for some framework-y code recently that the author should be careful to avoid accidentally reinventing [Redux](https://redux.js.org), which is a library I love to hate. During this review, I was struck by a thought and finally able to articulate why I don't like Redux:

Redux is a design pattern, not a library.

The core of Redux maps directly onto, and is largely implemented by, language-level features:[^1]

- reducers: switch + object spread
- actions: discriminated unions (a language-level feature in TypeScript)
- action creators: object literals/constructors
- middleware: higher-order functions/decorators
- dispatch: function call
- store: just... a plain object

Redux-the-library doesn't actually _do_ anything significant; instead, it merely assigns roles and new names to existing language features. Indeed, when Dan Abramov was still involved in it, one of his frequent selling points was that it was [more of an idea than anything else, and so simple that you could even just implement it yourself](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367)...

...which is exactly what you're supposed to do with a design pattern. Have you ever seen a library for the visitor pattern? No you haven't, because a design pattern doesn't have enough meat on the bones to be a library. A design pattern doesn't save work, abstract away complexity or add expressivity. A design pattern guides you in writing the same amount of code you would have without it, but with fewer traps. That's Redux-the-library in a nutshell.

It is this misinterpretation of Redux as a library that leads to the overengineered, overabstract boilerplate I associate with the ecosystem of things built upon it. Redux-the-library wraps these expressive language-level constructs into restrictive, supposedly-but-not-really higher-level primitives that other things in the Redux ecosystem attempt to build on. But it doesn't work: there's no _there_ there, and most of them (thunks and middlewares and sagas, oh my) also end up being design patterns in diguise, with all the attendant implementation work for their users.

Let's be clear: there is nothing inherently wrong with a library mandating the use of restrictive primitives to interact with it. But this is a cost, and in the case of Redux-the-library, there is no benefit in exchange for this cost, because Redux-the-pattern is too simple for Redux-the-library to offer meaningful expressivity or code savings. I would even say that Redux-the-library is _competing_ with the host language rather than complementing it, replacing usefully context-aware expression of Redux-the-pattern's ideas with a verbose one-size-fits-all implementation of those ideas.

The Redux ecosystem is illustrative of the pitfalls of overeager abstraction,[^2] which is a common impulse in programmers. It's true that if you move your solution one rung higher on the abstraction ladder you can solve a broader swath of related problems. It's also true that your solution then becomes less expressive and ergonomic in the context from which it was born. If you keep going, you end up writing a programming language inside your programming language or [a database that can describe any possible business process with no additional code](TODO). You know what else can solve all manner of problems it wasn't designed with in mind? A programming language.

The skill and artistry is knowing when to stop. If you don't, you end up right where you started: trying to implement some feature in your chosen language/framework/whatever, except you've replaced something (presumably) well-designed and battle-tested with your half-baked non-framework. But it's still the same amount of work, just now in a stilted, foreign language.

[^1]: The only core Redux concept missing from this list is selectors, which do not correspond directly to a language-level feature, but "composable memoized pure function implementing a view of a value" is not a novel idea.

[^2]: Originally this post was just me venting about Redux, but I relegated the remainder of that to this (long) footnote and tried to chop it down a bit. Enjoy an entire bonus post, I guess.

    I suspect a lot of the people involved in the major Redux ecosystem libraries had never heard the phrases "state transition", "pure function" or "copy on write" before and thought that Redux (both pattern and library) was some kind of generational innovation rather than a textbook example of what those things mean when applied to idiomatic JavaScript. Just another example of web developers rediscovering things that other developers have known for a long time. (n.b. I am also a web developer, I guess.)

    Nobody in the ecosystem seems to notice that the only way to open source any of the abstractions they've built in-house is to strip them of all opinions and publish a bunch of wrapper functions or reimplementations of existing language constructs, collectively christened with some new name. After all, you can't open source _your_ action creators, but you can open source, uh, a function that makes functions that put all their arguments into an object literal.

    The towering momuments to abstraction that inevitably emerge when Redux-the-library is used in nontrivial applications ironically end up being as unpleasant to read and write as what you'd have ended up with if you reached for the first thing that comes to mind _without_ Redux-the-pattern, i.e., a massive, mutable global state singleton. Except: the Redux version is smeared across dozens of files and several libraries. Did you know Dan Abramov [never used Redux in any production application](https://www.reddit.com/r/reactjs/comments/dsfio6/comment/f6pmgmj/)? In fact, Dan [really doesn't like Redux anymore](https://www.reddit.com/r/reactjs/comments/dsfio6/comment/f6p4krr/).

    Also, have you ever seen the types for Redux and Redux-adajacent libraries? I mean, [look](https://github.com/reduxjs/redux-toolkit/blob/0246f788ef964a6afb5071f5b9a651d48630f3e0/packages/toolkit/src/configureStore.ts#L118-L126) [at](https://github.com/reduxjs/react-redux/blob/a128c5ebb30bda6e60d597dc37ab97992f8e0d8d/src/types.ts#L110-L124) [these](https://github.com/reduxjs/reselect/blob/1223a1b0997a6b248ccbac3ba4e2a544a7a676d8/src/createSelectorCreator.ts#L80-L104). They say so little, with so much.

{% include next-previous.html %}

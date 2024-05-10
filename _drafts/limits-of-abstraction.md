---
layout: post
title: Redux and the Limits of Abstraction
tags: programming
---

I mentioned in a code review for some framework-y code recently that the author should be careful to avoid accidentally reinventing [Redux](https://redux.js.org), which is a library I love to hate. During this review, I was struck by a thought and finally able to articulate why I do:

Redux is a _design pattern_, not a library.

The core of Redux maps directly onto, and is usually implemented by, language-level features:[^1]

- reducers: switch + object spread
- actions: discriminated unions (a language-level feature in TypeScript)
- action creators: object literals/constructors
- middleware: higher-order functions/decorators
- store: just... a plain object

Redux-the-library doesn't actually _do_ anything significant, instead, it just assigns roles and new names to existing language features. Indeed, when Dan Abramov was still involved in it, one of his frequent selling points was that it was [more of an idea than anything else, and so simple that you could even just implement it yourself](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367)...

...which is exactly what you're supposed to do with a design pattern. Have you ever seen a library for the visitor pattern? No you haven't, because a design pattern doesn't have enough meat on the bones to be a library. A design pattern doesn't save work, abstract away complexity or add expressivity. A design pattern guides you in writing the same amount of code with fewer traps. This is what it's like to use Redux-the-library.

This mixup meant that all the layers and layers of abstraction built upon this foundation, the middlewares and thunks and sagas and slices and action creator creators, all of them, were stuck with only the crippled sub-language that Redux-the-library had blessed. These layers all missed that the key was Redux-the-pattern, i.e., the renaming itself, and in fact, that Redux-the-library was more competing with the host language than complementing it by replacing useful expressions of the idea with a one-size-fits-all implementation of that idea.

Moving along before this post descends completely into a rant on Redux,[^2] I want to transition to a broader idea

The moral of the story is that one needs to be judicious with abstraction, and that generalization is not worth pursuing merely on its own merits.

[^1]: The only core Redux component missing from this list is selectors, which do not correspond directly to a language-level feature, but "composable memoized pure function" is not exactly a novel idea.

[^2]: Originally this post _was_ just a rant, but I relegated the remainder to this footnote and chopped it way down for both our sakes. The gist: the badness that leads to all the hate comes from the ecosystem around Redux-the-library, which where is most of these aforementioned layers and layers come from. I suspect a lot of the involved people had never heard the phrases "state transition", "pure function" or "copy on write" before and thought that Redux (both pattern and library) was some kind of generational innovation rather than a textbook example of what those things mean when applied to idiomatic JavaScript.

    Nobody in the ecosystem seemed to notice that the only way to open source any of the layers they built in-house was to strip them of all usefulness and publish a bunch of tiny wrapper functions that collectively got some new flashy marketing name. After all, you can't open source _your_ action creators, but you can open source, uh, a function that makes functions that put all their arguments into an object literal.

    Using Redux-the-library, which means constructing a bespoke, towering monument to abstraction, we inevitably end up with boilerplate little different from dozens of purpose-built methods on a mutable global singleton, which is incidentally what you would have written if you didn't apply Redux-the-pattern. Except that this version is smeared across dozens of files and several libraries, and in any case, Dan Abramov [knew better than to use it in production](https://www.reddit.com/r/reactjs/comments/dsfio6/comment/f6pmgmj/). In fact, Dan [really doesn't like Redux anymore](https://www.reddit.com/r/reactjs/comments/dsfio6/comment/f6p4krr/).

    And the _types_: I have never seen so much complexity used to describe so little: https://github.com/reduxjs/redux-toolkit/blob/0246f788ef964a6afb5071f5b9a651d48630f3e0/packages/toolkit/src/configureStore.ts#L118-L126 ; https://github.com/reduxjs/react-redux/blob/a128c5ebb30bda6e60d597dc37ab97992f8e0d8d/src/types.ts#L110-L124

{% include next-previous.html %}

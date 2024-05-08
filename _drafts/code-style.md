---
layout: post
title: My Code Style
tags: programming
anchor_headings: true
---

{:.no_toc}

* TOC
{:toc}

# What This Is

This is my code style. Style in the sense of concepts represented in code, and how they are placed relative to each other and explained to the reader, not in the sense of where I put the curly brackets.

There is no objectively correct answer for this kind code style, but this document outlines the main pillars of mine. As such, they are also the things I look for in code reviews. I refer to this document when doing code reviews (which is probably why you're here).

Yes, this document is very dry.

None of these points on style are hard and fast. They overlap and sometimes trade off. Ultimately, code needs to serve an end, and sometimes that requires compromising on principles.

# The Underlying Philosophy

Before wading into the crossfire on when and how to write comments, I want to outline some more abstract concepts that are reflected in the more-specific opinions that follow.

The philosophical points below are idealistic and can't always be achieved within in the constraints of any given code review, but I strive for them when possible.

## Data First, Business Logic Second

> Show me your flowcharts [algorithms] and conceal your tables [data model], and I shall continue to be mystified. Show me your tables, and I won’t usually need your flowcharts; they’ll be obvious.
>
> – Fred Brooks, Mythical Man Month

If you don't know what values you're operating with, you can't do anything with them. The names, types and lifetimes of values, as well as the interaction between them, should be the primary driver for how code is structured. Programs are ultimately machines for processing inputs into outputs, so build around those inputs and outputs and any necessary intermediates.

## Tools, Not Process

_a.k.a._ **Solve Problems Once**

> If you haven't automated your last-year self out of a job, you aren't learning.
>
> – An ex-manager of mine (paraphrased)

Don't do manually what can be done automatically. Put the work in now to find, configure or build the right tool for the job, then never think of that problem again. Don't make anyone else have to think about the problem, either, if you can avoid it: documentation is no replacement for automation.

## Strive to Explain Intent

Code is an unambiguous, precise specification of behavior, so treat it like one. Computers don't need to have code explained to them, but people do. Write your code so it's clear what you intend to have happen, so that when it inevitably doesn't, someone can understand what you were trying to do. You might not be there to explain what you meant.

This is an umbrella term, broader than the oft-cited "don't be clever". Removing or avoiding cleverness is often a consequence of striving to explain intent.

## Write Quality Code the First Time

Spend the time now to save the time later.

If I sent you this page, you aren't the first employee of an underfunded startup in do-or-die mode. Every corner you cut will be paid for dozens of times over with every reader of your code. Bike shed your names before you merge. Your prototype _will_ end up in production, so give it a little more thought.

## Perfect is the Enemy of Good

You've probably heard this before, stated as "don't let perfect be the enemy of good". I like the more assertive phrasing because _you are in control_. Misguidedly seeking perfection isn't happening _to_ you.

What's usually missed when this is cited is that (1) it takes a lot experience to learn where the line is and (2) where you draw the line is probably not exactly where I do. Keep that in mind and learn to be a little flexible without compromising on the principles that truly make a difference.

# Superficial Code Style

## Consistency

Whoever said "consistency is the hobgoblin of little minds" never had to work in a multi-million line codebase. Counterintuitively, it is a tool of the practitioner, rather than a fetish of the theoretician.

Consistency enables quick and dirty regexes when you can't rely on types to find usages.

Consistency is how you can do massive code reviews and not trip over every line (such reviews _do_ happen: sorry idealists).

Consistency is why I can use inconsistency to draw attention where necessary.

Consistency is how I stay sane.

## Automated Formatters

Automated formatters like Prettier and Black are to be considered correct, _even in weird edge cases_. When there is a conflict on style, the automated formatter is correct. Modern bikesheds come pre-painted.

### Exception: Multi-line Regexes

Regexes are always hard to read. Unfortunately, long regexes are sometimes necessary. In the case where you cannot comment on a long nasty regex by pointing to some documentation (e.g. the classic [email regex StackOverflow question](https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression)), it's probably a good idea to break your regex up onto multiple lines and explain what each piece is doing.

In this case, automated formatters are likely to wreck your significant indentation or inline sections that were separated for clarity and should therefore be disabled if they do not understand your multi-line regex.

### Exception: Cross-language, Byte-identical Find-replace

Some languages have syntactic overlap, but often have differing formatting rules. In the _exceptionally rare_\* circumstances where it's valuable to have the same sequence of characters across two languages, disable the formatter for that block.

\* This has happened exactly once in my programming life (both professional and personal), but I want this document to be complete, so here it is. In particular, I wanted to find exact matches across JavaScript and JSON files, but JSON only permits double-quotes while JavaScript's Prettier formatter was configured for single quotes. Notably, this linting tool was later rewritten to something simpler and more expressive such that maintaining formatting consistency became irrelevant (and impossible), which is the ideal outcome.

# Comments

Comments should be used to explain _why_, not _what_ and definitely never _how_.

## When to Use Comments

Sparingly.

Code should strive to be self-explanatory. It is a precise specification of behavior covering both the _what_ and the _how_ by definition, and usually the _why_ by virtue of naming, organization and common contextual knowledge (i.e. what the whole program is designed to do).

Comments are suitable only when there is no reasonable naming or organization of the code that can address the _why_. Explaining _what_ or _how_ risks the comment becoming misleading in the future, since comments are not checked for consistency or sanity by any automated tool. Misleading comments are worse than no comments. Don't litter.

## Examples of Useful Comments

Useful comments are those that explain necessary but unusual code constructs, such as:

- Code taken from the internet.
- Working around weird APIs.
- Non-obvious side-effects.
- Satisfying some automated tool such as a linter.
- Magic constants.
- Hacks.

## Examples of Extraneous Comments

Common cases where comments are used and shouldn't be:

- Explaining an inline constant.
  - Instead, hoist it to a SHOUTING_CASE value, and if it still needs explanation, then consider a comment.
  - In the specific cases of numbers or strings, it can sometimes be useful to break the derivation of the value out into steps for emphasis, e.g., `const FIFTEEN_MINUTES = 15 * 60 * 1000;`
- Explaining a boolean parameter at a call site.
  - Instead, consider rewriting the called function to accept an enumeration or keyword arguments, forcing the call site to be clearer.
- Restating adjacent code, e.g., annotating the line `sorted_values = sorted(values, key=lambda v: v.name)` with `# sort the values by name`.
  - Instead, delete the comment.

# Naming

Good names go a long way towards pre-empting comments. Following certain conventions make the code-reading experience smoother by not surprising your reader. They can even speed up code-writing by making you think _"What exactly am I trying to express here?"_ rather than barging ahead into a dead end with the first thing that comes to mind.

## Names Should Be At Least Two Words

The clarity of any given name goes _way_ up from one word to two. Look around you: how many tables, chairs, windows, devices, utensils, tools, vehicles or people can you uniquely identify by adding just one adjective or locator to, well, "table", "chair", "window", etc.? When in doubt, overshare.

**Exception:** in highly-generic contexts, you might not be able to come up with a better name than `row` or `data`.

**Exception:** in inline contexts, shorter names can improve clarity by reducing repetitive noise, such as in e.g. `all_entries.filter(e => e.enabled)`.

## Use Standard Vocabulary

Prefer well-known words like "get" rather than synonyms like "obtain". Use boring, clear names almost all the time. While fun, your code should require neither a dictionary nor a thesaurus. Unusual names suggest unusual behavior, so don't be misleading.

**Exception:** don't be afraid to use jargon when it's suitable. If you're overloading the subtraction operator, it's okay, even preferred, to say "subtrahend".

**Exception:** if you want to define something new with _very particular and maybe unusual_ semantics, it can be useful to choose a word that doesn't have baggage and define it to mean what you want. Consider leaving a comment.

## Avoid Most Abbreviations

Your editor has autocomplete and your ability to parse streams of letters is not the bottleneck to your understanding. Don't be afraid of _authentication_, _rasterization_ or even _canonicalization_.\* It's better to spend the extra milliseconds now and avoid ambiguity and confusion later.

If you really want to abbreviate things, only do it if they are at least one of:
  - _common in English_, such as "appt" for "appointment"
  - _obvious in context_, such as referring to the `mag` of a `Vector3`
  - _idiomatic_, such as looping with `i` and `j`

\* I tried to come up with non _-tion_ words, but those nounified verbs come up all the time!

## Initialisms are Words

Treat initialisms and acronyms as words for the purposes of casing. Don't write `OWASPVPNHTTPHandler`; write `OwaspVpnHttpHandler`. I hope this example is self-explanatory.

As a bonus, some tools (e.g. IntelliJ) have built-in fuzzy-search behavior that returns higher-quality results when initialisms are capitalized as words.

## Functions Should be Verb-y

Action words like "get", "commit" or "write" communicate that a function _performs an action_. This re-emphasizes the distinction between code and data (hi, Lispers!) along with your language's syntax and the syntax highlighter, and helps frame the naming question in useful terms: what does this function _do_?

## Values Should be Noun-y

Variables and parameters should have noun-y names that communicate _what_ role they play, but rarely _how_. Avoid including the type of the variable in its name. Like functions being verb-y, this emphasizes a distinction and helpfully frames the question to aid in picking a good name.

## Exception: Booleans

Empirically, boolean functions and values benefit from some special considerations. They should be phrased...
  - _declaratively_, like `is_something()` rather than `check_if_something()`.
  - _positively_, e.g. `is_something_enabled`, not negatively, e.g., `is_something_disabled`. This reduces indirection by one level and helps avoid confusing double negatives.

Consider [replacing boolean values by a two-state enumeration](#enumerations-v-booleans).

# State Management

In most run-of-the-mill programming, the complexity you and your reader have to deal with comes from having to track three things:

- **control flow** paths, in order to understand all the possible paths through a piece of code
- **variable scopes**, in order to understand what values are currently in play and could interact with each other
- **mutations** made to a value after it is initially declared, changing how it may interact with other values or control flow constructs

Designing your code in order to reduce the size of the state space introduced by these three things can significantly reduce the surface area for bugs and make the code easier to both read and write.

## Control Flow

Reduce the number of possible paths control can take through a given piece of code (the [cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)). Ideally, this means eliminating branches entirely.

### Match `if` with `else` Whenever Possible

`if` blocks without `else`s often look like a mistake. The entire rest of the scope is still controlled by the `if`, but now implicitly. If you must use a standalone `if`, spend the space saying `else { /* noop */ }` so there is no doubt. Fall-through in `switch` is widely disliked and usually only permitted with an explanation or at least acknowledgement; this is little different.

As a special case, many `if`s-without-`else`s are early returns, and can almost always be:

- reframed as an assertion, which unlike a corresponding `if`-then-`throw`/`raise` will be phrased both positively and declaratively
- rolled into one of the existing edge or common cases you already handle, such as not giving special treatment to empty collection types

Avoiding lone `if`s has the added benefit of being able to more reliably use indentation as a reminder and emphasis for which statements are subject to which control flow.

### Combine (and Eliminate) Cases

All techniques for eliminating branches boil down to identifying cases which appear distinct, but are not. Essentially distinct things often manifest as distinct types, and cannot be handled the same way. If you have multiple cases handling values of the same type, look closer: the cases may be more similar than they first appear. Finding a way to combine them might reveal and underlying truth and more correspondingly more elegant solution.

A very common case of unnecessarily distinct cases is nullable collection types. Is a null array a meaningfully distinct thing from an empty one? Usually, not: in both cases, you are going to do zero iterations. Use an empty array, and unconditionally iterate, instead of null checking.

### Explicit Alternatives

If one branch being hit means that other branches cannot be, represent that explicitly.

A series of three independent `if`s in a row doing is-instance checks will not all trigger for a given value, but at a skim (and perhaps without strong compiler support) this may not be obvious. Three `if`s represent 8 possible paths. By chaining `if`s into `else if`s, you can reduce the number of paths in this example to 3 or 4 (depending on if the last case is a catch-all or not).

This technique can often be used to great effect inside loop bodies that would otherwise have to be written with `break` or `continue`.

### Branch in the Right Place

Moving a branch higher or lower in the control flow can make a huge difference.

In an extreme case, consider the difference between a set of related methods (say, some [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)) that can handle two kinds of entities. You would almost certainly rather have eight methods bundled into two sets of four, than four methods, each containing one branch per entity type.

This can go the other way, too: sometimes readability is improved if you drop an entire `if`-`else` construct and replace it with a single ternary, buried deep in some otherwise-consistent expression.

In both cases, the goal is to find that crossover point that minimizes both the number of branches, and the number of _kinds_ of branches (or things that are being branched on).

## Variable Scope

Try to reduce the number of ways variables could potentially interact with each other. Ideally, this means eliminating a variable entirely.

Every declared variable is another item to keep track of. The larger the scope of the variable, the longer one has to remember what the value is for and what changes, if any, the value has undergone since its declaration. Longer-lived variables also overlap with more other variables, increasing the number of possible interactions an unfamiliar reader has to consider.

### Don't Store Derived Values

Storing values derived from other values requires careful management of the derived value to ensure it is consistent with the inputs. This is a form of cache invalidation, which is a known [hard thing](https://martinfowler.com/bliki/TwoHardThings.html).

Instead, compute them on the fly when needed by the end consumer. Many languages have good, idiomatic ways to do this, like JavaScript closure-thunks, Java getters, and Python properties.

### Defer Declarations as Late as Possible

A variable declaration is a statement to your reader: "here is something you have to keep track of". If you declare everything up front in your scope, you have maximized the number of possible interactions to consider. If you declare a variable without initializing it, you have most likely put your program into a temporarily-invalid state (that you intend to resolve immediately, it's true).

Declaring variables closer to where they are used reduces possible interactions and likely gives you the opportunity to provide a useful initialization value.

### Shorten Lifetimes with Blocks (or One-use Functions)

Anonymous scoping blocks (if your language supports it) or one-use functions (otherwise) can be used to move the end of a variable's lifetime earlier. This complements moving the declaration later to minimize possible interactions with other variables. In cases where several intermediate values are juggled to produce some other value, an anonymous block can ensure those intermediate values can be forgotten about by the reader as soon as the block ends, rather than hang over their head through the rest of the function.

Some languages make this more ergonomic than others. Languages with blocks-as-values are best; languages whose only scope control is functions are acceptable, but one has to get used to the idea of breaking out single-use functions.

## Mutation and Side Effects

Try to reduce the number of possible states your program can be in. Ideally, values can be initialized onces and never changed.

TODO: In languages that support it, declaring variables constant (the irony!) is recommended in all cases where it's possible. The majority of modern application glue code is not a performance bottleneck, and writing fast but unreadable code is rarely the best way to scale.

### Techniques

TODO

- declare variables requiring complex control flow in blocks or dedicated functions
- eliminate variables that can be derived from another

# Inlining v. Factoring Out

# Lean on the Type System

A blog post once used the phrase "type system maximalist". I am a type system maximalist, to the degree that our languages are able to express it.

https://brooker.co.za/blog/2020/06/23/code.html

## Something About Assertions

# Enumerations v. Booleans

A common place I've seen this distinction sneak up on people is when boolean user settings have defaults. Do you support a "don't care, always use the default" option? This is often represented as a nullable boolean value. A nullable boolean value has 3 states. Doesn't sound much like a boolean anymore, and as code changes accumulate over time and the team changes, it can be hard to understand if these nullable booleans were intentional or an oversight (perhaps because your SQL dialect defaults columns to being nullable and you didn't know). If you store a 3-value enumeration, all ambiguity is removed at lowest level and source of truth.

# Git and Version Control

## Squash v. True Merge

## Merge v. Rebase

## Force-pushing

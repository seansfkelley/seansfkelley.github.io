---
layout: post
title: My Code Style
tags: programming
anchor_headings: true
---

* TOC
{:toc}

# What This Is

This is my code style. "Style" here means how concepts are represented, structured and explained to the reader, not where I put the curly brackets.

There is no objectively correct answer regarding this kind code of style, but this document outlines the main pillars of mine. As such, they are also the things I look for in code reviews. I refer to this document when doing code reviews (which is probably why you're here).

Yes, this document is very dry.

## Use Engineering Judgement

**None of these points on style are hard and fast.** They overlap and sometimes trade off. Ultimately, code needs to serve an end, and sometimes that requires compromising on principles.

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

Code is an unambiguous, precise specification of behavior, so treat it like one. Computers don't need to have code explained to them, but people do. Write your code so it's clear what you _intend_ to have happen, so that when it inevitably doesn't, someone besides you -- or just your future self -- can understand how to fix it properly.

This supersedes the oft-cited "don't be clever": removing or avoiding cleverness is common result of striving to explain intent.

## Write Quality Code the First Time

Spend the time now to save the time later.

If I sent you this page, you aren't the first employee of an underfunded startup in do-or-die mode. Every corner you cut will be paid for dozens of times over with every reader of your code. Bike shed your names before you merge. Your prototype _will_ end up in production, so give it a little more thought.

## Perfect is the Enemy of Good

The standard phrasing of this -- "don't let perfect be the enemy of good" -- isn't assertive enough for my tastes. You are in control. Misguidedly seeking perfection isn't happening _to_ you.

What's usually missed when this is cited is that (1) it takes a lot experience to learn where the line is and (2) where you draw the line is probably not exactly where I do. Keep this in mind and learn to be a little flexible without compromising on the principles that truly make a difference.

# Superficial Code Style

A quick diversion into what "style" usually means to state some core high-level principles. We're still not talking about curly brackets.

## Consistency

Whoever said "consistency is the hobgoblin of little minds" never had to work in a multi-million line codebase. Rather, it is a tool of the practitioner, not a fetish of the theoretician.

Consistency is how you can do massive code reviews and not trip over every line (such reviews _do_ happen: sorry idealists).

Consistency enables quick and dirty regexes when you can't rely on types to find usages.

Consistency is why I can use inconsistency to draw attention to unavoiably peculiar code.

Consistency is how I stay sane.

## Automated Formatters

Automated formatters like Prettier and Black are to be considered correct, _even in weird edge cases_. When there is a conflict on style, the automated formatter is correct. Modern bikesheds come pre-painted. Spend your valuable time elsewhere.

### Exception: Multi-line Regexes

Regexes are always hard to read. Unfortunately, long regexes are sometimes necessary. In the case where you cannot comment on a long nasty regex by pointing to [some documentation](https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression) (or your language doesn't have [`RegexBuilder`](https://developer.apple.com/documentation/regexbuilder) _\*swoon\*_), it's probably a good idea to break your regex up onto multiple lines and explain what each piece is doing.

In this case, automated formatters are likely to wreck your significant indentation or inline sections that were separated for clarity and should therefore be disabled if they do not understand your multi-line regex.

### Exception: Cross-language, Byte-identical Find-replace

Some languages have syntactic overlap, but often have differing formatting rules. In the _exceptionally rare_[^1] circumstances where it's valuable to have the same sequence of characters across two languages, disable the formatter for that block.

# Comments

Comments should be used to explain _why_, not _what_ and definitely never _how_.

This section refers only to regular comments, not doc comments, which serve an entirely different purpose.

## When to Use Comments

Sparingly.

Code should strive to be self-explanatory. It is a precise specification of behavior covering both the _what_ and the _how_ by definition, and usually the _why_ by virtue of naming, organization and common contextual knowledge (i.e. what the whole program is designed to do).

Comments are suitable only when there is no reasonable naming or organization of the code that can address the _why_. Explaining _what_ or _how_ risks the comment becoming misleading in the future, since comments are not checked for consistency or sanity by any automated tool. Misleading comments are worse than no comments. Don't litter.

## Examples of Useful Comments

Useful comments are those that explain necessary but unusual code constructs, such as those that:

- are hacks
- have magic constants
- have non-obvious side-effects
- work around weird APIs
- satisfy some automated tool, such as a linter
- intentionally preserve style for compatibility or historical reasons

## Examples of Extraneous Comments

Common instance of unjustifiable comments are those that:

- explain an inline constant
  - Instead, hoist it to a SHOUTING_CASE value, and if it still needs explanation, then consider a comment.
  - In the specific cases of numbers or strings, it can sometimes be useful to break the derivation of the value out into steps for emphasis, e.g., `const FIFTEEN_MINUTES = 15 * 60 * 1000;`
- explain a boolean parameter at a call site
  - Instead, consider [rewriting the called function to accept an enumeration](#enumerations-v-booleans) (or keyword arguments), forcing the call site to be clearer.
- restate adjacent code in prose
  - Instead, delete the comment.

# Naming

Good names go a long way towards pre-empting reader questions and code comments. Following certain conventions make the code-reading experience smoother by not surprising your reader. They can even speed up code-writing by forcing you to stop and think _"What exactly am I trying to express here?"_ rather than barging ahead into a dead end with whatever control flow first comes to mind.

## Names Should Be At Least Two Words

The clarity of any given name goes _way_ up from one word to two. Look around you: how many tables, chairs, windows, devices, utensils, tools, vehicles or people can you uniquely identify in your current "scope" by adding just one adjective or locator to, well, "table", "chair", "window", etc.? When in doubt, overshare.

**Exception:** in highly-generic contexts, you might not be able to come up with a better name than `row` or `data`.

**Exception:** in inline contexts, shorter names can improve clarity by reducing repetitive noise, such as in e.g. `all_entries.filter(e => e.enabled)`.

## Use Standard Vocabulary

Prefer well-known words like "get" rather than synonyms like "obtain". Use boring, clear names almost all the time. While fun, your code should require neither a dictionary nor a thesaurus. Unusual names suggest unusual behavior, so don't be misleading.

**Exception:** don't be afraid to use jargon when it's suitable. If you're overloading the subtraction operator, it's okay, even preferred, to say "subtrahend".

**Exception:** if you want to define something new with _very particular and maybe unusual_ semantics, it can be useful to choose a word that doesn't have baggage and define it to mean what you want. Consider leaving a comment.

## Avoid Most Abbreviations

Your editor has autocomplete and your ability to parse streams of letters is not the bottleneck to your understanding. Don't be afraid of _authentication_, _rasterization_ or even _canonicalization_.[^2] It's better to spend the extra milliseconds now and avoid ambiguity and confusion later.

If you really want to abbreviate things, only do it if they are at least one of:
  - _common in English_, such as "appt" for "appointment"
  - _obvious in context_, such as referring to the `mag` of a `Vector3`
  - _idiomatic_, such as looping with `i` and `j`

## Initialisms are Words

Treat initialisms and acronyms as words for the purposes of casing. Don't write `AWSIAMJSONParser`; write `AwsIamJsonParser`. I hope this example is self-explanatory. (If not, how about `JPEGEXIFGPSLookup` or `XMLDTDURIResolver`?)

As a bonus, some tools (e.g. IntelliJ) have built-in fuzzy-search behavior that returns higher-quality results when initialisms are capitalized as words.

## Functions Should be Verb-y

Action words like "get", "commit" or "write" communicate that a function _performs an action_. This re-emphasizes the distinction between code and data (hi, Lispers!) along with your language's syntax and the syntax highlighter, and helps frame the naming question in useful terms: what does this function _do_?

## Values Should be Noun-y

Variables and parameters should have noun-y names that communicate _what_ role they play, but rarely _how_. Avoid including the type of the variable in its name, which may change and thereby confuse more than help. Like functions being verb-y, this emphasizes a distinction and helpfully frames the question to aid in picking a good name.

## Exception: Booleans

Empirically, boolean functions and values benefit from some special considerations. They should be phrased...
  - _declaratively_, like `is_something()` rather than `check_if_something()`.
  - _positively_, e.g. `is_something_enabled`, not negatively, e.g., `is_something_disabled`. This reduces indirection by one level and helps avoid unnecessary double negatives.

Consider [replacing boolean values by a two-state enumeration](#enumerations-v-booleans).

# Managing State

In most run-of-the-mill programming, the complexity you and your reader have to deal with comes from having to track three things:

- **control flow** paths, in order to understand all the possible paths through a piece of code
- **variable scopes**, in order to understand what values are currently in play and could interact with each other
- **mutations** made to a value after it is initially declared, changing how it may interact with other values or control flow constructs

Designing your code in order to reduce the size of the state space introduced by these three things can significantly reduce the surface area for bugs and make the code easier to both read and write.

All three of these have overlap with each other and with [types](#types), so I have tried to assign each pattern to the context it interacts with the most.

## Control Flow

Reduce the number of possible paths control can take through a given piece of code (the [cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)). Ideally, this means eliminating branches entirely.

### Match `if` with `else` Whenever Possible

`if` blocks without `else`s often look like a mistake. The entire rest of the scope is still controlled by the `if`, but implicitly. If you must use a standalone `if`, spend the space saying `else { /* noop */ }` so there is no doubt. Fall-through in `switch` is widely disliked and usually only permitted with an explanation or at least acknowledgement; this is little different.

Many `if`s-without-`else`s are early returns. If these are grouped at the top of a function, they are permissible, but they will often be better expressed by one of the constructs described in the next sections, such as [assertions](#use-assertions-to-supplement-types) or [eliminating redundant cases](#combine-and-eliminate-cases).

Early returns anywhere but at the top of a function are usually more surprising than helpful, and should be avoided if the function is more than a loop or two.

Avoiding lone `if`s has the added benefit of being able to more reliably use indentation as a reminder and emphasis for which statements are subject to which control flow.

### Use Assertions to Supplement Types

Not all valid inputs can be expressed in the type system. Assertions are a clear and compact expression of those preconditions which cannot be. They should be phrased positively -- "this must be true to continue" not "if this is not true, stop" -- and are necessarily declarative in style.

Standalone `if`s whose body is a `throw`/`raise` are assertions in disguise, but phrased in reverse and introducing additional unnecessary scopes.

### Combine (and Eliminate) Cases

All techniques for eliminating branches boil down to identifying cases which appear distinct, but are not. Essentially distinct things often manifest as distinct types, and cannot be handled the same way. If you have multiple cases handling values of the same type, look closer: the cases may be more similar than they first appear. Finding a way to combine them might reveal an underlying truth and a correspondingly more elegant solution.

A very common case of unnecessarily distinct cases is nullable collection types. Is a null array a meaningfully distinct thing from an empty one? Usually, not: in both cases, you are going to do zero iterations. Use an empty array, and unconditionally iterate, instead of null checking.

### Explicit Alternatives

If one branch being hit means that other branches cannot be, represent that explicitly.

A series of three independent `if`s in a row doing is-instance checks will not all trigger for a given value, but at a skim (and perhaps without strong compiler support) this may not be obvious. Three `if`s represent 8 possible paths. By chaining `if`s into `else if`s, you can reduce the number of paths in this example to 3 or 4 (depending on if the last case is a catch-all or not).

This technique can often be used to great effect inside loop bodies that would otherwise have to be written with `break` or `continue`.

### Branch in the Right Place (or: Inline _and_ Factor Out)

Moving a branch higher or lower in the control flow can make a huge difference.

In an extreme case, consider the difference between a set of related methods (say, some [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)) that can handle two kinds of entities. You would almost certainly rather have eight methods bundled into two sets of four (two entites times four CRUD methods), than four methods, each containing one branch per entity type.

This can go the other way, too: sometimes readability is improved if you drop an entire `if`-`else` construct and replace it with a single ternary, buried deep in some otherwise-consistent expression.

In both cases, the goal is to find that crossover point that minimizes both the number of branches, and the number of _kinds_ of branches (or things that are being branched on).

When considering functions specifically, this manifests as the decision to inline or factor out a function body. Inlining can eliminate redundancy such as large parameter sets, whereas factoring out can reduce variable scopes, and both can eliminate control flow redundancy in surrounding code.

### Functions Decide _or_ Act, Not Both

One generally thinks of a function as code that effects a change to something, but oftentimes the complexity instead comes in _choosing_ which change to make. Unless one or both of "decide" and "act" are simple, split them into separate functions, perhaps even one-use functions. This almost always yields a very clear separation of concerns that can be effectively tested and might enable some deduplication (e.g. multiple decisions that end up acting the same).

You may have to introduce a new type if the decision cannot be represented as a primitive type. This is often a blessing in disguise; this new type will likely make it easier to identify which cases are meaningfully distinct and may point the way to a simpler implementation of either or both of the "decide" or "act" phases.

In rare cases, making this change and noticing that many decisions boil down to the same act with tiny variations can lead to noticing that _all_ decisions boil down to the same act, which removes the "decide" part entirely.

### Use Exhaustiveness Checking

Instead of carefully inspecting whether every input type has as corresponding branch, make the type checker do it. Many languages have first-class exhaustiveness checking ([1](https://gibbok.github.io/typescript-book/book/exhaustiveness-checking/), [2](https://rustc-dev-guide.rust-lang.org/pat-exhaustive-checking.html), [3](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/controlflow/#Switch)...), so when you modify your type, which is the source of truth for what your code is capable of, the language ensures all usages are up-to-date.

Exhaustiveness checking is so useful that I routinely reshape or augment existing types specifically so that they can fit the language's preferred style for it. This falls under "solve all problems once". Yes, I am an admitted [type system maximalist](https://brooker.co.za/blog/2020/06/23/code.html).

## Variable Scope

Try to reduce the number of ways variables could potentially interact with each other. Ideally, this means eliminating a variable entirely.

Every declared variable is another item to keep track of. The larger the scope of the variable, the longer one has to remember what the value is for and what changes, if any, the value has undergone since its declaration. Longer-lived variables also overlap with more other variables, increasing the number of possible interactions an unfamiliar reader has to consider.

### Don't Store Derived Values

Storing values derived from other values requires careful management of the derived value to ensure it is consistent with the inputs. This is a form of cache invalidation, which is a known [hard thing](https://martinfowler.com/bliki/TwoHardThings.html).

Instead, compute them on the fly when needed by the end consumer. Many languages have good, idiomatic ways to do this, like JavaScript closure-thunks, Java getters, and Python properties.

### Defer Declarations as Late as Possible

A variable declaration is a statement to your reader: "here, keep an eye on this". If you declare everything up front in your scope, you have maximized the number of possible interactions to consider. If you declare a variable without initializing it, you have most likely put your program into a temporarily-invalid state (that you presumably intend to resolve near-immediately).

Declaring variables closer to where they are used reduces possible interactions and likely gives you the opportunity to provide a useful initialization value.

### Shorten Lifetimes with Blocks (or One-use Functions)

Anonymous scoping blocks (if your language supports it) or one-use functions (otherwise) can be used to move the end of a variable's lifetime earlier. This complements moving the declaration later to minimize possible interactions with other variables. In cases where several intermediate values are juggled to produce some other value, an anonymous block can ensure those intermediate values can be forgotten about by the reader as soon as the block ends, rather than hang over their head through the rest of the function.

Some languages make this more ergonomic than others. Languages with blocks-as-values are best; languages whose only scope control is functions are acceptable, but one has to get used to the idea of breaking out single-use functions.

## Mutation and Side Effects

Try to reduce the number of possible states your program can be in. Ideally, values can be initialized once and never changed.

### Prefer Constant Variables

In languages that support it, declaring variables constant (heh) is recommended in all cases where it's possible. The majority of modern application glue code is not a performance bottleneck, and making the computer go slightly out of the way to compute and store a series of constants is rarely going to harm scalability.

Constants are both easier for a human to reason about, and may allow compilers and other tools to make optimizations under the hood to reclaim any lost performance. In extreme cases, code without mutation may run faster than faster-looking mutation-based code because optimizations like vectorization become possible.

### Minimize Mutations' Blast Radius

Where mutation cannot be avoided for practical reasons, encapsulate it in a (testable!) implementation where consumers can mostly or entirely ignore the grisly details. In many languages, this is a perfect application of classes, which can hide all intermediate/book-keeping values away from the consumer and only allow known-good operations at the right times. See also: [state machines](https://en.wikipedia.org/wiki/State_machine).

Functional-like programming is increasingly prevalent in historically-imperative languages. This is a Good Thing, and means that classes can be reserved as a signpost saying "here be dragons", rather than a Java-style code organization catch-all.

# Types

This section is general recommendations for types that do not fit in a narrower context.

See also [exhaustiveness checking](#use-exhaustiveness-checking).

## Enumerations v. Booleans

Booleans are a two-valued enumeration. Some languages make compilation decisions based on which you choose, but by and large which to use is a stylistic decision.

Nullable booleans should be avoided. They are a three-valued enumeration, where the null value has potentially-unclear or even accidental semantics and depending on the language/database/protocol support for null handling, may be an unnecessary footgun. Consider a user-controlled setting: does null mean "use the default at the time I close the settings page" or "use the default at the time the setting is used"? Instead of answering that question directly, either explicitly default the boolean at write time or define an enumeration with a member called `use_current_default` (respectively).

Boolean parameters should be used sparingly, as many call sites with boolean literals are reader-unfriendly. This is extra true if there are multiple boolean parameters.

## Keyword Arguments

Functions with many parameters are sometimes unavoidable. Mitigate the readability difficulty and ordering sensitivity by using keyword arguments, so the call sites are clearer to read and easier to write correctly.

In some languages this may require you to define a new type. These types often end up as [union types](https://en.wikipedia.org/wiki/Union_type), since it's rare that every parameter in a large parameter list is used in every code path, which may point to a beneficial refactor to split the methods or even re-combine the different paths (and corresponding parameters) back together.

Keyword arguments can even amplify the readability of good names where they are not strictly necessary to mitigate large parameter lists, as seen frequently in Swift.

# Version Control (i.e. Git)

With apologies to Mercurial, Perforce, Fossil, and (extra apologies) SVN/CVS users.

## Squash v. Rebase v. Merge into Mainline

Between squashes and merges I prefer merges, but _consistency_ is more important. If your team uses squashes, you must permit an escape hatch for occasional merges. Rebasing is never correct, both lying about development history while still cluttering it with non-"atomic" commits.

Consistency across the team means I always know where to go to get the development history of a change -- either in-repo or the code review tool -- and I can write/use automated tooling knowing what to expect. Mixing styles makes every dive into code history an unpleasant surprise.

Squash-based workflows must have an escape hatch for true merges to deal with scripted changes. This is for a few reasons:

- The script should _always_ be present in the history nearby the change it made, but it's likely undesirable to have it in the repo right now.
- The automated changes may be uninteresting for e.g. blame, and Git supports mechanisms to ignore named commits for blames and diffs.
- When debugging the change in the future, it is important to know if the issue originated in automated changes or related manual changes.

Squashing fails at all three.

## Force-pushing/Rebasing Feature Branches

Depends on the current state of the code review and quality of the review tools.

If nobody has reviewed your code, force-pushing is acceptable, and possibly even desirable in order to present the best-organized history to the first reviewer(s).

If a review is in progress, force-push only if the review tools support it in a first-class way. At the time of writing GitHub completely shits the bed, losing comments and unsetting review state all over the place, which is a huge waste of time for reviewers. A competitor I have used and like, [Reviewable](https://reviewable.io), supports force-pushes first-class and will show your reviewer the actual diff, even from a commit they saw previously that is no longer on the branch.

# Debuggability and Observability

## String Literal Log Lines

Log lines should have a (hopefully unique) string literal explaining their purpose. Pass relevant values in a separate parameter.

Interpolating relevant values into the primary log message makes it difficult for a human to quickly grep for the log's source, introduces unnecessary formatting uncertainty (do you quote string-type values? what if the string has a quote in it? what if your string is the word "null"?) and can make it difficult or impossible for logging tools to extract and search/aggregate on those values.

{% include common-footer.html %}

[^1]: Useful cross-language byte-identical find-replace has happened exactly once in my programming life (both professional and personal), but I want this document to be complete, so it's included. I wanted to find exact matches across JavaScript and JSON files, but JSON only permits double-quotes while JavaScript's Prettier formatter was configured for single quotes. Notably, the tool with this code was later rewritten to something simpler and more expressive such that maintaining formatting consistency became irrelevant (and impossible), which is the ideal outcome.
[^2]: I tried to come up with non _-tion_ words, but those nounified verbs come up all the time!

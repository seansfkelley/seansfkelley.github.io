---
layout: post
title: Code Writing and Review Opinions
---

## Table of Contents
{:.no_toc}

* TOC
{:toc}

## How to Read This Document

I titled this page "opinions" on purpose. Nothing here is objectively correct, but these opinions and styles are the main pillars which support my code writing and as such are the things I look for in code reviews.

Unless otherwise specified, none of these opinions are hard and fast. They overlap and sometimes trade off. Ultimately, code needs to serve an end, and sometimes that requires compromising on principles. Not often, though. :wink:

## Underlying Philosophy

These are more abstract concepts that drive the more specific opinions, below. These philosophies are idealistic and can't always be achieved within in the constraints of any given code review, but nevertheless should be strived for.

### Data First, Business Logic Second

> Show me your flowcharts [algorithms] and conceal your tables [data model], and I shall continue to be mystified. Show me your tables, and I won’t usually need your flowcharts; they’ll be obvious.
>
> - Fred Brooks, Mythical Man Month

If you don't know what values you're operating with, you can't do anything with them. Names, types and relationships between types should be the primary driver for how code is structured.

### Tools, Not Process

> If you haven't automated your last-year self out of a job, you aren't learning.
>
> - An ex-manager of mine

Don't do manually what can be done automatically. Put the work in now to find, configure or build the right tool for the job, then never think of that problem again. Documentation is no replacement for automation.

### Strive to Explain Intent

Code is an unambiguous, precise specification of behavior, so treat it like one. Computers don't need to have code explained to them, but people do. Write your code so it's clear what you intend to have happen, so that when it inevitably doesn't, someone can understand what you were trying to do.

This is intended to be a broader umbrella than "don't be clever", which is a corollary.

### Write Quality Code the First Time

Spend the time now to save the time later. Every corner you cut will be paid for dozens of times over with every reader of your code. Bike shed your names before you merge.

## Basic Code Style + Linting

Automated formatters like Prettier and Black are to be considered correct, even in weird edge cases, with _extremely_ rare exceptions enumerated below.

### Automated Formatters + Linting

Automated formatters are superpowered linters.

- Do not turn on any lint rules that are purely stylistic (e.g., operator spacing).
- Do consider turning on lint rules that are semantic (e.g. double-versus-triple-equals in TypeScript).
- When there is a conflict on style, the automated formatter is correct.
- Try to avoid changing the automated formatter's default configuration.

### Formatting Exception 1: Multi-line Regexes

Regexes are always hard to read. Unfortunately, long regexes are sometimes necessary. In the case where you cannot comment on a long nasty regex by pointing to some documentation (e.g. the classic [email regex StackOverflow question](https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression)), it's probably a good idea to break your regex up onto multiple lines and explain what each piece is doing.

In this case, automated formatters are likely to wreck your significant indentation or inline sections that were separated for clarity and should therefore be disabled.

## Comments

Comments should be used to explain _why_, not _what_ and definitely never _how_. Use them sparingly.

Code should strive to be self-explanatory. It is a specification of behavior, unlike comments, which are neither type-checked nor executed. If you're discussing behavior, it belongs in the code. If there is no way to write the code without making your reader wonder "why?", _then_ you put in a comment.

### Useful Comments

Useful comments are those that explain necessary but unusual code constructs, such as:

- Code taken from the internet.
- Working around weird APIs.
- Non-obvious side-effects.
- Satisfying some automated tool such as a linter.
- Magic constants.
- Hacks.

### Extraneous Comments

Common cases where comments are used and shouldn't be:

- Explaining an inline constant.
  - Instead, hoist it to a SHOUTING_CASE value, and if it still needs explanation, then consider a comment.
  - In the specific cases of numbers or strings, it can sometimes be useful to break the derivation of the value out into steps for emphasis, e.g., `const FIFTEEN_MINUTES = 15 * 60 * 1000;`
- Explaining a boolean parameter at a call site.
  - Instead, consider rewriting the called function to accept an enumeration or keyword arguments, forcing the call site to be clearer.
- Restating adjacent code, e.g., annotating the line `sorted_values = sorted(values, key=lambda v: v.name)` with  `# sort the values by name`
  - Instead, delete the comment.

### Comments Age Poorly

Comments get stale. When writing comments, keeping it about the _why_ makes the comment both more useful and more likely to last. Again, since comments are neither type-checked nor executed, they often get forgotten or ignored. Be careful when authoring comments to write them so they last: it's better to have no comment at all than a misleading one.

## Naming

Good names go a long way towards pre-empting comments. Following certain conventions make the code-reading experience smoother by not surprising your reader. They can even speed up code-writing by making you think "What exactly am I trying to express here?" rather than reaching for the first thing that comes to mind.

- **General**
  - Try to use at least two words to describe each thing. The clarity of any given name goes way up from one word to two. This is a guideline, not a hard rule; sometimes just `data` is the only suitable name.
    - Exception: in certain inline contexts, shorter names can improve clarity by reducing repetitive noise, such as in e.g. `all_possible_entries.filter(e => e.enabled)`.
  - When in doubt, more words in a name is better than fewer. Overshare.
  - Prefer well-known words like "get" rather than synonyms like "obtain".
    - Corollary: use boring, clear names almost all the time. Don't make your reader need a dictionary.
    - Exception: don't be afraid to use jargon when it's suitable. If you're overloading the subtraction operator, it's okay to say "subtrahend".
    - Exception: if you want to define something new with _very particular_ semantics, it can be useful to choose a word that doesn't have baggage and define it to mean what you want.
  - Try to avoid abbreviations. Your editor has autocomplete and it takes very little time to read "long" words. If you still want to, only do it if they are either (preferably both)...
    - _common in English_, such as "appt" for "appointment"
    - _obvious in context_, such as referring to the `mag` of a `Vector3`
  - Treat initialisms and acronyms as words for the purposes of casing. Write `OwaspVpnHttpHandler` instead of `OWASPVPNHTTPHandler`.
- **Functions** should have verb-y names including words like "get", "commit" or "write". This communicates that a function _performs an action_.
- **Variables and parameters** should have noun-y names that communicate _what_ role they play, but rarely _how_ (i.e., avoid including the type of the variable in its name).
- **Booleans** should be phrased...
  - _declaratively_, like `is_something()` rather than `check_if_something()`.
  - _positively_, e.g. `is_something_enabled`, not negatively, e.g., `is_something_disabled`. This reduces indirection by one level and helps avoid double negatives.

## Mutations, Lifetimes and Branching

Complexity in most run-of-the-mill programming comes from two sources: branching (control flow) and state management (variables).

### Control Flow

When writing code, you should strive to reduce the number of possible paths control can take through a given piece of code. This reduces the surface area for bugs and keeps complexity lower for your reader.

_Ideally_, you can eliminate a branch entirely by rolling it into another branch. A common pattern to achieve this is to use empty collections rather than null in the "empty" case.

If that isn't possible, try to consider the appropriate place for branching. Should it be aggressively localized, such as to a ternary? Should it be broadened to the point where it's selecting between different classes that implement some common interface?

### Variables

When writing code, you should strive to reduce the number of possible states. This reduces the surface area for bugs and keeps complexity lower for your reader.

_Ideally_, you can eliminate a variable entirely because its value can be derived from other value when necessary.

If that isn't possible, try to reduce the lifetime of the variable. Rather than defining it at the top of the enclosing function, calculate it right before it's used the first time. This reduces the number of ways that variable can interact with other variables and functions.

In languages that support it, declaring variables `const` is recommended in all cases where it's possible. We aren't writing highly performance-sensitive code, so it's okay to make the computer do a little extra work rather than using extensive in-place mutation or reusing names.

## If Block Matching

`if` blocks represent a choice point and control, either implicitly or explicitly, all code that comes after them. Prefer using explicit `else` even when it's not strictly necessary: it both provides a visual cue via indentation that the code in question is controlled by the `if` block and also that it _should_ be controlled by that block (rather than, say, sloppy programming leading to an accidental early-abort).

## Inlining v. Factoring Out

## Lean on the Type System

A blog post once used the phrase “type system maximalist”. I am a type system maximalist, to the degree that our languages are able to express it.

## Enumerations v. Booleans

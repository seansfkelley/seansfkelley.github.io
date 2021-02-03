---
layout: post
title: 'Javascript: The Bad Parts'
---

Last week I stumbled upon TC39's [record and tuple proposal](https://github.com/tc39/proposal-record-tuple) for the first time, and was really happy to see the language taking a long-overdue big step forward in safety and usability.

It also prompted me to write this post so that I don't have to repeat myself to those unfortunate souls who have to hear me rail against the language.

## Table of Contents
{:.no_toc}

* TOC
{:toc}

## Automatic Type Coercion

```js
assert(0 == "");
assert([] == "");
assert({} != "");
```

Maybe in the early days of the web when everyone was flying by the seat of their pants it made sense to paper over newbie mistakes like comparing a stringified number to a number literal.

That said, automatic type coercion is a feature very rarely seen in other programming languages. Even Python, which lets you overload almost every conceivable hook, tends to avoid this type of behavior. The cases it does appear in are usually highly restricted, such as allowing comparison between a datetime and a string, or a datetime and a number.

I can't think of a single case where it is desirable, from a correctness, readability and maintainability perspective, to allow comparing numbers to strings and come up with a "sane" result. [ESLint recommends against it as "good practice"](https://eslint.org/docs/rules/eqeqeq). This type of behavior should be opt-in, or at least highly restricted by default.

## Two Null Types: `null` and `undefined`

```js
assert(/foo/.test("bar") === undefined);
assert("bar".match(/foo/) === null);
assert(JSON.stringify({ foo: null, bar: undefined }) === '{"foo":null}');
assert(typeof null === "object");
assert(typeof undefined === "undefined");
```

JavaScript kind of worked itself into a corner on this one, because it wanted to silently report a null value for fields that didn't exist on objects. Unlike `==`, I can kind of see the value in this feature both during the flying-by-the-seat-of-your-pants phase and after. Objective-C, for instance, has well-defined semantics for sending messages to nil (or "calling methods on null" in more-normal terminology).[^1]

How, then, does one differentiate between "object does not have this field" and "object has this field, but it's null"? Do you even need to? This is actually a very tricky question which most languages sidestep by not having this feature at all -- it is an error to access an unknown field, even in languages where you can define fields dynamically through introspection.

JavaScript's approach is to instead dump this tricky question onto the end user, again and again and again. Some standard library methods return `null` in failure or no-op cases, some `undefined`. Some accept only one of them as the "do nothing" input and throw errors on the other. JSON serialization treats them differently. You can assign an object field to `undefined`, which makes it truly weird to understand if the field in question exists (but is undefined) or doesn't exist at all. They respond differently to `typeof` and `===`. Every corner of the language is a trap, even more so than the [billion-dollar mistake](https://en.wikipedia.org/wiki/Null_pointer#History)[^2] it already was.

Thankfully, and with immense irony, `==` can be used to mostly ignore the differences when doing the most common operation with null values, checking if they are null, since coercion treats them both the same.

## Dynamic `this`

```js
class Foo { getThis() { return this; }};
const fn = new Foo().getThis;
assert(fn() === undefined);
```

Dynamic `this` is a feature I truly do not understand the design of. In JavaScript, `this` is just syntactic sugar to name an implicit argument to an instance method, so in a sense, dynamic `this` is just giving you a mechanism to provide a value for that parameter.

The problem is that it's half-baked: you have to step carefully when passing around a function reference from an object lest you end up with `this === window` or `this === undefined`, both of which are certainly undesirable when dealing with those function references. But the implicit-by-definition nature of the `this` keyword strongly evokes C-family-style, unconfigurable `this`, which is flat wrong.

The closest fully-baked comparison I can think of is, as usual, Python. Python differs in two crucial ways: `self` is explicitly declared, thereby reminding you that it's just a parameter, not a keyword with special behavior, and you can only provide the value for `self` by invoking the method statically.[^3] It's effectively impossible to end up with the "wrong" `self` in the course of normal development, even when you're doing some light metaprogramming.

JavaScript's dynamic `this` is nothing more than a trap that ends up netting zero keystrokes saved -- think of all the usages of `bind` or fat arrows one needs to sprinkle around to compensate -- while adding cognitive overhead unique among common programming languages.

## Conflation of "Record" and "Map" Types

First, some definitions. A "record" type is one which has a well-known set of field names that can be accessed to retreive values. A "map" is a data structure that pairs up arbitrary keys with arbitrary values. A record can be thought of as a special case of a map that only allows string keys.

Until the introduction of ES6 `Map`, JavaScript had no map type. I have personally made and witnessed some pretty absurd workarounds for this shortcoming, including serializing map keys to JSON, which is both tedious and of questionable correctness (what if your serialization changes key ordering?). Before `Map`, JavaScript's answer to this extremely common operation was objectively and comprehensively bad.

## Value Semantics and the Failures of `Map` and `Set`

Following on from the previous section, `Map` didn't really fix many problems, practically speaking. Yes, JavaScript now had a dedicated map type, so objects-as-maps were theoretically obsolete. But  `Map` (and `Set`, which has all the same problems) operates using reference equality, not value equality.

The choice to use reference equality instead of value equality makes a lot of sense in context: JavaScript has a weak-to-nonexistent notion of value equality (or, more generally, comparisons by value). The only values for which value and reference equality are the same are primitives, so in the case where you were using objects as maps whose values were strings, numbers (coerced to strings) or booleans (coerced to strings), you may see an improvement in type sanity.

The use of reference equality mean that `Map` and `Set` wildly underdeliver on their promise to provide a sane alternative to JSON serializing objects to use them as map keys, because if you aren't extremely careful about maintaining reference equality

### The Failures of Map (and Set)

After `Map` (and `Set`)

### and the lack of a true map type

### and no, ES6 `Map` doesn't really count

## lack of useful collection types (set, map)

## legacy

### `with` blocks

### `eval`

### `var`

### `new Boolean` versus `Boolean`

## things that don't really matter that people like to complain about (or think are cool and unique)

### prototypal inheritance

### dynamicity of closure references (or: why do all of my closures defined in a loop refer to the same value)

### floating-point-only numbers

### optional semicolons


{% include next-previous.html %}

-------------------------------------------------------------------------------

[^1]: Objective-C is an extensively flawed and weird language in its own right, but let's not get into that here.
[^2]: Inflation and the pervasiveness of software mean that this cost is definitely _well_ above a billion at this point. But I don't fault C.A.R. Hoare, the null reference was inevitable and entirely reasonable. Optional types are big in imperative languages now, anyway.
[^3]: It's entirely possible there are other incantations that allow configuring `self`. But the point stands: Python does the sane thing by default when using method references, and requires extra effort to do weird stuff.

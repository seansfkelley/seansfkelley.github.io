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

```js
const map = {};
map[{ my: "object" }] = 10;
assert(map['[object Object]'] === 10);
```

First, some definitions. A "record" type is one which has a well-known set of field names that can be accessed to retreive values. A "map" is a data structure that pairs up arbitrary keys with arbitrary values. A record can be thought of as a special case of a map that only allows string keys.

Until the introduction of ES6 `Map`, JavaScript had no real map type at all. I have personally made and witnessed some pretty absurd workarounds for this shortcoming, including serializing objects as map keys into JSON, which is both tedious and of questionable correctness (what if your serialization changes key ordering?).

Before `Map`, JavaScript had no way to performantly _and_ correctly implement the basic map type that comes with all standard libraries. What one would expect to do when coming from other languages -- that is, to provide the object directly as the key -- would silently "succeed" with the utterly useless, dreaded `[object Object]` map key. Home-grown map solutions had to use expensive serialization or tree structures in order to maintain correctness, and did not have the slick syntactic support that objects-as-maps did.

## Reference Semantics and the Failures of `Map` and `Set`

```js
assert(new Set([1, 1]).size === 1);
assert(new Set([{}, {}]).size === 2);
```

Following on from the previous section, `Map` didn't really fix many problems, practically speaking. Yes, JavaScript now had a dedicated map type, so objects-as-maps were theoretically obsolete. But  `Map` (and `Set`, which has all the same problems) operates using reference equality, not value equality.

The choice to use reference equality instead of value equality makes a lot of sense in context: JavaScript has a weak-to-nonexistent notion of value equality (or, more generally, comparisons by value). The only values for which value and reference equality are the same are primitives, so in the case where you were using objects as maps whose values were strings, numbers (coerced to strings) or booleans (coerced to strings), you may see an improvement in type sanity.

However, the use of reference equality mean that `Map` and `Set` wildly underdeliver on their promise to provide a sane alternative to JSON serializing objects to use them as map keys, because if you aren't extremely careful about maintaining reference equality in the rest of your code, you will run into all manner of correctness issues: keys missing that you thought would be there, keys present that you thought you had deleted, duplicates...

Reference equality of objects and arrays is something that is generally swept under the rug in many idiomatic usages of objects in JavaScript. Spreading, destructuring and object literals in particular make it very easy to slice and dice and reassemmble objects that are reference-different but value-equals. Some libraries, like React, strongly encourage you to use spreading and destructuring extensively to ensure that any given object is immutable over its lifetime, while still allowing you to easily construct new, different objects. But if those objects are reference-different and value-equals, correctness checks and performance optimizations that would be obvious and free in other languages -- such as checking for cache hits with an object key -- are difficult to implement.

## Things People Complain About That I Don't Think Matter

### Prototypal Inheritance

I can't recall ever seeing any significant usage of prototypal inheritance that isn't exactly equivalent to a class hierarchy in other languages. Yes, you can reassign `__proto__`, and yes, non-class things can have prototypes that make them behave sort of like subclasses. I've seen the occasionally usage of these things, but in every single case they have boiled down to an unusual and roundabout way of saying `extends`. With "true" classes now in JavaScript, I think prototypal inheritance is basically irrelevant.

### Dynamic Nature of Closure References

A motivating code sample:

```js
const fns = [];
for (var i = 0; i < 3; ++i) {
  fns.push(() => i);
}
fns.forEach(fn => { console.log(fn()); });
```

(Note: this works "as expected" if you declare `let i` instead.)

I think this is fine. Some languages capture closed-over values by direct reference and some capture the whole environment and evaluate the reference later. They're better for different things, and you can always express patterns that are easier in one in some fashion in the other. You just have to learn which way your language functions.

### No Integers and No Doubles

The vast majority of code uses small integers and small floating-point numbers. It's somewhat frustrating that JavaScript uses an unusual standard that allows neither full (32- or 64-bit) integers or floats. But if these lower-than-normal limits or lack of integer/float separation matter to you, you should probably be using a different representation anyway, such as `BigInt` for currencies or strings for 64-bit database IDs.

### Optional Semicolons

I cannot fathom why the language designers bothered with this. Either make the language require seimcolons or not. Why is this a choice that developers have to make? Unlike `'` versus `"` (which allow nesting) or `var` versus `let` (which have different semantics), there is literally zero value to optional semicolons. It's pure flamebait.

## Lightning Round: Things That Thankfully Don't Matter Anymore

- `with`: terrible idea, glad it was dead on arrival.
- `eval`: fun while it lasted, but always a bad idea.
- `var`: block-scoped declarations are the right choice.
- `new Boolean()` versus `Boolean` (etc.): technically still an issue, but new standard library types are taking a stance to avoid more confusion.

{% include next-previous.html %}

-------------------------------------------------------------------------------

[^1]: Objective-C is an extensively flawed and weird language in its own right, but let's not get into that here.
[^2]: Inflation and the pervasiveness of software mean that this cost is definitely _well_ above a billion at this point. But I don't fault C.A.R. Hoare, the null reference was inevitable and entirely reasonable. Optional types are big in imperative languages now, anyway.
[^3]: It's entirely possible there are other incantations that allow configuring `self`. But the point stands: Python does the sane thing by default when using method references, and requires extra effort to do weird stuff.

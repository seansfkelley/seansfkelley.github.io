---
layout: post
title: "TypeScript Tricks for Fun and Profit"
date: 2020-09-10 19:00:00 -0700
---

I've been using TypeScript since about 1.8-ish (released early 2016), and in that time I've adopted a habit of trying to encode as much behavior as possible into the type system. After all, why think about writing code when I can tell TypeScript what kind of code I can write and it'll tell me how to do half of it? A few months ago I saw the phrase "type system maximalist" on either Hacker News or a blog linked from it, and since then I've used that phrase to describe myself.

So without further ado, here are, in no particular order, a number of neat TypeScript tricks/patterns I've found or (rarely) invented over the years that just resonated with my type system maximalism.

## Shadowing Types with Values

```ts
// Define a type, like a union type you want to later discriminate.
interface Foo {
  foo: string;
}

interface Bar {
  bar: string;
}

type FooBar = Foo | Bar;

// Also define a constant to shadow that type.
const Foo = {
  is: (v: FooBar): v is Foo => (v as Foo).foo != null,
};

// Then you can use the shadowed name as a type and a value simultaneously.
const fooBar: FooBar = { foo: "foo" };

if (Foo.is(fooBar)) {
  console.log(fooBar.foo);
}
```

[(Playground Link)](https://www.typescriptlang.org/play?#code/PTAEBEFMDMEsDtKgIagC4E8AOkA0oAbWAayVQFd5YB7edbJDa80Ad2XjXWsOTUgBOoACawAzgGMBsALYI+kAHQAoBPwHRkEpADFqPAN7LQoaPoBcoMWmnwA5gG5lAX2WrOgzdtAAhZEKMTACN-S2tbRxc3TBxQPWo-IQBeOP1QAB9ffydlEFAAQQIxHmEYBDJQCVprDi40HjEAC2RhalZ0ZrqGFSr4a1SeFMDQcUsACgA3S3jEgEpLCZGxAdAkgD5QSZRl+NnFMx4AQhT4cgICXBccvIAVRsg6JhYJDlByMSQ0e6tm1tZIYSgeDIGRkZaoGJkeCA1ATZAEchIMSyM5oDiQZhiAgYHrVLgHRLTfSJVagAymCygADkBypoGcOVg0E28UU4jGBP8s1mZOMlWq1AISgI1DsHOJ-n2+lmTmcQA)

One of my favorite patterns for cleaning up the ergonomics around type definitions is to shadow them with "namespace" consts with the same name. In this way, you can associate "static" methods with the type, and make them almost[^1] inseparable from their type. In particular, I often use this for type guards, because I like the ergonomics of importing a union type along with the type guards that allow me to inspect it for free.

This is very similar to [how classes affect the type and value namespaces](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#basic-concepts), though this technique can be applied to non-class types including unions, primitives and branded types (see below).

## Branded Types

```ts
// Define a user ID type that's "just" a string.
type UserId = string & { __userIdBrand: unknown };

// Get a user ID value somehow (more on that later).
const userId: UserId = "string" as UserId;

// Downgrade it to a string? No problem.
const someId: string = userId;

// But you can't assign arbitrary strings!
// ERROR: Type 'string' is not assignable to type 'UserId'.
const anotherUserId: UserId = someId;
```

[(Playground Link)](https://www.typescriptlang.org/play?ssl=1&ssc=1&pln=12&pc=38#code/PTAEBEFMDMEsDtKgIagK4GdICdQElxQAXATwAckiALZIgcg1ACIArTIplUDI7BAcwB0AKFIVQAVSzY8AE1ABebrwGgAZKADeoAPo7MOOQCFsyeLIBc6eAGt4AewDu8UAF8A3MOEhQAcUhEXAa4BKAAbsgANmhIGPYAtpBUTqAAFPH22Ej2LtS0oJG0OACUIgDGOTzo0nJWUobySgwq8Px0KIz1MrKe3mDgTq2mskiwgUT2XDx8rQD8oAByk2TY9gBGkZDx5ZWBcYm1yjP8itUNvT5GaIEk9migZWZ0gcgYGLD8LsjYa2Om2CQjgIMABCPqgACiACUoQB5KFWAAq5CQzWO7VgjAcLzeH3gyA2lEmYlRXTkdB28CqZns1BwZMskhqjW4CUgcncQA)

Branded types are a well-known type trick, but I include them here because as far as I know they are, in their particulars, unique to TypeScript and they're the first type hack I ever came across, so I still have a soft spot for them.

Branded types inject a splash of nominal typing into an otherwise structurally-typed language by abusing the notion of a structural type. In the example above, I define a `UserId` type that is a string with an additional, _mandatory_ (and that's important) field. But a value that actually matches this type is never constructed at runtime: it's only ever regular strings. The brand field exists only in the space of types, and creating an "instance" of a branded type is generally accomplished by a type assertion (or equivalent).[^2]

Once can build all kinds of niceties around branded types, especially if you combine it with shadowing (described above).

```ts
// Define the branded type.
type UserId = string & { __userIdBrand: unknown };

// Some utility methods, using the type shadowing pattern.
const UserId = {
  // Type guard for generic strings.
  is: (v: string): v is UserId => USER_ID_REGEX.test(v),
  // Safe cast from generic strings.
  as: (v: string): UserId => {
    if (UserId.is(v)) {
      return v as UserId;
    } else {
      throw new Error("could not convert to user ID");
    }
  },
  // Unsafe cast from generic strings.
  unsafeAs: (v: string): UserId => v as UserId,
};

// Only allow loading a user using a value known to be a user ID, rather than arbitrary strings.
async function fetchUser(id: UserId) {
  // ...
}
```

[(Playground Link)](https://www.typescriptlang.org/play?#code/PTAEBEFMDMEsDtKgC4AskCMBOBDeATSfFATwAdIA6AKGXKQFUBnSLASWIF5QnksEA5qABkoAN6gA+pICuLdvgBCuAgC5QM+AGt4AewDu8UAF8A3NWohQAZV0BbJDOSwANrDqgHaXfiYAaDSZBFHRSCh5UHHwDYLIcZGRWeBoAY114XlBmVg5QbjFqUFArABV6UAEZHCxiaF0sCshEfhSePkEmGiLYJnUACgA3dV5+eAEASnUB0B6s+VzOAD4s6wBRACVJNnBJddWAcVWADUpE3kHxv0LisGscaCQUnEzoLHtG5thWkY6u0Gf+kM2qMJupsgo8ssCkVutBQH1wRxKD0LuNxNcYaAsJBkDIsEZps85jl8OZMcZQJAXCx0Ziimg3vpQIgmassG8sH0AERpGQuYh6ZCgNLwAasIXIXSBVigbZc8ZkmHGa7GK5FKwMDL3R7PIWvd4CJqsL7A37XTRMbUAQV68KBPzGk2JEKWoEJTGdHCuZgsVgA8vAXCR-i4XAZQGGosEcNKGnJo26cC4ZEgdAYjJLQBgkDG5DLtgFcGgZWg8P8sBh3LgsMGHQJOtRniR4K1oJoUs50qAHsgUqhwX1YPgwfN8GjoTdQJRp9RjEA)

### Branded Type Payloads

```ts
// Define a generic branded type.
type Id<T> = string & { __payload: T };

// Define a method that takes a generic branded ID, and returns a value of the corresponding type.
async function fetchById<T>(id: Id<T>): Promise<T> {
  // ...
}

// "Instantiate" an instance of the generic type as a concrete type.
type UserId = Id<{
  username: string;
  email: string;
}>;

// Load the concrete ID type (ignore the cast!) and get the corresponding payload back!
const { username, email } = await fetchById("id" as UserId);
```

[(Playground Link)](https://www.typescriptlang.org/play?#code/PTAEBEFMDMEsDtKgIagOaUQJ1gY1AEZbLwAmkpoALgJ4AOkAdAFC0OgCSpAPACoB8oALygAzlRzw0oAGSgA3qAD6SushoAbAPbJSALlC9QAXwDczZiAgwESVAFtIVABZbKL5FWrIA1pFEo6JiQOPhEJOSUHOAANChkoFhOAK5Y8AGoAG7IGslIWtDUzki4WlhJonRaZAjSbEzMyKI08PjQya1UsNWg0E64zgBCNFx8-AAUsPqcPAIAlAYAClha9rCikGMKzKCgVowHzMYWVgBEHOlUJF2ekKfxoAjiJLj5hS5IGNh41PR2GaBSq0klQkPUWPVQABVDZYLjCGbceQ7UDJWHwZCOAziSRocy7SD2ZCwDTYiS1czGfjmSxgAAyOncxUB1VwIKQ0V+7EmaHgZTBzNwTSoAEI5vFKBgvB8WeV-FUalJQGpNIzCMhcD4RcwgeIFKj0ZjIHFCcSNCYEcgAO7Erx9KgDYZccanKb3JrQ2FcOamIA)

I first saw this in [Palantir's Redoodle library](https://github.com/palantir/redoodle/blob/0e6effda99ccd25f32e4ef6bf8450af0c71d29f3/src/TypedActionString.ts#L33). It's a further extension to branded types that doesn't just create a single nominal types, but allows a generic definition of branded types along with definitions of branded instances that carry type information around with them.

I've found this pattern really useful for any patterns that would otherwise be [stringly-typed](https://blog.codinghorror.com/new-programming-jargon/), such as for Redux actions (a la Redoodle, above) or an RPC framework I wrote, where the type-branded string you provide states both which method to invoke and what the required inputs and returned outputs are.

## Type Maps

```ts
// Define a type that specifies, say, legal input shapes for particular keys.
type Inputs = {
  foo: {
    foo: string;
  };
  bar: {
    bar: string;
  };
};

// Define a corresponding output type.
type Outputs = {
  foo: string;
  bar: number;
};

// Correlate inputs with outputs, allowing typesafe invoke-by-name.
function doStuff<K extends keyof Inputs>(key: K, input: Inputs[K]): Outputs[K] {
  // ...
}

console.log(doStuff("foo", { foo: "input value" }).trim());
```

[(Playground Link)](https://www.typescriptlang.org/play?ssl=1&ssc=1&pln=22&pc=60#code/PTAEBEFMDMEsDtKgIagC4E8AOS0Atk1QBnHAY1jkmIBoTkM6AbSAc2SdASwFcjiCOYqGgB7AE6gsycWlhkeTGaADWkDMQB0AKEw5QASXi80wgLygA3ttAjRogFxWbtu45JpxCVgG4XAXz9bACMZJ2tXUFDxJ2JPbyDQQO1k7RAIGAQkVDIJcWosUXgAE29QUT4TdGxIHT0kAHlKvnNnWzF3OK94Xxdop3geAFtgyHE-VPSAYTzIJTQkbhbQAHdYfHLm0zoOJlE1nuqhZGhF+AA3UTUAWmCMa-hkIdrtaB54Mjki0GLRAGU0DxoNAADwAaVAkAAHgsSsI1BhRNBDMYWgA+AAUCKcYLoSzQTiMJmIAG0wQBdACUTiaaGJZPJbVA6U0rJS2m0uXgxFELE0e1YGN+AKB0AxAHIOuK6JY3E5xfjQOcODxIOKkpTNPEhhjKZSfEA)

## Assignability Type "Tests"

```ts
// Continuing the example from above, but simplfied.
type Inputs = {
  foo: string;
  bar: string;
};

type Outputs = {
  foo: string;
  bar: number;
};

// Stylistically, open a block to reduce name pollution.
{
  // Ensure that values are assignable one direction...
  const _1: keyof Inputs = (null as any) as keyof Outputs;
  // ...and also the other direction.
  const _2: keyof Outputs = (null as any) as keyof Inputs;
  // If you have noUnusedLocals turned on, you might need a trivial use to quiet the compiler.
  _1;
  _2;
}
```

[(Playground Link)](https://www.typescriptlang.org/play?noUnusedLocals=true#code/PTAEGEHsDsBcEtoFdEHNSwBYFNTYB4CGAtgA4A2uAZgE6TGiEBGkAbtgDShNKygDO8MuSrxsAEwB0AKFgBPUrgCS0Ur36gAvKADe00KCqRIALgGwaaANz7uhGmf4Xr0gL43ZC3AHlea2BraegZGpuaW0Kg2Bkz2ZsjETNg0Nu7S0iCgAMry5PBO8ADGhOTkclyQitCM3OSQhQDWGJCgNBJIhbjQJLikkKW88DAywaCZAKLQ-EhtGJiEfKwlSNga9riE-IKo3UyUoDC44vBthQjDkjIGhTBOoAD6AIxmDdhykFSgKv6BoAAUyFKjDW0DkAEpgaBXu9Pr5YD9omMwJdJIRoOJGOR+C0sLhILiaKBjqdztArqAblM+PcAEwvN4fUBwn5af6A8iQtHgyHQxnfdSIzJKT7vJCgebsUDQSAAVWQ-AkABl6iUNLAZtAJAdoFxRaBiPBUJg+JqtYQMJZWPASqAkArmqAAI4obB8XEU+ikeCUGjkp6I2mpIA)

## Derive Runtime Values from Types

```ts
typesafeUnionMembers;
```

## Exhaustiveness Checking

```ts
assertNever;
```

This trick dates to long before the `asserts` keyword was added to the language, but even with a first-class notion of assertion methods, it still has a ueful niche all its own.

## Form Field Spec Generator

## Libraries

type-zoo
typical
what else?

## Footnotes

[^1]: Since [type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export) were added, you can now separate the type from its const namespace if you so desire.
[^2]: Equivalent might be typing the output of `JSON.parse`, or declaring the types of some API call going over the wire without runtime validating them.

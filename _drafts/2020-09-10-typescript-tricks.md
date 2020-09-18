---
layout: post
title: "TypeScript Tricks for Fun and Profit"
date: 2020-09-10 19:00:00 -0700
---

I've been using TypeScript since about 1.8-ish (released early 2016), and in that time I've adopted a habit of trying to encode as much behavior as possible into the type system. After all, why think about writing code when I can tell TypeScript what kind of code I can write and it'll tell me how to do half of it? A few months ago I saw the phrase "type system maximalist" on either Hacker News or a blog linked from it, and since then I've used that phrase to describe myself.

This post is a hodge-podge of tricks I've found to improve ergonomics or maintainability of code that's written types-first. That is, I usually try to specify problems entirely in types before writing any business logic around them.[^1] That way, I can make changes type-first, and if I've done my job right, the compiler will guide me to all the places I need to update or, in its own roundabout way via the error messages, tell me exactly what I have to write.

## Table of Contents
{:.no_toc}

* TOC
{:toc}


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

One of my favorite patterns for cleaning up the ergonomics around type definitions is to shadow them with "namespace" consts with the same name. In this way, you can associate "static" methods with the type, and make them almost[^2] inseparable from their type. In particular, I often use this for type guards, because I like the ergonomics of importing a union type along with the type guards that allow me to inspect it simultaneously.

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

Branded types inject a splash of nominal typing into an otherwise structurally-typed language by abusing the notion of a structural type. In the example above, I define a `UserId` type that is a string with an additional, _mandatory_ (and that's important) field. But a value that actually matches this type is never constructed at runtime: it's only ever regular strings. The brand field exists only in the space of types, and creating an "instance" of a branded type is generally accomplished by a type assertion (or equivalent).[^3]

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

## Branded Types with Payloads

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

This is a further extension to branded types that doesn't just create a single nominal types, but allows a generic definition of branded types along with definitions of branded instances that carry type information around with them.

I first saw this pattern in [Palantir's Redoodle library](https://github.com/palantir/redoodle/blob/0e6effda99ccd25f32e4ef6bf8450af0c71d29f3/src/TypedActionString.ts#L33). I've found it really useful for any patterns that would otherwise be [stringly-typed](https://blog.codinghorror.com/new-programming-jargon/), such as for Redux actions (a la Redoodle) or an RPC framework I wrote, where the type-branded string you provide states both which method to invoke and what the required inputs and returned outputs are.

## Type Maps

```ts
// Define a type that specifies, say, legal input shapes for particular keys.
interface Inputs {
  foo: {
    foo: string;
  };
  bar: {
    bar: string;
  };
}

// Define a corresponding output type.
interface Outputs {
  foo: string;
  bar: number;
}

// Correlate inputs with outputs, allowing typesafe invoke-by-name.
function doStuff<K extends keyof Inputs>(key: K, input: Inputs[K]): Outputs[K] {
  // ...
}

console.log(doStuff("foo", { foo: "input value" }).trim());
```

[(Playground Link)](https://www.typescriptlang.org/play?#code/PTAEBEFMDMEsDtKgIagC4E8AOS0Atk1QBnHAY1jkmIBoTkM6AbSAc2SdASwFcjiCOYqGgB7AE6gsycWlhkeTGaADWkDMQB0AKARpI46MjJIAkvF5phAb22gRo0QC5Qt+-bHOSacQlYBuO1AAX0D7ACMZFzd3SPEXYh8-MJDA4O1tEAgYBCRUMglxaixReAATP1BRPkt0bEgdPQMjE1AAeRq+GyDPBKT4AKC4l3geAFtwgzSMrIBhQsglfS4LLtAAd1h8Ks6rOg4mUU2BuqFkaCQEADdRNQBacIw7+GQxhu1oHngyOVLQMtEAGU0DxoNAADwAaVAkAAHvpysI1BhRNBQOZLMQAHwACmRLkhdG4fBcGK6AG1IQBdACULg6aExlKpriCWU0HO06W0BXgxFELE0h1YOIBwNB0BxACJPFK6NYHF4pcSiFcODxIFKQjTNEkxjiaTTAkA)

Type maps serve a similar purpose to strings branded with type payloads, but have different maintainability/ergonomic tradeoffs. In particular, type maps keep all the definitions localized, allowing you to derive the set of legal options with a simple `keyof` (rather than maintaining a separate union type) and don't require users to import/convert/cast strings into their branded equivalents.

I've used this pattern for the aforementioned RPC framework, which you can see a notional version of in the example above.

## Assignability Type "Tests"

```ts
// Continuing the example from above, but simplfied.
interface Inputs {
  foo: string;
  bar: string;
}

interface Outputs {
  foo: string;
  bar: number;
}

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

[(Playground Link)](https://www.typescriptlang.org/play?#code/PTAEGEHsDsBcEtoFdEHNSwBYFNTYB4CGAtgA4A2uAZgE6TGiEBGkAbtgDShNKygDO8MuSrxsAEwB0AKESxsNKoQDGuAJLRSvfqADe00KCqRIALgGwaaANwHuhGuf6Wb0gL7TZcBUtWgA8rxasDr6hsZmFlbQqLaGTA7myMRMCrYe0iCgAMqwAJ7k8M7wyoTk5HlckKTY0Izc5JDKANYYkKA0Ekh+0CS4pJDlvPAwMmGgWQCi0PxInRiYhHysZUjYOg64hPyCqL1MlKAwuOLwncoIo5IyhsowzqAA+gCM5s3YeZBUoBrBOgC8oAAFMhyowNtA8gBKcGgd6fb6BWB-OITMDXSSEaDiRjkfjtLC4SCEmigU7nS7QG6gO4zPiPABMbw+XwCQW0oEBIKQYO2jEhML58NZv20qKyam+nyQoEW7FA0EgAFVkPwJAAZJplHSwObQCRHaBcaWgYjwVCYPj6g2EDBWVjwMqgJBqtqgACOKGwfEJNPopHglBo1JeqMZ6SAA)

If you've contributed to DefinitelyTyped, you might already be familiar with the concept of compile-time unit tests: code that never runs, but is checked for type errors as part of the test suite. I don't write many of these in production code, but checking two types for equality is one that comes in handy every now in then, especially when two types need to agree on something (like the type maps example, above).

The idea is that, instead of dragging in [new tooling that can inspect the AST](https://github.com/SamVerschueren/tsd) or that has [some complex `TypeEquals` assertion type](https://github.com/tycho01/typical/blob/master/src/type/TypesEqual.ts), I can abuse the fact that two sets ("types") are equal if they are non-strict subsets of ("assignable to") each other. The example above shows the full incantation I tend to use: actual code that executes but does nothing useful, colocated with the types in question, stuffed into a block to make it extra-clear that this is something unusual.

## Derive Runtime Values from Types

```ts
type State = "paused" | "running" | "finished";

function unionMembers<K extends string>(r: Record<K, unknown>): K[] {
  return Object.keys(r) as K[];
}

// Type-safely define a list that contains every option _exactly_ once.
const ALL_STATES = unionMembers<State>({
  paused: true,
  running: true,
  finished: true,
});
```

[(Playground Link)](https://www.typescriptlang.org/play?#code/C4TwDgpgBAysCGxoF4oCIzwK4GcIBM0oAfdAJywDtKBLSgcyNLQDM6acALAtAbgCh+LKgGNgNAPaUoVSZQCyEALYAjCGRwAeANJQIADySV8OKDmBk69AHwAKMgC4oAJQgiJZfDoA0MygGtKCQB3SmsASidtAG0AXSgAb34oKDIIYCwyaQB5FQArN2AAOn8IEBx7cKh4UxjYgQBfQQB6ZqgAFXAIAFoceBYIABsQKHwINkpoeChBjmAoYE5EKHdKBDpTCAA3dRGJMHEpKAB9A3gxYeOoKREIIv5V8ygAQQAZV+OYduf2gFEYKCoWRSRSqdRaOCICB2JIpTC4AhOCxYCDeZKpKi0BhIiio9ETDjcfA4lFohrhXhAA)

Bridging values from type space to value space helps keep your types as the source of truth for what's allowable. I inevitably add functions like `unionMembers` to every project that grows past a certain size. Functions like these help the exhaustive, manually-defined types be a single source of truth while minimizing redundant exhaustive manual definition of values that can be used at runtime, usually in dynamic contexts (think: iterating over string literal union members to populate a dropdown).

One can take this pattern very far. I once wrote a type `FormField` that would take an arbitrary (possibly nested!) type and require you to define an object that represented a "spec" for a corresponding form that some React code could interpret for rendering. So if you wanted to define a form for editing user details, you could `const USER_DETAIL_FORM: FormField<Omit<User, "id">> = { ... };` and the compiler would tell you exactly what to write. It was a little messy, though, so I think if you're doing something like that [io-ts](https://github.com/gcanti/io-ts) is probably a better bet.

## Exhaustiveness Checking

```ts
type Kind = "foo" | "bar";

function assertNever(x: never): never {
  throw new Error("should be unreachable");
}

function doStuff(kind: Kind) {
  if (kind === "foo") {
    return ...;
  } else if (kind === "bar") {
    return ...;
  } else {
    // Ensure that adding a new union member doesn't silently do nothing.
    // Note that you have to return here if you've enabled noImplicitReturns.
    return assertNever(kind);
  }
}
```

[(Playground Link)](https://www.typescriptlang.org/play?noImplicitReturns=false#code/C4TwDgpgBA0glgOwCZQLxQEQDMD2ONQA+mARgIYBOGA3AFC1YCuCAxsHDglGQM48QVgAOQgA3AQAoAHgC4oCMQICUcheIpQA3rShRgACwo4A7vIimAohSMUJGHvpyMANihLRmFCGRb6yJZwgMJToAX3omVnZOKCQcAGVgRiwsCQBrRCQ5eGQlLR0oOCwodMy0VHRsPGD83V0vJIouADpWul1QqAhnfkLi0uRyyvIqPO06qAbGJqhW5vaoTu7e8bqAejWoCwQeaegDMmBuJCREAHNuM1NmDi4AWwg79w04iB4EAHIjnjhAhGBnCBYjh5DgDOdmgVdBsoEIwfs-EcQE4oH5xHoQVMZvoBNAilBkYwPuiIAh-IEUAgcABJO5gZxwFhwYAAJQgjR2kImWK4vH4ghE6gGSBCBXCoSAA)

This trick dates to long before the `asserts` keyword was added to the language, but even with a first-class notion of assertion methods, it still has a useful niche all its own. Anywhere enumerations or discriminated unions are involved, `assertNever` is never (hah) far behind. I learned about this first from [basarat's excellent book](https://basarat.gitbook.io/typescript/type-system/discriminated-unions#throw-in-exhaustive-checks).

## Deeper Type Inspection

```ts
// Based off of https://github.com/Microsoft/TypeScript/pull/21316 ctrl-f FunctionPropertyNames.
type PropertyNamesOfType<T, U> = Extract<
  { [K in keyof T]: T[K] extends U ? K : never }[keyof T],
  string
>;

// Based on Lodash, but typed to only accept field names that are typed as strings.
function keyBy<T extends object, K extends PropertyNamesOfType<T, string>>(
  v: T[],
  field: K
): Record<string, T> {
  // ...
}

interface AnObject {
  foo: string;
  bar: number;
}

keyBy([] as AnObject[], "foo"); // okay!
keyBy([] as AnObject[], "bar"); // not okay!
keyBy([] as AnObject[], "baz"); // really not okay!
```

[(Playground Link)](https://www.typescriptlang.org/play?noImplicitReturns=false#code/PTAECEEMGcFMBNQHsBmLnoBYBdsAdoAuEAcwEttMBXAIwDoBjJAW2AFkyGAnJaVbYABUAnnlgBlbmTwC8VADbzgAJgCMAZlUA2UA2xd5AWnQAxKgDs9ZJOYAKPMV2zCAcpGaxodAFDOxoeyRHZzcPaAB5FBExAB5BABpQAFUAPlAAXlAAUQAPfUg9GO9QUABvUABtAGlQMnNQAGtYYVRQQQBdQjbq9tBYPNhzeGhk0AB+UBqu81gAN1guUABfCqaW9A744tBofTqSbxSAbm9vEAgYBGR6gBkkeBhMRJoqbFA-K+wka-lhUAKGLAZKAUGRYPJEOZ3J53phIG9IFxYO9RFcYDs9uYSF5vCgLFYbI1muBhHE+gMhiMkDQAFawPSJGr9bCDYYBBwLELQiJRVFxRK7Lj7FIpAAU21mXUEFXaWxKoPB8C6VW8AEougAlelILjwGKC-aJQRpUrbc50C3eJanOosrgoArIgCC5nCtPpb1N8qQSC6BqxJxKNER0yozBoCxO1u8axJopl-xGLrddL0MsSACIUD6M6qjqBzkgGpBhABCGPE4Tx3ro5PutOy0AZ4NcXP587mJBvIsl8uxqsJ2uu+vYdNN4MALzbBbASMgij+ne7xbLQA)

```ts
// Pick the union member that matches the given discriminant.
// from: https://stackoverflow.com/questions/48750647/get-type-of-union-by-discriminant
type DiscriminateUnion<
  U, // union
  F extends keyof U, // discriminant field
  V extends U[F] // discriminant value
> = U extends Record<F, V> ? U : never;

interface Book {
  kind: "book";
  author: string;
}

interface Movie {
  kind: "movie";
  director: string;
}

type Media = Book | Movie;

const DEFAULT_MEDIA_BY_KIND: {
  [K in Media["kind"]]: DiscriminateUnion<Media, "kind", K>;
} = {
  book: {
    kind: "book",
    author: "Roald Dahl",
  },
  movie: {
    kind: "movie",
    director: "David Lynch",
  },
};
```

[(Playground Link)](https://www.typescriptlang.org/play?noImplicitReturns=false#code/PTAEAUEsGMGtQC4AsCmoCuA7SB7ToBbFAgIxQCdEkBDBQ26VAZyrQHNIA3FfAE0ibRykApEzVMCAHQAoEKABm5HAQBcoJAgQAHJqpBME1ODm7kFAGxwB3KdBXAAjuhSHcmJsAAsADgDsAKwADABsXn7AbCgIALQIAJ7aKDE4CjFY7jEk8TH8gsKi4pIyCUmgACICQiJitCgAqth4ADwyoKD1ADSg8hl4baAAYqAoAB4IPLwssCjxqR3d8nnVhRJ0CpAoFrwDAGoj45Ms9QDagwC6PWDLBbWSoJzUFi4yAHygALwdBxOYU6AAJRQ9nIvGag26u3eAH5vupMCgzABuGQyMQTczGNAAIRwOHgAG8BrAxLx1AAiEh42DklHtajoZA4cjqQzCTBsFEAX1R6IoCixoAAsqZNqAie0SX8KQRRShaQN+ORgQhmayEOzOTIeSVEmghSh+NRPqBcfjQAAfYVylEyeweOjlACigwAgvUADIAFQA+kKneUAJKun3YgCaPoA0oGAHLldQS0AnSOgMTCw2QagnclS3jk87ndSVfI1cQTRruZoGo3dHOk8ndSOvbkmxNU-EJgaS0kU9s0zpd0AMpks0DkgE4J68CrUJAWBsDLkD9qyzibTvtbvSserzYLzegJUqtVj8rUNfTj3xTCMfegJfapFAA)

Both `PropertyNamesOfType` and `DiscriminateUnion` crop up in every project at least once, but rarely more than that. The definitions are quite obtuse though, so I always find myself scrambling to dig through old projects to find the definitions before I forget what I was trying to write.

## Other Type Libraries

There's a handful of libraries out there that can do some pretty neat stuff in in the type space. Here's a non-exhaustive list if you want to see more weird abuses of the type system in action.

- [type-zoo](https://github.com/pelotom/type-zoo)
- [typical](https://github.com/tycho01/typical)
- [typelevel-ts](https://github.com/gcanti/typelevel-ts)

type-zoo is the one I use for production most frequently, because it has the tiny set of most-useful utilities I use most often.

## Other Explorations of the Type System

I recently came across [TSpell](https://github.com/kkuchta/TSpell) and I just had to share. What a lovely monstrosity.

Somewhat more practically, [type-challenges](https://github.com/type-challenges/type-challenges) is a good way to exercise some of the more esoteric aspects of the type system.

## Footnotes
{:.no_toc}

[^1]: Here is the part where I mention the [Fred Brooks quote](https://en.wikiquote.org/wiki/Fred_Brooks) about flowcharts and tables.
[^2]: Since [type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export) were added, you can now separate the type from its const namespace if you so desire.
[^3]: Equivalent might be typing the output of `JSON.parse`, or declaring the types of some API call going over the wire without runtime validating them.

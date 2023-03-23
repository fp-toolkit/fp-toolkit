# fp-toolkit ⚒️

**Table of Contents**

-   [Introduction](#introduction)
-   [Design goals](#design-goals)
-   [Modules overview](#modules-overview)
-   [Comparison to fp-ts](#comparison-to-fp-ts)
-   [Tips for debugging](#tips-for-debugging)
-   [Contributing](#contributing)
-   [Local development](#local-development)

## Introduction

This library is for TypeScript developers who want to get `$#!7` done using functional programming techniques but without all the esoteric ivory tower mumbo jumbo that usually comes along with that. This is **not** an attempt to make [TypeScript](https://www.typescriptlang.org) into something that it isn't meant to be; we're not trying to shoehorn everything from a "pure" functional language like [PureScript](https://www.purescript.org) or [Haskell](https://www.haskell.org) into TypeScript. This library is much more closely aligned with [F#](https://fsharp.org) in terms of design. It is "functional first," but allows developers to take and use the best parts of both the functional and imperative paradigms.

This library focuses on a select handful of types taken from the functional paradigm that are **incredibly useful for solving real-world programming problems**. It doesn't care about monoids or semigroups, applicatives or endofunctors.

**TL;DR** &mdash; If you want category theory, this is not the library for you.

## Design goals

1. Clear documentation & lots of examples
1. Make the type system work for us, not the other way around
1. No esoteric names or functional programming mumbo jumbo
1. No category theory
1. An API that's as simple as possible but no simpler
1. Focus on function purity and data immutability
1. Consistent API across modules

## Modules overview

This library aims to provide a set of types and functions that help to model real-world programming problems in a type-safe, concise, readable, and testable way:

### [Function composition](src/composition/index.ts)

The function composition module exposes `pipe` for right-to-left pipelining of values through a set of functions, and it exposes `flow` for right-to-left function composition.

### [Array](src/Array.ts)

The `Array` module is a set of useful, type-safe functions for working with `readonly` arrays using functional composition/pipelining. It offers functions like:

-   `uniq`
-   `sortBy`
-   `groupBy`
-   `union`
-   `take`
-   `skip`
-   ...and many more!

### [NonEmptyArray](src/NonEmptyArray.ts)

The `NonEmptyArray` module is a set of useful, type-safe functions for working with `readonly` arrays that contain at least one element. It offers _additional_ functions on top of the `Array` module like:

-   `range`
-   `destruct`
-   `make`
-   `first`
-   ...and more!

### [Async](src/Async.ts)

The `Async` module helps you model and manage asynchronous workflows. Best of all, `Async` computations are _Lazy_, which means no work will start until you explicitly ask it to! The `Async` module offers:

-   `sequential`&mdash;execute a collection of `Async` computations in series and collect the results
-   `parallel`&mdash;execute a collection of `Async` computations in parallel and collect the results
-   `delay`
-   `bind`&mdash;chain `Async` computations together, one after the other
-   `tee`&mdash;for easy debugging
-   ...and more!

### [Result](src/Result.ts)

The `Result` module is a simple, predictable, and type-safe way to model the outcome of an operation that can fail. `Result`s come in handy in tons of situations: network calls, parsing unsafe input, DOM updates that may fail to apply, etc. The `Result` module offers:

-   `match`&mdash;get readable pattern matching semantics
-   `tryCatch`
-   `tee` & `teeErr`&mdash;for easy debugging
-   ...and many more functions!

### [AsyncResult](src/AsyncResult.ts)

The `AsyncResult` module helps you model in a predictable, type-safe way any kind of async operation that can fail. (It's just the `Async` type with a more specific "inner value.")

-   `tryCatch`&mdash;to keep exception handling at the boundaries of your app
-   `match`&mdash;pattern match against the inner `Result`
-   `bind`&mdash;for chaining multiple async operations that can fail together such that they only happen if each preceding operation succeeds
-   ...and more!

### [Option](src/Option.ts)

The ubuqituos `Option<T>` type. For those of you who are sick of null reference exceptions and want a way to model optional values that forces you to deal with the possibility of null, while retaining the fluidity of function composition pipelining. This module gives you:

-   `ofNullish`
-   `toNullish`
-   `filter`
-   `refine`
-   `defaultValue`
-   `defaultWith`
-   `map` & `bind`
-   ...and more!

### [Enums](src/Enums.ts)

The `Enums` module offers a way to work with enums in a more ergonomic way without the overhead of having to think about the nuances of the built-in `enum`s that TypeScript provides. Use the `enumOf` function and you get for free:

-   `match` & `matchOrElse` functions for exhaustive pattern matching
-   an automagical `parse` function
-   an array of all valid `values`

### [Variants](src/Variants.ts)

The `Variants` module offers a much more ergonomic way to work with **non-generic** discriminated unions in TypeScript than you get out-of-the-box. Use a simple object describing each union case and the data it holds and you get a generated union type, constructor functions, and exhaustive/partial pattern matching functions for free!

If you're looking for something more full-featured (and also way more complex), check out the amazing [variant](https://github.com/paarthenon/variant) library.

### [Deferred](src/Deferred.ts) & [DeferredResult](src/DeferredResult.ts)

The `Deferred` and `DeferredResult` types are a kind of analogy to the `Async` and `AsyncResult` types. The `Async*` types model the work itself; the `Deferred*` types model the _state_ of the ongoing async operation. These two types are incredibly useful in Redux reducer functions (or vanilla React `useReducer` hooks) because they can succinctly model exactly and only the valid states of an asynchronous operation. And they do that without "flag soup" of a bunch of loosely related boolean flags that are _implicitly_ related to each other.

-   `match`
-   `matchOrElse`
-   ...and more!

### [EqualityComparer](src/EqualityComparer.ts) & [OrderingComparer](src/OrderingComparer.ts)

These modules make structural equality and decidable ordering of elements in TypeScript much easier. Easily describe how you would like types to be compared using functions like:

-   `ofStruct`&mdash;effortlessly define the structural equality for an object type
-   `deriveFrom`&mdash;derive an equality or ordering comparer from one you already have
-   `getComposite`&mdash;combine ordering comparers using a "and then by ..., and then by..." approach
-   ...and more!

### [function](src/function.ts)

This module gives you two useful functions to make debugging easier in a functional pipelineing paradigm:

-   `tee`
-   `teeAsync`

### [Map](src/Map.ts)

Work with `Map` data structures in a type-safe and immutable way. Offers helpful utilities like:

-   `iter`
-   `reduce`
-   `filter`
-   ...and many more!

### [Nullable](src/Nullable.ts)

Work with types that may be `null | undefined` in a fluid way. The nullish-coalescing `??` and elvis `?.` operators only get you so far, because they require that you use a method-chaining approach. Using function pipelining with the `Nullable` module you can use any function you write with things like:

-   `map`
-   `bind`
-   `defaultWith`
-   ...and more!

### [String](src/String.ts)

A bunch of useful functions for working with strings in a functional paradigm.

-   `trim`
-   `capitalize`
-   `split`
-   ...and more!

## Comparison to `fp-ts`

This library was heavily inspired by [fp-ts](https://github.com/gcanti/fp-ts). `fp-ts` is a phenomenal library if what you want to do is pure functional programming that is heavily influenced by category theory.

If you have done more with `fp-ts` than a pet project, you'll know that as soon as you peek under the covers, you're greeted with all kinds of esoteric language: there is higher-kinded polymorphism, kleisli composition, instances of applicatives, monoids, monads, semigroups, oh my! 😱 Moreover, there are _SO_. _MANY_. _MODULES_. The API surface is enormous! (And that completeness is intended to be a feature for users, not a bug.)

While `fp-ts` is a fantastic library for its own purpose, its documentation is sparse and its API is huge, which makes it have an incredibly high learning curve. Many of the names chosen for functions are esoteric. **In sum, it was written for power users.**

`fp-toolkit`, on the other hand, is designed to be much more minimal. No category theory. No enormous API surface area to learn and master. **We just kept the bits that are really useful for making real-world applications.**

And, with common-sense names, documentation, and examples for nearly every function, the learning curve should be greatly reduced for onboarding even developers who are not familiar with functional programming!

## Tips for debugging

One complaint that is frequently lodged against functionally-oriented code is that it is harder to debug. That complain is not entirely without merit&mdash;but it is also easily avoidable! When using functional pipelining and left-to-right composition, the easiest way to get access to and debug intermediate values is to use `tee` functions.

### Tee and crumpets

The `tee` function gets its name from visualizing a literal plumbing pipeline:

```
|
├ <- This is the tee
|
```

You can imagine the "flow" (of data, in this case) going downwards. The `tee` "splits off" from that main branch so that you can do something else with the data flowing through the pipeline.

### Debugging with tee

Being able to "branch off" means that we can use tee to do things like log intermediate values. Consider this basic example just using the plain `tee` function from the function module.

```ts
import { pipe, tee, String, Array } from "fp-toolkit"

const x = pipe(
    "cheese",
    tee(console.log), // logs "cheese"
    String.split(""),
    tee(console.log), // logs ["c", "h", "e", "e", "s", "e"]
    Array.reverse,
    tee(console.log), // logs ["e", "s", "e", "e", "h", "c"]
    Array.head,
    tee(console.log) // logs `Option.some("e")`
) // => `Option.some("e")`
```

As you can see, using `tee` gives you access to the value being passed through the function pipeline **without affecting that value as it's being passed through**. This means you can execute _any arbitrary side effect_ against the value as it's being passed through.

Alternatively, if you wanted to open up an intermediate value to breakpoint debugging, you could pass a function with a `{ }` body. This example uses `teeAsync` just to demonstrate:

```ts
import { pipe, flow, teeAsync, String, Array } from "fp-toolkit"

// curried version of `.then`, for illustrative purposes only
const mapPromise =
    <A, B>(f: (a: A) => B) =>
    (promise: Promise<A>): Promise<B> =>
        promise.then(f)

// assume we have some promise representing an API response
declare const apiResponse: Promise<string>

const x = await pipe(
    apiResponse,
    teeAsync(r => {
        // r is something like "status: ok"
        console.log(r) // accessible for breakpoint debugging
    }),
    mapPromise(flow(String.split(" "), Array.head, String.capitalize)),
    teeAsync(firstWordCapitalized => {
        // "Status:"
        console.log(firstWordCapitalized) // accessible for breakpoint debugging
    })
) // => resolves to something like "Status:"
```

`teeAsync` will log the inner value of the promise once it resolves, whereas if you try to use plain `tee` with promises, you will end up just having access to the `Promise` object (which may actually be useful in some scenarios). Note again, using `tee*` functions **does not change the value being passed through the rest of the function pipeline**.

### All the tees

Many of the modules in `fp-toolkit` have support for `tee` functions to enable easy debugging, logging, and side effects.

-   `Option.tee` executes side effects on inner `Nome` values
-   `Result.tee` executes side effects on inner `Ok` values
-   `Result.teeErr` executes side effects on inner `Err` values
-   `Async.tee` executes side effects on inner `Async` values

## Contributing

Contributions to this library are welcomed and encouraged! Feel free to log new issues and open pull requests from forks. Clearly, issues with clear communication, code samples, and thorough explanation and reasoning will be actioned first. PRs need to have addressed all the adjacent issues: documentation, examples, and solid test coverage.

In other words, if you open an issue that just says, "there is a bug with this thing," don't exepct that to get much traction. Or if you open a PR that is lacking any test coverage or has no documentation, again&mdash;don't expect that to get much traction.

## Local development

Here are the important things for getting started developing on this project:

-   We are using [vite](https://vitejs.dev) to build/bundle and [vitest](https://vitest.dev) to test
-   `npm run test` starts running tests in watch mode
-   `npm run test:coverage` runs tests with coverage using `c8`
-   `npm run build` builds the library with vite
-   `npm run lint` lints the code with [eslint](https://eslint.org)
-   `npm run fmt` uses [prettier](https://prettier.io/docs/en/) to format all the things
-   `npm run docs` uses [TypeDoc](https://typedoc.org) to generate a static documentation website

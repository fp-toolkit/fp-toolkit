/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable  @typescript-eslint/no-unsafe-call */

/// ATTRIBUTION: https://github.com/gcanti/fp-ts/blob/master/src/function.ts

/**
- [Jump to Pipe](#pipelining-with-pipe)
- [Jump to Flow](#flowing-with-flow)

Both JavaScript and TypeScript have great support for the functional programming paradigm because
they support functions as first-class values. That is, functions can be assigned to variables, passed
around as arguments to other functions, and can be freely constructed and typed in the same way as
any other values.

The functional programming paradigm takes this a step further by making function composition the
primary (but not always exclusive!) means by which large and complex applications are built.

React itself is a prime example. Using Function Components to construct a user interface is essentially
just composing lots of small functions (read: components) together to make one larger function (the 
root component of your application component tree).

### Math-y definition

In its most abstract and pure mathematical sense, function composition is simply taking the result
from one function and passing it to another function. Consider the following code snippet:

```ts
const f = (n: number) => n * 20
const g = (n: number) => n + 4

// define a new function `h` that is the _composition_ of `f` and `g`
const h = (n: number) => f(g(n))
```

Notice that the composition essentially reflects passing the value first to `g`, then passing the
resultant value immediately to `f`. Of course, we can keep composing functions all the way down the
road like `f(g(h(z(42)))`.

## Pipelining with `pipe`

Because function composition is so useful and prevalent in the functional paradigm, it helps to make
it as readable and convenient as possible.

The `pipe` operator is a way to re-organize function composition so that it reads linearly, like a
pipeline... hence its name! Using the `pipe` operator, the nested mess above could be written as follows:

```ts
const result = pipe(
    42,
    z,
    h,
    g,
    f
)
```

In plain english: "Start with the value 42. Pass that value to `z`. Then pass the resultant value to `h`.
Then pass the resultant value to `g`. Then pass the resultant value to `f`."

**Note:** Pipelining requires unary functions (functions that take a single argument) to work properly. This
is why generally functionally-oriented libraries like this one favor curried function signatures.

### Examples

Function composition with `pipe` is the primary motivation for using currying and partially applying
functions. Consider the following annotated code example:

```ts
// lets assume we have access to some basic string functions with these signatures
declare const capitalize: (s: string) => string
declare const exclaim: (s: string) => string
declare const duplicate: (s: string) => [string, string]

// note that the following functions are curried
declare const split: (splitter: string) => (s: string) => string[]
declare const join: (joiner: string) => (as: string[]) => string
declare const map: <A, B>(f: (a: A) => B) => (as: A[]) => B[]
declare const flatMap: <A, B>(f: (a: A) => B[]) => (as: A[]) => B[]

const result = pipe(
    "hello there",
    split(" "),                             // ["hello", "there"]
    map(s => pipe(s, capitalize, exclaim)), // ["Hello!", "There!"]
    flatMap(duplicate),                     // ["Hello!", "Hello!", "There!", "There!"]
    join("<>")                              // "Hello!<>Hello!<>There!<>There!"
);
```

As you can see, this fashion of function composition allows us to "snap together" (like LEGO bricks)
small and simple functions to build up more complicated logic and data transformation pipelines that...

1. are more _declarative_ than _imperative_&mdash;they describe what we would like done at a high level,
   they don't tell the computer how exactly to do it
2. require no intermediate throw-away values

For instance, you could rewrite the above pipeline along these lines:

```ts
const splitResult = "hello there".split(" ")
const mapResult = splitResult.map(s => {
  const capitalized = capitalize(s);
  return exclaim(capitalized);
})
const flatMapResult = mapResult.flatMap(duplicate)
const joinResult = flatMapResult.join("<>")
```

See how you have to manually declare the result of each step and pass that explicitly to the next "step"
in the flow?

Of course, in this instance, you could _probably_ achieve a similar syntax with fluent method chaining,
because JavaScript provides a lot of prototype methods for strings and arrays that are interoperable.
But that is something of a special case for strings and arrays in particular. More importantly, method
chaining requires you to [monkey patch](https://en.wikipedia.org/wiki/Monkey_patch) the global prototype
to be able to fluently chain non-built-in functions together.

This example is just to demonstrate how the `pipe` allows you to get rid of the usually-required intermediate
result assignments that are threaded through to the next call using any arbitrary functions, _regardless
of what is available as instance methods_.

### TC39 proposal

There is a [stage 2 proposal](https://github.com/tc39/proposal-pipeline-operator) to make the pipeline operator
(`|>`) built-in to JavaScript because it is a high-demand language feature. TypeScript generally implements
TC39 proposals once they hit stage 3.

## Flowing with `flow`

Let's revisit part of the example from above:

```ts
const result = pipe(
    "hello there",
    split(" "),
    map(s => pipe(s, capitalize, exclaim)), // notice how `s` is only used as the initial value for `pipe`?
    flatMap(duplicate),
    join("<>")
)
```

Whenever you see a lambda where the lambda argument is only used as the initial value, you can likely
replace that with `flow`.

So, the above could be re-written:

```ts
const result = pipe(
    "hello there",
    split(" "),
    map(flow(
        capitalize,
        exclaim
    )),
    flatMap(duplicate),
    join("<>")
)
```

You can think of `flow` like `pipe` where the initial value becomes the implicit first argument to the
function. So, for example, these two function definitions are equivalent:

```ts
declare const double: (n: number) => number
declare const addTwenty: (n: number) => number

const doubleThenAddTwenty1 = (n: number) => pipe(n, double, addTwenty);
const doubleThenAddTwenty2 = flow(double, addTwenty);
```

The fancy term for `flow` is left-to-right function composition. But, frankly, it is generally easier
to just think about `flow` as a `pipe` where the initial value of the `pipe` becomes the implicit first
argument to the function that `flow` produces.

Or, another way to think about it is that `pipe` starts with a **value** then accepts a pipeline of
functions, and returns a **value**. `flow`, on the other hand, starts with a **function** and accepts =
other functions to compose together and returns a **function** that is "waiting" to be passed a value.

Yet another way to conceptualize it is that immediately passing a value to a function composed with
`flow` is identical to using `pipe` starting with the value, so the following two are identical:

```ts
const result1 = pipe("help", capitalize, exclaim);

const result2 = flow(capitalize, exclaim)("help");
```

### A word of warning

Because of how TypeScript's compiler works, `pipe` will almost always give you better type inference
than `flow`. Especially when you start to work with generic types like `Option`s or `Array`s, you
will likely find that TypeScript gets confused rather frequently if you overuse `flow`, so don't abuse it!

Moreover, abusing or overusing `flow` can actually end up making your code _less_ readable than
it would be with more straightforward `pipe`s.

**As a rule of thumb**, you should _usually_ constrain your use of `flow` to small local functions
where you already have good type inference, like in the example above.

@module Composition
*/

/* c8 ignore start */
/** Left-to-right function composition. See module-level docs for more. */
export function flow<A extends ReadonlyArray<unknown>, B>(
    ab: (...a: A) => B
): (...a: A) => B
export function flow<A extends ReadonlyArray<unknown>, B, C>(
    ab: (...a: A) => B,
    bc: (b: B) => C
): (...a: A) => C
export function flow<A extends ReadonlyArray<unknown>, B, C, D>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D
): (...a: A) => D
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E
): (...a: A) => E
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E, F>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F
): (...a: A) => F
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G
): (...a: A) => G
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H
): (...a: A) => H
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I
): (...a: A) => I
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I, J>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J
): (...a: A) => J
export function flow(
    ab: Function,
    bc?: Function,
    cd?: Function,
    de?: Function,
    ef?: Function,
    fg?: Function,
    gh?: Function,
    hi?: Function,
    ij?: Function
): unknown {
    switch (arguments.length) {
        case 1:
            return ab
        case 2:
            return function (this: unknown) {
                return bc!(ab.apply(this, arguments))
            }
        case 3:
            return function (this: unknown) {
                return cd!(bc!(ab.apply(this, arguments)))
            }
        case 4:
            return function (this: unknown) {
                return de!(cd!(bc!(ab.apply(this, arguments))))
            }
        case 5:
            return function (this: unknown) {
                return ef!(de!(cd!(bc!(ab.apply(this, arguments)))))
            }
        case 6:
            return function (this: unknown) {
                return fg!(ef!(de!(cd!(bc!(ab.apply(this, arguments))))))
            }
        case 7:
            return function (this: unknown) {
                return gh!(fg!(ef!(de!(cd!(bc!(ab.apply(this, arguments)))))))
            }
        case 8:
            return function (this: unknown) {
                return hi!(gh!(fg!(ef!(de!(cd!(bc!(ab.apply(this, arguments))))))))
            }
        case 9:
            return function (this: unknown) {
                return ij!(hi!(gh!(fg!(ef!(de!(cd!(bc!(ab.apply(this, arguments)))))))))
            }
    }
    return
}
/* c8 ignore end */

// ATTRIBUTION: https://github.com/gcanti/fp-ts/blob/master/src/function.ts

/* c8 ignore start */
/**
 * A version of left-to-right function composition that starts with a _value_.
 * Commonly referred to as function pipelining, for obvious reasons.
 *
 * See module-level docs for more.
 */
export function pipe<A>(a: A): A
export function pipe<A, B>(a: A, ab: (a: A) => B): B
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C
export function pipe<A, B, C, D>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D
): D
export function pipe<A, B, C, D, E>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E
): E
export function pipe<A, B, C, D, E, F>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F
): F
export function pipe<A, B, C, D, E, F, G>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G
): G
export function pipe<A, B, C, D, E, F, G, H>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H
): H
export function pipe<A, B, C, D, E, F, G, H, I>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I
): I
export function pipe<A, B, C, D, E, F, G, H, I, J>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J
): J
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K
): K
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L
): L
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M
): M
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M,
    mn: (m: M) => N
): N
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M,
    mn: (m: M) => N,
    no: (n: N) => O
): O

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M,
    mn: (m: M) => N,
    no: (n: N) => O,
    op: (o: O) => P
): P

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M,
    mn: (m: M) => N,
    no: (n: N) => O,
    op: (o: O) => P,
    pq: (p: P) => Q
): Q

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M,
    mn: (m: M) => N,
    no: (n: N) => O,
    op: (o: O) => P,
    pq: (p: P) => Q,
    qr: (q: Q) => R
): R

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M,
    mn: (m: M) => N,
    no: (n: N) => O,
    op: (o: O) => P,
    pq: (p: P) => Q,
    qr: (q: Q) => R,
    rs: (r: R) => S
): S

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J,
    jk: (j: J) => K,
    kl: (k: K) => L,
    lm: (l: L) => M,
    mn: (m: M) => N,
    no: (n: N) => O,
    op: (o: O) => P,
    pq: (p: P) => Q,
    qr: (q: Q) => R,
    rs: (r: R) => S,
    st: (s: S) => T
): T
export function pipe(
    a: unknown,
    ab?: Function,
    bc?: Function,
    cd?: Function,
    de?: Function,
    ef?: Function,
    fg?: Function,
    gh?: Function,
    hi?: Function
): unknown {
    switch (arguments.length) {
        case 1:
            return a
        case 2:
            return ab!(a)
        case 3:
            return bc!(ab!(a))
        case 4:
            return cd!(bc!(ab!(a)))
        case 5:
            return de!(cd!(bc!(ab!(a))))
        case 6:
            return ef!(de!(cd!(bc!(ab!(a)))))
        case 7:
            return fg!(ef!(de!(cd!(bc!(ab!(a))))))
        case 8:
            return gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))))
        case 9:
            return hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))))
        default: {
            let ret = arguments[0]
            for (let i = 1; i < arguments.length; i++) {
                ret = arguments[i](ret)
            }
            return ret
        }
    }
}
/* c8 ignore end */

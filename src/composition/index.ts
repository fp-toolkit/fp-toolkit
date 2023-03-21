/**
- [Jump to Pipe](#pipelineing-with-pipe)
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

## Pipelineing with `pipe`

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

export { pipe } from "./Pipe"
export { flow } from "./Flow"

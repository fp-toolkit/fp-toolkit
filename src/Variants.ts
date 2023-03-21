/**
Variants allow you to more easily create and work with discriminated unions than you can
out-of-the-box with TypeScript.

**This bears repeating:** the type that is exported by `VariantOf` is _just_ a plain
discriminated union. It's like a discriminated union PLUS.

If you find yourself working with many kinds of discriminated union types in TypeScript,
you will likely be writing a ton of boilerplate code over and over for each one: record
type definitions, manually exporting a union type, then writing a constructor function
for each case, followed by writing each `match` and `matchOrElse` function by hand while
making sure to enforce exhaustive checks manually. This also has the unfortunate side effect
of increasing your unit test API surface area, since each `match` function now needs to be
unit tested individually. Using variants allows us to skip both the boilerplate code and
the boilerplate test code.

Moreover, using variant-flavored discriminated unions means we can sprinkle in other helpful
features like scoping, where you can reuse the same variant structure but scope the discriminants
without making the rest of the code more verbose. This is particularly useful for things like
redux actions which conventionally are scoped like `domainArea/actionName`, but when dealing
with each case, you don't want to have to manually write out things like `domainArea/` over and over.

## Basic usage

In this example below, we have a `Pet` object and `Pet` type that we're exporting. It may seem
surprising for the object and the type to have the exact same name, but TypeScript is able to
infer from context which you're trying to reference. (That is because one name lives in the world
of _types_ and the other name lives in the world of _values_.)

```ts
export const Pet = variant({
    dog: (name: string) => ({ name }),
    cat: (livesLeft: number) => ({ livesLeft }),
    fish: {},
})
export type Pet = VariantOf<typeof Pet>
```

**Aside:** if you squint hard enough, you should see that this API is designed to read concisely,
like [ML-family](<https://en.wikipedia.org/wiki/ML_(programming_language)>) languages that have more
first-class support for discriminated unions. For example, in F#, a similar type definition might look like:

```fsharp
type Pet =
    | Dog of name: string
    | Cat of livesLeft: int
    | Fish
```

The `Pet` object will give you access to the [helper methods](#helper-methods) mentioned below while
the `Pet` type gives you a type in the shape of your discriminated union.

```ts
import { Pet } from "@/types"

// Simple constructor
const myPet = Pet.dog("Rex")

// Simple matching
const sayHelloToPet = Pet.match({
    dog: "Hello dog!",
    cat: "Hello cat!",
    fish: "Blub blub fish!",
})

// Equivalent to:
const sayHelloToPetWithSwitch = (pet: Pet) => {
    switch (pet._tag) {
        case "Dog":
            return "Hello dog!";
        case "Cat":
            return "Hello cat!";
        case "Fish":
            return "Blub blub fish!";
        default:
            return "This should not happen!"; // Have to handle this case somehow
    }
}

// The generated `Pet` type is:
type PetByHand =
  | {
      _tag: "Dog";
      name: string;
    }
  | {
      _tag: "Cat";
      livesLeft: number;
    }
  | {
      _tag: "Fish";
    };

// ^^ Note that this type is JUST a standard TS discriminated union! 
```

## Concepts

### Discriminant

The discriminant will be the property that is used to distinguish between the various types.

By default, this property is `_tag` but using {@link variantC}, you can call this property
something else. For example, for Redux actions, you will want to use `type` as the discriminant
property (as is virtually always used with Redux actions).

As an example, consider the `Pet` variant type.

```ts
const Pet = variant({
    dog: (name: string) => ({ name }),
    cat: (livesLeft: number) => ({ livesLeft }),
    fish: {},
})
type Pet = VariantOf<typeof Pet>
```

Our `Pet` type will look like:

```ts
{
    _tag: "Dog",
    name: string;
} |
{
    _tag: "Cat",
    livesLeft: number
} |
{
    _tag: "Fish"
}
```

As you can see, the property names we pass into `variant` get translated into the different possible
values of the discriminant property (`_tag`).

### Scope

Scopes can be used when you have the possibility of different variant types with the same name, such
that one can't be passed in for another. This is common with our [Redux actions](#redux-actions) where
multiple action variants might share the same name (e.g., `rowAdded`).

Practically speaking, this means that instead of the `AvailabilityHours.rowAdded` and `AvailabilityDates.rowAdded`
both having a discriminant property of `rowAdded`, they have `AvailabilityHours/rowAdded` and
`AvailabilityDates/rowAdded`, respectively. See the example below for an illustration of this. (Note
Redux actions use `type`, instead of `_tag` as we did above.)

Availability Hours:

```ts
{
  type: "AvailabilityHours/RowAdded";
}
```

Availability Dates:

```ts
{
  type: "AvailabilityDates/RowAdded";
}
```

As you can see, it is now impossible to pass in the `rowAdded` action from AvailabilityHours
into a function that expects an AvailabilityDates action variant, and vice versa. The compiler
simply won't let you do it!

## Helper Methods

All examples below use the following `Pet` variant type to illustrate their usages.

```ts
const Pet = variant({
    dog: (name: string) => ({ name }),
    cat: (livesLeft: number) => ({ livesLeft }),
    fish: {},
})
type Pet = VariantOf<typeof Pet>
```

### Constructors

Used to create an instance of a particular variant type. If a function is used for the variant
type (like `dog` and `cat` above) then that function becomes the constructor function. Otherwise
if there is no function and just an empty object (like `fish` above), then there is no traditional
constructor function, but just a static instance you can reference.

**Note:** Because TypeScript is a structurally typed language, discriminated union constructors
behave somewhat differently than in other languages where discriminated unions are more prevalent.
For instance, the `Pet.dog` constructor below doesn't return the type `Pet`, but actually returns
the literal object type `{ _tag: 'dog', name: string }`, which is _assignable to_ `Pet`. In some cases,
this is very desirable because you know the exact shape of the object without pattern matching.
In other cases, it can lead the TypeScript compiler to make more restrictive (or "narrow") type
inferences than you may expect. This is a compiler-level behavior, so just something to watch out for!

```ts
const rexTheDog = Pet.dog("Rex")
const nineLivesTheCat = Pet.cat(9)
const myGoldFish = Pet.fish
```

### match

`match` can be used similarly to a `switch` but is much more concise and
forces exhaustive checking at compile time.

```ts
const isFish = Pet.match({
    dog: false,
    cat: false,
    fish: true
});

const pet = ???; // Assume we won't know what kind of pet until runtime.

if (isFish(pet)) {
    console.log("You got yourself a fish there!");
}
```

As you can see above, hard coded literals can be given to the matcher, but lambda functions also work!
If given a lambda, you'll automatically have type-safe access to the unique properties of that variant
type. (This is essentially equivalent to the semantics of pattern matching.)

Lambdas are especially useful if (a) you need to access the destructured case data (e.g., the dog's
name like below) to produce the result, or (b) you want to avoid doing an expensive or long-running
computation unless it is actually needed.

```ts
const describePet = Pet.match({
    dog: ({ name }) => `This dog's name is ${name}.`,
    cat: ({ livesLeft }) => `This cat has ${livesLeft} lives left!`,
    fish: () => "This is just a fish, nothing special about it."
    // Note: this case wouldn't need to be a function since the fish variant type does not have any data on it.
})

const pet = ??? // Assume we won't know what kind of pet until runtime.

console.log("Say hello to my pet!")
console.log(describePet(pet))
```

Note you can also mix and match between hard-coded literals and functions. Since `fish` has no additional data,
I would probably write the above like this.

```ts
const describePet = Pet.match({
  dog: ({ name }) => `This dog's name is ${name}.`,
  cat: ({ livesLeft }) => `This cat has ${livesLeft} lives left!`,
  fish: "This is just a fish, nothing special about it.",
})
```

### matchOrElse

There are plenty of instances where you don't want your matching to be exhaustive but instead have a
"default" (`orElse`) case. Like in the `isFish` example above, it feels a bit redundant to mark
everything not a `fish` with `false`, right? With `matchOrElse`, you could simplify
it to the following:

```ts
const isFish = Pet.matchOrElse({
    fish: true
    orElse: false
})
```

`matchOrElse` can take any number of variant types (except all of them, use `match` in that case 😁) so you
aren't restricted to just "fish or else!".

```ts
const isInterestingPet = Pet.matchOrElse({
    dog: true,
    cat: true,
    orElse: false,
})
```

(This assumes we're confident that `dog` and `cat` are the only interesting pets that we will ever have,
which may not be a safe assumption 😉)

Just like `match`, `matchOrElse` can also take functions that will give you the data attached to the
particular variant instance:

```ts
const describePet = Pet.match({
    dog: ({ name }) => `This dog's name is ${name}.`,
    cat: ({ livesLeft }) => `This cat has ${livesLeft} lives left!`,
    orElse: "Sorry, nothing interesting about this pet.",
})
```

### types

Simply gives you an object that gives you all the variant types with their corresponding discriminant
property value. We've found this to be mostly useful for tests (especially tests where we need to verify
that certain redux actions have been dispatched in a particular order).

```ts
const dogTag = Pet.types.dog // Evaluates to "Dog"
```

If a scope is included in the variants, this will also be included here.

```ts
const rowAdded = AvailabilityHours.types.rowAdded // Evaluates to "AvailabilityHours/RowAdded"
```

## VariantC

In the majority of cases, usage of `variantC` should not be necessary. The `C` stands for "customize",
so this version of `variant` allows you to customize your variant slightly. Currently the two things
that can be customized are the [discriminant property](#discriminant) and the [scope](#scope).

We use `variantC` (but abstracted away) with our [Redux Actions](#redux-actions) to use scope names
(because that is more important with redux actions where collisions are more likely) and rename our
discriminant property to `type` (per redux action convention).

Another (very contrived) example of using `variantC` might be:

```ts
const discriminantProperty = "petKind"
const scope = "CoolPets/"
const CustomPet = variantC(
    {
        dog: (name: string) => ({ name }),
        cat: (livesLeft: number) => ({ livesLeft }),
        fish: {},
    },
    discriminantProperty,
    scope
)
type CustomPet = VariantOf<typeof CustomPet>
```
@module Variants
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Identity } from "./prelude"
import { String } from "./string"

/**************
 * Helper Types
 ***************/
type DefaultDiscriminant = "_tag"

type DefaultScope = ""

type Func = (...args: any[]) => any

type EmptyObjGuard<T> = T extends ObjectGuard<infer O>
    ? object extends O
        ? O
        : never
    : never

type Scoped<T extends string, Scope extends string = ""> = Scope extends ""
    ? T
    : `${Scope}${T}`

type ObjectGuard<T extends object> = Exclude<T, any[] | Func>

type NonEmptyStringKeys<T> = Exclude<Extract<keyof T, string>, "">

/********************
 * Foundational Types
 *********************/

type VariantInputObject = Record<string, Func | object>

type Variant<
    Case extends string,
    Data extends object = object,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = Identity<
    {
        readonly [key in Discriminant]: Scoped<Case, Scope>
    } & Readonly<Data>
>

type CaseReturnType<T> = T extends (...args: any[]) => infer R
    ? R extends object
        ? R
        : never
    : EmptyObjGuard<T>

type VariantConstructor<
    Args extends any[],
    Case extends string,
    Data extends object = object,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = (...args: Args) => Variant<Case, Data, Discriminant, Scope>

type VariantConstructorOrValue<
    T,
    Case extends string,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = ObjectGuard<CaseReturnType<T>> extends never
    ? [never, "Only objects are allowed as variant data. Wrap variant data in an object."]
    : T extends Func
    ? VariantConstructor<Parameters<T>, Case, CaseReturnType<T>, Discriminant, Scope>
    : Variant<Case, CaseReturnType<T>, Discriminant, Scope>

type VariantConstructors<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = {
    readonly [Case in NonEmptyStringKeys<Input>]: VariantConstructorOrValue<
        Input[Case],
        Capitalize<Case>,
        Discriminant,
        Scope
    >
}

type _VariantOf<
    Input extends VariantInputObject,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = {
    [Case in NonEmptyStringKeys<Input>]: Identity<
        Variant<Capitalize<Case>, CaseReturnType<Input[Case]>, Discriminant, Scope>
    >
}[NonEmptyStringKeys<Input>]

/*****************
 * Composite Types
 ******************/

type VariantMatcher<A, Input extends VariantInputObject = Record<string, never>> = {
    readonly [Case in keyof Input]: ((data: CaseReturnType<Input[Case]>) => A) | A
}

type VariantMatch<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = <A>(
    matcher: VariantMatcher<A, Input>
) => (instance: _VariantOf<Input, Discriminant, Scope>) => A

type PartialVariantMatcher<
    A,
    Input extends VariantInputObject = Record<string, never>
> = Partial<VariantMatcher<A, Input>> & {
    readonly orElse: (() => A) | A
}

type VariantMatchOrElse<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = <A>(
    partialMatcher: PartialVariantMatcher<A, Input>
) => (instance: _VariantOf<Input, Discriminant, Scope>) => A

type VariantTypes<
    Input extends VariantInputObject = Record<string, never>,
    Scope extends string = DefaultScope
> = {
    readonly [Case in NonEmptyStringKeys<Input>]: Scoped<Capitalize<Case>, Scope>
}

type VariantModule<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = {
    readonly match: VariantMatch<Input, Discriminant, Scope>
    readonly matchOrElse: VariantMatchOrElse<Input, Discriminant, Scope>
    readonly types: Identity<VariantTypes<Input, Scope>>
} & VariantConstructors<Input, Discriminant, Scope>

/**
 * Extracts a "plain old" discriminated union type from a `VariantModule` constructed
 * with {@link variant} or {@link  variantC}.
 */
export type VariantOf<V> = V extends VariantModule<
    infer Input,
    infer Discriminant,
    infer Scope
>
    ? Identity<_VariantOf<Input, Discriminant, Scope>>
    : [never, "Error: V must be a variant module"]

/**********************
 * Generative Functions
 ***********************/

const isFunc = (f: Func | object): f is Func => typeof f === "function"

const getVariantCtors = <
    T extends VariantInputObject,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
>(
    inp: T,
    discriminant: Discriminant,
    scope: Scope
): VariantConstructors<T, Discriminant, Scope> =>
    Object.entries(inp).reduce((acc, entry) => {
        const [_case, ctor] = entry
        const capitalizedCase = String.capitalize(_case)
        const scopedCapitalizedCase =
            scope.length > 0 ? `${scope}${capitalizedCase}` : `${capitalizedCase}`

        return Object.assign(acc, {
            [_case]: isFunc(ctor)
                ? (...args: any[]) => ({
                      [discriminant]: scopedCapitalizedCase,
                      ...ctor(...args),
                  })
                : { [discriminant]: scopedCapitalizedCase },
        })
    }, {}) as VariantConstructors<T, Discriminant, Scope>

const getVariantTypes = <T extends VariantInputObject, Scope extends string = "">(
    inp: T,
    scope: Scope
): Identity<VariantTypes<T, Scope>> =>
    Object.entries(inp).reduce((acc, entry) => {
        const [_case] = entry
        const capitalizedCase = String.capitalize(_case)
        const scopedCapitalizedCase =
            scope.length > 0 ? `${scope}${capitalizedCase}` : `${capitalizedCase}`

        return Object.assign(acc, { [_case]: scopedCapitalizedCase })
    }, {}) as Identity<VariantTypes<T, Scope>>

const unscope = <Scope extends string>(type: string, scope: Scope) =>
    scope.length > 0 ? type.replace(new RegExp(`${scope}`), "") : type

const getMatchFn =
    <
        T extends VariantInputObject,
        Discriminant extends string = DefaultDiscriminant,
        Scope extends string = DefaultScope
    >(
        discriminant: Discriminant,
        scope: Scope
    ): VariantMatch<T, Discriminant> =>
    matcher =>
    instance => {
        const unscopedUncapitalizedType = String.uncapitalize(
            unscope(instance[discriminant], scope)
        )

        if (!Object.hasOwn(matcher, unscopedUncapitalizedType)) {
            throw new TypeError(
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `Expected to be given a variant with scope ${scope}. Actual type was ${instance[discriminant]}`
            )
        }

        const branch = matcher[unscopedUncapitalizedType]

        const data = { ...instance }
        delete data[discriminant]

        return typeof branch === "function" ? (branch as any)(data) : branch
    }

const getMatchOrElseFn =
    <
        T extends VariantInputObject,
        Discriminant extends string = DefaultDiscriminant,
        Scope extends string = DefaultScope
    >(
        discriminant: Discriminant,
        scope: Scope
    ): VariantMatchOrElse<T, Discriminant> =>
    matcher =>
    instance => {
        const unscopedUncapitalizedType = String.uncapitalize(
            unscope(instance[discriminant], scope)
        )

        if (Object.hasOwn(matcher, unscopedUncapitalizedType)) {
            const branch = matcher[unscopedUncapitalizedType]

            const data = { ...instance }
            delete data[discriminant]

            return typeof branch === "function" ? branch(data) : branch
        }

        return typeof matcher.orElse === "function"
            ? (matcher.orElse as any)()
            : matcher.orElse
    }

/** _C_ stands for customize! Returns a module object containing case
 * constructors a mapping of cases to (possibly) scoped `types` (i.e., tags),
 * and `match`/`matchOrElse` functions. **This function allows you to pass
 * your own discriminant (e.g., `"type"`) and scope (e.g., `"Namespace/"`).**
 *
 * Changing the scope allows you to re-use the exact same variant structure
 * without risking conflicting types or matcher functions. **Use a scope
 * for redux actions to namespace them.**
 *
 * This does not handle generic variants, like `Option<T>`.
 *
 * @example
 * ```
 * export const Action = variantC({
 *     loadStuffStarted: {},
 *     loadStuffFinished: (response: string) => ({ response }),
 * }, "type", "Namespace/")
 * export type Action = VariantOf<typeof Action>
 *
 * // Access type names
 * const types = Action.types // => { loadStuffStarted: "Namespace/LoadStuffStarted", loadStuffFinished: "Namespace/LoadStuffFinished" }
 *
 * // Construct a new instance
 * const myAction = Action.loadStuffFinished("200 OK") // => { type: "Namespace/LoadStuffFinished", response: "200 OK" }
 *
 * // Perform a match
 * const matchResult = pipe(
 *     myAction,
 *     Action.match({
 *       loadStuffStarted: "stuff started!",
 *       loadStuffFinished: ({ response }) => `Finished, response=${response}`,
 *     })
 * ) // => "Finished, response=200 OK"
 * ```
 */
export const variantC = <
    T extends VariantInputObject,
    Discriminant extends string,
    Scope extends string
>(
    inp: T,
    discriminant: Discriminant,
    scope: Scope
): VariantModule<T, Discriminant, Scope> => ({
    ...getVariantCtors(inp, discriminant, scope),
    match: getMatchFn(discriminant, scope),
    matchOrElse: getMatchOrElseFn(discriminant, scope),
    types: getVariantTypes(inp, scope),
})

/**
 * Returns a module object containing case constructors, a mapping of cases to
 * (possibly) scoped `types` (i.e., tags), and `match`/`matchOrElse` functions.
 * **This function uses the default discriminant of `"_tag"` and no scope.**
 *
 * This **does not** handle generic variants, like `Option<T>`.
 *
 * @example
 * ```
 * export const Pet = variant({
 *   dog: (name: string) => ({ name }),
 *   cat: (livesLeft: number) => ({ livesLeft }),
 *   fish: {},
 * })
 * export type Pet = VariantOf<typeof Pet>
 *
 * // Access type names (useful in Redux scenarios)
 * const types = Pet.types // => { dog: "Dog", cat: "Cat", fish: "Fish" }
 *
 * // Construct a new instance
 * const myDog = Pet.dog("Fido") // => { _tag: "Dog", name: "Fido" }
 *
 * // Perform a match
 * const matchResult = pipe(
 *     myDog,
 *     Pet.matchOrElse({
 *         dog: ({ name }) => `Woof! I am ${name}`,
 *         orElse: "not a dog",
 *     })
 * ) // => "Woof! I am Fido"
 * ```
 */
export const variant = <T extends VariantInputObject>(
    inp: T
): VariantModule<T, DefaultDiscriminant, DefaultScope> => ({
    ...getVariantCtors(inp, "_tag", ""),
    match: getMatchFn("_tag", ""),
    matchOrElse: getMatchOrElseFn("_tag", ""),
    types: getVariantTypes(inp, ""),
})

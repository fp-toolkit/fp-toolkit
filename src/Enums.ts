/**
See [Enums considered harmful](https://www.youtube.com/watch?v=jjMbPt_H3RQ) for the motivation
behind this custom type. (Also worth noting is that in TypeScript 5.0 [all Enums are considered
unions](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#all-enums-are-union-enums).)

Similar to [variants](variants.md) for disciminated unions, `enumOf` allows you to more easily
and safely create and work with enums in TypeScript.

## Basic Example

```ts
export const MyEnum = enumOf(
    {
        Dog: "Dog",
        Cat: "Cat",
        ZEBRA: 1234,
    } as const, // the `as const` won't be required in TypeScript 5.0
    "MyEnum" // friendly name is optional; used to generate helpful parser errors
) 

export type MyEnum = EnumOf<typeof MyEnum> // => "Dog" | "Cat" | 1234
```

## Methods

### Standard enum-style accessors

```ts
const dog = MyEnum.Dog // => "Dog"
const zebra = MyEnum.ZEBRA // => 1234
```

### Values

Access array of all valid values, correctly typed (but without any ordering guarantees).

```ts
const myEnumValues = MyEnum.values // => ["Dog", "Cat", 1234]
```

### Parser

Get a safe parser function for this enum automagically!

```ts
const parsed = MyEnum.parse("cat") // => a `Result<MyEnum, string>`, in this case `Result.ok("Cat")`
```

### Match

See `match` in the {@link Variants} module docs for more details on matchers.

```ts
const speak: (e: MyEnum) => string = MyEnum.match({
    Dog: "woof woof",
    Cat: () => "meow",
    ZEBRA: "is my skin white with black stripes or black with white stripes??",
})

speak(myEnum)
```

### MatchOrElse

See `matchOrElse` in the {@link Variants} module docs for more details on partial matchers.

```ts
const speak: (e: MyEnum) => string = MyEnum.matchOrElse({
    Dog: "woof woof",
    Cat: () => "meow",
    orELse: "I cannot speak.",
})

speak(myEnum)
```

@module Enums
*/

import { Array } from "./Array"
import { flow, pipe } from "./Composition"
import { Option } from "./Option"
import { Result } from "./Result"
import { String } from "./String"
import type { Identity, NonNullish } from "./prelude"

/** @ignore */
type StringKeys<T extends object> = Extract<keyof T, string>

/**
 * A plain object that serves as the definition of the enum type.
 * Until TypeScript 5.0 is released, you need to specify `as const`
 * on this object definition.
 */
type RawEnum = Record<string, string | number>

/** @ignore */
type StringKeyValues<T extends RawEnum> = Identity<T[StringKeys<T>]>

/** @ignore */
type EnumMatcher<A, R extends RawEnum> = {
    readonly [Label in StringKeys<R>]: (() => A) | A
}

/** @ignore */
type PartialEnumMatcher<A, R extends RawEnum> = Partial<EnumMatcher<A, R>> & {
    readonly orElse: (() => A) | A
}

type EnumMatch<R extends RawEnum> = <A>(
    matcher: EnumMatcher<A, R>
) => (value: StringKeyValues<R>) => A

type EnumMatchOrElse<R extends RawEnum> = <A>(
    matcher: PartialEnumMatcher<A, R>
) => (value: StringKeyValues<R>) => A

/**
 * The output of the {@link enumOf} function. Produces an object that serves both as
 * the enum as well as a namespace for helper functions related to that enum.
 */
type EnumModule<R extends RawEnum> = Identity<
    {
        readonly [Label in StringKeys<R>]: R[Label]
    } & {
        /**
         * Returns a readonly array containing the set of all possible enum values. No
         * guarantees are made regarding the order of items in the resultant array.
         */
        readonly values: ReadonlyArray<StringKeyValues<R>>

        /**
         * For string enum values, the parse function will trim and coerce values to lowercase
         * before comparison. (This has no effect on numeric enum values.) Thus, if an
         * enum is defined as `'Yes' | 'No'`, this decoder will parse `'yes'`, `' yES'`,
         * and `' YES '` correctly into the canonical `'Yes'` enum value.
         */
        readonly parse: (u: unknown) => Result<StringKeyValues<R>, string>

        /**
         * Use this function for an exhaustive case check that doesn't require using
         * a switch/case block or any kind of assertExhaustive check.
         */
        readonly match: EnumMatch<R>

        /**
         * Use this function for a partial case check that doesn't require using
         * a switch/case block.
         */
        readonly matchOrElse: EnumMatchOrElse<R>
    }
>

/**
 * Gets the union type representing all possible enum values.
 */
export type EnumOf<T> = T extends EnumModule<infer R extends RawEnum>
    ? StringKeyValues<R>
    : [never, "Error: T must be an EnumModule"]

const getParserErrorMessage = <T extends RawEnum>(
    enumValues: EnumModule<T>["values"],
    enumFriendlyName: string
) =>
    `Must be an enum value in the set ${enumFriendlyName}{ ${enumValues.join(
        ", "
    )} }`

const toTrimmedLowerCase = (a: string | number) =>
    pipe(
        Option.some(a),
        Option.refine(String.isString),
        Option.map(flow(String.trim, String.toLowerCase)),
        Option.defaultValue<string | number>(a)
    )

const isStringOrNumber = (u: NonNullish): u is string | number =>
    typeof u === "string" || typeof u === "number"

const getParseFn =
    <R extends RawEnum>(
        enumValues: EnumModule<R>["values"],
        enumFriendlyName: string
    ) =>
    (u: unknown): Result<StringKeyValues<R>, string> =>
        pipe(
            Option.ofNullish(u),
            Result.ofOption(
                () =>
                    `Enum${
                        enumFriendlyName ? ` ${enumFriendlyName}` : ""
                    } cannot be null/undefined`
            ),
            Result.refine(
                isStringOrNumber,
                () =>
                    `Enum${
                        enumFriendlyName ? ` ${enumFriendlyName}` : ""
                    } must be a string or number`
            ),
            Result.map(toTrimmedLowerCase),
            Result.bind(testVal =>
                pipe(
                    enumValues,
                    Array.find(val => toTrimmedLowerCase(val) === testVal),
                    Option.match({
                        some: a => Result.ok(a),
                        none: () =>
                            Result.err(
                                getParserErrorMessage(
                                    enumValues,
                                    enumFriendlyName
                                )
                            ),
                    })
                )
            )
        )

const isFunc = (f: unknown): f is (...args: any[]) => any =>
    typeof f === "function"

const getMatchFn =
    <R extends RawEnum>(raw: R): EnumMatch<R> =>
    matcher =>
    value => {
        const enumEntry = Object.entries(raw).find(([, v]) => v === value)

        if (!enumEntry) {
            throw new TypeError(
                `Expected to match against an enum where '${value}' is a valid value.`
            )
        }

        const enumLabel = enumEntry[0]
        if (!Object.hasOwn(matcher, enumLabel)) {
            throw new TypeError(
                `Expected a matcher containing a case for '${enumLabel}'.`
            )
        }

        const matcherBranch = matcher[enumLabel]
        return isFunc(matcherBranch) ? matcherBranch() : matcherBranch
    }

const getMatchOrElseFn =
    <R extends RawEnum>(raw: R): EnumMatchOrElse<R> =>
    matcher =>
    value => {
        const enumEntry = Object.entries(raw).find(([, v]) => v === value)

        if (!enumEntry) {
            throw new TypeError(
                `Expected to match against an enum where '${value}' is a valid value.`
            )
        }

        const enumLabel = enumEntry[0]
        if (Object.hasOwn(matcher, enumLabel)) {
            const branch = matcher[enumLabel]
            return isFunc(branch) ? branch() : branch
        }

        return isFunc(matcher.orElse) ? matcher.orElse() : matcher.orElse
    }

/**
 * Generates an "enum module" from a raw object. For motivation behind using a custom
 * generative function instead of the built-in `enum` types, see [this video](https://youtu.be/jjMbPt_H3RQ).
 *
 * This function augments a raw "enum object" with several useful capabilities: `values`, `parse`, `match`,
 * and `matchOrElse`.
 *   - `values` contains the list of valid enum values
 *   - `parse` is a parser function auto-magically created for this enum
 *   - `match` is a pipeable function that allows exhaustive pattern matching
 *   - `matchOrElse` is a pipeable function that allows inexhaustive pattern matching
 *
 * @remarks
 * You can use the `parse` function together with `io-ts` to easily create a decoder for this enum.
 *
 * @example
 * ```ts
 * export const MyEnum = enumOf({
 *   Dog: 'Dog',
 *   Cat: 'Cat',
 *   ZEBRA: 1234,
 * } as const, 'MyEnum') // => friendly name optional; used to generate helpful decoder errors
 * export type MyEnum = EnumOf<typeof MyEnum>; //=> 'Dog' | 'Cat' | 1234
 *
 * // Standard enum-style accessors
 * const dog = MyEnum.Dog; // => 'Dog'
 * const zebra = MyEnum.ZEBRA; // => 1234
 *
 * // Access array of all valid values, correctly typed
 * const myEnumValues = MyEnum.values; // => ['Dog', 'Cat', 1234]
 *
 * // Get a decoder instance for this enum automagically
 * const myDecoder = MyEnum.decoder; // => a `D.Decoder<unknown, 'Dog' | 'Cat' | 1234>`
 *
 * // Match an enum value against all its cases (compiler ensures exhaustiveness)
 * const value: MyEnum = 'Cat';
 * const matchResult = pipe(
 *   value,
 *   MyEnum.match({
 *     Dog: 'woof woof',
 *     Cat: () => 'meow',
 *     ZEBRA: 'is my skin white with black stripes or black with white stripes??'
 *   })
 * ) // => 'meow'
 * ```
 */
export const enumOf = <const T extends RawEnum>(
    raw: T,
    enumFriendlyName = ""
): EnumModule<T> => {
    const entriesWithStringKeys = Object.entries(raw).reduce(
        (acc, [label, value]) => ({
            // biome-ignore lint/performance/noAccumulatingSpread: this is a one-time evaluation so not a perf concern
            ...acc,
            [label]: value,
        }),
        {}
    )

    const values = Object.values(raw)

    return {
        ...entriesWithStringKeys,
        values,
        parse: getParseFn(values, enumFriendlyName),
        match: getMatchFn(raw),
        matchOrElse: getMatchOrElseFn(raw),
    } as unknown as EnumModule<T>
}

/**
 * An `Option` represents a value that is, well, optional—
 * it can either be present or absent. This is particularly
 * useful for modeling nullable values while avoiding the
 * possibility of null reference errors.
 *
 * @group Types
 *
 * @remarks
 * The functions in this module are curried and are optimized
 * for use with left-to-right function composition like `pipe`
 * and `flow`.
 *
 * **Note:** There is a generic type constraint on option that
 * excludes `null`, `undefined`, and `void` types. This is
 * intentional, because `Option<undefined>` or `Option<null>` make
 * little to no sense conceptually.
 *
 *
 * @example
 * ```
 * pipe(
 *     56,
 *     Option.ofNullish,
 *     Option.filter(n => n > 50),
 *     Option.map(String),
 *     Option.match({
 *         some: a => `${a}!`,
 *         none: "!"
 *     }),
 *     console.info
 * ) // logs "56!"
 * ```
 *
 * @module Option
 */

import { pipe } from "../Composition"
import { EqualityComparer } from "../EqualityComparer"
import {
    type NonNullish,
    type Refinement,
    type Tagged,
    assertExhaustive,
} from "../prelude"

export interface Some<A extends NonNullish>
    extends Tagged<"Some", { some: A }> {}
export interface None extends Tagged<"None", object> {}

export type Option<A extends NonNullish> = Some<A> | None

/**
 * Creates a new `Some` instance.
 *
 * @group Constructors
 *
 * @returns a new `Some` instance containing the given value
 */
export const some = <A extends NonNullish>(some: A): Option<A> => ({
    _tag: "Some",
    some,
})

/**
 * Alias for the Some constructor. See {@link some}.
 *
 * @group Constructors
 */
export const of = some

/**
 * The static None instance.
 *
 * @group Constructors
 */
export const none: Option<never> = Object.freeze({ _tag: "None" })

/**
 * @ignore
 */
type OptionMatcher<A, R> = {
    readonly some: R | ((some: A) => R)
    readonly none: R | (() => R)
}

const isRawValue = <A, R>(caseFn: R | ((ok: A) => R)): caseFn is R =>
    typeof caseFn !== "function"

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg)

/**
 * Exhaustively pattern match against an `Option` in order
 * to "unwrap" the inner value. Provide either a raw value
 * or lambda to use for each case (`Some` or `None`). This
 * function is curried.
 *
 * @group Pattern Matching
 *
 * @example
 * pipe(
 *     Option.some(42),
 *     Option.match({
 *         some: n => n * 2,
 *         none: 0,
 *     })
 * ) // => 84
 */
export const match =
    <A extends NonNullish, R>(matcher: OptionMatcher<NoInfer<A>, R>) =>
    (option: Option<A>) => {
        switch (option._tag) {
            case "Some":
                return getMatcherResult(matcher.some, option.some)
            case "None":
                return getMatcherResult(matcher.none, void 0)
            /* c8 ignore next 2 */
            default:
                return assertExhaustive(option)
        }
    }

/**
 * Maps the wrapped `Some` value using the given function.
 * Passes through `None` as-is.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     Option.some("cheese"),
 *     Option.map(s => s.length),
 *     Option.defaultValue(0)
 * ) // => 6
 */
export const map = <A extends NonNullish, B extends NonNullish>(
    f: (a: NoInfer<A>) => B
) =>
    match<A, Option<B>>({
        some: a => some(f(a)),
        none: none,
    })

/**
 * Execute an arbitrary side-effect function if `Some`.
 * Does not call the function for `None`.
 * This is a terminal function for a `pipe`line
 * (i.e. does not pass through the value)
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     Option.some("cheese"),
 *     Option.iter(s => fooCallback(s))
 * ) // fooCallback is called with "cheese"
 *
 * pipe(
 *     Option.none,
 *     Option.iter((s: string) => fooCallback(s))
 * ) // fooCallback is not called
 */
export const iter = <A extends NonNullish>(f: (a: NoInfer<A>) => void) =>
    match<A, void>({
        some: f,
        none: void 0,
    })

/**
 * Tests the wrapped `Some` value using the given predicate.
 * If the wrapped value fails the check, returns `None`.
 * `None` is passed through as-is.
 *
 * @group Filtering
 *
 * @example
 * pipe(
 *     Option.some(70),
 *     Option.filter(n => n <= 25),
 *     Option.defaultValue(0)
 * ) // => 0
 */
export const filter = <A extends NonNullish>(f: (a: NoInfer<A>) => boolean) =>
    match<A, Option<A>>({
        some: a => (f(a) ? some(a) : none),
        none: none,
    })

/**
 * Use a type guard (a.k.a. `Refinement`) to filter the wrapped value.
 * If the type guard holds for the wrapped value, returns `Some` with
 * the narrowed type. `None` is passed through as-is.
 *
 * @group Filtering
 *
 * @example
 * ```
 * const isString = (u: unknown): u is string => typeof u === "string"
 *
 * pipe(
 *     Option.some("cheese" as any),    // Option<any>
 *     Option.refine(isString),         // Option<string> (type is narrowed by the guard)
 *     Option.map(s => s.length)        // Option<number> (TS infers the type of `s`)
 * ) // => Option.some(6)
 * ```
 */
export const refine = <A extends NonNullish, B extends A>(
    f: Refinement<A, B>
) =>
    match<A, Option<B>>({
        some: a => (f(a) ? some(a) : none),
        none: none,
    })

/**
 * Returns the wrapped value if the `Option` is `Some`,
 * otherwise uses the given value as a default value.
 *
 * @group Pattern Matching
 *
 * @example
 * pipe(
 *     Option.none,
 *     Option.defaultValue("ABC")
 * ) // => "ABC"
 */
export const defaultValue = <A extends NonNullish>(a: NoInfer<A>) =>
    match<A, A>({
        some: a => a,
        none: a,
    })

/**
 * Returns the wrapped value if `Some`. Otherwise, uses the
 * given lambda to compute and return a default value.
 *
 * @group Pattern Matching
 *
 * @example
 * pipe(
 *     Option.some("123"),
 *     Option.defaultWith(() => "")
 * ) // => "123"
 *
 * @example
 * pipe(
 *     Option.none,
 *     Option.defaultWith(() => "")
 * ) // => ""
 */
export const defaultWith = <A extends NonNullish>(f: () => NoInfer<A>) =>
    match<A, A>({
        some: a => a,
        none: f,
    })

/**
 * Maps an `Option` using a function that returns another
 * `Option` and flattens the result. Sometimes called `flatMap`.
 *
 * @group Mapping
 *
 * @example
 * ```ts
 * declare mightFailA: () => Option<string>
 * declare mightFailB: (s: string) => Option<number>
 *
 * pipe(
 *     mightFailA(),                // Option<string>
 *     Option.bind(mightFailB),     // Option<number>
 *     Option.defaultWith(() => 0)  // number
 * )
 * // => 200 if both mightFail functions return `Some`
 * // => 0 if either function returns `None`
 * ```
 */
export const bind = <A extends NonNullish, B extends NonNullish>(
    f: (a: NoInfer<A>) => Option<B>
) =>
    match<A, Option<B>>({
        some: f,
        none: none,
    })

/**
 * Alias of {@link bind}
 *
 * @group Mapping
 */
export const flatMap = bind

/**
 * A type guard determining whether an `Option` instance is a `Some`.
 *
 * @group Type Guards
 *
 * @example
 * Option.isSome(Option.some(1)) // => true
 * Option.isSome(Option.none) // => false
 */
export const isSome = <A extends NonNullish>(o: Option<A>): o is Some<A> =>
    o._tag === "Some"

/**
 * A type guard determining whether an `Option` instance is a `None`.
 *
 * @group Type Guards
 * @example
 * Option.isNone(Option.none) // => true
 * Option.isNone(Option.some(1)) // => false
 */
export const isNone = <A extends NonNullish>(o: Option<A>): o is None =>
    o._tag === "None"

/**
 * Returns a `Some` containing the value returned from the map function
 * if both `Option`s  are `Some`s. Otherwise, returns `None`.
 *
 * This is a kind of shortcut for pattern matching a tuple of `Option`s.
 *
 * @group Mapping
 * @group Pattern Matching
 *
 * @example
 * pipe(
 *     [Option.some(10), Option.some(20)],
 *     Option.map2((a, b) => a + b),
 *     Option.defaultValue(0)
 * ) // => 30
 */
export const map2 =
    <A extends NonNullish, B extends NonNullish, C extends NonNullish>(
        map: (a: NoInfer<A>, b: NoInfer<B>) => C
    ) =>
    (options: readonly [Option<A>, Option<B>]): Option<C> => {
        if (isSome(options[0]) && isSome(options[1])) {
            return some(map(options[0].some, options[1].some))
        }

        return none
    }

/**
 * Returns a Some containing the value returned from the map function
 * if all three `Option`s are `Some`s. Otherwise, returns `None`.
 *
 * This is a kind of shortcut for pattern matching a 3-tuple of `Option`s.
 *
 * @group Mapping
 * @group Pattern Matching
 *
 * @example
 * pipe(
 *     [Option.some(10), Option.some(20), Option.some(30)],
 *     Option.map3((a, b, c) => a + b + c),
 *     Option.defaultValue(0)
 * ) // => 60
 *
 * @example
 * pipe(
 *     [Option.none, Option.some(20), Option.some(30)],
 *     Option.map3((a, b, c) => a + b + c),
 *     Option.defaultValue(0)
 * ) // => 0
 */
export const map3 =
    <
        A extends NonNullish,
        B extends NonNullish,
        C extends NonNullish,
        D extends NonNullish,
    >(
        map: (a: NoInfer<A>, b: NoInfer<B>, c: NoInfer<C>) => D
    ) =>
    (options: readonly [Option<A>, Option<B>, Option<C>]): Option<D> => {
        if (isSome(options[0]) && isSome(options[1]) && isSome(options[2])) {
            return some(map(options[0].some, options[1].some, options[2].some))
        }

        return none
    }

/**
 * Constructs an `Option` from a potentially nullish value.
 * Nullish values will result in a `None` instance. Other
 * values will result in a `Some` instance containing the
 * value now constrained to be `NonNullable`.
 *
 * @group Constructors
 *
 * @example
 * Option.ofNullish(null) // => Option.none
 * Option.ofNullish(undefined) // => Option.none
 * Option.ofNullish(1) // => Option.some(1)
 */
export const ofNullish = <A>(a: A): Option<NonNullable<A>> =>
    a != null ? some(a) : none

/**
 * Converts an `Option` to a nullish value. (`null | undefined`)
 *
 * @group Pattern Matching
 *
 * @param useNull Defaults to `true`. Specify `false` to use `undefined` instead of `null` for `None`s
 */
export const toNullish = <A extends NonNullish>(
    o: Option<A>,
    useNull = true
): A | null | undefined =>
    pipe(
        o,
        match({
            some: a => a,
            none: useNull ? null : undefined,
        })
    )

/**
 * Attempt to perform a function that may throw. If the
 * function throws, returns `None` and swallows the Error.
 *
 * @group Error Handling
 */
export const tryCatch = <A extends NonNullish>(
    mightThrow: () => A
): Option<A> => {
    try {
        return some(mightThrow())
    } catch (_) {
        return none
    }
}

/**
 * Get an `EqualityComparer` for an `Option<A>` by giving this function an
 * `EqualityComparer` for type `A`. Represents structural (value-based) equality
 * for the `Option` type.
 *
 * @group Equality
 * @group Utils
 *
 * @param equalityComparer The `EqualityComparer` to use for the inner value.
 * @returns A new `EqualityComparer` instance
 */
export const getEqualityComparer = <A extends NonNullish>({
    equals,
}: EqualityComparer<A>): EqualityComparer<Option<A>> =>
    // `ofEquals` has a built-in reference equality check, which captures the None/None case
    EqualityComparer.ofEquals((opt1, opt2) =>
        pipe(
            [opt1, opt2] as const,
            map2((a1: A, a2: A) => equals(a1, a2)),
            defaultValue(false)
        )
    )

/**
 * Execute an arbitrary side effect using the inner value of the `Option`. Useful
 * for debugging and logging purposes. Will not have any effect for `None`s.
 *
 * @param f The side effect to execute.
 *
 * @returns The `Option`, unchanged.
 *
 * @group Utils
 */
export const tee =
    <A extends NonNullish>(f: (a: NoInfer<A>) => void) =>
    (option: Option<A>) =>
        pipe(
            option,
            map(a => {
                f(a)
                return a
            })
        )

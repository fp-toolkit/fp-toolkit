import { Tagged, assertExhaustive } from "./prelude"
import { pipe } from "./composition"

/* eslint-disable @typescript-eslint/no-empty-interface */
interface Some<A> extends Tagged<"Some", { some: A }> {}
interface None extends Tagged<"None", object> {}
/* eslint-enable @typescript-eslint/no-empty-interface */

/** An `Option<A>` represents a value that, conceptually, can
 * either be present or absent. This is useful for modeling
 * potentially null values while avoiding the possibility of
 * null reference errors.
 *
 * This API has been designed to be used with `pipe`:
 *
 * @example
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
 * ); // "56!"
 */
export type Option<A> = Some<A> | None

/** Constructs a new Some instance with the given value. */
const Some = <A>(some: A): Option<A> => ({
    _tag: "Some",
    some,
})

/** Alias for the Some constructor. */
const of = Some

/** The static None instance. */
const None: Option<never> = { _tag: "None" }

type OptionMatcher<A, R> = {
    readonly some: R | ((some: A) => R)
    readonly none: R | (() => R)
}

type PartialOptionMatcher<A, R> = Partial<OptionMatcher<A, R>> & {
    readonly orElse: R | (() => R)
}

const isRawValue = <A, R>(caseFn: R | ((ok: A) => R)): caseFn is R =>
    typeof caseFn !== "function"

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg)

/** Pattern match against an `Option` in order to "unwrap" the
 * inner value. Provide either a raw value or lambda to use
 * for each case: `some` or `none`.
 *
 * Ensures an exhaustive pattern match.
 *
 * @example
 * pipe(
 *     Option.Some(42),
 *     Option.match({
 *         some: n => n * 2,
 *         none: 0,
 *     })
 * ); // yields `84`
 */
const match =
    <A, R>(matcher: OptionMatcher<A, R>) =>
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

const getPartialMatcherResult = <T, R>(
    match: ((t: T) => R) | R | undefined,
    arg: T,
    orElseMatch: (() => R) | R
) =>
    match !== undefined
        ? getMatcherResult(match, arg)
        : getMatcherResult(orElseMatch, undefined)

/** Non-exhaustive pattern match against an `Option` in order
 * to "unwrap" the inner value. Provide either a raw value or
 * lambda to use for either the `some` or `none` case along with
 * the `orElse` (default) case (also accepts a raw value or lambda).
 *
 * @example
 * pipe(
 *     Option.None,
 *     Option.match({
 *         some: (n: number) => n * 3,
 *         orElse: 1
 *     })
 * ); // yields `1`
 */
const matchOrElse =
    <A, R>(matcher: PartialOptionMatcher<A, R>) =>
    (option: Option<A>) => {
        switch (option._tag) {
            case "Some":
                return getPartialMatcherResult(matcher.some, option.some, matcher.orElse)
            case "None":
                return getPartialMatcherResult(matcher.none, undefined, matcher.orElse)
            /* c8 ignore next 2 */
            default:
                return getMatcherResult(matcher.orElse, undefined)
        }
    }

/** Projects the wrapped value using the given function if the
 * `Option` is `Some`, otherwise returns `None`.
 *
 * @example
 * pipe(
 *     Option.Some("cheese"),
 *     Option.map(s => s.length),
 *     Option.defaultValue(0)
 * ); // yields `6`
 */
const map = <A, B>(f: (a: A) => B) =>
    match<A, Option<B>>({
        some: a => Some(f(a)),
        none: None,
    })

/** Tests the wrapped value using the given predicate. If the
 * wrapped value fails the check, returns `None`. `None` is
 * passed through without being checked.
 *
 * @example
 * pipe(
 *     Option.Some(70),
 *     Option.filter(n => n <= 25),
 *     Option.defaultValue(0)
 * ); // yields `0`
 */
const filter = <A>(f: (a: A) => boolean) =>
    match<A, Option<A>>({
        some: a => (f(a) ? Some(a) : None),
        none: None,
    })

/** Use a type guard to filter the wrapped value. If the
 * type guard holds for the wrapped value, returns `Some`
 * with the refined type. `None` is passed through
 * without being checked.
 */
const refine = <A, B extends A>(f: (a: A) => a is B) =>
    match<A, Option<B>>({
        some: a => (f(a) ? Some(a) : None),
        none: None,
    })

/** Returns the wrapped value if the `Option` is `Some`,
 * otherwise uses the given value as a default value.
 */
const defaultValue = <A>(a: A) =>
    match<A, A>({
        some: a => a,
        none: a,
    })

/** Returns the raw value if the `Option` is `Some`, otherwise
 * uses the given lambda to compute and return a fallback value.
 */
const defaultWith = <A>(f: () => A) =>
    match<A, A>({
        some: a => a,
        none: f,
    })

/** Projects an `Option` using a function that itself returns
 * an `Option` and flattens the result.
 *
 * @example
 * declare mightFailA: () => Option<string>;
 * declare mightFailB: (s: string) => Option<200>;
 *
 * pipe(
 *     mightFailA(),
 *     Option.bind(mightFailB),
 *     Option.defaultWith(() => 0)
 * );
 * // yields `200` if both mightFail functions succeed
 * // yields `0` if either function fails
 */
const bind = <A, B>(f: (a: A) => Option<B>) =>
    match<A, Option<B>>({
        some: f,
        none: None,
    })

/** A type guard determinding whether an `Option` instance is a `Some`. */
const isSome = <A>(o: Option<A>): o is Some<A> => o._tag === "Some"

/** A type guard determining whether an `Option` instance is a `None`. */
const isNone = <A>(o: Option<A>): o is None => o._tag === "None"

/** Returns a Some containing the projected value if both `Option`s are `Some`s.
 * Otherwise, returns `None`.
 */
const map2 =
    <A, B, C>(map: (a: A, b: B) => C) =>
    (options: readonly [Option<A>, Option<B>]): Option<C> => {
        if (isSome(options[0]) && isSome(options[1])) {
            return Some(map(options[0].some, options[1].some))
        }

        return None
    }

/** Returns a Some containing the projected value if all three
 * `Option`s are `Some`s, otherwise returns `None`.
 */
const map3 =
    <A, B, C, D>(map: (a: A, b: B, c: C) => D) =>
    (options: readonly [Option<A>, Option<B>, Option<C>]): Option<D> => {
        if (isSome(options[0]) && isSome(options[1]) && isSome(options[2])) {
            return Some(map(options[0].some, options[1].some, options[2].some))
        }

        return None
    }

/** Wraps a potentially `null | undefined` value into an `Option`.
 * Nullish values will result in a `None` instance, other values will
 * result in a `Some` instance.
 */
const ofNullish = <A>(a: A): Option<NonNullable<A>> => (a != null ? Some(a) : None)

/** Converts an `Option` to a nullish value.
 * @param useNull specify `true` to use `null` instead of `undefined` for `None`s
 */
const toNullish = <A>(o: Option<A>, useNull = false): A | null | undefined =>
    pipe(
        o,
        match({
            some: a => a,
            none: useNull ? null : undefined,
        })
    )

/** Attempt to perform a function that may throw an Error.
 * On the case of an Error, returns `None` and swallows the Error.
 */
const tryCatch = <A>(mightThrow: () => A): Option<A> => {
    try {
        return Some(mightThrow())
    } catch (_) {
        return None
    }
}

export const Option = {
    Some,
    of,
    None,
    ofNullish,
    toNullish,
    match,
    matchOrElse,
    map,
    map2,
    map3,
    bind,
    defaultValue,
    defaultWith,
    isSome,
    isNone,
    filter,
    refine,
    tryCatch,
}

import { Tagged, assertExhaustive } from "./Prelude";
import { pipe } from "./composition";

type Some<A> = Tagged<"option/some", { some: A }>;
type None = Tagged<"option/none", object>;

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
export type Option<A> = Some<A> | None;

/** Constructs a new Some instance with the given value. */
const Some = <A>(some: A): Option<A> => ({
    _tag: "option/some",
    some,
});

/** Constructs a new None instance. */
const None = <A = never>(): Option<A> => ({
    _tag: "option/none",
});

type Matcher<A, R> = {
    readonly some: R | ((some: A) => R);
    readonly none: R | (() => R);
};

type PartialMatcher<A, R> = Partial<Matcher<A, R>> & {
    readonly orElse: R | (() => R);
};

const isRawValue = <A, R>(caseFn: R | ((ok: A) => R)): caseFn is R =>
    typeof caseFn !== "function";

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg);

/** Pattern match against an `Option` in order to "unwrap" the
 * inner value. Provide either a raw value or lambda to use
 * for each case: `some` or `none`.
 *
 * Ensures an exhaustive pattern match.
 */
const match =
    <A, R>(matcher: Matcher<A, R>) =>
    (option: Option<A>) => {
        switch (option._tag) {
            case "option/some":
                return getMatcherResult(matcher.some, option.some);
            case "option/none":
                return getMatcherResult(matcher.none, void 0);
            default:
                return assertExhaustive(option);
        }
    };

const getPartialMatcherResult = <T, R>(
    match: ((t: T) => R) | R | undefined | null,
    arg: T,
    orElseMatch: (() => R) | R
) =>
    match != null
        ? getMatcherResult(match, arg)
        : getMatcherResult(orElseMatch, undefined);

/** Pattern match against an `Option` in order to "unwrap" the
 * inner value. Provide either a raw value or lambda to use
 * for each case: `some` or `none`. If a matcher is not given,
 * uses the `orElse` case (also a raw value or lambda).
 */
const matchOrElse =
    <A, R>(matcher: PartialMatcher<A, R>) =>
    (option: Option<A>) => {
        switch (option._tag) {
            case "option/some":
                return getPartialMatcherResult(matcher.some, option.some, matcher.orElse);
            case "option/none":
                return getPartialMatcherResult(matcher.none, undefined, matcher.orElse);
            default:
                return getMatcherResult(matcher.orElse, undefined);
        }
    };

/** Projects the wrapped value using the given function if the
 * `Option` is `Some`, otherwise returns `None`.
 */
const map = <A, B>(f: (a: A) => B) =>
    match<A, Option<B>>({
        some: a => Some(f(a)),
        none: None(),
    });

/** Tests the wrapped value using the given predicate. If the
 * wrapped value fails the check, returns `None`. `None` is
 * passed through without being checked.
 */
const filter = <A>(f: (a: A) => boolean) =>
    match<A, Option<A>>({
        some: a => (f(a) ? Some(a) : None()),
        none: None(),
    });

/** Use a type guard to filter the wrapped value. If the
 * type guard holds for the wrapped value, returns `Some`
 * with the refined type. `None` is passed through
 * without being checked.
 */
const refine = <A, B extends A>(f: (a: A) => a is B) =>
    match<A, Option<B>>({
        some: a => (f(a) ? Some(a) : None()),
        none: None(),
    });

/** Returns the raw value if the `Option` is `Some`, otherwise
 * uses the given value as a default value.
 */
const defaultValue = <A>(a: A) =>
    match<A, A>({
        some: a => a,
        none: a,
    });

/** Returns the raw value if the `Option` is `Some`, otherwise
 * uses the given lambda to compute and return a default value.
 */
const defaultWith = <A>(f: () => A) =>
    match<A, A>({
        some: a => a,
        none: f,
    });

/** Projects an `Option` using a function that itself returns
 * an `Option` and flattens the result.
 */
const bind = <A, B>(f: (a: A) => Option<B>) =>
    match<A, Option<B>>({
        some: f,
        none: None(),
    });

/** A type guard determinding whether an `Option` instance is a `Some`. */
const isSome = <A>(o: Option<A>): o is Some<A> => o._tag === "option/some";

/** A type guard determining whether an `Option` instance is a `None`. */
const isNone = <A>(o: Option<A>): o is None => o._tag === "option/none";

/** Returns a Some containing the projected value if both `Option`s are `Some`s.
 * Otherwise, returns `None`.
 */
const map2 =
    <A, B, C>(map: (a: A, b: B) => C) =>
    (options: readonly [Option<A>, Option<B>]): Option<C> => {
        if (Option.isSome(options[0]) && Option.isSome(options[1])) {
            return Some(map(options[0].some, options[1].some));
        }

        return None();
    };

/** Wraps a potentially `null` or `undefined` value into an `Option`.
 * Nullish values will result in a `None` instance, other values will
 * result in a `Some` instance.
 */
const ofNullish = <A>(a: A): Option<NonNullable<A>> =>
    a != null ? Option.Some(a) : Option.None();

/** Converts an `Option` to a nullish value.
 * @param useNull specify `true` to use `null` instead of `undefined`
 */
const toNullish = <A>(o: Option<A>, useNull = false): A | null | undefined =>
    pipe(
        o,
        match({
            some: a => a,
            none: useNull ? null : undefined,
        })
    );

export const Option = {
    Some,
    None,
    ofNullish,
    toNullish,
    match,
    matchOrElse,
    map,
    map2,
    bind,
    defaultValue,
    defaultWith,
    isSome,
    isNone,
    filter,
    refine,
};

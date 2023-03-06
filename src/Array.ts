import { Predicate } from "./Prelude";
import { Option } from "./Option";
import { NonEmptyArray } from "./NonEmptyArray";
import { pipe } from "./composition";

/** A curried and readonly version of the built-in `filter`. */
const filter =
    <A>(pred: Predicate<A>) =>
    (as: readonly A[]): readonly A[] =>
        as.filter(pred);

/** A curried and readonly version of the built-in `map`. */
const map =
    <A, B>(f: (a: A) => B) =>
    (as: readonly A[]): readonly B[] =>
        as.map(f);

/** Projects each value of the array into an `Option`, and
 * keeps only the values where the projection returns `Some`.
 */
const choose =
    <A, B>(f: (a: A) => Option<B>) =>
    (as: readonly A[]): readonly B[] => {
        const bs: B[] = [];

        for (let i = 0; i < as.length; i++) {
            const maybeB = f(as[i]);
            if (Option.isSome(maybeB)) {
                bs.push(maybeB.some);
            }
        }

        return bs;
    };

/** Yields `Some` containing the first value of the array if
 * non-empty, otherwise `None`.
 */
const head = <A>(as: readonly A[]): Option<A> =>
    as.length > 0 ? Option.Some(as[0]) : Option.None();

/** Yields `Some` containing all array values except the first
 * one if non-empty, otherwise `None`.
 */
const tail = <A>(as: readonly A[]): Option<readonly A[]> => {
    if (as.length === 0) {
        return Option.None();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...tail] = as;
    return Option.Some(tail);
};

/** Yields only the first `n` elements of the array.
 * Will return the entire array if `n` is greater
 * than the length of the array.
 *
 * @param count is normalized to a natural number
 */
const take =
    (count: number) =>
    <A>(as: readonly A[]): readonly A[] => {
        const c = count <= 0 ? 0 : Math.floor(count);

        if (c > as.length) {
            return as;
        }

        const out: A[] = [];

        for (let i = 0; i < as.length && i < c; i++) {
            out.push(as[i]);
        }

        return out;
    };

/** Yields only the remaining elements of the array
 * after skipping `n` elements. Returns empty if the
 * skip count goes past the end of the array.
 *
 * @param count is normalized to a natural number
 */
const skip =
    (count: number) =>
    <A>(as: readonly A[]): readonly A[] => {
        const c = count <= 0 ? 0 : Math.floor(count);

        if (c >= as.length) {
            return [];
        }

        const out: A[] = [];

        for (let i = c; i < as.length; i++) {
            out.push(as[i]);
        }

        return out;
    };

/** Curried and readonly version of the built-in `reduce`. */
const reduce =
    <A, B>(initialValue: B, reducer: (acc: B, next: A) => B) =>
    (as: readonly A[]): B =>
        as.reduce(reducer, initialValue);

/** Curried and readonly version of the built-in `reduceRight`. */
const reduceRight =
    <A, B>(initialValue: B, reducer: (acc: B, next: A) => B) =>
    (as: readonly A[]): B =>
        as.reduceRight(reducer, initialValue);

const isRawValue = <A, R>(caseFn: R | ((ok: A) => R)): caseFn is R =>
    typeof caseFn !== "function";

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg);

interface Matcher<A, R> {
    empty: (() => R) | R;
    nonEmpty: ((as: NonEmptyArray<A>) => R) | R;
}

/** Pattern match against an array to "unwrap" its values. Provide
 * a matcher object to handle both the `empty` and `nonEmpty` cases.
 * The matcher can use lambdas or raw values. In the `nonEmpty` case,
 * the lambda will be given a `NonEmptyArray`.
 *
 * The compiler will ensure exhaustive case matching.
 *
 * @example
 * pipe(
 *     ["a", "b"],
 *     Array.match({
 *         empty: () => "default",
 *         nonEmpty: Array.reduceRight("", (a, b) => `${a}${b}`)
 *     })
 * ); // "ba"
 */
const match =
    <A, R>(matcher: Matcher<A, R>) =>
    (as: readonly A[]): R =>
        as.length > 0
            ? getMatcherResult(matcher.nonEmpty, as as NonEmptyArray<A>)
            : getMatcherResult(matcher.empty, undefined);

/** A type guard that tests whether the given array is equivalent
 * to the empty tuple.
 */
const isEmpty = <A>(as: readonly A[]): as is readonly [] => as.length === 0;

/** A type guard that thests whether the given array is a `NonEmptyArray` */
const isNonEmpty = <A>(as: readonly A[]): as is NonEmptyArray<A> => as.length > 0;

/** Also commonly known as `flatMap`. Projects each element of the array
 * given a function that itself returns an array, then flattens the result.
 */
const bind =
    <A, B>(f: (a: A) => readonly B[]) =>
    (as: readonly A[]): readonly B[] =>
        as.flatMap(f);

/** Adds an element to the end of an array, which always returns
 * a `NonEmptyArray`.
 */
const append =
    <A>(a: A) =>
    (as: readonly A[]): NonEmptyArray<A> =>
        [...as, a] as unknown as NonEmptyArray<A>;

/** Also known as `cons`. Inserts an element at the beginning
 * of an array, which always returns a `NonEmptyArray`.
 */
const prepend =
    <A>(a: A) =>
    (as: readonly A[]): NonEmptyArray<A> =>
        [a, ...as];

/** Returns a Map of keys to groups, where the selector function
 * is used to generate a string key that determines in which group
 * each array element is placed.
 *
 * @example
 * pipe(
 *     [1, 2, 1, 2, 3, 3, 5],
 *     Array.groupBy(String)
 * ) == new Map([ // assuming structural equality
 *     ['1', [1, 1]],
 *     ['2', [2, 2]],
 *     ['3', [3, 3]],
 *     ['5', [5]]
 * ])
 */
const groupBy =
    <A>(selector: (a: A) => string) =>
    (as: readonly A[]): ReadonlyMap<string, NonEmptyArray<A>> => {
        const groups: Map<string, NonEmptyArray<A>> = new Map();

        as.forEach(a => {
            const key = selector(a);

            return groups.has(key)
                ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  groups.set(key, pipe(groups.get(key)!, append(a)))
                : groups.set(key, [a]);
        });

        return groups;
    };

/** Adds an array of values to the _end_ of the subsequently
 * passed (partially applied) array, in a way that makes sense
 * when reading top-to-bottom using `pipe`.
 *
 * @example
 * pipe(
 *     [1, 2],
 *     Array.concat([3, 4])
 * ); // [1, 2, 3, 4]
 */
const concat =
    <A>(addToEnd: readonly A[]) =>
    (as: readonly A[]): readonly A[] =>
        [...as, ...addToEnd];

/** Like `concat`, except this adds an array of values to the
 * _beginning_ of the subsequently (partially applied) array,
 * in a way that makes more sense when _not_ using `pipe`.
 *
 * @example
 * pipe(
 *     ["a", "b"],
 *     Array.concatFirst(["c", "d"])
 * ); // ["c", "d", "a", "b"]
 *
 * Array.concatFirst(["a", "b"])(["c", "d"]); // ["a", "b", "c", "d"]
 */
const concatFirst =
    <A>(addToFront: readonly A[]) =>
    (as: readonly A[]): readonly A[] =>
        [...addToFront, ...as];

export const Array = {
    filter,
    map,
    bind,
    choose,
    head,
    tail,
    take,
    skip,
    reduce,
    reduceRight,
    match,
    isEmpty,
    isNonEmpty,
    append,
    prepend,
    groupBy,
    concat,
    concatFirst,
};

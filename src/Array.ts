import { Predicate, Refinement, EqualityComparer, OrderingComparer } from "./prelude"
import { Option } from "./Option"
import { Result } from "./Result"
import { pipe } from "./composition"

interface NonEmptyArray<A> extends ReadonlyArray<A> {
    0: A
}

/** A curried and readonly version of the built-in `filter`.
 * Accepts a plain predicate function or a refinement
 * function (type guard).
 */
const filter: {
    <A, B extends A>(refinement: Refinement<A, B>): (as: readonly A[]) => readonly B[]
    <A>(predicate: Predicate<A>): <B extends A>(bs: readonly B[]) => readonly B[]
    <A>(predicate: Predicate<A>): (as: readonly A[]) => readonly A[]
} =
    <A>(f: Predicate<A>) =>
    <B extends A>(as: readonly B[]) =>
        as.filter(f)

const filteri =
    <A>(f: (a: A, i: number) => boolean) =>
    (as: readonly A[]): readonly A[] =>
        as.filter(f)

/** A curried and readonly version of the built-in `map`. */
const map =
    <A, B>(f: (a: A) => B) =>
    (as: readonly A[]): readonly B[] =>
        as.map(f)

const mapi =
    <A, B>(f: (a: A, i: number) => B) =>
    (as: readonly A[]): readonly B[] =>
        as.map(f)

/** Projects each value of the array into an `Option`, and
 * keeps only the values where the projection returns `Some`.
 *
 * @example
 * const actual = pipe(
 *     [32, null, 55, undefined, 89] as const,
 *     Array.choose(flow(Option.ofNullish, Option.map(String)))
 * )
 * expect(actual).toStrictEqual(["32", "55", "89"])
 */
const choose =
    <A, B>(f: (a: A) => Option<B>) =>
    (as: readonly A[]): readonly B[] => {
        const bs: B[] = []

        for (let i = 0; i < as.length; i++) {
            const maybeB = f(as[i])
            if (Option.isSome(maybeB)) {
                bs.push(maybeB.some)
            }
        }

        return bs
    }

/** Like `choose`, but projects each value of the array into
 * a `Result`, and keeps only the values where the projection
 * returns `Ok`.
 *
 * @example
 * const actual = pipe(
 *     [32, null, 55, undefined, 89] as const,
 *     Array.chooseR(flow(Option.ofNullish, Option.map(String), Result.ofOption(() => "err")))
 * )
 * expect(actual).toStrictEqual(["32", "55", "89"])
 */
const chooseR =
    <A, E, B>(f: (a: A) => Result<B, E>) =>
    (as: readonly A[]): readonly B[] => {
        const bs: B[] = []

        for (let i = 0; i < as.length; i++) {
            const result = f(as[i])
            if (Result.isOk(result)) {
                bs.push(result.ok)
            }
        }

        return bs
    }

/** Yields `Some` containing the first value of the array if
 * non-empty, otherwise `None`.
 */
const head = <A>(as: readonly A[]): Option<A> =>
    as.length > 0 ? Option.Some(as[0]) : Option.None

/** Yields `Some` containing all array values except the first
 * one if non-empty, otherwise `None`.
 */
const tail = <A>(as: readonly A[]): Option<readonly A[]> => {
    if (as.length === 0) {
        return Option.None
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...tail] = as
    return Option.Some(tail)
}

/** Yields only the first `n` elements of the array.
 * Will return the entire array if `n` is greater
 * than the length of the array.
 *
 * @param count is normalized to a natural number
 */
const take =
    (count: number) =>
    <A>(as: readonly A[]): readonly A[] => {
        const c = count <= 0 ? 0 : Math.floor(count)

        if (c > as.length) {
            return as
        }

        const out: A[] = []

        for (let i = 0; i < as.length && i < c; i++) {
            out.push(as[i])
        }

        return out
    }

/** Yields only the remaining elements of the array
 * after skipping `n` elements. Returns empty if the
 * skip count goes past the end of the array.
 *
 * @param count is normalized to a natural number
 */
const skip =
    (count: number) =>
    <A>(as: readonly A[]): readonly A[] => {
        const c = count <= 0 ? 0 : Math.floor(count)

        if (c >= as.length) {
            return []
        }

        const out: A[] = []

        for (let i = c; i < as.length; i++) {
            out.push(as[i])
        }

        return out
    }

/** Curried and readonly version of the built-in `reduce`. */
const reduce =
    <A, B>(initialValue: B, reducer: (acc: B, next: A) => B) =>
    (as: readonly A[]): B =>
        as.reduce(reducer, initialValue)

/** Curried and readonly version of the built-in `reduceRight`. */
const reduceRight =
    <A, B>(initialValue: B, reducer: (acc: B, next: A) => B) =>
    (as: readonly A[]): B =>
        as.reduceRight(reducer, initialValue)

const isRawValue = <A, R>(caseFn: R | ((ok: A) => R)): caseFn is R =>
    typeof caseFn !== "function"

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg)

interface ArrayMatcher<A, R> {
    empty: (() => R) | R
    nonEmpty: ((as: NonEmptyArray<A>) => R) | R
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
    <A, R>(matcher: ArrayMatcher<A, R>) =>
    (as: readonly A[]): R =>
        as.length > 0
            ? getMatcherResult(matcher.nonEmpty, as as NonEmptyArray<A>)
            : getMatcherResult(matcher.empty, undefined)

/** A type guard that tests whether the given array is equivalent
 * to the empty tuple.
 */
const isEmpty = <A>(as: readonly A[]): as is readonly [] => as.length === 0

/** A type guard that thests whether the given array is a `NonEmptyArray` */
const isNonEmpty = <A>(as: readonly A[]): as is NonEmptyArray<A> => as.length > 0

/** Also commonly known as `flatMap`. Projects each element of the array
 * given a function that itself returns an array, then flattens the result.
 */
const bind =
    <A, B>(f: (a: A) => readonly B[]) =>
    (as: readonly A[]): readonly B[] =>
        as.flatMap(f)

/** Adds an element to the end of an array, which always returns
 * a `NonEmptyArray`.
 */
const append =
    <A>(a: A) =>
    (as: readonly A[]): NonEmptyArray<A> =>
        [...as, a] as unknown as NonEmptyArray<A>

/** Also known as `cons`. Inserts an element at the beginning
 * of an array, which always returns a `NonEmptyArray`.
 */
const prepend =
    <A>(a: A) =>
    (as: readonly A[]): NonEmptyArray<A> =>
        [a, ...as]

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
        const groups: Map<string, NonEmptyArray<A>> = new Map()

        as.forEach(a => {
            const key = selector(a)

            return groups.has(key)
                ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  groups.set(key, pipe(groups.get(key)!, append(a)))
                : groups.set(key, [a])
        })

        return groups
    }

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
        [...as, ...addToEnd]

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
        [...addToFront, ...as]

/** Returns true if at least one element of the array
 * satisfies the given predicate. A curried alias of
 * Array.prototype.some()
 */
const exists =
    <A>(predicate: (a: A) => boolean) =>
    (as: readonly A[]): boolean =>
        as.some(predicate)

/** Equivalent to calling `Array.prototype.flat()` with a depth of 1. */
const flatten = <A>(as: readonly A[][]): readonly A[] => as.flat()

/** Splits an array into chunks of a specified size. The final
 * chunk will contain fewer elements than the specified size if
 * the array is not evenly divisible by the specified size.
 *
 * **Note:** Will return `[]`, not `[[]]` if given an empty array.
 *
 * @param maxChunkSize will be normalized to a natural number
 *
 * @example
 * pipe(
 *     ["a", "b", "c", "d", "e"],
 *     Array.chunk(2)
 * ); // [["a", "b"], ["c", "d"], ["e"]]
 */
const chunk =
    (maxChunkSize: number) =>
    <A>(as: readonly A[]): readonly NonEmptyArray<A>[] => {
        if (isEmpty(as)) {
            return []
        }

        const chunkSize = maxChunkSize <= 1 ? 1 : Math.floor(maxChunkSize)

        const numChunks = Math.ceil(as.length / chunkSize)

        const chunks: A[][] = [...globalThis.Array(numChunks)].map(() => [])

        let chunkIndex = 0

        for (let i = 0; i < as.length; i++) {
            if (i !== 0 && i % chunkSize === 0) {
                chunkIndex++
            }
            chunks[chunkIndex].push(as[i])
        }

        return chunks as unknown as readonly NonEmptyArray<A>[]
    }

/** Returns the length of the array. */
const length = <A>(as: readonly A[]) => as.length

/** Returns true if the given element is in the array.
 * Optionally, pass an `EqualityComparer` to use. Uses
 * reference (triple equals) equality by default.
 */
const contains =
    <A>(a: A, equalityComparer?: EqualityComparer<A>) =>
    (as: readonly A[]): boolean => {
        if (isEmpty(as)) {
            return false
        }

        const referenceEquals = <T>(o1: T, o2: T) => o1 === o2
        const equals = equalityComparer?.equals ?? referenceEquals
        const predicate = (test: A) => equals(a, test)

        return as.find(predicate) != null
    }

/** Returns a new array containing only unique values. If
 * passed, uses the `EqualityComparer` to test uniqueness.
 * Defaults to using reference equality (triple equals).
 */
const uniq =
    <A>(equalityComparer?: EqualityComparer<A>) =>
    (as: readonly A[]): readonly A[] => {
        if (isEmpty(as)) {
            return []
        }

        const out: A[] = []

        as.forEach(a => {
            if (!contains(a, equalityComparer)(out)) {
                out.push(a)
            }
        })

        return out
    }

const uniqBy =
    <A, B>(f: (a: A) => B, equalityComparer?: EqualityComparer<B>) =>
    (as: readonly A[]): readonly A[] => {
        if (isEmpty(as)) {
            return []
        }

        const out: A[] = []
        const projections: B[] = []

        as.forEach(a => {
            const projected = f(a)
            if (!contains(projected, equalityComparer)(projections)) {
                projections.push(projected)
                out.push(a)
            }
        })

        return out
    }

const sort =
    <A>(orderingComparer?: OrderingComparer<A>) =>
    (as: readonly A[]): readonly A[] => {
        if (isEmpty(as)) {
            return []
        }

        return as.slice(0).sort(orderingComparer?.compare)
    }

const sortBy =
    <A, B>(f: (a: A) => B, orderingComparer?: OrderingComparer<B>) =>
    (as: readonly A[]): readonly A[] => {
        if (isEmpty(as)) {
            return []
        }

        const compareFn =
            orderingComparer == null
                ? undefined
                : (o1: A, o2: A): number => orderingComparer.compare(f(o1), f(o2))

        return as.slice(0).sort(compareFn)
    }

/** Returns a new array with the elements in reverse order. */
const reverse = <A>(as: readonly A[]): readonly A[] => as.slice(0).reverse()

/** Returns the first element in the array that returns
 * true for the given predicate, or None if no such element
 * exists.
 */
const find =
    <A>(predicate: Predicate<A>) =>
    (as: readonly A[]): Option<A> =>
        Option.ofNullish(as.find(predicate))

/** Returns the first index of the array for which the element
 * at that index returns true for the given predicate, or None
 * if no such index/element exists.
 */
const findIndex =
    <A>(predicate: Predicate<A>) =>
    (as: readonly A[]): Option<number> => {
        const result = as.findIndex(predicate)
        return result < 0 ? Option.None : Option.Some(result)
    }

const except =
    <A>(excludeThese: readonly A[], equalityComparer?: EqualityComparer<A>) =>
    (as: readonly A[]): readonly A[] => {
        if (isEmpty(as)) {
            return []
        }

        if (isEmpty(excludeThese)) {
            return as
        }

        const out: A[] = []

        for (let i = 0; i < as.length; i++) {
            if (!pipe(excludeThese, contains(as[i], equalityComparer))) {
                out.push(as[i])
            }
        }

        return out
    }

const union =
    <A>(unionWith: readonly A[], equalityComparer?: EqualityComparer<A>) =>
    (as: readonly A[]): readonly A[] =>
        isEmpty(unionWith) && isEmpty(as)
            ? []
            : pipe(as, concat(unionWith), uniq(equalityComparer))

export const Array = {
    filter, // needs tests and docs
    filteri, // needs tests and docs
    map, // needs tests and docs
    mapi, // needs tests and docs
    bind,
    choose,
    chooseR,
    head,
    tail,
    take,
    skip,
    reduce, // needs tests and docs
    reduceRight, // needs tests and docs
    match,
    isEmpty,
    isNonEmpty,
    append,
    prepend,
    groupBy,
    concat,
    concatFirst,
    exists,
    flatten,
    chunk,
    length,
    contains,
    uniq,
    uniqBy, // needs tests and docs
    sort, // needs tests and docs
    sortBy, // needs tests and docs
    reverse,
    find,
    findIndex,
    except, // needs tests and docs
    union, // needs tests and docs
}

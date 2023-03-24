/**
 * A suite of useful functions for working with readonly arrays. These functions
 * provide a curried API that works seamlessly with right-to-left function
 * composition and preserve the `readonly` type.
 *
 * @module Array
 */
import { Predicate, Refinement, NonNullish } from "./prelude"
import { Option } from "./Option"
import { Result } from "./Result"
import { pipe } from "./Composition"
import { EqualityComparer } from "./EqualityComparer"
import { OrderingComparer } from "./OrderingComparer"
import { NonEmptyArray } from "./NonEmptyArray"

/* eslint-disable func-style */
/**
 * Curried and readonly version of the built-in `filter`.
 * Accepts a plain predicate function or a refinement
 * function (a.k.a. type guard).
 *
 * @group Filtering
 */
export function filter<A, B extends A>(
    refinement: Refinement<A, B>
): (as: readonly A[]) => readonly B[]
export function filter<A>(
    predicate: Predicate<A>
): <B extends A>(bs: readonly B[]) => readonly B[]
export function filter<A>(predicate: Predicate<A>): (as: readonly A[]) => readonly A[]
export function filter<A>(f: Predicate<A>) {
    return <B extends A>(as: readonly B[]) => as.filter(f)
}
/* eslint-enable func-style */

/**
 * Like {@link filter}, but the predicate function also accepts the
 * index of the element as an argument.
 *
 * @group Filtering
 */
export const filteri =
    <A>(f: (a: A, i: number) => boolean) =>
    (as: readonly A[]): readonly A[] =>
        as.filter(f)

/**
 * Curried and readonly version of the built-in `map`.
 *
 * @group Mapping
 */
export const map =
    <A, B>(f: (a: A) => B) =>
    (as: readonly A[]): readonly B[] =>
        as.map(f)

/**
 * Like {@link map} but the map function also accepts the
 * index of the element as an argument.
 *
 * @group Mapping
 */
export const mapi =
    <A, B>(f: (a: A, i: number) => B) =>
    (as: readonly A[]): readonly B[] =>
        as.map(f)

/**
 * Maps each value of the array into an `Option`, and keeps only the inner
 * values of those `Option`s that are`Some`. Essentially, this is a combined map +
 * filter operation where each element of the array is mapped into an `Option`
 * and an `isSome` check is used as the filter function.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     [32, null, 55, undefined, 89],   // (number | null | undefined)[]
 *     Array.choose(x => pipe(
 *         x,                           // number | null | undefined
 *         Option.ofNullish,            // Option<number>
 *         Option.map(String)           // Option<string>
 *     ))                               // string[]
 * ) // => ["32", "55", "89"]
 */
export const choose =
    <A, B extends NonNullish>(f: (a: A) => Option<B>) =>
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

/**
 * Like {@link choose}, but maps each value of the array into a `Result`,
 * and keeps only the values where the projection returns `Ok`. Essentially,
 * this is a combined map + filter operation where each element of the array
 * is mapped into an `Result` and an `isOk` check is used as the filter function.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     [32, null, 55, undefined, 89],       // (number | null | undefined)[]
 *     Array.chooseR(x => pipe(
 *         x,                               // number | null | undefined
 *         Option.ofNullish,                // Option<number>
 *         Option.map(String),              // Option<string>
 *         Result.ofOption(() => "err")     // Result<string, string>
 *     ))                                   // string[]
 * ) // => ["32", "55", "89"]
 */
export const chooseR =
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

/**
 * Get the first element of the array (wrapped in `Some`) if
 * non-empty, otherwise `None`.
 *
 * @group Utils
 * @group Pattern Matching
 *
 * @example
 * ```ts
 * Array.head([]) // => `Option.none`
 * Array.head([1, 2, 3]) // => `Option.some(1)`
 * ```
 */
export const head = <A extends NonNullish>(as: readonly A[]): Option<A> =>
    as.length > 0 ? Option.some(as[0]) : Option.none

/**
 * Alias of {@link head}.
 *
 * @group Utils
 * @group Pattern Matching
 */
export const first = head

/**
 * Get a new array containing all values except the first
 * one (wrapped in `Some`) if non-empty, otherwise `None`.
 *
 * @group Utils
 * @group Pattern Matching
 *
 * @example
 * pipe(
 *     [1, 2, 3, 4],
 *     Array.tail
 * ) // => Option.some([2, 3, 4])
 */
export const tail = <A>(as: readonly A[]): Option<readonly A[]> => {
    if (as.length === 0) {
        return Option.none
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, ...tail] = as
    return Option.some(tail)
}

/**
 * Get the first `n` elements of the array. Will return the entire
 * array if `n` is greater than the length of the array.
 *
 * @param count is normalized to a non-negative integer
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     [1, 2, 3, 4, 5, 6],
 *     Array.take(3)
 * ) // => [1, 2, 3]
 */
export const take =
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

/**
 * Get the remaining elements of the array
 * after skipping `n` elements. Returns empty if the
 * skip count goes past the end of the array.
 *
 * @group Utils
 *
 * @param count is normalized to a non-negative integer
 *
 * @example
 * pipe(
 *     [1, 2, 3, 4, 5, 6],
 *     Array.skip(3)
 * ) // => [4, 5, 6]
 */
export const skip =
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

/**
 * Curried and readonly version of the built-in `Array.prototype.reduce`. Takes
 * the initial value first instead of last.
 *
 * @group Utils
 * @group Folding
 */
export const reduce =
    <A, B>(initialValue: B, reducer: (acc: B, next: A) => B) =>
    (as: readonly A[]): B =>
        as.reduce(reducer, initialValue)

/**
 * Curried and readonly version of the built-in `Array.prototype.reduceRight`.
 * Takes the initial value first instead of last.
 *
 * @group Utils
 * @group Folding
 */
export const reduceRight =
    <A, B>(initialValue: B, reducer: (acc: B, next: A) => B) =>
    (as: readonly A[]): B =>
        as.reduceRight(reducer, initialValue)

const isRawValue = <A, R>(caseFn: R | ((ok: A) => R)): caseFn is R =>
    typeof caseFn !== "function"

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg)

/**
 * @ignore
 */
interface ArrayMatcher<A, R> {
    empty: (() => R) | R
    nonEmpty: ((as: NonEmptyArray<A>) => R) | R
}

/**
 * Exhaustive pattern match against an array to "unwrap" its values. Provide
 * a matcher object to handle both the `empty` and `nonEmpty` cases.
 * The matcher can use lambdas or raw values. In the `nonEmpty` case,
 * the lambda will be given a `NonEmptyArray`.
 *
 * @group Pattern Matching
 *
 * @example
 * ```ts
 * pipe(
 *     ["a", "b"],
 *     Array.match({
 *         empty: () => "default",
 *         nonEmpty: Array.reduceRight("", (a, b) => `${a}${b}`)
 *     })
 * ) // => "ba"
 * ```
 */
export const match =
    <A, R>(matcher: ArrayMatcher<A, R>) =>
    (as: readonly A[]): R =>
        as.length > 0
            ? getMatcherResult(matcher.nonEmpty, as as NonEmptyArray<A>)
            : getMatcherResult(matcher.empty, undefined)

/**
 * Type guard that tests whether the given array is equivalent
 * to the empty tuple type.
 *
 * @group Type Guards
 * @group Utils
 */
export const isEmpty = <A>(as: readonly A[]): as is readonly [] => as.length === 0

/**
 * Type guard that tests whether the given array is a `NonEmptyArray`
 *
 * @group Type Guards
 * @group Utils
 */
export const isNonEmpty = <A>(as: readonly A[]): as is NonEmptyArray<A> => as.length > 0

/**
 * Also commonly known as `flatMap`. Maps each element of the array
 * given a function that itself returns an array, then flattens the result.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     [1, 2, 3],
 *     Array.bind(n => [n, n])
 * ) // => [1, 1, 2, 2, 3, 3]
 */
export const bind =
    <A, B>(f: (a: A) => readonly B[]) =>
    (as: readonly A[]): readonly B[] =>
        as.flatMap(f)

/**
 * Alias of {@link bind}.
 *
 * @group Mapping
 */
export const flatMap = bind

/**
 * Add an element to the _end_ of an array. Always returns
 * a `NonEmptyArray`.
 *
 * @group Utils
 */
export const append =
    <A>(a: A) =>
    (as: readonly A[]): NonEmptyArray<A> =>
        [...as, a] as unknown as NonEmptyArray<A>

/**
 * Also known as `cons`. Insert an element at the beginning
 * of an array. Always returns a `NonEmptyArray`.
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     [2, 3],
 *     Array.prepend(1)
 * ) // => [1, 2, 3]
 */
export const prepend =
    <A>(a: A) =>
    (as: readonly A[]): NonEmptyArray<A> =>
        [a, ...as]

/**
 * Return a Map of keys to groups, where the selector function
 * is used to generate a string key that determines in which group
 * each array element is placed.
 *
 * @group Grouping
 * @group Utils
 *
 * @example
 * pipe(
 *     [1, 2, 1, 2, 3, 3, 5],
 *     Array.groupBy(String)
 * )
 * // structurally equivalent to
 * new Map([
 *     ['1', [1, 1]],
 *     ['2', [2, 2]],
 *     ['3', [3, 3]],
 *     ['5', [5]]
 * ])
 */
export const groupBy =
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

/**
 * Add an array of values to the _end_ of the subsequently
 * passed (partially applied) array, in a way that makes sense
 * when reading top-to-bottom/left-to-right using `pipe`.
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     [1, 2],
 *     Array.concat([3, 4])
 * ) // => [1, 2, 3, 4]
 */
export const concat =
    <A>(addToEnd: readonly A[]) =>
    (as: readonly A[]): readonly A[] =>
        [...as, ...addToEnd]

/**
 * Like {@link concat}, except this adds an array of values to the
 * _beginning_ of the subsequently (partially applied) array,
 * in a way that makes more sense when _not_ using `pipe`.
 *
 * @group Utils
 *
 * @example
 * ```ts
 * // Reads "backwards" when used with `pipe`
 * pipe(
 *     ["a", "b"],
 *     Array.concatFirst(["c", "d"])
 * ) // => ["c", "d", "a", "b"]
 * // Reads better when *not* used with `pipe`
 * Array.concatFirst(["a", "b"])(["c", "d"]) // => ["a", "b", "c", "d"]
 * ```
 */
export const concatFirst =
    <A>(addToFront: readonly A[]) =>
    (as: readonly A[]): readonly A[] =>
        [...addToFront, ...as]

/**
 * Returns true if at least one element of the array
 * satisfies the given predicate. Curried version of
 * `Array.prototype.some`.
 *
 * @group Utils
 */
export const exists =
    <A>(predicate: (a: A) => boolean) =>
    (as: readonly A[]): boolean =>
        as.some(predicate)

/**
 * Alias of {@link exists}.
 *
 * @group Utils
 */
export const some = exists

/**
 * Equivalent to calling `Array.prototype.flat()` with a depth of 1.
 *
 * @group Utils
 */
export const flatten = <A>(as: readonly (readonly A[])[]): readonly A[] => as.flat()

/**
 * Split an array into chunks of a specified size. The final
 * chunk will contain fewer elements than the specified size if
 * the array is not evenly divisible by the specified size.
 *
 * @remarks
 * **Note:** Will return `[]`, _not_ `[[]]` if given an empty array.
 *
 * @param maxChunkSize Normalized to a positive integer.
 *
 * @example
 * pipe(
 *     ["a", "b", "c", "d", "e"],
 *     Array.chunk(2)
 * ) // => [["a", "b"], ["c", "d"], ["e"]]
 *
 * @group Utils
 * @group Grouping
 */
export const chunk =
    (maxChunkSize: number) =>
    <A>(as: readonly A[]): readonly NonEmptyArray<A>[] => {
        if (isEmpty(as)) {
            return []
        }

        const chunkSize = maxChunkSize <= 1 ? 1 : Math.floor(maxChunkSize)

        const numChunks = Math.ceil(as.length / chunkSize)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

/**
 * Get the length of an array.
 *
 * @group Utils
 */
export const length = <A>(as: readonly A[]) => as.length

/**
 * Returns true if the given element is in the array.
 * Optionally, pass an `EqualityComparer` to use. Uses
 * reference (triple equals) equality by default.
 *
 * @group Utils
 */
export const contains =
    <A>(a: A, equalityComparer: EqualityComparer<A> = EqualityComparer.Default) =>
    (as: readonly A[]): boolean => {
        if (isEmpty(as)) {
            return false
        }

        const predicate = (test: A) => equalityComparer.equals(a, test)

        return as.some(predicate)
    }

/**
 * Return a new array containing only unique values. If
 * passed, uses the `EqualityComparer` to test uniqueness.
 * Defaults to using reference equality (triple equals).
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     [3, 2, 1, 2, 1, 4, 9],
 *     Array.uniq()
 * ) // => [3, 2, 1, 4, 9]
 */
export const uniq =
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

/**
 * Returns a new array containing only unique values as determined
 * by mapping each element with the given function and optionally
 * passing an equality comparer to use on the mapped elements.
 * Defaults to using reference equality (triple equals).
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     [{ name: "Rufus" }, { name: "Rex" }, { name: "Rufus" }],
 *     Array.uniqBy(p => p.name)
 * ) // => [{ name: "Rufus" }, { name: "Rex" }]
 */
export const uniqBy =
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

/**
 * Get a new array with elements sorted. If given, will use the
 * `OrderingComparer`. Otherwise, uses the default JavaScript ASCII-based sort.
 *
 * @group Utils
 *
 * @example
 * declare const petByNameComparer: OrderingComparer<Pet>
 *
 * const pets: readonly Pet[] = [
 *     { name: "Fido" },
 *     { name: "Albus" },
 *     { name: "Rex" },
 *     { name: "Gerald" }
 * ]
 *
 * pipe(
 *     pets,
 *     Array.sort(petByNameComparer),
 *     Array.map(p => p.name)
 * ) // => [ "Albus", "Fido", "Gerald", "Rex" ]
 */
export const sort =
    <A>(orderingComparer?: OrderingComparer<A>) =>
    (as: readonly A[]): readonly A[] => {
        if (isEmpty(as)) {
            return []
        }

        return as.slice(0).sort(orderingComparer?.compare)
    }

/**
 * Get a new array with elements sorted based on the sort-order
 * of each mapped element produced by the given mapping function.
 * If given, will use the `OrderingComparer`. Otherwise, defaults to an
 * OrderingComparer that `String`s the mapped element and uses the
 * default ASCII-based sort.
 *
 * @group Utils
 */
export const sortBy =
    <A, B>(
        f: (a: A) => B,
        orderingComparer: OrderingComparer<B> = OrderingComparer.Default
    ) =>
    (as: readonly A[]): readonly A[] =>
        isEmpty(as)
            ? []
            : as.slice(0).sort((o1: A, o2: A) => orderingComparer.compare(f(o1), f(o2)))

/**
 * Get a new array with the elements in reverse order.
 *
 * @group Utils
 */
export const reverse = <A>(as: readonly A[]): readonly A[] => as.slice(0).reverse()

/**
 * Get the _first_ element in the array (wrapped in a `Some`) that
 * returns `true` for the given predicate, or `None` if no such
 * element exists.
 *
 * @group Utils
 */
export const find =
    <A extends NonNullish>(predicate: Predicate<A>) =>
    (as: readonly A[]): Option<A> =>
        Option.ofNullish(as.find(predicate))

/**
 * Get the _first_ index of the array (wrapped in a `Some`) for
 * which the element at that index returns true for the given predicate,
 * or `None` if no such index/element exists.
 *
 * @group Utils
 */
export const findIndex =
    <A>(predicate: Predicate<A>) =>
    (as: readonly A[]): Option<number> => {
        const result = as.findIndex(predicate)
        return result < 0 ? Option.none : Option.some(result)
    }

/**
 * Get a new array containing only those elements that are not
 * in the given `excludeThese` array. If given, will use the
 * EqualityComparer. Otherwise, defaults to reference equality
 * (triple equals).
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     [1, 2, 3, 4, 5],
 *     Array.except([2, 5])
 * ) // => [1, 3, 4]
 */
export const except =
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

/**
 * Get a new array containing the set union of two arrays, defined as the
 * set of elements contained in both arrays. **Remember:** sets only contain
 * unique elements. If you just need to join two arrays together, use {@link concat}.
 *
 * @group Utils
 */
export const union =
    <A>(unionWith: readonly A[], equalityComparer?: EqualityComparer<A>) =>
    (as: readonly A[]): readonly A[] =>
        isEmpty(unionWith) && isEmpty(as)
            ? []
            : pipe(as, concat(unionWith), uniq(equalityComparer))

/**
 * Get an {@link EqualityComparer} that represents structural equality for an array
 * of type `A` by giving this function an `EqualityComparer` for each `A` element.
 *
 * @group Equality
 * @group Utils
 *
 * @param equalityComparer The `EqualityComparer` to use for element-by-element comparison.
 *
 * @returns A new `EqualityComparer` instance
 *
 * @example
 * const eq = Array.getEqualityComparer(EqualityComparer.Number)
 * eq.equals([1, 2, 3], [1, 2, 3]) // => true
 * eq.equals([1, 3], [3, 1]) // => false
 */
export const getEqualityComparer = <A>({
    equals,
}: EqualityComparer<A>): EqualityComparer<readonly A[]> =>
    EqualityComparer.ofEquals((arr1, arr2) => {
        if (isEmpty(arr1) && isEmpty(arr2)) {
            return true
        }

        if (arr1.length !== arr2.length) {
            return false
        }

        for (let i = 0; i < arr1.length; i++) {
            if (!equals(arr1[i], arr2[i])) {
                return false
            }
        }

        return true
    })

/**
 * Does not affect the passed array at runtime. (Effectively executes an identity
 * function) Removes the `readonly` part of the **type** only.
 *
 * @group Utils
 */
export const asMutable = <A>(as: readonly A[]) => as as A[]

/**
 * Execute an arbitrary side effect for each element of the array. Essentially a
 * curried version of the built-in `forEach` method.
 *
 * @group Utils
 */
export const iter =
    <A>(f: (a: A) => void) =>
    (as: readonly A[]): void =>
        as.forEach(a => f(a))

/** @ignore */
export const Array = {
    filter,
    filteri,
    map,
    mapi,
    bind,
    flatMap,
    choose,
    chooseR,
    head,
    first,
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
    exists,
    some,
    flatten,
    chunk,
    length,
    contains,
    uniq,
    uniqBy,
    sort,
    sortBy,
    reverse,
    find,
    findIndex,
    except,
    union,
    getEqualityComparer,
    asMutable,
    iter,
}
/* c8 ignore end */

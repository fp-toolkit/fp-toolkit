import { Array } from "../Array"
import { EqualityComparer } from "../EqualityComparer"
import { pipe } from "../Composition"
import { Bool } from "../Bool"
import { Option } from "../Option"

/**
 * A [branded type](https://prosopo.io/articles/typescript-branding/) that is "just"
 * an array at runtime. At compile-time, however, the "brand" affords type safety
 * so that an `ArraySet` can behave like any other `Array`, but any other `Array`
 * cannot behave like an `ArraySet`.
 */
export type ArraySet<T> = readonly T[] & { readonly ArraySet: unique symbol }

const unsafe = <T>(arr: readonly T[]): ArraySet<T> =>
    arr as unknown as ArraySet<T>

/**
 * Creates a new, empty `ArraySet` with the given type.
 *
 * @group Constructors
 */
export const empty = <T = never>(): ArraySet<T> => unsafe<T>([])

/**
 * Checks whether an array is an `ArraySet`. Can be used as a predicate function
 * or as a type guard. Uses default equality (reference/triple-equals) if an
 * `EqualityComparer` isn't given.
 *
 * @group Utils
 */
export const isArraySet = <T>(
    arr: readonly T[],
    equalityComparer?: EqualityComparer<T>
): arr is ArraySet<T> =>
    pipe(arr, Array.uniq(equalityComparer), Array.length) === arr.length

/**
 * Add an element to the `ArraySet`, using the given `EqualityComparer` if provided.
 * If the element already exists (according to the `EqualityComparer` logic), returns
 * an `ArraySet` with the existing elements.
 *
 * @group Transformations
 *
 * @example
 * pipe(
 *   ArraySet.of(['A', 'B']),
 *   ArraySet.add('C')
 * ) // => ['A', 'B', 'C']
 *
 * @example
 * pipe(
 *   ArraySet.of(['A', 'B']),
 *   ArraySet.add('A')
 * ) // => ['A', 'B']
 */
export const add =
    <T>(elem: NoInfer<T>, equalityComparer?: EqualityComparer<NoInfer<T>>) =>
    (set: ArraySet<T>): ArraySet<T> =>
        pipe(
            set,
            Array.contains(elem, equalityComparer),
            Bool.match({
                true: set,
                false: unsafe([elem, ...set]),
            })
        )

/**
 * Remove an element from the `ArraySet`, using the given `EqualityComparer` if provided.
 * If the element does not exist, will return an `ArraySet` with the same elements.
 *
 * @group Transformations
 *
 * @example
 * pipe(
 *   ArraySet.of(['A', 'B', 'C']),
 *   ArraySet.remove('B')
 * ) // => ['A', 'C']
 */
export const remove =
    <T>(
        elem: NoInfer<T>,
        { equals }: EqualityComparer<NoInfer<T>> = EqualityComparer.Default
    ) =>
    (set: ArraySet<T>): ArraySet<T> =>
        pipe(
            set,
            Array.filter(el => !equals(el, elem)),
            unsafe
        )

/**
 * Convert an existing `Array` into an `ArraySet`, using the given `EqualityComparer`.
 * Analogous to `new Set([...])`.
 *
 * @group Constructors
 */
export const ofArray = <T>(
    arr: readonly T[],
    equalityComparer?: EqualityComparer<T>
): ArraySet<T> => pipe(arr, Array.uniq(equalityComparer), unsafe)

/**
 * Alias for {@link ofArray}
 *
 * @group Constructors
 */
export const of = ofArray

/**
 * Create a new `ArraySet` from the result of merging two `ArraySet`s and keeping only
 * the unique values, according to the given `EqualityComparer` (or default/triple-equals
 * if not specified).
 *
 * @group Set Arithmetic
 *
 * @example
 * pipe(
 *   ArraySet.of([1, 2, 3, 4]),
 *   ArraySet.union(ArraySet.of([3, 4, 5]))
 * ) // => [1, 2, 3, 4, 5]
 */
export const union =
    <T>(set2: ArraySet<T>, equalityComparer?: EqualityComparer<T>) =>
    (set1: ArraySet<T>): ArraySet<T> =>
        pipe([...set1, ...set2], Array.uniq(equalityComparer), unsafe)

/**
 * Create a new `ArraySet` by keeping only elements that are contained in both `ArraySet`s.
 * Uses the given `EqualityComparer` if specified; defaults to reference/triple-equals.
 *
 * @group Set Arithmetic
 *
 * @example
 * pipe(
 *   ArraySet.of([1, 2, 3, 4]),
 *   ArraySet.intersect(ArraySet.of([3, 4, 5]))
 * ) // => [3, 4]
 */
export const intersect =
    <T>(
        set2: ArraySet<T>,
        { equals }: EqualityComparer<T> = EqualityComparer.Default
    ) =>
    (set1: ArraySet<T>): ArraySet<T> => {
        const eq = (t1: T) => (t2: T) => equals(t1, t2)

        const bigger = set1.length > set2.length ? set1 : set2
        const smaller = (bigger === set1 ? set2 : set1).slice() // make a copy in order to (safely) mutate; see comment below

        const intersection: T[] = []

        for (const elem of bigger) {
            pipe(
                smaller,
                Array.findIndex(eq(elem)),
                Option.match({
                    some: i => {
                        intersection.push(smaller[i])
                        smaller.splice(i, 1) // remove this element from the (copied) array; make subsequent `findIndex` operations faster
                    },
                    none: undefined,
                })
            )
        }

        return unsafe(intersection)
    }

/**
 * Create a new `ArraySet` by excluding the given `Array` of elements.
 *
 * @example
 * pipe(
 *   ArraySet.of([1, 2, 3, 4, 5]),
 *   ArraySet.except([2, 4])
 * ) // => [1, 3, 5]
 */
export const except =
    <T>(excluded: readonly T[], equalityComparer?: EqualityComparer<T>) =>
    (set: ArraySet<T>): ArraySet<T> =>
        pipe(set, Array.except(excluded, equalityComparer), unsafe)

/**
 * Given an `EqualityComparer` for each element, returns an `EqualityComparer`
 * instance that will yield Set-based equality between two `ArraySet`s.
 *
 * @group Equality
 */
export const getEqualityComparer = <T>(
    eq: EqualityComparer<T>
): EqualityComparer<ArraySet<T>> => ({
    equals: (set1: ArraySet<T>, set2: ArraySet<T>) => {
        if (set1.length === 0 && set2.length === 0) {
            return true
        }

        if (set1.length !== set2.length) {
            return false
        }

        return pipe(set1, except(set2, eq), Array.length) === 0
    },
})

/**
 * An `OrderingComparer` represents the ability to deterministcally sort a set of values.
 * Meaning, it should always give back the same sort order given the same set of values.
 *
 * The `compare` function returns `-1` if the first item is _less than_ the second
 * item. It returns `1` if the first item is _greater than_ the second item in the
 * sort order. It returns `0` if the first item is equivalent  to the second item
 * with reference to the sort order.
 *
 * **Note:** An `OrderingComparer` is not structurally compatible with an `Ord` from `fp-ts`
 * by default. You can get an `Ord`-compatible structure via {@link deriveEqualityComparer}.
 *
 * @example
 * interface Pet {
 *    readonly name: string
 *    readonly age: number
 * }
 *
 * class PetByAgeDescComparer implements OrderingComparer<Pet> {
 *    compare(p1: Pet, p2: Pet) {
 *        return p1.age === p2.age ? 0 : p1.age < p2.age ? 1 : -1
 *    }
 * }
 *
 * @module OrderingComparer
 */

import { String as S } from "./string"
import { EqualityComparer } from "./EqualityComparer"

/**
 * A more strict version of the default JavaScript compare function result.
 * (i.e., `-1` and `1` are required specifically, not just `< 0` or `> 0`)
 */
type CompareResult =
    | -1 // the first value is considered _less than_ the second value
    | 0 // the first value is considered _the same as_ the second value
    | 1 // the first value is considered _greater than_ the second value

export interface OrderingComparer<A> {
    compare(a1: A, a2: A): CompareResult
}

/**
 * Construct a new `OrderingComparer` based on a compare function that returns
 * `-1`, `0`, or `1`. See docs for {@link OrderingComparer}.
 *
 * **Note:** this function already checks for reference equality and will return
 * `0` in that case. (So the compare function you pass here does not necessarily
 * need to check for reference equality.)
 *
 * @group Constructors
 *
 * @returns A new `OrderingComparer` instance.
 */
export const ofCompare = <A>(
    compare: OrderingComparer<A>["compare"]
): OrderingComparer<A> => ({
    compare: (a1, a2) => (a1 === a2 ? 0 : compare(a1, a2)),
})

/**
 * Reverse the sort order produced by an `OrderingComparer`. For example, you could use this
 * to generate an `OrderingComparer` that would sort numbers in descending order.
 *
 * @group Utils
 *
 * @returns A new `OrderingComparer` with its sort order inverted.
 *
 * @example
 * const numberDesc = OrderingComparer.reverse(OrderingComparer.Number)
 */
export const reverse = <A>({ compare }: OrderingComparer<A>): OrderingComparer<A> =>
    ofCompare((a1, a2) => compare(a2, a1))

/**
 * Given you already have an `OrderingComparer` for some type `A`, and you know how to
 * map from some other type `B` to type `A`, you can effectively "re-use" your `OrderingComparer`
 * for type `B`. Also referred to commonly as `contramap`, because the mapping is going
 * from `B`&rarr;`A`, not from `A`&rarr;`B`.
 *
 * @group Utils
 * @group Constructors
 *
 * @param known The `OrderingComparer` that you already have.
 * @param map The function that can map from `B`&rarr;`A`.
 *
 * @returns A new `OrderingComparer` instance.
 */
export const deriveFrom = <A, B>(
    known: OrderingComparer<A>,
    map: (b: B) => A
): OrderingComparer<B> => ({
    compare: (b1, b2) => (b1 === b2 ? 0 : known.compare(map(b1), map(b2))),
})

/**
 * The default `OrderingComparer`. Converts both values to strings (if they
 * are not already) and does the default ASCII-based alphabetical comparison.
 *
 * @group Primitives
 */
export const Default: OrderingComparer<never> = ofCompare((a1, a2) => {
    const a1String: string = S.isString(a1) ? a1 : globalThis.String(a1)
    const a2String: string = S.isString(a2) ? a2 : globalThis.String(a2)

    return a1String < a2String ? -1 : a1String > a2String ? 1 : 0
})

/**
 * Combine or merge multiple `OrderingComparer`s together **in a specific order**.
 * Conceptually, this means, "Sort these values by this first, then this, then this"
 * and so on.
 *
 * For example if you have an `OrderingComparer` that sorts strings alphabetically in
 * a case-insensitive manner (say, `alphabeticalCiComparer`) and an `OrderingComparer`
 * that sorts strings by their length (say, `lengthComparer`), you could generate a new
 * "composite" `OrderingComparer` that sorts alphabetically (case-insensitive) **and
 * then by** length.
 *
 * @example
 * const alphabeticalCiThenLengthComparer =
 *     OrderingComparer.getComposite(alphabeticalCiComparer, lengthComparer)
 *
 * @group Utils
 *
 * @remarks
 * If no comparers are passed, will default to {@link Default}
 *
 * @returns A new `OrderingComparer` instance.
 */
export const getComposite = <A>(
    ...comparers: readonly OrderingComparer<A>[]
): OrderingComparer<A> => {
    /* c8 ignore next 3 */
    if (comparers.length < 1) {
        return Default
    }

    return ofCompare((a1, a2) =>
        comparers.reduce<CompareResult>(
            (result, nextComparer) =>
                result !== 0 ? result : nextComparer.compare(a1, a2),
            0
        )
    )
}

/**
 * An `OrderingComparer` for the built-in `number` type, in ascending order.
 *
 * @group Primitives
 */
export const Number: OrderingComparer<number> = ofCompare((n1, n2) =>
    n2 - n1 > 0 ? -1 : 1
)

/**
 * An `OrderingComparer` for the built-in `string` type. Equivalent to {@link Default}.
 *
 * @group Primitives
 */
export const String: OrderingComparer<string> = Default

/**
 * An `OrderingComparer` for the built-in `date` type, in ascending order.
 *
 * @group Primitives
 */
export const Date: OrderingComparer<Date> = deriveFrom(Number, date => date.valueOf())

/**
 * Get a combined `OrderingComparer` and `EqualityComparer` by using the check,
 * "Does the compare return `0`?" as the equals function. This produces a type
 * that is compatible with `Ord` from `fp-ts`.
 *
 * @returns A new instance that implements both `EqualityComparer` and `OrderingComparer`
 *
 * @group Utils
 */
export const deriveEqualityComparer = <A>(
    orderingComparer: OrderingComparer<A>
): OrderingComparer<A> & EqualityComparer<A> => ({
    compare: orderingComparer.compare,
    equals: (a1, a2) => a1 === a2 || orderingComparer.compare(a1, a2) === 0,
})

/**
 * Get whether the _first_ value is **greater than** the _second_ value.
 *
 * @param orderingComparer The `OrderingComparer` to use for the comparison.
 *
 * @group Comparisons
 */
export const gt =
    <A>({ compare }: OrderingComparer<A>) =>
    (first: A, second: A): boolean =>
        compare(first, second) === 1

/**
 * Get whether the _first_ value is **greater than or equal to** the _second_ value.
 *
 * @param orderingComparer The `OrderingComparer` to use for the comparison.
 *
 * @group Comparisons
 */
export const geq =
    <A>({ compare }: OrderingComparer<A>) =>
    (first: A, second: A): boolean =>
        compare(first, second) >= 0

/**
 * Get whether the _first_ value is **less than** the _second_ value.
 *
 * @param orderingComparer The `OrderingComparer` to use for the comparison.
 *
 * @group Comparisons
 */
export const lt =
    <A>({ compare }: OrderingComparer<A>) =>
    (first: A, second: A): boolean =>
        compare(first, second) === -1

/**
 * Get whether the _first_ value is **less than or equal to** the _second_ value.
 *
 * @param orderingComparer The `OrderingComparer` to use for the comparison.
 *
 * @group Comparisons
 */
export const leq =
    <A>({ compare }: OrderingComparer<A>) =>
    (first: A, second: A): boolean =>
        compare(first, second) <= 0

/**
 * Get whether the value is between the upper and lower bound (inclusive).
 *
 * @group Comparisons
 */
export const isBetween =
    <A>(orderingComparer: OrderingComparer<A>) =>
    (lowerBound: A, upperBound: A) =>
    (a: A): boolean =>
        geq(orderingComparer)(a, lowerBound) && leq(orderingComparer)(a, upperBound)

/* c8 ignore start */
/** @ignore */
export const OrderingComparer = {
    ofCompare,
    reverse,
    deriveFrom,
    Default,
    Number,
    String,
    Date,
    getComposite,
    deriveEqualityComparer,
    gt,
    geq,
    lt,
    leq,
    isBetween,
}
/* c8 ignore end */

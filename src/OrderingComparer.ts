import { String as S } from "./string"

type CompareResult =
    | -1 // the first value should be _before_ the second value in order
    | 0 // the first value should not change relative to the second value in order
    | 1 // the first value should be _after_ the second value in order

/**
 * An `OrderingComparer` represents the ability to deterministcally sort a set of values.
 * Meaning, it should always give back the same sort order given the same set of values.
 *
 * The `compare` function returns `-1` if the first item should be _before_ the second
 * item in the sort order. It returns `1` if the first item should be _after_ the second
 * item in the sort order. It returns `0` if the first item does not need to change where
 * it is in relation to the second item with reference to the sort order.
 */
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
 * @category Constructors
 *
 * @returns A new `OrderingComparer` instance.
 */
const ofCompare = <A>(compare: OrderingComparer<A>["compare"]): OrderingComparer<A> => ({
    compare: (a1, a2) => (a1 === a2 ? 0 : compare(a1, a2)),
})

/**
 * Reverse the sort order produced by an `OrderingComparer`. For example, you could use this
 * to generate an `OrderingComparer` that would sort numbers in descending order.
 *
 * @category Utils
 *
 * @returns A new `OrderingComparer` with its sort order inverted.
 *
 * @example
 * const numberDesc = OrderingComparer.reverse(OrderingComparer.Number)
 */
const reverse = <A>({ compare }: OrderingComparer<A>): OrderingComparer<A> =>
    ofCompare((a1, a2) => compare(a2, a1))

/**
 * Given you already have an `OrderingComparer` for some type `A`, and you know how to
 * map from some other type `B` to type `A`, you can effectively "re-use" your `OrderingComparer`
 * for type `B`. Also referred to commonly as `contramap`, because the mapping is going
 * from `B`&rarr;`A`, not from `A`&rarr;`B`.
 *
 * @category Utils
 * @category Constructors
 *
 * @param known The `OrderingComparer` that you already have.
 * @param map The function that can map from `B`&rarr;`A`.
 *
 * @returns A new `OrderingComparer` instance.
 */
const deriveFrom = <A, B>(
    known: OrderingComparer<A>,
    map: (b: B) => A
): OrderingComparer<B> => ({
    compare: (b1, b2) => (b1 === b2 ? 0 : known.compare(map(b1), map(b2))),
})

/**
 * The default `OrderingComparer`. Converts both values to strings and does
 * the default ASCII-based alphabetical comparison.
 */
const Default: OrderingComparer<never> = ofCompare((a1, a2) => {
    const a1String: string = S.isString(a1) ? a1 : globalThis.String(a1)
    const a2String: string = S.isString(a2) ? a2 : globalThis.String(a2)

    return a1String.localeCompare(a2String) < 0 ? -1 : 1
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
 * @category Utils
 *
 * @remarks
 * If no comparers are passed, will default to {@link Default}
 *
 * @returns A new `OrderingComparer` instance.
 */
const getComposite = <A>(
    ...comparers: readonly OrderingComparer<A>[]
): OrderingComparer<A> => {
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
 * An `OrderingComparer` for the built-in `number` type. In ascending order.
 */
const Number: OrderingComparer<never> = ofCompare((n1, n2) => (n2 - n1 > 0 ? -1 : 1))

/**
 * An `OrderingComparer` for the built-in `string` type. Semantically equivalent
 * to {@link Default}.
 */
const String: OrderingComparer<string> = Default

/**
 * An `OrderingComparer` for the built-in `date` type. In ascending order.
 */
const Date: OrderingComparer<Date> = deriveFrom(Number, date => date.valueOf())

export const OrderingComparer = {
    ofCompare,
    reverse,
    deriveFrom,
    Default,
    Number,
    String,
    Date,
    getComposite,
}

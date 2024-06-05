/**
 * A suite of functions for working with `Record<>` types in an immutable, functional way.
 * The motivating use-case for using a `Record<>` over a `Map<>` is that `Record`s are plain
 * JavaScript objects, which means they are serializable by default. Because of objects' limitations,
 * however, keys must extend the string type.
 *
 * **Important Note:** The functions in this module _ignore nullish values_, because the type
 * of `V` (values) must be non-nullish. For example, if you create a `Rec<string, number>`
 * like `{ prop: undefined }`, calculating `Rec.size` will return 0 and `Rec.isEmpty` will
 * return `true`. This behavior aligns `Rec` more consistently with `Map` semantics.
 *
 * @module Rec
 */

import { EqualityComparer } from "../EqualityComparer"
import { Option } from "../Option"
import { Array } from "../Array"
import { pipe } from "../Composition"
import type { NonNullish, Predicate } from "../prelude"
import { OrderingComparer } from "../OrderingComparer"

/** Represents a strongly-typed and immutable Object. */
export type Rec<K extends string, V extends NonNullish> = Readonly<
    Partial<Record<K, V>>
>

/**
 * Returns whether the record contains any key/value pairs.
 *
 * @group Utils
 *
 * @returns `true` if the record has no bindings, `false` otherwise.
 */
export const isEmpty = <K extends string, V extends NonNullish>(
    rec: Rec<K, V>
): boolean => pipe(rec, keys(), Array.length) < 1

/**
 * Creates a new empty record. Essentially an alias for `{}`.
 * Provided for convenience to avoid some type inference weirdness.
 *
 * @group Constructors
 */
export const empty = <
    K extends string = never,
    V extends NonNullish = never,
>(): Rec<K, V> => ({}) as Rec<K, V>

/**
 * Lookup a key/value pair (wrapped in a `Some`) from a `Rec` using the given key.
 * If the `Rec` doesn't contain the key, returns `None`.
 *
 * Uses the given equality comparer if passed. Otherwise, defaults to reference
 * equality (triple equals) for equality comparisons.
 *
 * @group Lookups
 *
 * @returns An `Option` containing a tuple of the key and value.
 */
export const findWithKey =
    <K extends string>(
        key: NoInfer<K>,
        { equals }: EqualityComparer<string> = EqualityComparer.Default
    ) =>
    <V extends NonNullish>(rec: Rec<K, V>): Option<readonly [K, V]> => {
        if (isEmpty(rec)) {
            return Option.none
        }

        for (const k in rec) {
            const v = rec[k]
            if (equals(k, key) && v != null) {
                return Option.some([k, v])
            }
        }

        return Option.none
    }

/**
 * Test whether a `Rec` contains the given key. Uses the given `EqualityComparer`
 * if passed. Otherwise, defaults to reference equality (triple equals).
 *
 * @group Lookups
 *
 * @returns `true` if the key is in the `Rec`, `false` otherwise.
 */
export const containsKey =
    <K extends string>(
        key: NoInfer<K>,
        equalityComparer?: EqualityComparer<string>
    ) =>
    <V extends NonNullish>(rec: Rec<K, V>): boolean =>
        pipe(rec, findWithKey(key, equalityComparer), Option.isSome)

/**
 * Get a value associated with the given key from the `Rec`. Returns a `Some`
 * containing the value, or `None` if the key is not in the `Rec`.
 *
 * Uses the given equality comparer if passed, otherwise defaults to using
 * reference equality (triple equals) for equality comparison.
 *
 * @group Lookups
 */
export const find =
    <K extends string>(
        key: NoInfer<K>,
        equalityComparer?: EqualityComparer<string>
    ) =>
    <V extends NonNullish>(rec: Rec<K, V>): Option<V> =>
        pipe(
            rec,
            findWithKey(key, equalityComparer),
            Option.map(([, v]) => v)
        )

/**
 * Adds a key/value pair to a `Rec`. If the given key already exists
 * the value at that key will be updated with the given value.
 *
 * Will use the equality comparer if given, otherwise defaults to using
 * reference equality (triple equals) for equality comparisons.
 *
 * @group Transformations
 *
 * @returns A new `Rec` with the added key/value pair
 */
export const set =
    <K extends string, V extends NonNullish>(
        [key, value]: readonly [NoInfer<K>, NoInfer<V>],
        equalityComparer?: EqualityComparer<string>
    ) =>
    (rec: Rec<K, V>): Rec<K, V> => {
        if (isEmpty(rec)) {
            return { [key]: value } as Rec<K, V>
        }

        return pipe(
            rec,
            findWithKey(key, equalityComparer),
            Option.match({
                none: () => ({
                    ...rec,
                    [key]: value,
                }),
                some: ([k]) => ({
                    ...rec,
                    [k]: value,
                }),
            })
        )
    }

/**
 * Makes a new `Rec` by producing a new value for each key using
 * the given function.
 *
 * @group Mapping
 * @group Transformations
 */
export const map =
    <K extends string, V extends NonNullish, R extends NonNullish>(
        f: (k: NoInfer<K>, v: NoInfer<V>) => R
    ) =>
    (rec: Rec<K, V>): Rec<K, R> => {
        if (isEmpty(rec)) {
            return empty<K, R>()
        }

        const out: Partial<Record<K, R>> = empty<K, R>()

        for (const k in rec) {
            const v = rec[k]

            if (v != null) {
                out[k] = f(k, v)
            }
        }

        return out
    }

/**
 * Get only the _keys_ from the `Rec` as an array. Will use the given `OrderingComparer`
 * to sort the keys, otherwise will use the default ASCII-based sort.
 *
 * @group Utils
 */
export const keys =
    <K extends string>(
        { compare }: OrderingComparer<NoInfer<K>> = OrderingComparer.Default
    ) =>
    <V extends NonNullish>(rec: Rec<K, V>): readonly K[] => {
        const out: K[] = []

        for (const k in rec) {
            if (rec[k] != null) {
                out.push(k)
            }
        }

        return out.sort(compare)
    }

/**
 * Get the first key for which the given predicate function returns
 * true, wrapped in a `Some`. If no key is found, returns `None`. To sort
 * the keys, it uses the given `OrderingComparer` if passed, otherwise
 * defaults to default ASCII-based sort.
 *
 * @group Lookups
 */
export const findKey =
    <K extends string>(
        predicate: Predicate<NoInfer<K>>,
        orderingComparer: OrderingComparer<
            NoInfer<K>
        > = OrderingComparer.Default
    ) =>
    <V extends NonNullish>(rec: Rec<K, V>): Option<K> =>
        pipe(
            rec,
            keys(orderingComparer),
            _ => _.find(predicate),
            Option.ofNullish
        )

/**
 * Returns `true` if at least one _value_ in the `Rec` returns `true`
 * for the given predicate function.
 *
 * @group Lookups
 * @group Utils
 */
export const exists =
    <V extends NonNullish>(predicate: Predicate<NoInfer<V>>) =>
    <K extends string>(rec: Rec<K, V>): boolean => {
        if (isEmpty(rec)) {
            return false
        }

        for (const k in rec) {
            const v = rec[k]

            if (v != null && predicate(v)) {
                return true
            }
        }

        return false
    }

/**
 * Replace the value at a given key in the `Rec` using the given
 * replacement function. Will use the given `EqualityComparer`
 * if passed for the key lookup. Otherwise, defaults to reference
 * equality (triple equals).
 *
 * If the key isn't in the record, returns the record unchanged.
 *
 * @group Transformations
 */
export const change =
    <K extends string, V extends NonNullish>(
        key: NoInfer<K>,
        f: (v: NoInfer<V>) => NoInfer<V>,
        equalityComparer?: EqualityComparer<NoInfer<K>>
    ) =>
    (rec: Rec<K, V>): Rec<K, V> =>
        pipe(
            rec,
            findWithKey(key, equalityComparer),
            Option.match({
                some: ([k, v]) => pipe(rec, set([k, f(v)])),
                none: rec,
            })
        )
/**
 * Get the number of key/value pairs in the record.
 *
 * @group Utils
 */
export const size = <K extends string, V extends NonNullish>(
    rec: Rec<K, V>
) => {
    let count = 0

    for (const k in rec) {
        if (rec[k] != null) {
            count++
        }
    }

    return count
}

/**
 * Gets all the values from the record as an array, including duplicates. Values
 * will be sorted using the default ASCII-based sort or the `OrderingComparer`
 * if it is given.

 * @group Utils
 */
export const values =
    <V extends NonNullish>(
        orderingComparer: OrderingComparer<
            NoInfer<V>
        > = OrderingComparer.Default
    ) =>
    <K extends string>(rec: Rec<K, V>): readonly V[] => {
        const values: V[] = []

        for (const k in rec) {
            const v = rec[k]
            if (v != null) {
                values.push(v)
            }
        }

        return values.sort(orderingComparer.compare)
    }

/**
 * Returns the record as an array of key-value tuples. The array will be sorted by
 * key, using the given `OrderingComparer` or falling back to the default ASCII-based
 * sort.
 *
 * @group Transformations
 * @group Utils
 */
export const toArray =
    <K extends string>(orderingComparer?: OrderingComparer<K>) =>
    <V extends NonNullish>(rec: Rec<K, V>): readonly (readonly [K, V])[] =>
        pipe(rec, keys(orderingComparer), _ => _.map(k => [k, rec[k]!]))

/**
 * Also commonly referred to as `fold` or `aggregate`. Applies each key/value
 * pair in the `Rec` to a "reducer" (or "folding") function to build up a final
 * accumulated value.
 *
 * Key/value pairs will be given to the reducer function based on the sort-order
 * of the _keys_. That order can be specified by passing the `OrderingComparer`.
 * Defaults to the standard ASCII-based sort.
 *
 * @group Transformations
 * @group Utils
 *
 * @param f
 * The reducer function. Accepts the accumulator value, the current key, and the
 * current value, and must return the next (incremental) accumulator value.
 */
export const reduce =
    <S, K extends string, V extends NonNullish>(
        init: S,
        f: (acc: S, k: NoInfer<K>, v: NoInfer<V>) => S,
        orderingComparer?: OrderingComparer<NoInfer<K>>
    ) =>
    (rec: Rec<K, V>): S =>
        pipe(rec, toArray(orderingComparer), _ =>
            _.reduce((s, [k, v]) => f(s, k, v), init)
        )

/**
 * Like {@link reduce}, but the key-value pairs are passed to the reducer in
 * _reverse_ sort-order.
 */
export const reduceRight =
    <S, K extends string, V extends NonNullish>(
        init: S,
        f: (acc: S, k: NoInfer<K>, v: NoInfer<V>) => S,
        orderingComparer?: OrderingComparer<NoInfer<K>>
    ) =>
    (rec: Rec<K, V>): S =>
        pipe(rec, toArray(orderingComparer), _ =>
            _.reduceRight((s, [k, v]) => f(s, k, v), init)
        )
/**
 * Get a new record containing only the key/value pairs for which the given
 * predicate function returns `true`.
 *
 * @group Transformations
 * @group Filtering
 */
export const filter =
    <K extends string, V extends NonNullish>(
        f: (k: NoInfer<K>, v: NoInfer<V>) => boolean
    ) =>
    (rec: Rec<K, V>): Rec<K, V> => {
        if (isEmpty(rec)) {
            return rec
        }

        const out: Partial<Record<K, V>> = empty<K, V>()

        for (const k in rec) {
            const v = rec[k]

            if (v != null && f(k, v)) {
                out[k] = v
            }
        }

        return out
    }

/**
 * Test whether every key/value pair in a record returns `true` for the
 * given predicate function.
 *
 * @group Utils
 */
export const every =
    <K extends string, V extends NonNullish>(
        f: (k: NoInfer<K>, v: NoInfer<V>) => boolean
    ) =>
    (rec: Rec<K, V>): boolean => {
        if (isEmpty(rec)) {
            return true
        }

        for (const k in rec) {
            const v = rec[k]

            if (v == null) {
                continue
            }

            if (!f(k, v)) {
                return false
            }
        }

        return true
    }

/**
 * Execute an arbitrary side-effect function for every key/value pair in the record.
 * Does not affect the values contained in the `Rec`. Can be helpful for logging
 * or debugging.
 *
 * @group Utils
 *
 * @param f Should not mutate its arguments. See {@link map} if you want to
 * transform the record into a new record with different values.
 *
 * @returns void
 */
export const iter =
    <K extends string, V extends NonNullish>(
        f: (k: NoInfer<K>, v: NoInfer<V>) => void
    ) =>
    (rec: Rec<K, V>): void => {
        if (isEmpty(rec)) {
            return
        }

        for (const k in rec) {
            const v = rec[k]

            if (v != null) {
                f(k, v)
            }
        }
    }

/**
 * Convert an array of tuples (key-value pairs) into a `Rec`.
 *
 * @group Constructors
 */
export const ofArray = <K extends string, V extends NonNullish>(
    array: readonly (readonly [K, V])[],
    equalityComparer?: EqualityComparer<K>
): Rec<K, V> => {
    if (array.length < 1) {
        return empty()
    }

    return array.reduce<Rec<K, V>>(
        (rec, kvp) => pipe(rec, set(kvp, equalityComparer)),
        empty()
    )
}

/**
 * Get a new record with the given key removed. For key lookup, will use
 * the `EqualityComparer` if passed, otherwise defaults to reference equality
 * (triple equals). The record will be returned unchanged if the key is not
 * found.
 *
 * @group Transformations
 */
export const remove =
    <K extends string>(
        key: NoInfer<K>,
        { equals }: EqualityComparer<NoInfer<K>> = EqualityComparer.Default
    ) =>
    <V extends NonNullish>(rec: Rec<K, V>) => {
        const equalsKey = (k: K) => equals(key, k)

        return pipe(
            Object.keys(rec) as unknown as readonly K[],
            Array.find(equalsKey),
            Option.match({
                some: k => {
                    const copy = { ...rec }
                    delete copy[k]
                    return copy
                },
                none: rec,
            })
        )
    }

/**
 * Convert a `Record` object into a `Rec`. Useful if you need to use a different
 * equality comparer than the default (triple equals). For instance, if you have a type
 * that represents an ISO timestamp as a string, and you consider those timestamps
 * equivalent if they are equal down to the minute, ignoring milliseconds. (In other words,
 * if `2024-05-31T13:20:01.445Z` = `2024-05-31T13:20:58.118Z`.)
 *
 * @group Constructors
 */
export const ofRecord = <K extends string, V extends NonNullish>(
    record: Record<K, V>,
    equalityComparer?: EqualityComparer<K>
) =>
    Object.entries<V>(record).reduce<Rec<K, V>>(
        (rec, [k, v]) => pipe(rec, set([k as K, v], equalityComparer)),
        empty()
    )

/* eslint-disable @typescript-eslint/ban-types */
import { EqualityComparer, OrderingComparer, Predicate } from "./prelude"
import { Option } from "./Option"
import { pipe } from "./composition"

const defaultEqualityComparer: EqualityComparer<never> = {
    equals: (a, b) => a === b,
}

const defaultOrderingComparer: OrderingComparer<never> = {
    compare: (a, b) => {
        const stringA = String(a)
        const stringB = String(b)
        return stringA === stringB ? 0 : stringA.localeCompare(stringB) < 0 ? -1 : 1
    },
    equals: defaultEqualityComparer.equals,
}

const findWithKey =
    <K>(key: K, { equals }: EqualityComparer<K> = defaultEqualityComparer) =>
    <V>(map: ReadonlyMap<K, V>): Option<[K, V]> => {
        if (map.size < 1) {
            return Option.none
        }

        for (const [k, v] of map) {
            if (equals(k, key)) {
                return Option.some([k, v])
            }
        }

        return Option.none
    }

const containsKey =
    <K>(key: K, equalityComparer: EqualityComparer<K> = defaultEqualityComparer) =>
    <V>(map: ReadonlyMap<K, V>): boolean =>
        pipe(map, findWithKey(key, equalityComparer), Option.isSome)

const find =
    <K>(key: K, equalityComparer: EqualityComparer<K> = defaultEqualityComparer) =>
    <V extends {}>(map: ReadonlyMap<K, V>): Option<V> =>
        pipe(
            map,
            findWithKey(key, equalityComparer),
            Option.map(([, v]) => v)
        )

/**
 * Adds a key/value pair to a `Map`. If the given key already exists
 * the value at that key will be updated with the given value.
 *
 * Will use the equality comparer if given, otherwise defaults to using
 * reference equality (triple equals) for equality comparisons.
 *
 * @category Transformations
 *
 * @returns A new `Map` with the added key/value pair
 */
const add =
    <K, V>(
        [key, value]: [K, V],
        equalityComparer: EqualityComparer<K> = defaultEqualityComparer
    ) =>
    (map: ReadonlyMap<K, V>): ReadonlyMap<K, V> => {
        if (map.size < 1) {
            const out = new globalThis.Map<K, V>()
            out.set(key, value)
            return out
        }

        const copy = new globalThis.Map(map)

        return pipe(
            map,
            findWithKey(key, equalityComparer),
            Option.match({
                none: () => {
                    copy.set(key, value)
                    return copy
                },
                some: ([k]) => {
                    copy.set(k, value)
                    return copy
                },
            })
        )
    }

const map =
    <K, V, R>(f: (k: K, v: V) => R) =>
    (map: ReadonlyMap<K, V>): ReadonlyMap<K, R> => {
        if (map.size < 1) {
            return new globalThis.Map()
        }

        const out = new globalThis.Map()

        for (const [k, v] of map) {
            out.set(k, f(k, v))
        }

        return out
    }

const findKey =
    <K extends {}>(predicate: Predicate<K>) =>
    <V>(map: ReadonlyMap<K, V>): Option<K> => {
        for (const [k] of map) {
            if (predicate(k)) {
                return Option.some(k)
            }
        }

        return Option.none
    }

const empty = <K = never, V = never>() => new globalThis.Map<K, V>()

const exists =
    <V>(predicate: Predicate<V>) =>
    <K>(map: ReadonlyMap<K, V>): boolean => {
        for (const [, v] of map) {
            if (predicate(v)) {
                return true
            }
        }

        return false
    }

const change =
    <K, V>(key: K, f: (v: V) => V, equalityComparer: EqualityComparer<K>) =>
    (map: ReadonlyMap<K, V>): ReadonlyMap<K, V> =>
        pipe(
            map,
            findWithKey(key, equalityComparer),
            Option.match({
                some: ([k, v]) => {
                    const copy = new globalThis.Map(map)
                    copy.set(k, f(v))
                    return copy
                },
                none: map,
            })
        )

const size = <K, V>(map: ReadonlyMap<K, V>) => map.size

const isEmpty = <K, V>(map: ReadonlyMap<K, V>) => map.size < 1

const keys =
    <K>({ compare }: OrderingComparer<K> = defaultOrderingComparer) =>
    <V>(map: ReadonlyMap<K, V>): readonly K[] =>
        Array.from(map.keys()).sort(compare)

const values =
    <K>(orderingComparer: OrderingComparer<K> = defaultOrderingComparer) =>
    <V>(map: ReadonlyMap<K, V>): readonly V[] =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        keys(orderingComparer)(map).map(key => map.get(key)!)

const toArray =
    <K>(orderingComparer: OrderingComparer<K> = defaultOrderingComparer) =>
    <V>(map: ReadonlyMap<K, V>): readonly [K, V][] =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        keys(orderingComparer)(map).map(key => [key, map.get(key)!])

const reduce =
    <S, K, V>(
        init: S,
        f: (acc: S, k: K, v: V) => S,
        orderingComparer: OrderingComparer<K> = defaultOrderingComparer
    ) =>
    (map: ReadonlyMap<K, V>): S =>
        toArray(orderingComparer)(map).reduce((s, [k, v]) => f(s, k, v), init)

const reduceRight =
    <S, K, V>(
        init: S,
        f: (acc: S, k: K, v: V) => S,
        orderingComparer: OrderingComparer<K> = defaultOrderingComparer
    ) =>
    (map: ReadonlyMap<K, V>): S =>
        toArray(orderingComparer)(map).reduceRight((s, [k, v]) => f(s, k, v), init)

const filter =
    <K, V>(f: (k: K, v: V) => boolean) =>
    (map: ReadonlyMap<K, V>): ReadonlyMap<K, V> => {
        if (map.size < 1) {
            return new globalThis.Map()
        }

        const out = new globalThis.Map()

        for (const [k, v] of map) {
            if (f(k, v)) {
                out.set(k, v)
            }
        }

        return out
    }

const every =
    <K, V>(f: (k: K, v: V) => boolean) =>
    (map: ReadonlyMap<K, V>): boolean => {
        if (map.size < 1) {
            return true
        }

        for (const [k, v] of map) {
            if (!f(k, v)) {
                return false
            }
        }

        return true
    }

const iter =
    <K, V>(f: (k: K, v: V) => void) =>
    (map: ReadonlyMap<K, V>): void => {
        if (map.size < 1) {
            return
        }

        for (const [k, v] of map) {
            f(k, v)
        }
    }

const ofArray = <K, V>(
    array: readonly [K, V][],
    equalityComparer: EqualityComparer<K> = defaultEqualityComparer
): ReadonlyMap<K, V> => {
    if (array.length < 1) {
        return new globalThis.Map()
    }

    return array.reduce<ReadonlyMap<K, V>>(
        (map, kvp) => add(kvp, equalityComparer)(map),
        empty()
    )
}

const ofRecord = <K extends string, V>(
    record: Record<K, V>,
    equalityComparer: EqualityComparer<K> = defaultEqualityComparer
) =>
    Object.entries<V>(record).reduce<ReadonlyMap<K, V>>(
        (map, [k, v]) => add([k as K, v], equalityComparer)(map),
        empty()
    )

export const Map = {
    exists, // docs and tests
    containsKey, // docs and tests
    findWithKey, // docs and tests
    find, // docs and tests
    findKey, // docs and tests
    add,
    change, // docs and tests
    map, // docs and tests
    filter, // docs and tests
    every, // docs and tests
    iter, // docs and tests
    empty, // docs and tests
    size, // docs and tests
    isEmpty, // docs and tests
    reduce, // docs and tests
    reduceRight, // docs and tests
    toArray, // docs and tests
    ofArray, // docs and tests
    ofRecord, // docs and tests
    keys, // docs and tests
    values, // docs and tests
}

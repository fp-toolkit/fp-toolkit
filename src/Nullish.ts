import { EqualityComparer } from "./EqualityComparer"

/* eslint-disable @typescript-eslint/ban-types */
export type Nullish<T extends {}> = T | null | undefined

/**
 * Gets an Eq type class instance that considers null/undefined equivalent, and
 * truthy values equivalent based on the given Eq instance.
 */
const getEqualityComparer = <A extends {}>({ equals }: EqualityComparer<A>) =>
    EqualityComparer.ofEquals<Nullish<A>>(
        (a1, a2) =>
            (a1 == null && a2 == null) || (a1 != null && a2 != null && equals(a1, a2))
    )

const defaultValue =
    <A extends {}>(a: A) =>
    (nullish: Nullish<A>): A =>
        nullish != null ? nullish : a

const defaultWith =
    <A extends {}>(f: () => A) =>
    (nullish: Nullish<A>): A =>
        nullish != null ? nullish : f()

const map =
    <A extends {}, B extends {}>(f: (a: A) => B) =>
    (nullish: Nullish<A>): Nullish<B> =>
        nullish != null ? f(nullish) : nullish

const bind =
    <A extends {}, B extends {}>(f: (a: A) => Nullish<B>) =>
    (nullish: Nullish<A>): Nullish<B> =>
        nullish != null ? f(nullish) : nullish

export const Nullable = {
    getEqualityComparer,
    defaultValue,
    defaultWith,
    map,
    bind,
}

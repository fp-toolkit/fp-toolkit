/**
 * The `Nullable` type is, unsurprisingly, the opposite of the built-in `NonNullable`
 * type. Sometimes, it is advantageous to model values as `Nullable` instead of using
 * the `Option` type. This module is designed to provide a set of useful functions for
 * seamlessly working with `Nullable` values in function pipelines.
 *
 * _Some_ of this behavior can be reproduced with JavaScript's nullish-coalescing `??`
 * operator, and the nullish-safe accessor `?.` operator. However, those operators lend
 * themselves primarily to OO-style programming, not function pipelining or composition.
 * These functions are curried and are designed to be used with right-to-left function
 * composition like `pipe` and `flow`.
 *
 * @example
 * ```
 * declare const str: Nullable<string>
 * pipe(
 *     str,
 *     Nullable.map(s => `¡${s}!`),
 *     Nullable.map(String.reverse),
 *     Nullable.defaultWith(() => "")   // could also have used Nullable.defaultValue("")
 * ) // => "!yoha¡", if str is "ahoy"; "" if str is null or undefined
 * ```
 *
 * @module
 */

/* eslint-disable @typescript-eslint/ban-types */
import { EqualityComparer } from "./EqualityComparer"

export type Nullable<A extends {}> = A | null | undefined

/**
 * Get an `EqualityComparer` that considers `null` and `undefined` equivalent, and
 * compares non-nullish values based on the given `EqualityComparer`.
 *
 * @group Utils
 *
 * @example
 * ```
 * const { equals } = Nullable.getEqualityComparer(EqualityComparer.Number)
 * equals(null, undefined) // => true
 * equals(3, undefined) // => false
 * equals(null, 4) // => false
 * equals(4, 4) // => true
 * equals(4, 5) // => false
 * ```
 */
export const getEqualityComparer = <A extends {}>(
    equalityComparer: EqualityComparer<A>
) =>
    EqualityComparer.ofEquals<Nullable<A>>(
        (a1, a2) =>
            (a1 == null && a2 == null) ||
            (a1 != null && a2 != null && equalityComparer.equals(a1, a2))
    )

/**
 * Similar to `Option.defaultValue`. If the given nullable value is nullish, returns
 * the given fallback/default value. If the given nullable value is non-nullish,
 * returns the value.
 *
 * @remarks
 * This is more or less equivalent to the `??` nullish-coalescing operator, it just
 * works more nicely in function composition pipelines.
 *
 * @param a The default/fallback value to use.
 *
 * @returns A non-nullable value.
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     undefined,
 *     Nullable.defaultValue("")
 * ) // => ""
 */
export const defaultValue =
    <A extends {}>(a: A) =>
    (nullable: Nullable<A>): NonNullable<A> =>
        nullable != null ? nullable : a

/**
 * Similar to `Option.defaultWith`. If the given nullable value is nullish,
 * computes the fallback/default value using the given function. If the given
 * nullable value is non-nullish, returns the value.
 *
 * @param f The function to use to compute the default/fallback value.
 *
 * @returns A non-nullable value.
 *
 * @group Utils
 *
 * @example
 * pipe(
 *     null,
 *     Nullable.defaultWith(() => 42)
 * ) // => 42
 */
export const defaultWith =
    <A extends {}>(f: () => A) =>
    (nullable: Nullable<A>): NonNullable<A> =>
        nullable != null ? nullable : f()

/**
 * Similar to `Option.map`. Uses the given function to map the nullable value
 * if it is non-nullish. Passes through nullish values unchanged.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     32,
 *     Nullable.map(n => n * 2)
 * ) // => 64
 *
 * pipe(
 *     undefined,
 *     Nullable.map((n: number) => n * 2)
 * ) // => undefined
 */
export const map =
    <A extends {}, B extends {}>(f: (a: A) => B) =>
    (nullable: Nullable<A>): Nullable<B> =>
        nullable != null ? f(nullable) : nullable

/**
 * Similar to `Option.bind`. Maps the nullable value using a function that itself
 * returns a possibly nullish value, and flattens the result.
 *
 * @group Mapping
 *
 * @example
 * ```
 * type Person = { readonly name?: string }
 *
 * declare const person: Nullable<Person>
 *
 * pipe(
 *     person,
 *     Nullable.bind(p => p.name),
 *     Nullable.defaultValue("")
 * )
 * // => "Joe" if both `person` and `person.name` are defined
 * // => "" if either `person` or `person.name` is undefined
 * ```
 */
export const bind =
    <A extends {}, B extends {}>(f: (a: A) => Nullable<B>) =>
    (nullable: Nullable<A>): Nullable<B> =>
        nullable != null ? f(nullable) : nullable

/**
 * Alias for {@link bind}.
 */
export const flatMap = bind

/* c8 ignore start */
/** @ignore */
export const Nullable = {
    getEqualityComparer,
    defaultValue,
    defaultWith,
    map,
    bind,
    flatMap,
}
/* c8 ignore end */

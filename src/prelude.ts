/* v8 ignore start */
/** A helper function to get TypeScript to enforce exhaustive
 * case checking in switch blocks.
 */
/** @ignore */
export const assertExhaustive = (_: never): never => {
    throw new Error(
        `assertExhaustive failed at runtime! It was called with ${_}`
    )
}
/* v8 ignore end */

/**
 * Internal utility type to get slight improvements in
 * intellisense for complex TypeScript object types.
 *
 * @ignore
 */
export type Identity<T> = T extends object
    ? NonNullish & {
          [P in keyof T]: T[P]
      }
    : T

/**
 * Internal utility type for discriminated unions.
 *
 * @ignore
 */
export type Tagged<Tag extends string, A extends object> = Identity<
    Readonly<
        {
            _tag: Tag
        } & A
    >
>

/**
 * Describes a function that is used in filtering operations
 * to determine if an element passes some set of criteria.
 *
 * See `Array.filter` for an example usage.
 */
export type Predicate<A> = (a: A) => boolean

/**
 * A sub-type of a Predicate. Represents a type guard that
 * holds when the given element can be determined to be a more
 * specific type.
 *
 * See `String.isString` for an example.
 */
export type Refinement<A, B extends A> = (a: A) => a is B

/** @ignore */
// biome-ignore lint/complexity/noBannedTypes: this type is actually useful in a number of places
export type NonNullish = {}

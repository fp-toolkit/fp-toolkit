/* c8 ignore start */
/** A helper function to get TypeScript to enforce exhaustive
 * case checking in switch blocks.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/** @ignore */
export const assertExhaustive = (_: never): never => {
    throw new Error(`assertExhaustive failed at runtime! It was called with ${_}`)
}
/* c8 ignore stop */

/**
 * Internal utility type to get slight improvements in
 * intellisense for complex TypeScript object types.
 *
 * @ignore
 */
export type Identity<T> = T extends object
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {} & {
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
export interface Predicate<A> {
    (a: A): boolean
}

/**
 * A super-type of a Predicate. Represents a type guard that
 * holds when the given element can be determined to be a more
 * specific type.
 *
 * See `String.isString` for an example.
 */
export interface Refinement<A, B extends A> {
    (a: A): a is B
}

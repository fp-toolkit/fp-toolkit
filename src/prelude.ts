/* c8 ignore start */
/** A helper function to get TypeScript to enforce exhaustive
 * case checking in switch blocks.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assertExhaustive = (_: never): never => {
    throw new Error(`assertExhaustive failed at runtime! It was called with ${_}`)
}
/* c8 ignore stop */

/** Internal utility type to get slight improvements in
 * intellisense for complex TypeScript object types.
 */
export type Identity<T> = T extends object
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {} & {
          [P in keyof T]: T[P]
      }
    : T

/** Internal utility type for discriminated unions. */
export type Tagged<Tag extends string, A extends object> = Identity<
    Readonly<
        {
            _tag: Tag
        } & A
    >
>

/** Describes a function that is used in filtering operations
 * to determine if an element passes some set of criteria.
 *
 * See Array.filter for an example usage.
 */
export interface Predicate<A> {
    (a: A): boolean
}

/** A super-type of a Predicate. Represents a type guard that
 * holds when the given element can be determined to be a more
 * specific type.
 *
 * See String.isString for an example.
 */
export interface Refinement<A, B extends A> {
    (a: A): a is B
}

/** An interface object compatible with the type of `Eq` from
 * fp-ts. Used to implement decidable equality for a given type.
 * @example
 * interface Pet {
 *    readonly name: string
 *    readonly age: number
 * }
 *
 * class PetByNameComparer implements EqualityComparer<Pet> {
 *    equals(p1: Pet, p2: Pet): boolean {
 *        return p1.name === p2.name
 *    }
 * }
 */
export interface EqualityComparer<A> {
    equals(o1: A, o2: A): boolean
}

/** An interface object compatible with the type of `Ord` from
 * fp-ts. It is a supertype of EqualityComparer because equality
 * can be derived from decidable ordering.
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
 *
 *    equals(p1: Pet, p2: Pet) {
 *        return this.compare(p1, p2) === 0
 *    }
 * }
 */
export interface OrderingComparer<A> extends EqualityComparer<A> {
    compare(o1: A, o2: A): -1 | 0 | 1
}

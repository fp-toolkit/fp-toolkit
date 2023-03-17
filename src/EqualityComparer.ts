/**
 * An `EqualityComparer` is intended to model deterministic or "decideable" equality
 * between two values. Meaning, it should always give back the same result for the
 * same inputs.
 *
 * Generally you won't need to worry about these things, but in case you come up against
 * some weird edge cases, `EqualityComparer`s should always satisfy these rules:
 *   1. always return `true` if given two values that are the same object reference
 *       - `myEqComparer.equals(a, a) === true`
 *   1. always return `true` for equivalent variables, regardless of the order in which they are passed
 *       - `myEqComparer.equals(a, b) === myEqComparer.equals(b, a)`
 *   1. should be transitive such that if `a` = `b` and `b` = `c`, then `a` = `c`
 *
 * @remarks
 * Compatible with the `Eq` type from `fp-ts`.
 *
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
 *
 * @module
 */
export interface EqualityComparer<A> {
    equals(a1: A, a2: A): boolean
}

/**
 * Construct a new `EqualityComparer` instance by providing an `equals` function
 * that can decide equality between two values.
 *
 * @group Constructors
 *
 * @returns A new `EqualityComparer` instance.
 */
export const ofEquals = <A>(
    equals: EqualityComparer<A>["equals"]
): EqualityComparer<A> => ({
    equals: (a1, a2) => a1 === a2 || equals(a1, a2),
})

/**
 * Given you already have an `EqualityComparer` for some type `A`, and you know how to
 * map from some other type `B` to `A`, you can effectively "re-use" your `EqualityComparer`
 * for type `B`. Also referred to commonly as `contramap`, because the mapping is going
 * from `B`&rarr;`A`, not from `A`&rarr;`B`.
 *
 * @group Utils
 * @group Constructors
 *
 * @param known The `EqualityComparer` that you already have.
 * @param map The function that can map from `B`&rarr;`A`.
 *
 * @returns A new `EqualityComparer` instance.
 */
export const deriveFrom = <A, B>(
    known: EqualityComparer<A>,
    map: (b: B) => A
): EqualityComparer<B> => ({
    equals: (b1, b2) => b1 === b2 || known.equals(map(b1), map(b2)),
})

type EqualityComparerRecord<A extends object> = {
    readonly [Key in keyof A]: EqualityComparer<A[Key]>
}

/**
 * Get an `EqualityComparer` that represents _structural_ equality for a type that
 * conforms to the given shape of type `A`. It is generally required to use `ofStruct`
 * for any complex object type for which you would like property-by-property comparison,
 * because JavaScript has no concept of structural or value-based equality.
 *
 * Will perform property-by-property equality comparsion for each property of the object,
 * using the given `EqualityComparer` instance for each property.
 *
 * @group Utils
 * @group Constructors
 *
 * @returns A new `EqualityComparer` instance.
 */
export const ofStruct = <A extends object>(
    struct: EqualityComparerRecord<A>
): EqualityComparer<Readonly<A>> =>
    ofEquals((a1, a2) => {
        for (const key in struct) {
            if (!struct[key].equals(a1[key], a2[key])) {
                return false
            }
        }
        return true
    })

/**
 * The default `EqualityComparer`, which uses reference (triple equals) equality.
 *
 * @group Primitives
 */
export const Default: EqualityComparer<never> = Object.freeze(
    ofEquals((a1, a2) => a1 === a2)
)

/**
 * An `EqualityComparer` for the built-in `Date` type.
 *
 * @group Primitives
 */
export const Date: EqualityComparer<Date> = ofEquals(
    (dt1, dt2) => dt1.valueOf() === dt2.valueOf()
)

/**
 * An `EqualityComparer` for the built-in `string` type.
 *
 * @group Primitives
 */
export const String: EqualityComparer<string> = Default

/**
 * An `EqualityComparer` for the built-in `number` type.
 *
 * @group Primitives
 */
export const Number: EqualityComparer<number> = Default

/**
 * @ignore
 */
export const EqualityComparer = {
    ofEquals,
    ofStruct,
    deriveFrom,
    Default,
    Date,
    String,
    Number,
}

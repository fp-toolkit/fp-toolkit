// NOTE: this is copied here rather than imported so that
// end users don't end up importing the NonEmptyArray module
// if they only wanted to import the string module.
interface NonEmptyArray<A> extends ReadonlyArray<A> {
    0: A
}

/** A boolean check that also serves as a type guard
 * which holds if the given string is the string literal
 * type `""`.
 */
const isEmpty = (s: string): s is "" => s === ""

/** A curried version of the built-in trim method. */
const trim = (s: string) => s.trim()

/** A curried version of the built-in toLowerCase method. */
const toLowerCase = (s: string) => s.toLowerCase()

/** A curried version of the built-in toUpperCase method. */
const toUpperCase = (s: string) => s.toUpperCase()

/** A type guard that holds true when `u` is a string. */
const isString = (u: unknown): u is string => typeof u === "string"

/** Returns the length of the string */
const length = (s: string) => s.length

/** A curried version of the built-in split method that
 * is guaranteed to always return at least one entry. If
 * the split fails to produce at least one entry, the entire
 * input string is returned as a singleton array.
 */
const split =
    (separator: string | RegExp) =>
    (s: string): NonEmptyArray<string> => {
        const result = s.split(separator)
        return result.length > 0 ? (result as unknown as NonEmptyArray<string>) : [s]
    }

export const String = {
    isEmpty,
    trim,
    toLowerCase,
    toUpperCase,
    isString,
    split,
    length,
}

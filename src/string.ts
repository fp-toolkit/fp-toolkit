/**
 * The string module is a suite of functions that are useful for string manipulation and
 * properly, designed for seamless use in function composition pipelines.
 *
 * @module String
 */

// NOTE: this is copied here rather than imported so that
// end users don't end up importing the NonEmptyArray module
// if they only wanted to import the String module.
/** @ignore */
interface NonEmptyArray<A> extends ReadonlyArray<A> {
    0: A
}

/**
 * A boolean check that also serves as a type guard which narrows the
 * type to the string literal `""`.
 *
 * @group Utils
 * @group Type Guards
 *
 * @returns boolean
 */
export const isEmpty = (s: string): s is "" => s === ""

/**
 * Curried version of the built-in trim method.
 *
 * @group Utils
 */
export const trim = (s: string) => s.trim()

/**
 * Curried version of the built-in toLowerCase method.
 *
 * @group Utils
 */
export const toLowerCase = (s: string) => s.toLowerCase()

/**
 * Curried version of the built-in toUpperCase method.
 *
 * @group Utils
 */
export const toUpperCase = (s: string) => s.toUpperCase()

/**
 * Type guard that holds true when `u` is a string.
 *
 * @group Type Guards
 *
 * @returns boolean
 */
export const isString = (u: unknown): u is string => typeof u === "string"

/**
 * Get the length of a string.
 *
 * @group Utils
 */
export const length = (s: string) => s.length

/**
 * Reverses a string.
 *
 * @group Utils
 */
export const reverse = (s: string) => s.split("").reverse().join("")

/**
 * A curried version of the built-in split method that
 * is guaranteed to always return at least one entry. If
 * the split fails to produce at least one entry, the entire
 * input string is returned as a single-element array.
 *
 * @group Utils
 */
export const split =
    (separator: string | RegExp) =>
    (s: string): NonEmptyArray<string> => {
        const result = s.split(separator)
        return result.length > 0 ? (result as unknown as NonEmptyArray<string>) : [s]
    }

/**
 * Capitalize the first letter of a string.
 *
 * @group Utils
 */
export const capitalize = (s: string) => {
    if (s.length < 1) {
        return ""
    }

    const [head, ...tail] = s.split("")

    return [head.toUpperCase(), ...tail].join("")
}

/**
 * Uncapitalize the first letter of a string.
 *
 * @group Utils
 */
export const uncapitalize = (s: string) => {
    if (s.length < 1) {
        return ""
    }

    const [head, ...tail] = s.split("")

    return [head.toLowerCase(), ...tail].join("")
}

/* c8 ignore start */
/** @ignore */
export const String = {
    isEmpty,
    trim,
    toLowerCase,
    toUpperCase,
    isString,
    split,
    length,
    reverse,
    capitalize,
    uncapitalize,
}
/* c8 ignore end */

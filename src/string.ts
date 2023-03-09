interface NonEmptyArray<A> extends ReadonlyArray<A> {
    0: A
}

const isEmpty = (s: string): s is "" => s === ""

const trim = (s: string) => s.trim()

const toLowerCase = (s: string) => s.toLowerCase()

const toUpperCase = (s: string) => s.toUpperCase()

const isString = (u: unknown): u is string => typeof u === "string"

const length = (s: string) => s.length

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

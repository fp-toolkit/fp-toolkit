/**
 * The `Result` type represents the outcome of a completed operation
 * that either succeeded with some `Ok` value (also called a "success"
 * or "right" value), or failed with some `Err` value (also called a
 * "failure" or "left" value).
 *
 * Generally speaking, `Result` is not intended to _replace_ exception
 * handling, but to augment it, so that exceptions can be used to handle
 * truly _exceptional_ things. (i.e., Is it really exceptional that a
 * network request failed?)
 *
 * This API has been optimized for use with left-to-right function composition
 * using {@link composition/Pipe!pipe} and {@link composition/Flow!flow}.
 *
 * @example
 * ```
 * pipe(
 *     Result.tryCatch(() => readFileMightThrow()),
 *     Result.mapErr(FileError.create),
 *     Result.bind(fileText => pipe(
 *         Result.tryCatch(() => transmitMightThrow(fileText)),
 *         Result.mapErr(FileError.create)
 *     )),
 *     Result.map(transmitResponse => transmitResponse?.status),
 *     Result.defaultValue("failed")
 * )
 * // may return, e.g., "pending" if everything worked
 * // or "failed" if something fell down along the way
 * ```
 *
 * @module Result
 */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { Tagged, assertExhaustive, Refinement, NonNullish } from "./prelude"
import { Option } from "./Option"
import { flow, pipe } from "./composition"
import { EqualityComparer } from "./EqualityComparer"

export interface Ok<A> extends Tagged<"Ok", { ok: A }> {}
export interface Err<E> extends Tagged<"Err", { err: E }> {}

export type Result<A, E> = Ok<A> | Err<E>

/**
 * Construct a new Ok instance.
 *
 * @group Constructors
 *
 * @returns A new Ok instance containing the given value.
 */
export const ok = <A, E = never>(ok: A): Result<A, E> => ({
    _tag: "Ok",
    ok,
})

/**
 * Construct a new Err instance.
 *
 * @group Constructors
 *
 * @returns A new Err instance with the given value. */
export const err = <E, A = never>(err: E): Result<A, E> => ({
    _tag: "Err",
    err,
})

/**
 * Alias for {@link ok}.
 *
 * @group Constructors
 */
export const of = ok

/**
 * @ignore
 */
interface ResultMatcher<A, E, R> {
    readonly ok: R | ((ok: A) => R)
    readonly err: R | ((err: E) => R)
}

const isRawValue = <A, E, R>(caseFn: R | ((ok: A) => R) | ((err: E) => E)): caseFn is R =>
    typeof caseFn !== "function"

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg)

/**
 * Exhaustive pattern match against a `Result` to "unwrap" its inner
 * value. Pass a matcher function with cases for `ok` and `err` that
 * can either be lambdas or raw values.
 *
 * @group Pattern Matching
 *
 * @example
 * ```
 * pipe(
 *     Result.err("failure"),
 *     Result.match({
 *         ok: a => `${a.length}`,
 *         err: s => `${s}!`
 *     })
 * ) // => "failure!"
 * ```
 */
export const match =
    <A, E, R>(matcher: ResultMatcher<A, E, R>) =>
    (result: Result<A, E>) => {
        switch (result._tag) {
            case "Ok":
                return getMatcherResult(matcher.ok, result.ok)
            case "Err":
                return getMatcherResult(matcher.err, result.err)
            /* c8 ignore next 2 */
            default:
                return assertExhaustive(result)
        }
    }

/**
 * Filter a `Result` using a type guard (a.k.a. `Refinement` function) that, if
 * it succeeds, will return an `Ok` with a narrowed type. If it fails, will use
 * the given `onFail` function to produce an error branch.
 *
 * @group Utils
 * @group Filtering
 *
 * @example
 * ```
 * const isCat = (s: string): s is "cat" => s === "cat"
 * pipe(
 *     Result.ok("dog"),
 *     Result.refine(isCat, a => `"${a}" is not "cat"!`)
 * ) // => Result.err('"dog" is not "cat"!')
 * ```
 */
export const refine =
    <A, B extends A, E>(refinement: Refinement<A, B>, onFail: (a: A) => E) =>
    (result: Result<A, E>): Result<B, E> =>
        pipe(
            result,
            match({
                ok: a => (refinement(a) ? ok(a) : err(onFail(a))),
                err: e => err(e),
            })
        )

/**
 * Map the inner `Ok` value using the given function and
 * return a new `Result`. Passes `Err` values through as-is.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     Result.ok(2),
 *     Result.map(n => n + 3)
 * ) // => Result.ok(5)
 */
export const map =
    <A, B>(f: (a: A) => B) =>
    <E>(result: Result<A, E>): Result<B, E> =>
        pipe(
            result,
            match({
                ok: a => ok(f(a)),
                err: e => err(e),
            })
        )

/**
 * Map the inner `Err` value using the given function and
 * return a new `Result`. `Ok` values are passed through as-is.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     Result.err("cheese melted"),
 *     Result.mapErr(s => s.length)
 * ) // => Result.err(13)
 */
export const mapErr =
    <E1, E2>(f: (e: E1) => E2) =>
    <A>(result: Result<A, E1>) =>
        pipe(
            result,
            match({
                ok: a => ok(a),
                err: e => err(f(e)),
            })
        )

/**
 * Map both branches of the Result by specifying a lambda
 * to use in either case. Equivalent to calling {@link map} followed
 * by {@link mapErr}.
 *
 * @group Mapping
 */
export const mapBoth = <A1, E1, A2, E2>(mapOk: (a: A1) => A2, mapErr: (e: E1) => E2) =>
    match<A1, E1, Result<A2, E2>>({
        ok: a => ok(mapOk(a)),
        err: e => err(mapErr(e)),
    })

/**
 * Return the inner `Ok` value or the given default value
 * if the Result is an Err.
 *
 * @group Pattern Matching
 */
export const defaultValue =
    <A>(a: A) =>
    <E>(result: Result<A, E>) =>
        pipe(
            result,
            match({
                ok: a => a,
                err: a,
            })
        )

/**
 * Return the inner `Ok` value or use the given lambda
 * to compute the default value if the `Result` is an `Err`.
 *
 * @group Pattern Matching
 */
export const defaultWith =
    <A>(f: () => A) =>
    <E>(result: Result<A, E>) =>
        pipe(
            result,
            match({
                ok: a => a,
                err: f,
            })
        )

/**
 * Maps the inner `Ok` value using a function that
 * also returns a `Result`, and flattens the result.
 * `Err` values are passed through as-is. This function
 * is also referred to as `flatMap`.
 *
 * @group Mapping
 *
 * @example
 * pipe(
 *     Result.ok("a"),
 *     Result.bind(s =>
 *         s === "a" ? Result.ok("got an a!") : Result.err("not an a")
 *     ),
 *     Result.defaultValue("")
 * ) // => "got an a!"
 */
export const bind = <A, E, B>(f: (a: A) => Result<B, E>) =>
    match<A, E, Result<B, E>>({
        ok: f,
        err: e => err(e),
    })

/**
 * Alias for {@link bind}.
 *
 * @group Mapping
 */
export const flatMap = bind

/**
 * A type guard (a.k.a. `Refinement`) that holds if the result
 * is an `Ok`. Allows the TypeScript compiler to narrow the type
 * and allow type-safe access to `.ok`.
 *
 * @group Type Guards
 */
export const isOk = <A, E = never>(result: Result<A, E>): result is Ok<A> =>
    result._tag === "Ok"

/**
 * A type guard (a.k.a. `Refinement`) that holds if the result is
 * an `Err`. Allows the TypeScript compiler to narrow the type and
 * allow safe access to `.err`.
 *
 * @group Type Guards
 */
export const isErr = <E, A = never>(result: Result<A, E>): result is Err<E> =>
    result._tag === "Err"

/**
 * Map a tuple of `Result`s.
 *
 * If given two `Ok` values, uses the given mapper function and produces
 * a new `Ok` instance with the result. If either of the `Result`s are an
 * `Err`, returns an `Err`. If both results are an `Err`, returns the first
 * one and ignores the second.
 *
 * @remarks
 * This is effectively a shortcut to pattern matching a 2-tuple of Results.
 *
 * @group Mapping
 */
export const map2 =
    <A, B, C>(map: (a: A, b: B) => C) =>
    <E>(results: readonly [Result<A, E>, Result<B, E>]): Result<C, E> => {
        if (isOk(results[0]) && isOk(results[1])) {
            return ok(map(results[0].ok, results[1].ok))
        } else if (isErr(results[0])) {
            return err(results[0].err)
        } else {
            return err((results[1] as Err<E>).err)
        }
    }

/**
 * Map a 3-tuple of `Result`s.
 *
 * If given three `Ok` values, uses the given mapper function and returns
 * a new `Ok` value with the result. If any of the `Result`s are an `Err`,
 * returns an `Err`.
 *
 * If multiple `Result`s are an `Err`, returns the first one found and
 * ignores the others.
 *
 * @remarks
 * This is effectively a shortcut to pattern matching a 3-tuple of Results.
 *
 * @group Pattern Matching
 */
export const map3 =
    <A, B, C, D>(map: (a: A, b: B, c: C) => D) =>
    <E>(results: readonly [Result<A, E>, Result<B, E>, Result<C, E>]): Result<D, E> => {
        if (isOk(results[0]) && isOk(results[1]) && isOk(results[2])) {
            return ok(map(results[0].ok, results[1].ok, results[2].ok))
        } else if (isErr(results[0])) {
            return err(results[0].err)
        } else if (isErr(results[1])) {
            return err(results[1].err)
        } else {
            return err((results[2] as Err<E>).err)
        }
    }

/* eslint-disable func-style */
/**
 * Attempts to invoke a function that may throw. If the function
 * succeeds, returns an Ok with the result. If the function throws,
 * returns an Err containing the thrown Error, optionally transformed.
 *
 * @group Utils
 *
 * @param onThrow
 * Optional. If given, accepts the thrown `unknown` object and produces
 * the Err branch. If omitted, the thrown object will be stringified and
 * wrapped in a new Error instance if it is not already an Error instance.
 */
export function tryCatch<A>(mightThrow: () => A): Result<A, Error>
export function tryCatch<A, E = unknown>(
    mightThrow: () => A,
    onThrow: (thrown: unknown) => E
): Result<A, E>
export function tryCatch<A, E = unknown>(
    mightThrow: () => A,
    onThrow?: (err: unknown) => E
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Result<A, any> {
    const toError = (err: unknown) => (err instanceof Error ? err : Error(String(err)))

    try {
        return ok(mightThrow())
    } catch (err) {
        if (onThrow != null) {
            return Result.err(onThrow(err))
        }
        return Result.err(toError(err))
    }
}
/* eslint-enable func-style */

/**
 * Allows some arbitrary side-effect function to be called
 * using the wrapped `Ok` value. Useful for debugging and logging.
 *
 * @group Utils
 *
 * @param f Should not mutate its arguments. Use {@link map} if you
 * want to map the inner value of the Result instead.
 *
 * @example
 * ```
 * pipe(
 *     Result.ok(23),
 *     Result.tee(console.log), // logs `23`
 *     Result.map(n => n + 1), // inner value is unchanged
 *     Result.defaultValue(0)
 * ) // => 24
 * ```
 */
export const tee =
    <A>(f: (a: A) => void) =>
    <E>(result: Result<A, E>): Result<A, E> =>
        pipe(
            result,
            match({
                ok: a => {
                    f(a)
                    return ok(a)
                },
                err: e => err(e),
            })
        )

/**
 * Allows some arbitrary side-effect function to be called
 * using the wrapped `Err` value. Useful for debugging and logging.
 *
 * @param f Should not mutate its arguments. Use {@link mapErr} if
 * you want to map the inner `Err` value.
 *
 * @group Utils
 *
 * @example
 * ```
 * pipe(
 *     Result.err("melted"),
 *     Result.teeErr(console.log),   // logs `melted`
 *     Result.mapErr(s => s.length), // inner value is unchanged
 * ) // => Result.err(6)
 * ```
 */
export const teeErr =
    <E>(f: (e: E) => void) =>
    <A>(result: Result<A, E>): Result<A, E> =>
        pipe(
            result,
            match({
                ok: a => ok(a),
                err: e => {
                    f(e)
                    return err(e)
                },
            })
        )

/**
 * Converts an `Option` to a `Result`.
 *
 * @group Constructors
 * @group Utils
 *
 * @param onNone Used to convert a `None` branch into an `Err` branch.
 *
 * @returns a new `Result`.
 */
export const ofOption = <A extends NonNullish, E>(onNone: () => E) =>
    Option.match<A, Result<A, E>>({
        some: ok,
        none: flow(onNone, err),
    })

/**
 * Get an `EqualityComparer` for an `Result<A, E>` by giving this function an
 * `EqualityComparer` for type `A` and one for type `E`. Represents structural
 * (value-based) equality for the `Result` type.
 *
 * @group Equality
 * @group Utils
 *
 * @param equalityComparerA The `EqualityComparer` to use for the inner ok value.
 * @param equalityComparerE The `EqualityComparer` to use for the inner err value.
 *
 * @returns A new `EqualityComparer` instance
 */
export const getEqualityComparer = <A, E>(
    equalityComparerA: EqualityComparer<A>,
    equalityComparerE: EqualityComparer<E>
): EqualityComparer<Result<A, E>> =>
    EqualityComparer.ofEquals((r1, r2) => {
        if (isErr(r1) && isErr(r2) && equalityComparerE.equals(r1.err, r2.err)) {
            return true
        }

        return pipe(
            [r1, r2] as const,
            map2((a1: A, a2: A) => equalityComparerA.equals(a1, a2)),
            defaultValue(false)
        )
    })

/* c8 ignore start */
/** @ignore */
export const Result = {
    ok,
    of,
    err,
    isOk,
    isErr,
    match,
    map,
    map2,
    map3,
    mapErr,
    mapBoth,
    bind,
    flatMap,
    defaultValue,
    defaultWith,
    tryCatch,
    tee,
    teeErr,
    ofOption,
    getEqualityComparer,
    refine,
}
/* c8 ignore end */

/**
 * An `AsyncResult` represents an asynchronous computation that may either
 * succeed or fail (but should never throw). It is identical to `Async<Result<A, E>`.
 * This module simply provides convenience functions for working with that
 * type because they are so frequently used in real-world programming.
 *
 * Like `Async`, `AsyncResult` represents a "cold" computation that must be
 * explicitly invoked/started, in contrast to `Promise`s, which are "hot."
 *
 * **Note:** You can use `Async.start` to start `AsyncResult`s because they are
 * just `Async`s with a constrained inner value type.
 *
 * @module AsyncResult
 */

import { Result } from "./Result"
import { Async } from "./Async"
import { pipe } from "./composition"

/**
 * @typeParam A The type of the `Ok` branch.
 * @typeParam E The type of the `Err` branch.
 */
export interface AsyncResult<A, E> {
    (): Promise<Result<A, E>>
}

/**
 * Construct a new `Ok` instance.
 *
 * @group Constructors
 *
 * @returns A new `AsyncResult` containing the given ok value.
 */
export const ok =
    <A, E = never>(ok: A): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.ok(ok))

/**
 * Construct a new `Err` instance.
 *
 * @group Constructors
 *
 * @returns A new `AsyncResult` using the given err value.
 */
export const err =
    <E, A = never>(err: E): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.err(err))

/**
 * Maps the wrapped `Ok` value using the given function and
 * returns a new `AsyncResult`. Passes `Err` values through as-is.
 *
 * @group Mapping
 *
 * @example
 * await pipe(
 *     AsyncResult.ok(10),
 *     AsyncResult.map(n => n * 2),
 *     Async.start
 * ) // => Result.ok(20)
 */
export const map =
    <A, B>(f: (a: A) => B) =>
    <E>(async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.map(f))

/**
 * Maps the wrapped `Err` value using the given function and
 * returns a new `AsyncResult`. Passes `Ok` values through as-is.
 *
 * @group Mapping
 *
 * @example
 * await pipe(
 *     AsyncResult.err("err"),
 *     AsyncResult.mapErr(s => s.length),
 *     Async.start
 * ) // => Result.err(3)
 */
export const mapErr =
    <Ea, Eb>(f: (a: Ea) => Eb) =>
    <A>(async: AsyncResult<A, Ea>): AsyncResult<A, Eb> =>
    () =>
        async().then(Result.mapErr(f))

/**
 * Takes two functions: one to map an `Ok`, one to map an `Err`.
 * Returns a new AsyncResult with the projected value based
 * on which function was used. Equivalent to calling {@link map} =
 * followed by {@link mapErr}.
 *
 * @group Mapping
 */
export const mapBoth =
    <A1, A2, E1, E2>(mapOk: (a: A1) => A2, mapErr: (e: E1) => E2) =>
    (async: AsyncResult<A1, E1>) =>
    () =>
        async().then(Result.mapBoth(mapOk, mapErr))

/**
 * Maps the wrapped `Ok` value using a given function that
 * also returns an AsyncResult, and flattens the result.
 * Also commonly known as `flatpMap`.
 *
 * @group Mapping
 *
 * @example
 * declare const getNumberOfLines: (fileName: string) => AsyncResult<number, Error>
 * declare const sendToServer: (numLines: number) => AsyncResult<{}, Error>
 *
 * await pipe(
 *     "log.txt",                       // string
 *     getNumberOfLines,                // AsyncResult<number, Error>
 *     AsyncResult.bind(sendToServer),  // AsyncResult<{}, Error>
 *     Async.start                      // Promise<Result<{}, Error>>
 * )
 * // returns Result.ok({}) if everything succeeds
 * // otherwise returns Result.err(Error) if something
 * // fell down along the way
 */
export const bind =
    <A, B, E>(f: (a: A) => AsyncResult<B, E>) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    async () => {
        const result = await async()
        return await pipe(
            result,
            Result.match({
                ok: f,
                err: e => err(e),
            }),
            Async.start
        )
    }

/**
 * Alias for {@link bind}.
 *
 * @group Mapping
 */
export const flatMap = bind

/**
 * Projects the wrapped `Ok` value using a given _synchronous_ function
 * that returns a `Result` and flattens that result into a new `AsyncResult`.
 * Primarily useful for composing together asynchronous workflows with
 * synchronous functions that may also fail. (e.g., parsing a JSON string)
 *
 * @group Mapping
 *
 * @example
 * declare const networkRequest: (url: string) => AsyncResult<JsonValue, Error>;
 * declare const parseJson: (j: JsonValue) => Result<MyType, string>;
 *
 * await pipe(
 *     url,                                 // string
 *     networkRequest,                      // AsyncResult<JsonValue, Error>
 *     AsyncResult.bindResult(flow(
 *         parseJson,                       // Result<MyType, string>
 *         Result.mapErr(s => new Error(s)) // Result<MyType, Error>
 *     )),                                  // AsyncResult<MyType, Error>
 *     Async.start                          // Promise<Result<MyType, Error>>
 * )
 * // returns Result.ok(MyType) instance if everything succeeds,
 * // otherwise returns Result.err(Error)F if something fell over
 */
export const bindResult =
    <A, B, E>(f: (a: A) => Result<B, E>) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.bind(f))

/**
 * Use this function to "lift" a `Result` value into the `AsyncResult` type.
 * Essentially, this just wraps a `Result` into a lambda that returns an
 * immediately-resolved `Promise` containing the `Result`.
 *
 * @group Utils
 * @group Constructors
 */
export const ofResult =
    <A, E>(result: Result<A, E>): AsyncResult<A, E> =>
    () =>
        Promise.resolve(result)

/**
 * Use this function to "lift" an `Async` computation into an `AsyncResult`.
 * Essentially, this just wraps the `Async`'s inner value into a `Result.ok`.
 *
 * @group Utils
 * @group Constructors
 */
export const ofAsync =
    <A, E = unknown>(async: Async<A>): AsyncResult<A, E> =>
    () =>
        async().then(a => Result.ok(a))

/* eslint-disable func-style */
/**
 * Converts an `Async` computation that might reject into an
 * Async computation that never rejects and returns a `Result`.
 * (Remember that an `Async` is just a lambda returning a `Promise`.)
 *
 * If the `onThrow` callback function is given, it will be used to
 * convert the thrown object into the Err branch. By default, the thrown
 * object will be `string`-ed and wrapped in an Error if it is not an Error already.
 *
 * @group Utils
 *
 * @example
 * ```
 * declare const doHttpThing: (url: string) => Promise<number>;
 *
 * await pipe(
 *     AsyncResult.tryCatch(() => doHttpThing("/cats")),    // AsyncResult<number, Error>
 *     AsyncResult.mapErr(e => e.message),                  // AsyncResult<number, string>
 *     Async.start                                          // Promise<Result<number, string>>
 * )
 * // yields `Result.ok(number)` if the call succeeded
 * // otherwise yields `Result.err(string)`
 * ```
 */
export function tryCatch<A>(mightThrow: Async<A>): AsyncResult<A, Error>
export function tryCatch<A, E = unknown>(
    mightThrow: Async<A>,
    onThrow: (thrown: unknown) => E
): AsyncResult<A, E>
export function tryCatch<A, E = unknown>(
    mightThrow: Async<A>,
    onThrow?: (err: unknown) => E
): AsyncResult<A, unknown> {
    return async () => {
        const toError = (err: unknown) =>
            err instanceof Error ? err : Error(String(err))

        try {
            return Result.ok(await mightThrow())
        } catch (err) {
            if (onThrow != null) {
                return Result.err(onThrow(err))
            }
            return Result.err(toError(err))
        }
    }
}
/* eslint-enable func-style */

/**
 * @ignore
 */
interface AsyncResultMatcher<A, E, R> {
    readonly ok: R | ((ok: A) => R)
    readonly err: R | ((err: E) => R)
}

/**
 * Exhaustive pattern match against an `AsyncResult`. Pass a matcher
 * object with cases for `ok` and `err` using either raw values or
 * lambdas accepting the data associated with each case.
 *
 * This pattern match unwraps the inner `Result` and returns an `Async`
 * computation containing the result of the match. Use {@link start} to
 * convert the `Async` into a `Promise` which can be `await`-ed.
 *
 * @group Pattern Matching
 *
 * @example
 * await pipe(
 *     AsyncResult.ok("alright!"),
 *     AsyncResult.match({
 *         ok: String.capitalize,
 *         err: "bah, humbug!",
 *     }),
 *     Async.start
 * ) // => "Alright!"
 */
export const match =
    <A, E, R>(matcher: AsyncResultMatcher<A, E, R>) =>
    (async: AsyncResult<A, E>): Async<R> =>
    () =>
        async().then(Result.match(matcher))

/**
 * Equivalent to both Async.start or simply invoking
 * the AsyncResult as a function. Aliased here for convenience.
 *
 * @group Utils
 */
export const start = <A, E>(async: AsyncResult<A, E>) => async()

/* c8 ignore start */
/** @ignore */
export const AsyncResult = {
    ok,
    err,
    map,
    mapErr,
    mapBoth,
    bind,
    flatMap,
    bindResult,
    ofResult,
    ofAsync,
    tryCatch,
    match,
    start,
}
/* c8 ignore end */

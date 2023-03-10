import { Result } from "./Result"
import { Async } from "./Async"
import { pipe } from "./composition"

/** The `AsyncResult` type represents an asynchronous computation
 * that can either succeed or fail, but never throws. It is equivalent
 * to `Async<Result<A, E>`. This module simply provides convenience functions
 * for working with that type because they are so frequently used in
 * real-world programming.
 *
 * Like `Async`, `AsyncResult` represents a "cold" computation that
 * must be explicitly invoked/started, in contrast to `Promise`s, which
 * are "hot." You can use `Async.start` to start `AsyncResult`s because
 * they are just `Async`s with a constrained inner value type.
 */
export interface AsyncResult<A, E> {
    (): Promise<Result<A, E>>
}

/** Constructs a new Ok instance using the given ok value. */
const Ok =
    <A, E = never>(ok: A): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.Ok(ok))

/** Constructs a new Err instance using the given err value. */
const Err =
    <E, A = never>(err: E): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.Err(err))

/** Projects the wrapped Ok value using the given function and
 * returns a new AsyncResult. Does not operate on Err values.
 *
 * @example
 * await pipe(
 *     AsyncResult.Ok(10),
 *     AsyncResult.map(n => n * 2),
 *     Async.start
 * ); // yields `Result.Ok(20)`
 */
const map =
    <A, B, E = never>(f: (a: A) => B) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.map(f))

/** Projects the wrapped Err value using the given function and
 * returns a new AsyncResult. Does not operate on Ok values.
 *
 * @example
 * await pipe(
 *     AsyncResult.Err("err"),
 *     AsyncResult.mapErr(s => s.length),
 *     Async.start
 * ); // yields `Result.Err(3)`
 */
const mapErr =
    <A, Ea, Eb>(f: (a: Ea) => Eb) =>
    (async: AsyncResult<A, Ea>): AsyncResult<A, Eb> =>
    () =>
        async().then(Result.mapErr(f))

/** Projects the wrapped Ok value using a given function that
 * itself returns an AsyncResult, and flattens the result.
 *
 * @example
 * declare const getNumberOfLines: (fileName: string) => AsyncResult<number, Error>;
 * declare const sendToServer: (numLines: number) => AsyncResult<{}, Error>;
 *
 * await pipe(
 *     "log.txt",                       // string
 *     getNumberOfLines,                // AsyncResult<number, Error>
 *     AsyncResult.bind(sendToServer),  // AsyncResult<{}, Error>
 *     Async.start                      // Promise<Result<{}, Error>>
 * );
 * // returns `Result.Ok({})` if everything succeeds
 * // otherwise returns `Result.Err(Error)` if something
 * // fell down along the way
 */
const bind =
    <A, B, E>(f: (a: A) => AsyncResult<B, E>) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    async () => {
        const result = await async()
        return await pipe(
            result,
            Result.match({
                ok: f,
                err: e => Err(e),
            }),
            Async.start
        )
    }

/** Projects the wrapped Ok value using a given synchronous function
 * that returns a Result and flattens that result into a new AsyncResult.
 * Primarily useful for composing together asynchronous workflows with
 * synchronous functions that may fail.
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
 * );
 * // yields a `Result.Ok(MyType)` instance if everything succeeds,
 * // otherwise yields a `Result.Err(Error)` if something fell over
 */
const bindResult =
    <A, B, E>(f: (a: A) => Result<B, E>) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.bind(f))

/** Use this function to "lift" a Result value into the AsyncResult type.
 * Essentially this just wraps a Result into a lambda that returns an
 * immediately-resolved Promise containing the Result.
 */
const ofResult =
    <A, E>(result: Result<A, E>): AsyncResult<A, E> =>
    () =>
        Promise.resolve(result)

/** Use this function to "lift" an Async value into the AsyncResult type.
 * Essentially, this just wraps the Async's inner value into a Result.Ok.
 */
const ofAsync =
    <A, E = unknown>(async: Async<A>): AsyncResult<A, E> =>
    () =>
        async().then(a => Result.Ok(a))

/** Converts an Async computation that might reject into an
 * Async computation that never rejects and returns a Result.
 * (Remember that an Async is just a lambda returning a Promise.)
 *
 * Use together with `AsyncResult.mapErr` to convert the type of the
 * Err branch.
 *
 * @param onThrow Optional. If given, will be used to convert
 * the thrown object into some Error. By default, the thrown
 * object will be toString-ed and stuffed in an Error if it is
 * not an Error already.
 *
 * @example
 * declare const doHttpThing: (url: string) => Promise<number>;
 *
 * await pipe(
 *     AsyncResult.tryCatch(() => doHttpThing("/cats")),    // AsyncResult<number, Error>
 *     AsyncResult.mapErr(e => e.message),                  // AsyncResult<number, string>
 *     Async.start                                          // Promise<Result<number, string>>
 * );
 * // yields `Result.Ok(number)` if the call succeeded
 * // otherwise yields `Result.Err(string)`
 */
function tryCatch<A>(mightThrow: Async<A>): AsyncResult<A, Error>
function tryCatch<A, E = unknown>(
    mightThrow: Async<A>,
    onThrow: (thrown: unknown) => E
): AsyncResult<A, E>
function tryCatch<A, E = unknown>(
    mightThrow: Async<A>,
    onThrow?: (err: unknown) => E
): AsyncResult<A, any> {
    return async () => {
        const toError = (err: unknown) =>
            err instanceof Error ? err : Error(String(err))

        try {
            return Result.Ok(await mightThrow())
        } catch (err) {
            if (onThrow != null) {
                return Result.Err(onThrow(err))
            }
            return Result.Err(toError(err))
        }
    }
}

interface AsyncResultMatcher<A, E, R> {
    readonly ok: R | ((ok: A) => R)
    readonly err: R | ((err: E) => R)
}

/** Perform exhaustive pattern matching against an `AsyncResult`.
 * Pass a matcher object with cases for `ok` and `err` using either
 * raw values or lambdas accepting the data associated with each case.
 *
 * This pattern match unwraps the inner `Result` and returns an `Async`
 * computation containing the result of the match.
 *
 * @example
 * await pipe(
 *     AsyncResult.Ok("alright!"),
 *     AsyncResult.match({
 *         ok: String.capitalize,
 *         err: "bah, humbug!",
 *     }),
 *     Async.start
 * ); // yields "Alright!"
 */
const match =
    <A, E, R>(matcher: AsyncResultMatcher<A, E, R>) =>
    (async: AsyncResult<A, E>): Async<R> =>
    () =>
        async().then(Result.match(matcher))

interface PartialAsyncResultMatcher<A, E, R>
    extends Partial<AsyncResultMatcher<A, E, R>> {
    readonly orElse: R | (() => R)
}

/** Perform a non-exhaustive pattern match against an `AsyncResult`.
 * Pass a matcher object with optional cases for `ok` or `err` plus an
 * `orElse` (default) case. Each case can be a raw value or lambda
 * accepting the data associated with each case.
 *
 * This pattern match unwraps the inner `Result` and returns an `Async`
 * computation containing the new value.
 *
 * @example
 * await pipe(
 *     AsyncResult.Ok("alright!"),
 *     AsyncResult.matchOrElse({
 *         err: "bah, humbug!",
 *         orElse: () => "default",
 *     }),
 *     Async.start
 * ); // yields "default"
 */
const matchOrElse =
    <A, E, R>(matcher: PartialAsyncResultMatcher<A, E, R>) =>
    (async: AsyncResult<A, E>): Async<R> =>
    () =>
        async().then(Result.matchOrElse(matcher))

export const AsyncResult = {
    Ok,
    Err,
    map,
    mapErr,
    // TODO: mapBoth?
    bind,
    bindResult,
    ofResult,
    ofAsync,
    tryCatch,
    match,
    matchOrElse,
}

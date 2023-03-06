import { Result } from "./Result";
import { Async } from "./Async";
import { pipe } from "./composition";

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
    (): Promise<Result<A, E>>;
}

const Ok =
    <A, E = never>(ok: A): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.Ok(ok));

const Err =
    <E, A = never>(err: E): AsyncResult<A, E> =>
    () =>
        Promise.resolve(Result.Err(err));

const map =
    <A, B, E = never>(f: (a: A) => B) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.map(f));

const mapErr =
    <A, Ea, Eb>(f: (a: Ea) => Eb) =>
    (async: AsyncResult<A, Ea>): AsyncResult<A, Eb> =>
    () =>
        async().then(Result.mapErr(f));

const bind =
    <A, B, E>(f: (a: A) => AsyncResult<B, E>) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    async () => {
        const result = await async();
        return await pipe(
            result,
            Result.match({
                ok: f,
                err: e => Err(e),
            }),
            Async.start
        );
    };

const bindResult =
    <A, B, E>(f: (a: A) => Result<B, E>) =>
    (async: AsyncResult<A, E>): AsyncResult<B, E> =>
    () =>
        async().then(Result.bind(f));

const ofResult =
    <A, E>(result: Result<A, E>): AsyncResult<A, E> =>
    () =>
        Promise.resolve(result);

const ofAsync =
    <A, E = unknown>(async: Async<A>): AsyncResult<A, E> =>
    () =>
        async().then(a => Result.Ok(a));

const tryCatch =
    <A>(mightThrow: Async<A>, onThrow?: (err: unknown) => Error): AsyncResult<A, Error> =>
    async () => {
        const toError = (err: unknown) =>
            err instanceof Error ? err : Error(String(err));

        try {
            return Result.Ok(await mightThrow());
        } catch (err) {
            return Result.Err(onThrow != null ? onThrow(err) : toError(err));
        }
    };

interface Matcher<A, E, R> {
    readonly ok: R | ((ok: A) => R);
    readonly err: R | ((err: E) => R);
}

/** Perform exhaustive pattern matching against an `AsyncResult`.
 * Pass a matcher object with cases for `ok` and `err` using either
 * raw values or lambdas accepting the data associated with each case.
 *
 * This pattern match unwraps the inner `Result` and returns an `Async`
 * computation containing the new value.
 *
 * @example
 * await pipe(
 *     AsyncResult.Ok("alright!"),
 *     AsyncResult.match({
 *         ok: String.capitalize,
 *         err: "bah, humbug!",
 *     }),
 *     Async.start
 * ); // yeilds "Alright!"
 */
const match =
    <A, E, R>(matcher: Matcher<A, E, R>) =>
    (async: AsyncResult<A, E>): Async<R> =>
    () =>
        async().then(Result.match(matcher));

interface PartialMatcher<A, E, R> extends Partial<Matcher<A, E, R>> {
    readonly orElse: R | (() => R);
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
    <A, E, R>(matcher: PartialMatcher<A, E, R>) =>
    (async: AsyncResult<A, E>): Async<R> =>
    () =>
        async().then(Result.matchOrElse(matcher));

export const AsyncResult = {
    Ok,
    Err,
    map,
    mapErr,
    bind,
    bindResult,
    ofResult,
    ofAsync,
    tryCatch,
    match,
    matchOrElse,
};

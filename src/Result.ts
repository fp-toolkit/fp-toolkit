/* eslint-disable @typescript-eslint/no-empty-interface */
import { Tagged, assertExhaustive } from "./Prelude";

interface Ok<A> extends Tagged<"result/ok", { ok: A }> {}
interface Err<E> extends Tagged<"result/err", { err: E }> {}

/** The `Result` type represents the outcome of a completed operation
 * that either succeeded with some `Ok` value (also called a "success"
 * or "right" value), or failed with some `Err` value (also called a
 * "failure" or "left" value).
 *
 * Generally speaking, `Result` is not intended to _replace_ exception
 * handling, but to augment it, so that exceptions can be used to handle
 * truly exceptional things. (i.e., Is it really exceptional that a
 * network request failed?)
 *
 * This API has been designed to work with `pipe`.
 *
 * @example
 * pipe(
 *     Result.tryCatch(() => readFileMightThrow()),
 *     Result.mapErr(FileError.create),
 *     Result.bind(fileText => pipe(
 *         Result.tryCatch(() => transmitMightThrow(fileText)),
 *         Result.mapErr(FileError.create)
 *     )),
 *     Result.map(transmitResponse => transmitResponse?.status),
 *     Result.defaultValue("failed")
 * );
 * // may return, e.g., "pending" if everything worked
 * // or "failed" if something fell down along the way
 */
export type Result<A, E> = Ok<A> | Err<E>;

/** Constructs a new Ok instance with the given ok value. */
const Ok = <A, E = never>(ok: A): Result<A, E> => ({
    _tag: "result/ok",
    ok,
});

/** Constructs a new Err instance with the given err value. */
const Err = <E, A = never>(err: E): Result<A, E> => ({
    _tag: "result/err",
    err,
});

/** Alias for the Ok constructor. */
const of = Ok;

interface Matcher<A, E, R> {
    readonly ok: R | ((ok: A) => R);
    readonly err: R | ((err: E) => R);
}

interface PartialMatcher<A, E, R> extends Partial<Matcher<A, E, R>> {
    readonly orElse: R | (() => R);
}

const isRawValue = <A, E, R>(caseFn: R | ((ok: A) => R) | ((err: E) => E)): caseFn is R =>
    typeof caseFn !== "function";

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg);

/** Pattern match against a `Result` to "unwrap" its inner value.
 * Pass a matcher function with cases for `ok` and `err` that can
 * either be lambdas or raw values.
 *
 * Enforces exhaustive case matching.
 *
 * @example
 * pipe(
 *     Result.Err("failure"),
 *     Result.match({
 *         ok: a => `${a.length}`,
 *         err: s => `${s}!`
 *     })
 * ); // "failure!"
 */
const match =
    <A, E, R>(matcher: Matcher<A, E, R>) =>
    (result: Result<A, E>) => {
        switch (result._tag) {
            case "result/ok":
                return getMatcherResult(matcher.ok, result.ok);
            case "result/err":
                return getMatcherResult(matcher.err, result.err);
            default:
                return assertExhaustive(result);
        }
    };

const getPartialMatcherResult = <T, R>(
    match: ((t: T) => R) | R | undefined,
    arg: T,
    orElseMatch: (() => R) | R
): R =>
    match !== undefined
        ? getMatcherResult(match, arg)
        : getMatcherResult(orElseMatch, undefined);

/** Perform non-exahustive pattern matching against a `Result`
 * to "unwrap" its inner value. Accepts a partial matcher object
 * that specifies a default `orElse` case to use if either matcher
 * is omitted. All match cases accept lambdas or raw values.
 *
 * @example
 * pipe(
 *     Result.Ok("cheese"),
 *     Result.matchOrElse({
 *         err: "ERR!",
 *         orElse: () => "success",
 *     })
 * ); // "success"
 */
const matchOrElse =
    <A, E, R>(matcher: PartialMatcher<A, E, R>) =>
    (result: Result<A, E>): R => {
        switch (result._tag) {
            case "result/ok":
                return getPartialMatcherResult(matcher.ok, result.ok, matcher.orElse);
            case "result/err":
                return getPartialMatcherResult(matcher.err, result.err, matcher.orElse);
            default:
                return getMatcherResult(matcher.orElse, undefined);
        }
    };

/** If the `Result` is `Ok`, projects the inner value using
 * the given function, returning a new `Result`. Passes
 * `Err` values through unchanged.
 *
 * @example
 * pipe(
 *     Result.Ok(2),
 *     Result.map(n => n + 3)
 * ); // yields `Result.Ok(5)`
 */
const map = <A, E, B>(f: (a: A) => B) =>
    match<A, E, Result<B, E>>({
        ok: a => Ok(f(a)),
        err: e => Err(e),
    });

/** If the `Result` is `Err`, projects the error value using
 * the given function and returns a new `Result`. `Ok` values
 * are passed through unchanged.
 *
 * @example
 * pipe(
 *     Result.Err("cheese melted"),
 *     Result.mapErr(s => s.length)
 * ); // yields `Result.Err(13)`
 */
const mapErr = <A, Ea, Eb>(f: (e: Ea) => Eb) =>
    match<A, Ea, Result<A, Eb>>({
        ok: a => Ok(a),
        err: e => Err(f(e)),
    });

/** Map both branches of the Result by specifying a lambda
 * to use in either case. Equivalent to calling `map` followed
 * by `mapErr`.
 */
const mapBoth = <A1, E1, A2, E2>(mapOk: (a: A1) => A2, mapErr: (e: E1) => E2) =>
    match<A1, E1, Result<A2, E2>>({
        ok: a => Ok(mapOk(a)),
        err: e => Err(mapErr(e)),
    });

/** Returns the inner Ok value or the given default value
 * if the Result is an Err.
 */
const defaultValue = <A, E = unknown>(a: A) =>
    match<A, E, A>({
        ok: a => a,
        err: a,
    });

/** Returns the inner Ok value or uses the given lambda
 * to compute the default value if the Result is an Err.
 */
const defaultWith = <A, E = unknown>(f: () => A) =>
    match<A, E, A>({
        ok: a => a,
        err: f,
    });

/** Projects the inner Ok value using a function that
 * itself returns a Result, and flattens the result.
 * Errs are passed through unchanged.
 *
 * @example
 * pipe(
 *     Result.Ok("a"),
 *     Result.bind(s =>
 *         s === "a" ? Result.Ok("got an a!") : Result.Err("not an a")
 *     ),
 *     Result.defualtValue("")
 * ); // yields "got an a!"
 */
const bind = <A, E, B>(f: (a: A) => Result<B, E>) =>
    match<A, E, Result<B, E>>({
        ok: f,
        err: e => Err(e),
    });

/** A type guard that holds if the result is an Ok. Allows the
 * TypeScript compiler to narrow the type and allow safe access
 * to `.ok`.
 */
const isOk = <A, E = unknown>(result: Result<A, E>): result is Ok<A> =>
    result._tag === "result/ok";

/** A type guard that holds if the result is an Err. Allows the
 * TypeScript compiler to narrow the type and allow safe access
 * to `.err`.
 */
const isErr = <E, A = unknown>(result: Result<A, E>): result is Err<E> =>
    result._tag === "result/err";

/** If given two Ok values, uses the given function and produces a new
 * Ok value with the result. If either of the Results are an Err, returns
 * an Err.
 *
 * If both results are an Err, returns the first one and ignores the second.
 *
 * This is effectively a shortcut to pattern matching a 2-tuple of Results.
 */
const map2 =
    <A, B, C, E>(map: (a: A, b: B) => C) =>
    (results: readonly [Result<A, E>, Result<B, E>]): Result<C, E> => {
        if (Result.isOk(results[0]) && Result.isOk(results[1])) {
            return Ok(map(results[0].ok, results[1].ok));
        } else if (Result.isErr(results[0])) {
            return Err(results[0].err);
        } else {
            return Err((results[1] as Err<E>).err);
        }
    };

/** If given three Ok values, uses the given function and produces a new
 * Ok value with the result. If any of the Results are an Err, returns
 * an Err.
 *
 * If multiple Results are an Err, returns the first one in order and ignores the others.
 *
 * This is effectively a shortcut to pattern matching a 3-tuple of Results.
 */
const map3 =
    <A, B, C, D, E>(map: (a: A, b: B, c: C) => D) =>
    (results: readonly [Result<A, E>, Result<B, E>, Result<C, E>]): Result<D, E> => {
        if (
            Result.isOk(results[0]) &&
            Result.isOk(results[1]) &&
            Result.isOk(results[2])
        ) {
            return Ok(map(results[0].ok, results[1].ok, results[2].ok));
        } else if (Result.isErr(results[0])) {
            return Err(results[0].err);
        } else if (Result.isErr(results[1])) {
            return Err(results[1].err);
        } else {
            return Err((results[2] as Err<E>).err);
        }
    };

/** Attemps to invoke a function that may throw an Error. If the function
 * succeeds, returns an Ok with the result. If the function throws an Error,
 * returns an Err containing the thrown Error, optionally transformed.
 *
 * @param onThrow Optional. If given, accepts the thrown `unknown` object and
 * must produce an Error. If omitted, the thrown object will be `toString`'d
 * and wrapped in a new Error if it is not already an Error instance.
 */
const tryCatch = <A>(
    mightThrow: () => A,
    onThrow?: (err: unknown) => Error
): Result<A, Error> => {
    const toError = (err: unknown) => (err instanceof Error ? err : Error(String(err)));

    try {
        return Ok(mightThrow());
    } catch (err) {
        return Err(onThrow != null ? onThrow(err) : toError(err));
    }
};

export const Result = {
    Ok,
    of,
    Err,
    isOk,
    isErr,
    match,
    matchOrElse,
    map,
    map2,
    map3,
    mapErr,
    mapBoth,
    bind,
    defaultValue,
    defaultWith,
    tryCatch,
};

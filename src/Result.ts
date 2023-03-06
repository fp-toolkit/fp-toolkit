import { Tagged, assertExhaustive } from "./Prelude";
import { pipe } from "./composition";

type Ok<A> = Tagged<"result/ok", { ok: A }>;
type Err<E> = Tagged<"result/err", { err: E }>;

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
 * ); // may return, e.g., "pending" if everything worked or "failed"
 *    // if something fell down along the way
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
 * the given function, returning a new `Result`. Ignores
 * `Err` values.
 */
const map = <A, E, B>(f: (a: A) => B) =>
    match<A, E, Result<B, E>>({
        ok: a => Ok(f(a)),
        err: e => Err(e),
    });

const mapErr = <A, Ea, Eb>(f: (e: Ea) => Eb) =>
    match<A, Ea, Result<A, Eb>>({
        ok: a => Ok(a),
        err: e => Err(f(e)),
    });

const mapBoth = <A1, E1, A2, E2>(mapOk: (a: A1) => A2, mapErr: (e: E1) => E2) =>
    match<A1, E1, Result<A2, E2>>({
        ok: a => Ok(mapOk(a)),
        err: e => Err(mapErr(e)),
    });

const defaultValue = <A, E = unknown>(a: A) =>
    match<A, E, A>({
        ok: a => a,
        err: a,
    });

const defaultWith = <A, E = unknown>(f: () => A) =>
    match<A, E, A>({
        ok: a => a,
        err: f,
    });

const bind = <A, E, B>(f: (a: A) => Result<B, E>) =>
    match<A, E, Result<B, E>>({
        ok: f,
        err: e => Err(e),
    });

const map2 =
    <A, B, C, E>(map: (a: A, b: B) => C) =>
    (r1: Result<A, E>, r2: Result<B, E>): Result<C, E> =>
        pipe(
            r1,
            match({
                ok: a =>
                    pipe(
                        r2,
                        match({
                            ok: b => Ok(map(a, b)),
                            err: e => Err(e),
                        })
                    ),
                err: e => Err(e),
            })
        );

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

const isOk = <A, E = unknown>(result: Result<A, E>): result is Ok<A> =>
    result._tag === "result/ok";

const isErr = <E, A = unknown>(result: Result<A, E>): result is Err<E> =>
    result._tag === "result/err";

export const Result = {
    Ok,
    of,
    Err,
    match,
    matchOrElse,
    map,
    map2,
    mapErr,
    bind,
    defaultValue,
    defaultWith,
    tryCatch,
    isOk,
    isErr,
};

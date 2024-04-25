/**
 * The `DeferredResult` type is simply a convenient alias for a {@link Deferred} with an
 * inner value of a result {@link Result}. The `DeferredResult` type is frequently useful
 * for modeling the state of an asynchronous operation in something like a Redux store or
 * the `State` type of a React `useReducer` hook.
 *
 * The most common use case for this module is to make a decision about what text/UI
 * components to display to a user based on the state of some asynchronous operation that
 * is potentially ongoing.
 *
 * See docs for {@link match} and {@link matchOrElse} for code examples.
 *
 * @module
 */

import { pipe } from "../Composition"
import type { Deferred } from "../Deferred"
import { Result } from "../Result"
import { type Identity, assertExhaustive } from "../prelude"

export type DeferredResult<A, E> = Deferred<Result<A, E>>

/** @ignore */
interface DeferredResultMatcher<A, E, R> {
    readonly notStarted: (() => R) | R
    readonly inProgress: (() => R) | R
    readonly resolvedOk: ((ok: A) => R) | R
    readonly resolvedErr: ((ok: E) => R) | R
}

/** @ignore */
interface PartialDeferredResultMatcher<A, E, R>
    extends Partial<DeferredResultMatcher<A, E, R>> {
    readonly orElse: (() => R) | R
}

const isRawValue = <A, E, R>(
    caseFn: R | ((ok: A) => R) | ((err: E) => E)
): caseFn is R => typeof caseFn !== "function"

const getMatcherResult = <T, R>(match: ((t: T) => R) | R, arg: T) =>
    isRawValue(match) ? match : match(arg)

const objHasOptionalProp = <T extends object, P extends keyof T>(
    prop: P,
    obj: T
): obj is Identity<T & Required<{ [key in P]: T[P] }>> =>
    Object.hasOwn(obj, prop)

/**
 * Exhaustive pattern match against a `DeferredResult`. Provide a raw value or
 * lambda function to use in each case: `notStarted`, `inProgress`, `resolvedOk`,
 * and `resolvedErr`. For `resolvedOk` and `resolvedErr`, the lambda function
 * will be given the attached "ok" or "err" data attached to the `Result`.
 *
 * @param matcher The matcher object containing the value or function to use in each case.
 *
 * @returns The result of evaluating the matcher case appropriate to the value.
 *
 * @group Pattern Matching
 *
 * @example
 * ```ts
 * declare const apiCallResponse: DeferredResult<Fruit, ApiError>
 * pipe(
 *     apiCallResponse,
 *     DeferredResult.match({
 *         notStarted: "Not Started",
 *         inProgress: "In Progress",
 *         resolvedOk: fruit => `Fruit is: ${fruit.name}`,
 *         resolvedErr: apiError => `Error was: ${ApiError.toString(apiError)}`
 *     })
 * )
 * ```
 */
export const match =
    <A, E, R>(matcher: DeferredResultMatcher<A, E, R>) =>
    (deferredResult: DeferredResult<A, E>) => {
        switch (deferredResult._tag) {
            case "InProgress":
                return getMatcherResult(matcher.inProgress, undefined)
            case "NotStarted":
                return getMatcherResult(matcher.notStarted, undefined)
            case "Resolved":
                return pipe(
                    deferredResult.resolved,
                    Result.match({
                        ok: a => getMatcherResult(matcher.resolvedOk, a),
                        err: e => getMatcherResult(matcher.resolvedErr, e),
                    })
                )
            /* c8 ignore next 2 */
            default:
                return assertExhaustive(deferredResult)
        }
    }

/**
 * Non-exhaustive pattern match against a `DeferredResult` value. Provide a raw
 * value or a lambda function to use in the cases you care about. (But don't provide
 * all the cases; if you want an exhaustive pattern match, use {@link match} instead.)
 * Must provide an `orElse` matcher case to use if no other match case is hit.
 *
 * This function is especially useful for when you really only care about the "resolved"
 * cases, for instance.
 *
 * @param matcher The matcher object containing the value or function to use in each case.
 *
 * @returns The result of evaluating the matcher case appropriate to the value.
 *
 * @group Pattern Matching
 *
 * @example
 * ```ts
 *     declare const apiResponse: DeferredResult<Fruit, ApiError>
 *     pipe(
 *         apiResponse,
 *         DeferredResult.matchOrElse({
 *             resolvedOk: fruit => `Got fruit! ${fruit.name}`,
 *             resolvedErr: apiError => `Oh noes! ${apiError.message}`,
 *             orElse: "Still loading..."
 *         })
 *     )
 * ```
 */
export const matchOrElse =
    <A, E, R>(matcher: PartialDeferredResultMatcher<A, E, R>) =>
    (deferredResult: DeferredResult<A, E>) => {
        switch (deferredResult._tag) {
            case "InProgress":
                return objHasOptionalProp("inProgress", matcher)
                    ? getMatcherResult(matcher.inProgress, undefined)
                    : getMatcherResult(matcher.orElse, undefined)
            case "NotStarted":
                return objHasOptionalProp("notStarted", matcher)
                    ? getMatcherResult(matcher.notStarted, undefined)
                    : getMatcherResult(matcher.orElse, undefined)
            case "Resolved":
                return pipe(
                    deferredResult.resolved,
                    Result.match({
                        ok: a =>
                            objHasOptionalProp("resolvedOk", matcher)
                                ? getMatcherResult(matcher.resolvedOk, a)
                                : getMatcherResult(matcher.orElse, undefined),
                        err: e =>
                            objHasOptionalProp("resolvedErr", matcher)
                                ? getMatcherResult(matcher.resolvedErr, e)
                                : getMatcherResult(matcher.orElse, undefined),
                    })
                )
            /* c8 ignore next 2 */
            default:
                return assertExhaustive(deferredResult)
        }
    }
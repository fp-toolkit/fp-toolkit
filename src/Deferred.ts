// TODO: DOCS!

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { Tagged, assertExhaustive, EqualityComparer } from "./prelude"
import { pipe } from "./composition"

const defaultEqualityComparer: EqualityComparer<never> = {
    equals: (a, b) => a === b,
}

interface NotStarted extends Tagged<"NotStarted", object> {}
interface InProgress extends Tagged<"InProgress", object> {}
interface Resolved<A> extends Tagged<"Resolved", { resolved: A }> {}

export type Deferred<A> = NotStarted | InProgress | Resolved<A>

const notStarted: Deferred<never> = { _tag: "NotStarted" }

const inProgress: Deferred<never> = { _tag: "InProgress" }

const resolved = <A>(a: A): Deferred<A> => ({ _tag: "Resolved", resolved: a })

// export type DeferredEither<L, R> = Deferred<Either<L, R>>

interface DeferredMatcher<A, R> {
    readonly notStarted: (() => R) | R
    readonly inProgress: (() => R) | R
    readonly resolved: ((a: A) => R) | R
}

interface PartialDeferredMatcher<A, R> extends Partial<DeferredMatcher<A, R>> {
    readonly orElse: (() => R) | R
}

type Func<T> = (...args: any[]) => T
type FuncOrValue<T> = Func<T> | T

const resultOrValue = <T>(f: FuncOrValue<T>, ...args: any[]) => {
    const isFunc = (f: FuncOrValue<T>): f is Func<T> => typeof f === "function"
    return isFunc(f) ? f(...args) : f
}

const match =
    <A, R>(matcher: DeferredMatcher<A, R>) =>
    (deferred: Deferred<A>) => {
        switch (deferred._tag) {
            case "NotStarted":
                return resultOrValue(matcher.notStarted)
            case "InProgress":
                return resultOrValue(matcher.inProgress)
            case "Resolved":
                return resultOrValue(matcher.resolved, deferred.resolved)
            default:
                return assertExhaustive(deferred) as R
        }
    }

const matchOrElse =
    <A, R>(matcher: PartialDeferredMatcher<A, R>) =>
    (deferred: Deferred<A>) => {
        switch (deferred._tag) {
            case "NotStarted":
                return resultOrValue(
                    matcher.notStarted != null ? matcher.notStarted : matcher.orElse
                )
            case "InProgress":
                return resultOrValue(
                    matcher.inProgress != null ? matcher.inProgress : matcher.orElse
                )
            case "Resolved":
                return matcher.resolved != null
                    ? resultOrValue(matcher.resolved, deferred.resolved)
                    : resultOrValue(matcher.orElse)
            default:
                return resultOrValue(matcher.orElse)
        }
    }

const isUnresolved = matchOrElse({
    resolved: false,
    orElse: true,
})

const isInProgress = <A>(deferred: Deferred<A>): deferred is InProgress =>
    pipe(
        deferred,
        matchOrElse({
            inProgress: true,
            orElse: false,
        })
    )

const isResolved = <A>(deferred: Deferred<A>): deferred is Resolved<A> =>
    pipe(
        deferred,
        matchOrElse({
            resolved: true,
            orElse: false,
        })
    )

const isResolvedWith = <A>(
    expected: A,
    { equals }: EqualityComparer<A> = defaultEqualityComparer
) =>
    matchOrElse<A, boolean>({
        resolved: actual => equals(actual, expected),
        orElse: false,
    })

export const Deferred = {
    notStarted,
    inProgress,
    resolved,
    match,
    matchOrElse,
    isUnresolved,
    isResolved,
    isInProgress,
    isResolvedWith,
}

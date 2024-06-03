type BoolMatcher<R> = {
    readonly true: R | (() => R)
    readonly false: R | (() => R)
}

const isRawValue = <R>(caseFn: R | (() => R)): caseFn is R =>
    typeof caseFn !== "function"

const getMatcherResult = <R>(match: (() => R) | R) =>
    isRawValue(match) ? match : match()

export const match =
    <R>(matcher: BoolMatcher<R>) =>
    (bool: boolean): R => {
        switch (bool) {
            case true:
                return getMatcherResult(matcher.true)
            case false:
                return getMatcherResult(matcher.false)
        }
    }

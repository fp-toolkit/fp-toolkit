// TODO: copy docs page from menu-admin-client

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Identity } from "./prelude"
import { String } from "./string"

/**************
 * Helper Types
 ***************/
type DefaultDiscriminant = "_tag"

type DefaultScope = ""

type Func = (...args: any[]) => any

type EmptyObjGuard<T> = T extends ObjectGuard<infer O>
    ? object extends O
        ? O
        : never
    : never

type Scoped<T extends string, Scope extends string = ""> = Scope extends ""
    ? T
    : `${Scope}${T}`

type ObjectGuard<T extends object> = Exclude<T, any[] | Func>

type NonEmptyStringKeys<T> = Exclude<Extract<keyof T, string>, "">

/********************
 * Foundational Types
 *********************/

type VariantInputObject = Record<string, Func | object>

type Variant<
    Case extends string,
    Data extends object = object,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = Identity<
    {
        readonly [key in Discriminant]: Scoped<Case, Scope>
    } & Readonly<Data>
>

type CaseReturnType<T> = T extends (...args: any[]) => infer R
    ? R extends object
        ? R
        : never
    : EmptyObjGuard<T>

type VariantConstructor<
    Args extends any[],
    Case extends string,
    Data extends object = object,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = (...args: Args) => Variant<Case, Data, Discriminant, Scope>

type VariantConstructorOrValue<
    T,
    Case extends string,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = ObjectGuard<CaseReturnType<T>> extends never
    ? [never, "Only objects are allowed as variant data. Wrap variant data in an object."]
    : T extends Func
    ? VariantConstructor<Parameters<T>, Case, CaseReturnType<T>, Discriminant, Scope>
    : Variant<Case, CaseReturnType<T>, Discriminant, Scope>

type VariantConstructors<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = {
    readonly [Case in NonEmptyStringKeys<Input>]: VariantConstructorOrValue<
        Input[Case],
        Capitalize<Case>,
        Discriminant,
        Scope
    >
}

type _VariantOf<
    Input extends VariantInputObject,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = {
    [Case in NonEmptyStringKeys<Input>]: Identity<
        Variant<Capitalize<Case>, CaseReturnType<Input[Case]>, Discriminant, Scope>
    >
}[NonEmptyStringKeys<Input>]

/*****************
 * Composite Types
 ******************/

type Matcher<A, Input extends VariantInputObject = Record<string, never>> = {
    readonly [Case in keyof Input]: ((data: CaseReturnType<Input[Case]>) => A) | A
}

type Match<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = <A>(
    matcher: Matcher<A, Input>
) => (instance: _VariantOf<Input, Discriminant, Scope>) => A

type PartialMatcher<
    A,
    Input extends VariantInputObject = Record<string, never>
> = Partial<Matcher<A, Input>> & {
    readonly orElse: (() => A) | A
}

type MatchOrElse<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = <A>(
    partialMatcher: PartialMatcher<A, Input>
) => (instance: _VariantOf<Input, Discriminant, Scope>) => A

type VariantTypes<
    Input extends VariantInputObject = Record<string, never>,
    Scope extends string = DefaultScope
> = {
    readonly [Case in NonEmptyStringKeys<Input>]: Scoped<Capitalize<Case>, Scope>
}

type VariantModule<
    Input extends VariantInputObject = Record<string, never>,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
> = {
    readonly match: Match<Input, Discriminant, Scope>
    readonly matchOrElse: MatchOrElse<Input, Discriminant, Scope>
    readonly types: Identity<VariantTypes<Input, Scope>>
} & VariantConstructors<Input, Discriminant, Scope>

/**
 * Extracts a "plain old" discriminated union type from a `VariantModule` constructed
 * with {@link variant} or {@link  variantC}.
 */
export type VariantOf<V> = V extends VariantModule<
    infer Input,
    infer Discriminant,
    infer Scope
>
    ? Identity<_VariantOf<Input, Discriminant, Scope>>
    : [never, "Error: V must be a variant module"]

/**********************
 * Generative Functions
 ***********************/

const isFunc = (f: Func | object): f is Func => typeof f === "function"

const getVariantCtors = <
    T extends VariantInputObject,
    Discriminant extends string = DefaultDiscriminant,
    Scope extends string = DefaultScope
>(
    inp: T,
    discriminant: Discriminant,
    scope: Scope
): VariantConstructors<T, Discriminant, Scope> =>
    Object.entries(inp).reduce((acc, entry) => {
        const [_case, ctor] = entry
        const capitalizedCase = String.capitalize(_case)
        const scopedCapitalizedCase =
            scope.length > 0 ? `${scope}${capitalizedCase}` : `${capitalizedCase}`

        return Object.assign(acc, {
            [_case]: isFunc(ctor)
                ? (...args: any[]) => ({
                      [discriminant]: scopedCapitalizedCase,
                      ...ctor(...args),
                  })
                : { [discriminant]: scopedCapitalizedCase },
        })
    }, {}) as VariantConstructors<T, Discriminant, Scope>

const getVariantTypes = <T extends VariantInputObject, Scope extends string = "">(
    inp: T,
    scope: Scope
): Identity<VariantTypes<T, Scope>> =>
    Object.entries(inp).reduce((acc, entry) => {
        const [_case] = entry
        const capitalizedCase = String.capitalize(_case)
        const scopedCapitalizedCase =
            scope.length > 0 ? `${scope}${capitalizedCase}` : `${capitalizedCase}`

        return Object.assign(acc, { [_case]: scopedCapitalizedCase })
    }, {}) as Identity<VariantTypes<T, Scope>>

const unscope = <Scope extends string>(type: string, scope: Scope) =>
    scope.length > 0 ? type.replace(new RegExp(`${scope}`), "") : type

const getMatchFn =
    <
        T extends VariantInputObject,
        Discriminant extends string = DefaultDiscriminant,
        Scope extends string = DefaultScope
    >(
        discriminant: Discriminant,
        scope: Scope
    ): Match<T, Discriminant> =>
    matcher =>
    instance => {
        const unscopedUncapitalizedType = String.uncapitalize(
            unscope(instance[discriminant], scope)
        )

        if (!Object.hasOwn(matcher, unscopedUncapitalizedType)) {
            throw new TypeError(
                `Expected to be given a variant with scope ${scope}. Actual type was ${instance[discriminant]}`
            )
        }

        const branch = matcher[unscopedUncapitalizedType]

        const data = { ...instance }
        delete data[discriminant]

        return typeof branch === "function" ? (branch as any)(data) : branch
    }

const getMatchOrElseFn =
    <
        T extends VariantInputObject,
        Discriminant extends string = DefaultDiscriminant,
        Scope extends string = DefaultScope
    >(
        discriminant: Discriminant,
        scope: Scope
    ): MatchOrElse<T, Discriminant> =>
    matcher =>
    instance => {
        const unscopedUncapitalizedType = String.uncapitalize(
            unscope(instance[discriminant], scope)
        )

        if (Object.hasOwn(matcher, unscopedUncapitalizedType)) {
            const branch = matcher[unscopedUncapitalizedType]

            const data = { ...instance }
            delete data[discriminant]

            return typeof branch === "function" ? branch(data) : branch
        }

        return typeof matcher.orElse === "function"
            ? (matcher.orElse as any)()
            : matcher.orElse
    }

/** _C_ stands for customize! Returns a module object containing case
 * constructors a mapping of cases to (possibly) scoped `types` (i.e., tags),
 * and `match`/`matchOrElse` functions. **This function allows you to pass
 * your own discriminant (e.g., `"type"`) and scope (e.g., `"Namespace/"`).**
 *
 * Changing the scope allows you to re-use the exact same variant structure
 * without risking conflicting types or matcher functions. **Use a scope
 * for redux actions to namespace them.**
 *
 * This does not handle generic variants, like `Option<T>`.
 *
 * @example
 * ```
 * export const Action = variantC({
 *   loadStuffStarted: {},
 *   loadStuffFinished: (response: string) => ({ response }),
 * }, 'type', 'Namespace/')
 * export type Action = VariantOf<typeof Action>;
 *
 * // Access type names
 * const types = Action.types // => { loadStuffStarted: 'Namespace/LoadStuffStarted', loadStuffFinished: 'Namespace/LoadStuffFinished' }
 *
 * // Construct a new instance
 * const myAction = Action.loadStuffFinished('200 OK') // => { type: 'Namespace/LoadStuffFinished', response: '200 OK' }
 *
 * // Perform a match
 * const matchResult = pipe(
 *   myAction,
 *   Action.match({
 *     loadStuffStarted: 'stuff started!',
 *     loadStuffFinished: ({ response }) => `Finished, response=${response}`,
 *   })
 * ) // => 'Finished, response=200 OK'
 * ```
 */
export const variantC = <
    T extends VariantInputObject,
    Discriminant extends string,
    Scope extends string
>(
    inp: T,
    discriminant: Discriminant,
    scope: Scope
): VariantModule<T, Discriminant, Scope> => ({
    ...getVariantCtors(inp, discriminant, scope),
    match: getMatchFn(discriminant, scope),
    matchOrElse: getMatchOrElseFn(discriminant, scope),
    types: getVariantTypes(inp, scope),
})

/** Returns a module object containing case constructors, a mapping of cases to
 * (possibly) scoped `types` (i.e., tags), and `match`/`matchOrElse` functions.
 * **This function uses the default discriminant of `"_tag"` and no scope.**
 *
 * This does not handle generic variants, like `Option<T>`.
 *
 * @example
 * ```
 * export const Pet = variant({
 *   dog: (name: string) => ({ name }),
 *   cat: (livesLeft: number) => ({ livesLeft }),
 *   fish: {},
 * })
 * export type Pet = VariantOf<typeof Pet>;
 *
 * // Access type names (useful in Redux scenarios)
 * const types = Pet.types // => { dog: 'Dog', cat: 'Cat', fish: 'Fish' }
 *
 * // Construct a new instance
 * const myDog = Pet.dog('Fido') // => { _tag: 'Dog', name: 'Fido' }
 *
 * // Perform a match
 * const matchResult = pipe(
 *   myDog,
 *   Pet.matchOrElse({
 *     dog: ({ name }) => `Woof! I am ${name}`,
 *     orElse: 'not a dog',
 *   })
 * ) // => 'Woof! I am Fido'
 * ```
 */
export const variant = <T extends VariantInputObject>(
    inp: T
): VariantModule<T, DefaultDiscriminant, DefaultScope> => ({
    ...getVariantCtors(inp, "_tag", ""),
    match: getMatchFn("_tag", ""),
    matchOrElse: getMatchOrElseFn("_tag", ""),
    types: getVariantTypes(inp, ""),
})

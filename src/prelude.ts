// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assertExhaustive = (_: never): never => {
    throw new Error("assertExhaustive failed at runtime!")
}

export type Identity<T> = T extends object
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {} & {
          [P in keyof T]: T[P]
      }
    : T

export type Tagged<Tag extends string, A extends object> = Identity<
    Readonly<
        {
            _tag: Tag
        } & A
    >
>

export interface Predicate<A> {
    (a: A): boolean
}

export interface Refinement<A, B extends A> {
    (a: A): a is B
}

export interface EqualityComparer<A> {
    equals(o1: A, o2: A): boolean
}

export interface OrderingComparer<A> extends EqualityComparer<A> {
    compare(o1: A, o2: A): -1 | 0 | 1
}

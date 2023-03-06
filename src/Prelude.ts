// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assertExhaustive = (_: never): never => {
    throw new Error("assertExhaustive failed at runtime!");
};

export type Identity<T> = T extends object
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {} & {
          [P in keyof T]: T[P];
      }
    : T;

export type Tagged<Tag extends string, A extends object> = Identity<
    Readonly<
        {
            _tag: Tag;
        } & A
    >
>;

export interface Predicate<A> {
    (a: A): boolean;
}

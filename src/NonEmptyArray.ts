export interface NonEmptyArray<A> extends ReadonlyArray<A> {
    0: A;
}

const head = <A>(as: NonEmptyArray<A>) => as[0];

const destruct = <A>(
    as: NonEmptyArray<A>
): {
    readonly head: A;
    readonly tail: readonly A[];
} => ({
    head: as[0],
    tail: as.slice(1),
});

const map =
    <A, B>(f: (a: A) => B) =>
    (as: NonEmptyArray<A>): NonEmptyArray<B> =>
        as.map(f) as unknown as NonEmptyArray<B>;

const bind =
    <A, B>(f: (a: A) => NonEmptyArray<B>) =>
    (as: NonEmptyArray<A>): NonEmptyArray<B> =>
        as.flatMap(f) as unknown as NonEmptyArray<B>;

const singleton = <A>(a: A): NonEmptyArray<A> => [a];

export const NonEmptyArray = {
    head,
    destruct,
    map,
    bind,
    singleton,
};

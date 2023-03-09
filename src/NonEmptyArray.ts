export interface NonEmptyArray<A> extends ReadonlyArray<A> {
    0: A
}

const head = <A>(as: NonEmptyArray<A>) => as[0]

const destruct = <A>(
    as: NonEmptyArray<A>
): {
    readonly head: A
    readonly tail: readonly A[]
} => ({
    head: as[0],
    tail: as.slice(1),
})

const map =
    <A, B>(f: (a: A) => B) =>
    (as: NonEmptyArray<A>): NonEmptyArray<B> =>
        as.map(f) as unknown as NonEmptyArray<B>

const bind =
    <A, B>(f: (a: A) => NonEmptyArray<B>) =>
    (as: NonEmptyArray<A>): NonEmptyArray<B> =>
        as.flatMap(f) as unknown as NonEmptyArray<B>

const singleton = <A>(a: A): NonEmptyArray<A> => [a]

const range = (startInclusive: number, endInclusive: number): NonEmptyArray<number> => {
    const start = Math.floor(startInclusive)
    const end = Math.floor(endInclusive)

    if (start >= end) {
        return [start]
    }

    const out: number[] = []
    for (let i = start; i <= end; i++) {
        out.push(i)
    }
    return out as unknown as NonEmptyArray<number>
}

const make = <A>(length: number, createElement: (i: number) => A): NonEmptyArray<A> => {
    const n = length <= 1 ? 1 : Math.floor(length)
    return [...Array(n).keys()].map(createElement) as unknown as NonEmptyArray<A>
}

const reverse = <A>(as: NonEmptyArray<A>): NonEmptyArray<A> =>
    as.slice(0).reverse as unknown as NonEmptyArray<A>

export const NonEmptyArray = {
    head,
    destruct,
    map,
    bind,
    singleton,
    range,
    make,
    reverse,
}

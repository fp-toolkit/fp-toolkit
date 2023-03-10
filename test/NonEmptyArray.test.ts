import { describe, it, expect } from "vitest"
import { NonEmptyArray } from "../src/NonEmptyArray"
import { pipe } from "../src/composition"
import { String } from "../src/string"

describe("NonEmptyArray", () => {
    describe("head", () => {
        it("returns the first element", () => {
            expect(NonEmptyArray.head([12])).toBe(12)
            expect(NonEmptyArray.head(["a", "b", "c"])).toBe("a")
        })
    })

    describe("destruct", () => {
        it("can destructure a singleton", () => {
            expect(NonEmptyArray.destruct(["a"])).toStrictEqual({
                head: "a",
                tail: [],
            })
        })

        it("can destructure a non-singleton", () => {
            expect(NonEmptyArray.destruct(["a", "b", "c"])).toStrictEqual({
                head: "a",
                tail: ["b", "c"],
            })
        })
    })

    describe("map", () => {
        it("maps", () => {
            expect(
                pipe(
                    [1, 2, 3, 4] as const,
                    NonEmptyArray.map(n => n * 3)
                )
            ).toStrictEqual([3, 6, 9, 12])
        })
    })

    describe("bind", () => {
        it("flatMaps", () => {
            expect(
                pipe(
                    ["a", "ab", "abc", "abcd"] as const,
                    NonEmptyArray.bind(String.split(""))
                )
            ).toStrictEqual(["a", "a", "b", "a", "b", "c", "a", "b", "c", "d"])
        })
    })

    describe("of", () => {
        it("produces a single-element array", () => {
            expect(NonEmptyArray.of("abc")).toStrictEqual(["abc"])
        })
    })

    describe("range", () => {
        it.each([
            [1, 5, [1, 2, 3, 4, 5]],
            [-3, 1, [-3, -2, -1, 0, 1]],
            [0, 0, [0]],
            [1, -20, [1]],
            [4.1142, 11.0034, [4, 5, 6, 7, 8, 9, 10, 11]],
        ])("produces the expected result %i", (start, end, expected) => {
            expect(NonEmptyArray.range(start, end)).toStrictEqual(expected)
        })
    })

    describe("make", () => {
        it("makes", () => {
            expect(NonEmptyArray.make(5, i => `${i + 1}`)).toStrictEqual([
                "1",
                "2",
                "3",
                "4",
                "5",
            ])
        })

        it("normalizes length to a natural number", () => {
            expect(NonEmptyArray.make(-20.11, () => "a")).toStrictEqual(["a"])
        })
    })

    describe("reverse", () => {
        it("reverses", () => {
            expect(NonEmptyArray.reverse([1, 2, 3, 4, 5])).toStrictEqual([5, 4, 3, 2, 1])
        })
    })
})

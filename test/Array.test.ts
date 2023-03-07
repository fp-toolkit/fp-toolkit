import { it, describe, expect } from "vitest"
import { pipe, flow } from "../src/composition"
import { Option } from "../src/Option"
import { Array } from "../src/Array"
import { NonEmptyArray } from "../src/NonEmptyArray"

describe("Array", () => {
    describe("choose", () => {
        it("projects and keeps only the Some results", () => {
            // arrange
            const arr = [32, null, 55, undefined, 89] as const
            // act
            const actual = pipe(
                arr,
                Array.choose(flow(Option.ofNullish, Option.map(String)))
            )
            // assert
            expect(actual).toStrictEqual(["32", "55", "89"])
        })
    })

    describe("take", () => {
        it("keeps only the specificed number of values when the array is longer", () => {
            // arrange
            const arr = [1, 2, 3, 4, 5]
            // act
            const actual = pipe(arr, Array.take(3))
            // assert
            expect(actual).toStrictEqual([1, 2, 3])
        })

        it("keeps all the itmes if the array is shorter", () => {
            // arrange
            const arr = [1, 2]
            // act
            const actual = pipe(arr, Array.take(3))
            // assert
            expect(actual).toStrictEqual(arr)
        })

        it("returns empty if array is empty", () => {
            // act
            const actual = pipe([], Array.take(3))
            // assert
            expect(actual).toStrictEqual([])
        })

        it.each([
            [-1, []],
            [3.22, [1, 2, 3]],
        ])("normalizes count to a natural number", (count, expected) => {
            // act
            const actual = pipe([1, 2, 3, 4, 5], Array.take(count))
            // assert
            expect(actual).toStrictEqual(expected)
        })
    })

    describe("skip", () => {
        it("returns all items after the skipped ones if the array is longer", () => {
            // arrange
            const arr = [1, 2, 3, 4, 5]
            // act
            const actual = pipe(arr, Array.skip(3))
            // asser
            expect(actual).toStrictEqual([4, 5])
        })

        it("returns empty if skip count = array length", () => {
            // arrange
            const arr = [1, 2, 3]
            // act
            const actual = pipe(arr, Array.skip(3))
            // assert
            expect(actual).toStrictEqual([])
        })

        it("returns empty if skip count > array length", () => {
            // arrange
            const arr = [1, 2, 3]
            // act
            const actual = pipe(arr, Array.skip(4))
            // assert
            expect(actual).toStrictEqual([])
        })

        it("returns empty if given empty", () => {
            // act
            const actual = pipe([], Array.skip(3))
            // assert
            expect(actual).toStrictEqual([])
        })

        it.each([
            [-1, [1, 2, 3, 4]],
            [3.22, [4]],
        ])("normalizes count to a natural number", (count, expected) => {
            // act
            const actual = pipe([1, 2, 3, 4], Array.skip(count))
            // assert
            expect(actual).toStrictEqual(expected)
        })
    })

    describe("isEmpty", () => {
        it("returns true when the array is empty", () => {
            expect(Array.isEmpty([])).toBe(true)
        })

        it("returns false when the array is not empty", () => {
            expect(Array.isEmpty([42])).toBe(false)
        })
    })

    describe("isNonEmpty", () => {
        it.each([[[1]], [[1, 2]], [[1, 2, 3]]])(
            "returns true if the array contains at least one element (%i)",
            arr => {
                expect(Array.isNonEmpty(arr)).toBe(true)
            }
        )

        it("returns false if the array is empty", () => {
            expect(Array.isNonEmpty([])).toBe(false)
        })
    })

    describe("bind", () => {
        it("flat maps", () => {
            // arrange
            const dupl = <A>(a: A) => [a, a] as const
            const arr = ["a", "b", "c"]
            // act
            const actual = pipe(arr, Array.bind(dupl))
            // assert
            expect(actual).toStrictEqual(["a", "a", "b", "b", "c", "c"])
        })
    })

    describe("append", () => {
        it.each([
            [[], ["new"]],
            [["old"], ["old", "new"]],
        ])("adds an element to the end of an array (%i)", (arr, expected) => {
            expect(pipe(arr, Array.append("new"))).toStrictEqual(expected)
        })
    })

    describe("prepend", () => {
        it.each([
            [[], ["new"]],
            [["old"], ["new", "old"]],
        ])("adds an element at the beginning", (arr, expected) => {
            expect(pipe(arr, Array.prepend("new"))).toStrictEqual(expected)
        })
    })

    describe("groupBy", () => {
        it("returns an empty map given an empty array", () => {
            expect(Array.groupBy(String)([])).toStrictEqual(new Map())
        })

        it("returns a map of grouped values for a non-empty array", () => {
            // arrange
            const arr = ["horse", "cow", "Cheese", "Hampster", "fox"]
            // act
            const actual = pipe(
                arr,
                Array.groupBy(s => s.toLowerCase()[0])
            )
            // assert
            expect(actual).toStrictEqual(
                new Map([
                    ["h", ["horse", "Hampster"]],
                    ["c", ["cow", "Cheese"]],
                    ["f", ["fox"]],
                ])
            )
        })
    })

    describe("concat", () => {
        it("adds the new values at the end of the partially applied values", () => {
            expect(pipe(["a", "b"], Array.concat(["c", "d"]))).toStrictEqual([
                "a",
                "b",
                "c",
                "d",
            ])
        })

        it("doesn't choke on empty arrays", () => {
            expect(pipe([], Array.concat([]))).toStrictEqual([])
        })
    })

    describe("concatFirst", () => {
        it("adds the new values at the beginning of the partially applied values", () => {
            expect(pipe(["a", "b"], Array.concatFirst(["c", "d"]))).toStrictEqual([
                "c",
                "d",
                "a",
                "b",
            ])
        })

        it("doesn't choke on empty arrays", () => {
            expect(pipe([], Array.concatFirst([]))).toStrictEqual([])
        })
    })

    describe("match", () => {
        it("can match with lambdas", () => {
            // arrange
            const matcher = {
                empty: () => 42,
                nonEmpty: NonEmptyArray.head,
            }
            // act
            const actual1 = pipe([], Array.match(matcher))
            const actual2 = pipe([23, 35], Array.match(matcher))
            // assert
            expect(actual1).toBe(42)
            expect(actual2).toBe(23)
        })

        it("can match with raw values", () => {
            // arrange
            const matcher = {
                empty: 42,
                nonEmpty: 24,
            }
            // act
            const actual1 = pipe([], Array.match(matcher))
            const actual2 = pipe([23, 35], Array.match(matcher))
            // assert
            expect(actual1).toBe(42)
            expect(actual2).toBe(24)
        })

        it("can accepts nullish matcher values", () => {
            // arrange
            const matcher = {
                empty: null,
                nonEmpty: undefined,
            }
            // act
            const actual1 = pipe([], Array.match(matcher))
            const actual2 = pipe([23, 35], Array.match(matcher))
            // assert
            expect(actual1).toBe(null)
            expect(actual2).toBe(undefined)
        })
    })

    describe("head", () => {
        it("returns Some if non-empty", () => {
            expect(Array.head([1, 2])).toStrictEqual(Option.Some(1))
        })

        it("returns None if empty", () => {
            expect(Array.head([])).toStrictEqual(Option.None())
        })
    })

    describe("tail", () => {
        it("returns `Some` with empty if array is singleton", () => {
            expect(Array.tail([1])).toStrictEqual(Option.Some([]))
        })

        it("returns `Some` with the remaining elements if array.length > 1", () => {
            expect(Array.tail([1, 2, 3])).toStrictEqual(Option.Some([2, 3]))
        })

        it("returns `None` if the array is empty", () => {
            expect(Array.tail([])).toStrictEqual(Option.None())
        })
    })
})

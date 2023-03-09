import { it, describe, expect } from "vitest"
import { pipe, flow } from "../src/composition"
import { Option } from "../src/Option"
import { Array } from "../src/Array"
import { NonEmptyArray } from "../src/NonEmptyArray"
import { Result } from "../src/Result"

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

    describe("chooseR", () => {
        it("projects and keeps only the Ok results", () => {
            // arrange
            const arr = [32, null, 55, undefined, 89] as const
            // act
            const actual = pipe(
                arr,
                Array.chooseR(
                    flow(
                        Option.ofNullish,
                        Option.map(String),
                        Result.ofOption(() => "err")
                    )
                )
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
            expect(Array.head([])).toStrictEqual(Option.None)
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
            expect(Array.tail([])).toStrictEqual(Option.None)
        })
    })

    describe("chunk", () => {
        it("returns empty for an empty array", () => {
            expect(Array.chunk(1)([])).toStrictEqual([])
        })

        it("returns even chunks if the array is evenly divisible by the chunk size", () => {
            expect(pipe([1, 2, 3, 4, 5, 6, 7, 8, 9], Array.chunk(3))).toStrictEqual([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
        })

        it("returns uneven chunks if the array is not evenly divisible by the chunk size", () => {
            expect(pipe(["a", "b", "c", "d", "e"], Array.chunk(2))).toStrictEqual([
                ["a", "b"],
                ["c", "d"],
                ["e"],
            ])
        })

        it("works for very large arrays when the array is evenly divisible by the chunk size", () => {
            // act
            const actual = pipe(NonEmptyArray.range(1, 10_000), Array.chunk(40))
            // assert
            expect(actual).toHaveLength(250)
            expect(actual.every(arr => arr.length === 40)).toBe(true)
        })

        it("works for very large arrays when the array is not evenly divisible by the chunk size", () => {
            // act
            const actual = pipe(NonEmptyArray.range(1, 11_111), Array.chunk(27))
            // assert
            expect(actual).toHaveLength(412)
            expect(
                actual.every(
                    (arr, i) =>
                        i === 411
                            ? arr.length === 14 // the last chunk only has 14 elements
                            : arr.length === 27 // all other chunks have exactly 27 elements
                )
            )
        })

        it.each([[-50], [0], [0.1442], [1.77]])(
            "normalizes the chunk size (%o) to a natural number",
            size => {
                expect(pipe([1, 2, 3], Array.chunk(size))).toStrictEqual([[1], [2], [3]])
            }
        )

        it.each([[1], [20], [100]])(
            "works for a singleton regardless of chunk size (%o)",
            size => {
                expect(pipe([1], Array.chunk(size))).toStrictEqual([[1]])
            }
        )
    })

    describe("contains", () => {
        it("returns true if the element is in the array (using default === equality)", () => {
            expect(pipe([1, 2, 3, 4], Array.contains(2))).toBe(true)
        })

        it("returns false if the element is not in the array (using default === equality)", () => {
            expect(pipe([1, 2, 3, 4], Array.contains(5))).toBe(false)
        })

        it(
            "returns false if a structurally equivalent element is in the array, " +
                "but is not reference equal (using default === equality)",
            () => {
                // arrange
                const as = [{ name: "john" }, { name: "jingleheimer" }, { name: "smith" }]
                // act
                const actual = Array.contains({ name: "john" })(as)
                // assert
                expect(actual).toBe(false)
            }
        )

        it("returns true if the element is in the array (using EqualityComparer)", () => {
            // arrange
            type Person = { name: string }
            const as = [{ name: "john" }, { name: "jingleheimer" }, { name: "smith" }]
            const equalityComparer = {
                equals: ({ name: name1 }: Person, { name: name2 }: Person) =>
                    name1 === name2,
            }
            // act
            const actual = Array.contains({ name: "smith" }, equalityComparer)(as)
            // assert
            expect(actual).toBe(true)
        })

        it("returns false if the element is not in the array (using EqualityComparer)", () => {
            // arrange
            type Person = { name: string }
            const as = [{ name: "john" }, { name: "jingleheimer" }, { name: "smith" }]
            const equalityComparer = {
                equals: ({ name: name1 }: Person, { name: name2 }: Person) =>
                    name1 === name2,
            }
            // act
            const actual = Array.contains({ name: "joe" }, equalityComparer)(as)
            // assert
            expect(actual).toBe(false)
        })
    })

    describe("length", () => {
        it.each([
            [[], 0],
            [[1, 2], 2],
            [["a", "b", "c", "d"], 4],
        ])(
            "returns the length of the array",
            (arr: readonly (string | number)[], expected) => {
                expect(Array.length(arr)).toBe(expected)
            }
        )
    })

    describe("uniq", () => {
        it("returns empty for an empty array", () => {
            expect(Array.uniq()([])).toStrictEqual([])
        })

        it("returns unique values (using default triple equals equality)", () => {
            expect(
                pipe(
                    ["a", "b", "b", "a", "c", "d", "e", "e", "e", "a", "z"],
                    Array.uniq()
                )
            ).toStrictEqual(["a", "b", "c", "d", "e", "z"])
        })

        it("does not work for objects without an equality comparer", () => {
            expect(
                pipe(
                    [{ name: "John" }, { name: "John" }, { name: "Larry" }],
                    Array.uniq()
                )
            ).toStrictEqual([{ name: "John" }, { name: "John" }, { name: "Larry" }])
        })

        it("returns uniq elements using the equality comparer if given", () => {
            // arrange
            type Person = { name: string }
            const people = [
                { name: "John" },
                { name: "John" },
                { name: "Larry" },
                { name: "Jeff" },
                { name: "Larry" },
            ]

            const equalityComparer = {
                equals: ({ name: name1 }: Person, { name: name2 }: Person) =>
                    name1 === name2,
            }
            // act
            const actual = Array.uniq(equalityComparer)(people)
            // assert
            expect(actual).toStrictEqual([
                { name: "John" },
                { name: "Larry" },
                { name: "Jeff" },
            ])
        })
    })

    describe("find", () => {
        it("returns Some(first elem) if the element exists", () => {
            expect(
                pipe(
                    [1, 2, 3, 4, 5],
                    Array.find(n => n % 2 === 0)
                )
            ).toStrictEqual(Option.Some(2))
        })

        it("returns None if the element does not exist", () => {
            expect(
                pipe(
                    [1, 2, 3, 4, 5],
                    Array.find(n => n < 0)
                )
            ).toStrictEqual(Option.None)
        })
    })

    describe("findIndex", () => {
        it("returns Some(first index) if the element exists", () => {
            expect(
                pipe(
                    [1, 2, 3, 4, 5],
                    Array.findIndex(n => n % 2 === 0)
                )
            ).toStrictEqual(Option.Some(1))
        })

        it("returns None if the element does not exist", () => {
            expect(
                pipe(
                    [1, 2, 3, 4, 5],
                    Array.find(n => n < 0)
                )
            ).toStrictEqual(Option.None)
        })
    })

    describe("reverse", () => {
        it("returns a new, reversed array", () => {
            // arrange
            const arr = ["a", "b", "c", "d"]
            // act
            const actual = Array.reverse(arr)
            // assert
            expect(actual).toStrictEqual(["d", "c", "b", "a"])
            expect(actual).not.toBe(arr)
        })
    })

    describe("exists", () => {
        it("returns true if an element satisfies the predicate", () => {
            expect(
                pipe(
                    [1, 5, 10, 15],
                    Array.exists(n => n > 10)
                )
            ).toBe(true)
        })

        it("returns false if no element satisfies the predicate", () => {
            expect(
                pipe(
                    [1, 5, 10, 15],
                    Array.exists(n => n < 1)
                )
            ).toBe(false)
        })
    })

    describe("flatten", () => {
        it("flattens a nested array", () => {
            expect(pipe([[1, 2], [3, 4], [5], [6], []], Array.flatten)).toStrictEqual([
                1, 2, 3, 4, 5, 6,
            ])
        })
    })
})

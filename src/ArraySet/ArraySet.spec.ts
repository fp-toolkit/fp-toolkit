import { describe, expect, expectTypeOf, it } from "vitest"
import { ArraySet } from "../ArraySet"
import type { EqualityComparer } from "../EqualityComparer"
import { pipe } from "../Composition"

const caseInsensitiveEqualityComparer: EqualityComparer<string> = {
    equals: (s1, s2) => s1.toLowerCase() === s2.toLowerCase(),
}

describe("ArraySet", () => {
    describe("empty", () => {
        it("returns an empty array", () => {
            expect(ArraySet.empty()).toStrictEqual([])
        })

        it("returns an ArraySet", () => {
            expectTypeOf(ArraySet.empty<string>()).toEqualTypeOf<
                ArraySet<string>
            >()
        })
    })

    describe("isArraySet", () => {
        it.each([
            {
                scenario: "default equality",
                equalityComparer: undefined,
                array: ["Bird", "Dog"],
            },
            {
                scenario: "custom equality",
                equalityComparer: caseInsensitiveEqualityComparer,
                array: ["Bird", "Dog"],
            },
        ])(
            "returns true if an array contains only unique elements for $scenario",
            ({ equalityComparer, array }) => {
                expect(ArraySet.isArraySet(array, equalityComparer)).toBe(true)
            }
        )

        it.each([
            {
                scenario: "default equality",
                equalityComparer: undefined,
                array: ["Bird", "Bird"],
            },
            {
                scenario: "custom equality",
                equalityComparer: caseInsensitiveEqualityComparer,
                array: ["Bird", "bird"],
            },
        ])(
            "returns false if an array does not contain only unique elements for $scenario",
            ({ equalityComparer, array }) => {
                expect(ArraySet.isArraySet(array, equalityComparer)).toBe(false)
            }
        )
    })

    describe("add", () => {
        it("returns an ArraySet", () => {
            expectTypeOf(
                pipe(ArraySet.empty<number>(), ArraySet.add(3))
            ).toEqualTypeOf<ArraySet<number>>()
        })

        describe("default equality comparer", () => {
            it("adds a unique item to the set", () => {
                expect(
                    pipe(ArraySet.of([1, 2, 3]), ArraySet.add(4))
                ).toStrictEqual([4, 1, 2, 3])
            })

            it("does not add a non-unique item to the set", () => {
                expect(
                    pipe(ArraySet.of([1, 2, 3]), ArraySet.add(3))
                ).toStrictEqual([1, 2, 3])
            })
        })

        describe("custom equality comparer", () => {
            it("adds a unique item to the set", () => {
                expect(
                    pipe(
                        ArraySet.of(["A", "B", "C"]),
                        ArraySet.add("d", caseInsensitiveEqualityComparer)
                    )
                ).toStrictEqual(["d", "A", "B", "C"])
            })

            it("does not add a non-unique item to the set", () => {
                expect(
                    pipe(
                        ArraySet.of(["A", "B", "C"]),
                        ArraySet.add("c", caseInsensitiveEqualityComparer)
                    )
                ).toStrictEqual(["A", "B", "C"])
            })
        })
    })

    describe("remove", () => {
        it("returns an ArraySet", () => {
            expectTypeOf(
                pipe(ArraySet.empty<number>(), ArraySet.remove(1))
            ).toEqualTypeOf<ArraySet<number>>()
        })

        describe("default equality comparer", () => {
            it("removes an existing element from the set", () => {
                expect(
                    pipe(ArraySet.of([1, 2, 3]), ArraySet.remove(1))
                ).toStrictEqual([2, 3])
            })

            it("does not remove a non-extant element from the set", () => {
                expect(
                    pipe(ArraySet.of([1, 2, 3]), ArraySet.remove(4))
                ).toStrictEqual([1, 2, 3])
            })
        })

        describe("custom equality comparer", () => {
            it("removes an existing element from the set", () => {
                expect(
                    pipe(
                        ArraySet.of(["A", "B", "C"]),
                        ArraySet.remove("b", caseInsensitiveEqualityComparer)
                    )
                ).toStrictEqual(["A", "C"])
            })

            it("does not remove a non-extant element from the set", () => {
                expect(
                    pipe(
                        ArraySet.of(["A", "B", "C"]),
                        ArraySet.remove("D", caseInsensitiveEqualityComparer)
                    )
                ).toStrictEqual(["A", "B", "C"])
            })
        })
    })

    describe("ofArray", () => {
        it("returns an ArraySet", () => {
            expectTypeOf(ArraySet.ofArray(["blah"])).toEqualTypeOf<
                ArraySet<string>
            >()
        })

        it("returns an array with duplicates removed (default equality)", () => {
            expect(ArraySet.of([1, 3, 1, 3, 5, 6, 7, 4, 4])).toStrictEqual([
                1, 3, 5, 6, 7, 4,
            ])
        })

        it("returns an array with duplicates removed (custom equality)", () => {
            expect(
                ArraySet.ofArray(
                    ["A", "D", "d", "A", "E", "f", "F"],
                    caseInsensitiveEqualityComparer
                )
            ).toStrictEqual(["A", "D", "E", "f"])
        })
    })

    describe("union", () => {
        it("returns an ArraySet", () => {
            expectTypeOf(
                pipe(ArraySet.empty<string>(), ArraySet.union(ArraySet.empty()))
            ).toEqualTypeOf<ArraySet<string>>()
        })

        describe("default equality", () => {
            it("produces a set union", () => {
                expect(
                    pipe(
                        ArraySet.of([1, 2, 3]),
                        ArraySet.union(ArraySet.of([2, 3, 4]))
                    )
                ).toStrictEqual([1, 2, 3, 4])
            })
        })

        describe("custom equality", () => {
            it("produces a set union", () => {
                expect(
                    pipe(
                        ArraySet.of(["A", "B", "C", "D"]),
                        ArraySet.union(
                            ArraySet.of(["c", "d", "e"]),
                            caseInsensitiveEqualityComparer
                        )
                    )
                ).toStrictEqual(["A", "B", "C", "D", "e"])
            })
        })
    })

    describe("intersect", () => {
        it("returns an ArraySet", () => {
            expectTypeOf(
                pipe(
                    ArraySet.empty<string>(),
                    ArraySet.intersect(ArraySet.empty())
                )
            ).toEqualTypeOf<ArraySet<string>>()
        })

        describe("default equality", () => {
            it("produces a set intersection", () => {
                expect(
                    pipe(
                        ArraySet.of([1, 2, 3, 4, 5]),
                        ArraySet.intersect(ArraySet.of([2, 4, 6]))
                    )
                ).toStrictEqual([2, 4])
            })
        })

        describe("custom equality", () => {
            it("produces a set intersection (set2 is smaller than set1)", () => {
                expect(
                    pipe(
                        ArraySet.of(["A", "b", "C", "d", "E"]),
                        ArraySet.intersect(
                            ArraySet.of(["c", "e", "B", "X"]),
                            caseInsensitiveEqualityComparer
                        )
                    )
                ).toMatchInlineSnapshot(`
                  [
                    "B",
                    "c",
                    "e",
                  ]
                `)
            })

            it("produces a set intersection (set1 is smaller than set2)", () => {
                expect(
                    pipe(
                        ArraySet.of(["c", "e", "B", "X", "Y", "Z", "W"]),
                        ArraySet.intersect(
                            ArraySet.of(["A", "b", "C", "d", "E"]),
                            caseInsensitiveEqualityComparer
                        )
                    )
                ).toMatchInlineSnapshot(`
                  [
                    "C",
                    "E",
                    "b",
                  ]
                `)
            })
        })
    })

    describe("except", () => {
        it("returns an ArraySet", () => {
            expectTypeOf(
                pipe(ArraySet.empty<number>(), ArraySet.except([1]))
            ).toEqualTypeOf<ArraySet<number>>()
        })

        it("returns empty if the given set is empty", () => {
            expect(
                pipe(ArraySet.of([]), ArraySet.except(ArraySet.of([1, 2, 3])))
            ).toStrictEqual([])
        })

        it("returns the given array if the excluded elements is empty", () => {
            expect(
                pipe(ArraySet.of([1, 2, 3]), ArraySet.except(ArraySet.empty()))
            ).toStrictEqual([1, 2, 3])
        })

        it("returns an ArraySet with excluded elements", () => {
            expect(
                pipe(
                    ArraySet.of([1, 3, 3, 5, 6, 7, 9, 11]),
                    ArraySet.except(ArraySet.of([5, 9, 11, 9]))
                )
            ).toStrictEqual([1, 3, 6, 7])
        })
    })

    describe("getEqualityComparer", () => {
        describe("returns an equality comparer that", () => {
            const { equals } = ArraySet.getEqualityComparer(
                caseInsensitiveEqualityComparer
            )

            it("returns true for two empty sets", () => {
                expect(equals(ArraySet.empty(), ArraySet.empty())).toBe(true)
            })

            it("returns false for sets of differing sizes", () => {
                expect(equals(ArraySet.of([""]), ArraySet.of([]))).toBe(false)
                expect(equals(ArraySet.empty(), ArraySet.of([""]))).toBe(false)
            })

            it("returns false for sets with different elements", () => {
                expect(
                    equals(ArraySet.of(["A", "B"]), ArraySet.of(["B"]))
                ).toBe(false)
                expect(
                    equals(ArraySet.of(["B"]), ArraySet.of(["A", "B"]))
                ).toBe(false)
            })

            it("returns true for sets with the same elements (regardless of order)", () => {
                expect(
                    equals(ArraySet.of(["A", "B"]), ArraySet.of(["B", "a"]))
                ).toBe(true)
                expect(
                    equals(ArraySet.of(["b", "A"]), ArraySet.of(["B", "a"]))
                ).toBe(true)
            })
        })
    })
})

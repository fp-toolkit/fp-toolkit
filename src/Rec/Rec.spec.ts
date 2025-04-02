import { describe, expect, expectTypeOf, it, vi } from "vitest"
import { Rec } from "../Rec"
import { EqualityComparer } from "../EqualityComparer"
import { OrderingComparer } from "../OrderingComparer"
import { pipe } from "../Composition"
import { Option } from "../Option"
import { String } from "../String"

const caseInsensitiveEqualityComparer: EqualityComparer<string> = {
    equals: (s1, s2) => s1.toLowerCase() === s2.toLowerCase(),
}

const byLengthDescComparer: OrderingComparer<string> = {
    compare: (s1, s2) =>
        s1.length > s2.length ? -1 : s2.length > s1.length ? 1 : 0,
}

const numberDesc = OrderingComparer.reverse(OrderingComparer.Number)

describe("Rec", () => {
    describe("set", () => {
        it("sets a new key/value on an empty record", () => {
            expect(
                pipe(Rec.empty<string, number>(), Rec.set(["Albus", 12]))
            ).toStrictEqual({ Albus: 12 })
        })

        it("sets a new key/value on a non-empty record without the same key using default equality", () => {
            expect(
                pipe(
                    { Fido: 44 } as Rec<string, number>,
                    Rec.set(["Albus", 12])
                )
            ).toStrictEqual({ Fido: 44, Albus: 12 })
        })

        it("overrides a key/value to a non-empty record with the same key using default equality", () => {
            expect(pipe({ Fido: 44 }, Rec.set(["Fido", 12]))).toStrictEqual({
                Fido: 12,
            })
        })

        it("sets a new key/value on a non-empty record without the same key using custom equality", () => {
            expect(
                pipe(
                    { Gouda: "AAA" } as Rec<string, string>,
                    Rec.set(["Cheddar", "C"], caseInsensitiveEqualityComparer)
                )
            ).toStrictEqual({ Gouda: "AAA", Cheddar: "C" })
        })

        it("overrides a new key/value on a non-empty record with the same key using custom equality", () => {
            expect(
                pipe(
                    { Gouda: "AA" } as Rec<string, string>,
                    Rec.set(["gouda", "B"], caseInsensitiveEqualityComparer)
                )
            ).toStrictEqual({ Gouda: "B" })
        })
    })

    describe("findWithKey", () => {
        it("returns None if the record is empty", () => {
            expect(
                pipe(Rec.empty<string>(), Rec.findWithKey("Abby"))
            ).toStrictEqual(Option.none)
        })

        it("returns None if the key is not in the record (using default equality)", () => {
            expect(
                pipe(
                    { Jared: 25 } as Rec<string, number>,
                    Rec.findWithKey("Fubo")
                )
            ).toStrictEqual(Option.none)
        })

        it("returns None if the key was manually bound to a nullish value", () => {
            expect(
                pipe(
                    { Jared: undefined } as Rec<string, number>,
                    Rec.findWithKey("Jared")
                )
            ).toStrictEqual(Option.none)
        })

        it("returns Some if the key is in the record (using default equality)", () => {
            expect(
                pipe(
                    Rec.empty<string, number>(),
                    Rec.set(["Jared", 25]),
                    Rec.findWithKey("Jared")
                )
            ).toStrictEqual(Option.some(["Jared", 25]))
        })

        it("returns None if the key is not in the record (using custom equality)", () => {
            expect(
                pipe(
                    Rec.empty<string, number>(),
                    Rec.set(["Muenster", 25]),
                    Rec.findWithKey("gouda", caseInsensitiveEqualityComparer)
                )
            ).toStrictEqual(Option.none)
        })

        it("returns Some if the key is in the record (using custom equality)", () => {
            expect(
                pipe(
                    Rec.empty<string, number>(),
                    Rec.set(["Muenster", 25]),
                    Rec.findWithKey("muensteR", caseInsensitiveEqualityComparer)
                )
            ).toStrictEqual(Option.some(["Muenster", 25]))
        })
    })

    describe("containsKey", () => {
        it.each([
            [true, "e", "in"],
            [false, "f", "not in"],
        ])(
            "returns %o if the key (%s) is %s the record (default equality)",
            (expected, letter) => {
                const letterCounts: Rec<string, number> = Rec.ofArray([
                    ["a", 21],
                    ["e", 17],
                ])
                expect(pipe(letterCounts, Rec.containsKey(letter))).toBe(
                    expected
                )
            }
        )

        it("ignores undefined keys", () => {
            expect(pipe({ Foobar: undefined }, Rec.containsKey("Foobar"))).toBe(
                false
            )
        })

        it.each([
            [true, "PROvolone", "in"],
            [false, "Brie", "not in"],
        ])(
            "returns %o if the key (%s) is %s the record (custom equality)",
            (expected, key) => {
                const cheeseRankings: Rec<string, string> = Rec.ofArray([
                    ["Provolone", "A+"],
                    ["Cheddar", "B-"],
                ])
                expect(
                    pipe(
                        cheeseRankings,
                        Rec.containsKey(key, caseInsensitiveEqualityComparer)
                    )
                ).toBe(expected)
            }
        )
    })

    describe("find", () => {
        it.each([
            [Option.some(17), "e", "in"],
            [Option.none, "f", "not in"],
        ])(
            "returns the value (%o) if the key (%s) is %s the record (default equality)",
            (expected, letter) => {
                const letterCounts: Rec<string, number> = Rec.ofArray([
                    ["a", 21],
                    ["e", 17],
                ])
                expect(pipe(letterCounts, Rec.find(letter))).toStrictEqual(
                    expected
                )
            }
        )

        it("ignores undefined keys", () => {
            expect(pipe({ Foobar: undefined }, Rec.find("Foobar"))).toBe(
                Option.none
            )
        })

        it.each([
            [Option.some("A+"), "Provolone", "in"],
            [Option.none, "Brie", "not in"],
        ])(
            "returns the value (%o) if the key (%s) is %s the record (custom equality)",
            (expected, key) => {
                const cheeseRankings: Rec<string, string> = Rec.ofArray([
                    ["Provolone", "A+"],
                    ["Cheddar", "B-"],
                ])
                expect(
                    pipe(
                        cheeseRankings,
                        Rec.find(key, caseInsensitiveEqualityComparer)
                    )
                ).toStrictEqual(expected)
            }
        )
    })

    describe("map", () => {
        it("returns an empty record if given an empty record", () => {
            expect(
                pipe(
                    Rec.empty(),
                    Rec.map(() => 0)
                )
            ).toStrictEqual(Rec.empty())
        })

        it("ignores keys that were manually set to undefined", () => {
            expect(
                pipe(
                    {
                        Bogie: 1,
                        Par: 0,
                        Birdie: -1,
                        Eagle: undefined,
                    },
                    Rec.map((_, v) => v)
                )
            ).toStrictEqual({
                Bogie: 1,
                Par: 0,
                Birdie: -1,
            })
        })

        it("returns a new record containing mapped values", () => {
            expect(
                pipe(
                    { John: 23, George: 8, Jimmy: 88 },
                    Rec.map((name, age) => `${name}:${age - 3}`)
                )
            ).toStrictEqual({
                John: "John:20",
                George: "George:5",
                Jimmy: "Jimmy:85",
            })
        })
    })

    describe("findKey", () => {
        it("returns None for an empty record", () => {
            expect(
                pipe(
                    Rec.empty(),
                    Rec.findKey((n: number) => n === 20)
                )
            ).toBe(Option.none)
        })

        it("ignores keys with manually-set undefined bindings", () => {
            expect(
                pipe(
                    { a: undefined },
                    Rec.findKey(() => true)
                )
            ).toBe(Option.none)
        })

        it("returns the first key for which the predicate returns true (default sort)", () => {
            expect(
                pipe(
                    { b: 2, d: 4, a: 1, c: 3 },
                    Rec.findKey(s => s.length === 1)
                )
            ).toStrictEqual(Option.some("a"))
        })

        it("returns None if no key matches the predicate (default sort)", () => {
            expect(
                pipe(
                    { b: 2, d: 4, a: 1, c: 3 },
                    Rec.findKey(s => s.length === 2)
                )
            ).toStrictEqual(Option.none)
        })

        it("returns the first key for which the predicate returns true (custom sort)", () => {
            expect(
                pipe(
                    {
                        Mozzarella: 1,
                        Provolone: 2,
                        " Provolone ": 4,
                        Cheddar: 3,
                    },
                    Rec.findKey(
                        s => s.trim().toLowerCase() === "provolone",
                        byLengthDescComparer
                    )
                )
            ).toStrictEqual(Option.some(" Provolone "))
        })

        it("returns None if no key matches the predicate (custom sort)", () => {
            expect(
                pipe(
                    {
                        Mozzarella: 1,
                        Provolone: 2,
                        " Provolone ": 4,
                        Cheddar: 3,
                    },
                    Rec.findKey(
                        s => s.trim().toLowerCase() === "muenster",
                        byLengthDescComparer
                    )
                )
            ).toStrictEqual(Option.none)
        })
    })

    describe("empty", () => {
        it("returns an empty record", () => {
            expect(Rec.empty()).toStrictEqual({})
        })
    })

    describe("exists", () => {
        it("returns false for an empty record", () => {
            expect(
                pipe(
                    Rec.empty(),
                    Rec.exists(() => true)
                )
            ).toBe(false)
        })

        it("ignores object keys with manually-set undefined bindings", () => {
            expect(
                pipe(
                    { a: undefined },
                    Rec.exists(() => true)
                )
            ).toBe(false)
        })

        it("returns false if no value in the record matches the predicate", () => {
            expect(
                pipe(
                    { Cat: 1, Dog: 3, Mouse: 0 },
                    Rec.exists(n => n < 0)
                )
            ).toBe(false)
        })

        it("returns true if at least one value in the record matches the predicate", () => {
            expect(
                pipe(
                    { Cat: 1, Dog: 3, Mouse: 0 },
                    Rec.exists(n => n > 2)
                )
            ).toBe(true)
        })
    })

    describe("change", () => {
        it("treats object keys that are manually set to undefined as non-extant", () => {
            expect(
                pipe(
                    { a: undefined },
                    Rec.change("a", () => 100)
                )
            ).toStrictEqual({ a: undefined })
        })

        describe("default equality", () => {
            it("returns the record unchanged if the key doesn't exist", () => {
                expect(
                    pipe(
                        { Cat: 1, Dog: 2 } as Rec<string, number>,
                        Rec.change("Mouse", n => n + 1)
                    )
                ).toStrictEqual({ Cat: 1, Dog: 2 })
            })

            it("returns the record with changed binding if the key does exist", () => {
                expect(
                    pipe(
                        { Cat: 1, Dog: 2 },
                        Rec.change("Dog", n => n + 1)
                    )
                ).toStrictEqual({ Cat: 1, Dog: 3 })
            })
        })

        describe("custom equality", () => {
            it("returns the record unchanged if the key doesn't exist", () => {
                expect(
                    pipe(
                        { Cheddar: 1, Mozzarella: 2 } as Rec<string, number>,
                        Rec.change(
                            "Provolone",
                            n => n + 1,
                            caseInsensitiveEqualityComparer
                        )
                    )
                ).toStrictEqual({ Cheddar: 1, Mozzarella: 2 })
            })

            it("returns the record with changed binding if the key does exist", () => {
                expect(
                    pipe(
                        { Cheddar: 1, Mozzarella: 2 } as Rec<string, number>,
                        Rec.change(
                            "cheddaR",
                            n => n + 1,
                            caseInsensitiveEqualityComparer
                        )
                    )
                ).toStrictEqual({ Cheddar: 2, Mozzarella: 2 })
            })
        })
    })

    describe("remove", () => {
        it("does not ignore object keys that were manually set to undefined", () => {
            expect(pipe({ a: undefined }, Rec.remove("a"))).toStrictEqual({})
        })

        it("removes the key from the record (default equality)", () => {
            expect(
                pipe(
                    {
                        DinJarin: 10,
                        Meredith: 20,
                        Grogu: 9001,
                    },
                    Rec.remove("Meredith")
                )
            ).toStrictEqual({
                DinJarin: 10,
                Grogu: 9001,
            })
        })

        it("doesn't change the record if the key doesn't exist (default equality)", () => {
            expect(
                pipe(
                    {
                        DinJarin: 10,
                        Grogu: 9001,
                    } as Rec<string, number>,
                    Rec.remove("Jimmy")
                )
            ).toStrictEqual({
                DinJarin: 10,
                Grogu: 9001,
            })
        })

        it("removes the key from the record (custom equality)", () => {
            expect(
                pipe(
                    { American: 0, Provolone: 23, "Sharp Cheddar": 12 } as Rec<
                        string,
                        number
                    >,
                    Rec.remove("prOvOlOne", caseInsensitiveEqualityComparer)
                )
            ).toStrictEqual({ American: 0, "Sharp Cheddar": 12 })
        })

        it("doesn't change the record if the key doesn't exist (custom equality)", () => {
            expect(
                pipe(
                    { American: 0, "Sharp Cheddar": 12 } as Rec<string, number>,
                    Rec.remove("prOvOlOne", caseInsensitiveEqualityComparer)
                )
            ).toStrictEqual({ American: 0, "Sharp Cheddar": 12 })
        })
    })

    describe("iter", () => {
        it("never calls the given function for an empty record", () => {
            const fn = vi.fn()
            pipe(Rec.empty(), Rec.iter(fn))
            expect(fn).not.toHaveBeenCalled()
        })

        it("ignores object keys that were manually set to undefined", () => {
            // arrange
            const fn = vi.fn()
            // act
            pipe({ a: undefined, b: undefined, c: 50 }, Rec.iter(fn))
            // assert
            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith("c", 50)
        })

        it("executes the given function for every key/value pair", () => {
            // arrange
            const fn = vi.fn()
            // act
            pipe(
                {
                    "red team": 44,
                    "blue team": 48,
                    "green team": 13,
                },
                Rec.iter(fn)
            )
            // assert
            expect(fn).toHaveBeenCalledTimes(3)
            ;(
                [
                    ["red team", 44],
                    ["blue team", 48],
                    ["green team", 13],
                ] as const
            ).forEach(([k, v]) => expect(fn).toHaveBeenCalledWith(k, v))
        })
    })

    describe("isEmpty", () => {
        it.each([
            [true, "is empty", []],
            [
                false,
                "is not empty",
                [
                    ["key1", "val1"],
                    ["key2", "val2"],
                ],
            ],
            [
                true,
                "only has undefined keys",
                [["key1", undefined as unknown as string]],
            ],
        ] as const)("returns %o if the record %s", (expected, _, bindings) => {
            expect(pipe(Rec.ofArray(bindings), Rec.isEmpty)).toBe(expected)
        })
    })

    describe("size", () => {
        it.each([
            [0, []],
            [1, [["dog", 1]]],
            [
                3,
                [
                    ["dog", 1],
                    ["cat", 2],
                    ["mouse", 3],
                ],
            ],
        ] as const)(
            "returns the size (%i) of the record",
            (expected, bindings) => {
                expect(pipe(Rec.ofArray(bindings), Rec.size)).toBe(expected)
            }
        )

        it("does not count object keys that are manually set to undefined", () => {
            expect(pipe({ a: undefined, b: undefined, c: 100 }, Rec.size)).toBe(
                1
            )
        })
    })

    describe("keys", () => {
        it("ignores object keys with undefined values", () => {
            expect(
                pipe({ a: undefined, b: undefined, c: 100, d: 1 }, Rec.keys())
            ).toStrictEqual(["c", "d"])
        })

        it.each([
            ["empty", [], []],
            [
                "non-empty",
                [
                    ["Johnny", 1],
                    ["Amy", 2],
                    ["Leonard", 3],
                ],
                ["Amy", "Johnny", "Leonard"],
            ],
        ] as const)(
            "returns the keys in the expected order when the record is %s (default comparison)",
            (_, bindings, expected) => {
                expect(pipe(Rec.ofArray(bindings), Rec.keys())).toStrictEqual(
                    expected
                )
            }
        )

        it.each([
            ["empty", [], []],
            [
                "non-empty",
                [
                    ["Muenster", "A+"],
                    ["Cheddar", "B"],
                    ["Kraft Single", "F-"],
                ],
                ["Kraft Single", "Muenster", "Cheddar"],
            ],
        ] as const)(
            "returns the keys in the expected order when the record is %s (custom comparison)",
            (_, bindings, expected) => {
                expect(
                    pipe(Rec.ofArray(bindings), Rec.keys(byLengthDescComparer))
                ).toStrictEqual(expected)
            }
        )
    })

    describe("values", () => {
        it("ignores object entries with undefined values", () => {
            expect(
                pipe({ a: undefined, b: undefined, c: 100, d: 1 }, Rec.values())
            ).toStrictEqual([1, 100])
        })

        it.each([
            ["empty", [], []],
            [
                "non-empty",
                [
                    ["Johnny", 2],
                    ["Amy", 3],
                    ["Leonard", 1],
                ],
                [1, 2, 3],
            ],
        ] as const)(
            "returns the values in the expected order (including duplicates) when the record is %s (default comparison)",
            (_, bindings, expected) => {
                expect(pipe(Rec.ofArray(bindings), Rec.values())).toStrictEqual(
                    expected
                )
            }
        )

        it.each([
            ["empty", [], []],
            [
                "non-empty",
                [
                    ["$", 1],
                    ["_", 2],
                    ["!", 3],
                ],
                [3, 2, 1],
            ],
        ] as const)(
            "returns the values in the expected order (including duplicates) when the record is %s (custom comparison)",
            (_, bindings, expected) => {
                expect(
                    pipe(
                        Rec.ofArray<string, number>(bindings),
                        Rec.values(numberDesc)
                    )
                ).toStrictEqual(expected)
            }
        )
    })

    describe("toArray", () => {
        it("returns an empty array for an empty record", () => {
            expect(pipe(Rec.empty(), Rec.toArray())).toStrictEqual([])
        })

        it("ignores object entries with undefined values", () => {
            expect(
                pipe({ b: 2, d: undefined, c: 3, a: undefined }, Rec.toArray())
            ).toStrictEqual([
                ["b", 2],
                ["c", 3],
            ])
        })

        it("returns an array of tuples sorted by key (default comparison)", () => {
            expect(
                pipe({ b: 2, d: 4, c: 3, a: 1 }, Rec.toArray())
            ).toStrictEqual([
                ["a", 1],
                ["b", 2],
                ["c", 3],
                ["d", 4],
            ])
        })

        it("returns an array of tuples sorted by key (custom comparison)", () => {
            expect(
                pipe(
                    { Gouda: 2, Mozzarella: 4, Garganzolaaaaaa: 3, Cheddar: 1 },
                    Rec.toArray(byLengthDescComparer)
                )
            ).toStrictEqual([
                ["Garganzolaaaaaa", 3],
                ["Mozzarella", 4],
                ["Cheddar", 1],
                ["Gouda", 2],
            ])
        })
    })

    describe("filter", () => {
        it("returns an empty record if given an empty record", () => {
            expect(
                pipe(
                    Rec.empty(),
                    Rec.filter(() => true)
                )
            ).toStrictEqual(Rec.empty())
        })

        it("ignores object entries with undefined values", () => {
            expect(
                pipe(
                    { a: undefined, b: undefined },
                    Rec.filter(() => false)
                )
            ).toStrictEqual({ a: undefined, b: undefined })
        })

        it("filters out keys that fail the predicate", () => {
            expect(
                pipe(
                    {
                        cheese: "yum",
                        soup: "yum",
                        veggies: "bleh",
                        crackers: "yum",
                        "lima beans": "bleh",
                    },
                    Rec.filter((_, v) => v === "yum")
                )
            ).toStrictEqual({ cheese: "yum", soup: "yum", crackers: "yum" })
        })
    })

    describe("every", () => {
        it("returns true for an empty record", () => {
            expect(
                pipe(
                    Rec.empty(),
                    Rec.every(() => false)
                )
            ).toBe(true)
        })

        it("ignores object entries with undefined values", () => {
            expect(
                pipe(
                    { a: 1, b: undefined },
                    Rec.every((_, v) => v === 1)
                )
            ).toBe(true)
        })

        it("returns true if every key/value pair holds true", () => {
            expect(
                pipe(
                    {
                        John: "Hancock",
                        James: "Monroe",
                        Alexander: "Hamilton",
                    },
                    Rec.every(
                        (first, last) => first.length > 0 && last.length > 0
                    )
                )
            ).toBe(true)
        })

        it("returns false if not every key/value pair holds true", () => {
            expect(
                pipe(
                    {
                        John: "",
                        James: "Monroe",
                        Alexander: "Hamilton",
                    },
                    Rec.every(
                        (first, last) => first.length > 0 && last.length > 0
                    )
                )
            ).toBe(false)
        })
    })

    describe("reduce", () => {
        it("reduces using default sort order", () => {
            expect(
                pipe(
                    { a: 1, b: 2, c: 3 },
                    Rec.reduce("", (acc, k, v) => `${acc}${k}${v}`)
                )
            ).toBe("a1b2c3")
        })

        it("ignores object entries with undefined values", () => {
            expect(
                pipe(
                    { a: undefined, b: undefined, c: 3, d: 4 },
                    Rec.reduce("", (acc, k, v) => `${acc}${k}${v}`)
                )
            ).toBe("c3d4")
        })

        it("reduces using custom sort order", () => {
            expect(
                pipe(
                    { a: "Parm", aa: "Goodie", aaa: "Weird Swiss" },
                    Rec.reduce(
                        "",
                        (acc, k, v) => `${acc}\n${k}-${v}`,
                        byLengthDescComparer
                    ),
                    String.trim
                )
            ).toMatchInlineSnapshot(`
        "aaa-Weird Swiss
        aa-Goodie
        a-Parm"
      `)
        })
    })

    describe("reduceRight", () => {
        it("reduces in reverse order, using default sort order", () => {
            expect(
                pipe(
                    { a: 1, b: 2, c: 3 },
                    Rec.reduceRight("", (acc, k, v) => `${acc}${k}${v}`)
                )
            ).toBe("c3b2a1")
        })

        it("ignores object entries with undefined values", () => {
            expect(
                pipe(
                    { a: undefined, b: undefined, c: 3, d: 4 },
                    Rec.reduceRight("", (acc, k, v) => `${acc}${k}${v}`)
                )
            ).toBe("d4c3")
        })

        it("reduces in reverse order, using custom sort order", () => {
            expect(
                pipe(
                    { a: "Parm", aa: "Goodie", aaa: "Weird Swiss" },
                    Rec.reduceRight(
                        "",
                        (acc, k, v) => `${acc}\n${k}-${v}`,
                        byLengthDescComparer
                    ),
                    String.trim
                )
            ).toMatchInlineSnapshot(`
        "a-Parm
        aa-Goodie
        aaa-Weird Swiss"
      `)
        })
    })

    describe("mergeInto", () => {
        it("copies all entries when merged into empty Rec", () => {
            const rec = { a: 1, b: 2, c: 3 }
            expect(pipe(rec, Rec.mergeInto({}))).toStrictEqual(rec)
        })

        it("retains all entries when empty rec merged into Rec", () => {
            const rec = { a: 1, b: 2, c: 3 }
            expect(pipe({}, Rec.mergeInto(rec))).toStrictEqual(rec)
        })

        it("overwrites entries with the same key in the 2nd rec", () => {
            expect(
                pipe(
                    { a: 11, b: 22, c: 33 },
                    Rec.mergeInto({ a: 1, b: 2, c: 3 })
                )
            ).toStrictEqual({ a: 11, b: 22, c: 33 })
        })

        it("preserves unique entries in original rec", () => {
            expect(
                pipe({ a: 11, b: 22 }, Rec.mergeInto({ a: 1, b: 2, c: 3 }))
            ).toStrictEqual({ a: 11, b: 22, c: 3 })
        })
    })

    describe("ofRecord", () => {
        it("should create a Rec from a record", () => {
            expectTypeOf(Rec.ofRecord({ a: 11, b: 22 })).toEqualTypeOf<
                Rec<"a" | "b", number>
            >()
        })

        it("should handle an empty Record", () => {
            expect(Rec.ofRecord({})).toStrictEqual(Rec.empty())
        })

        it("should merge keys when equal by equalityComparer", () => {
            expect(
                Rec.ofRecord(
                    { aa: 11, bb: 22 },
                    EqualityComparer.ofEquals((a, b) => a.length === b.length)
                )
            ).toStrictEqual({ aa: 22 })
        })
    })
})

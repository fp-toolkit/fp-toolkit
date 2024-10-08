import { describe, expect, it, vi } from "vitest"
import { pipe } from "../Composition"
import { EqualityComparer } from "../EqualityComparer"
import { Option } from "../Option"
import type { NonNullish } from "../prelude"

describe("Option", () => {
    describe("constructors", () => {
        describe("Some", () => {
            it("creates a new Some instance", () => {
                expect(Option.some(42)).toStrictEqual({
                    _tag: "Some",
                    some: 42,
                })
            })
        })

        describe("None", () => {
            it("creates a new None instance", () => {
                expect(Option.none).toStrictEqual({
                    _tag: "None",
                })
            })
        })
    })

    describe("ofNullish", () => {
        it.each([[null], [undefined]])(
            "converts nullish values (%o) to None",
            inp => {
                expect(Option.ofNullish(inp)).toStrictEqual(Option.none)
            }
        )

        it.each([
            [0, Option.some(0)],
            [42, Option.some(42)],
            ["", Option.some("")],
            ["cheese", Option.some("cheese")],
            [[], Option.some([])],
            [[1], Option.some([1])],
        ])("converts non-nullish values (%o) to Some", (inp, expected) => {
            expect(Option.ofNullish(inp)).toStrictEqual(expected)
        })
    })

    describe("toNullish", () => {
        it.each([
            [undefined, null],
            [false, undefined],
            [true, null],
        ])(
            "converts None to a nullish value (useNull = %o)",
            (useNull, expected) => {
                expect(Option.toNullish(Option.none, useNull)).toBe(expected)
            }
        )

        it.each([
            [0, Option.some(0)],
            [42, Option.some(42)],
            ["", Option.some("")],
            ["cheese", Option.some("cheese")],
            [[], Option.some([])],
            [[1], Option.some([1])],
        ])("converts Some to a raw value (%o)", (expected, inp) => {
            expect(Option.toNullish<NonNullish>(inp)).toStrictEqual(expected)
        })
    })

    describe("isSome", () => {
        it("returns true for Some", () => {
            expect(Option.isSome(Option.some(1))).toBe(true)
        })

        it("returns false for None", () => {
            expect(Option.isSome(Option.none)).toBe(false)
        })
    })

    describe("isNone", () => {
        it("returns true for None", () => {
            expect(Option.isNone(Option.none)).toBe(true)
        })

        it("returns false for Some", () => {
            expect(Option.isNone(Option.some(1))).toBe(false)
        })
    })

    describe("map", () => {
        it("returns a Some with projected inner value if Some", () => {
            const incr = (n: number) => n + 1
            expect(pipe(Option.some(22), Option.map(incr))).toStrictEqual(
                Option.some(23)
            )
        })

        it("returns None if given None", () => {
            const incr = (n: number) => n + 1
            expect(pipe(Option.none, Option.map(incr))).toStrictEqual(
                Option.none
            )
        })
    })

    describe("iter", () => {
        it("calls the function with inner value if Some", () => {
            const callback = vi.fn()
            pipe(Option.some(22), Option.iter(callback))
            expect(callback).toHaveBeenCalledOnce()
            expect(callback).toHaveBeenCalledWith(22)
        })

        it("does not call the function if given None", () => {
            const callback = vi.fn()
            pipe(Option.none, Option.iter(callback))
            expect(callback).not.toHaveBeenCalled()
        })
    })

    describe("map2", () => {
        it("returns the projected value if both Options are Some", () => {
            // act
            const actual = pipe(
                [Option.some(2), Option.some(3)] as const,
                Option.map2((a, b) => a + b)
            )
            // assert
            expect(actual).toStrictEqual(Option.some(5))
        })

        it.each([
            [[Option.none, Option.none]],
            [[Option.some(2), Option.none]],
            [[Option.none, Option.some(3)]],
        ] as const)(
            "returns None if either/both of the Options are None",
            (options: readonly [Option<number>, Option<number>]) => {
                // act
                const actual = pipe(
                    options,
                    Option.map2((a, b) => a + b)
                )
                // assert
                expect(actual).toStrictEqual(Option.none)
            }
        )
    })

    describe("map3", () => {
        it("returns the projected value if all 3 Options are Some", () => {
            // act
            const actual = pipe(
                [Option.some(2), Option.some(3), Option.some(4)] as const,
                Option.map3((a, b, c) => a + b + c)
            )
            // assert
            expect(actual).toStrictEqual(Option.some(9))
        })

        it.each([
            [[Option.none, Option.none, Option.none]],
            [[Option.some(2), Option.none, Option.none]],
            [[Option.none, Option.some(3), Option.none]],
            [[Option.none, Option.none, Option.some(3)]],
            [[Option.none, Option.some(3), Option.some(3)]],
            [[Option.some(3), Option.some(3), Option.none]],
        ] as const)(
            "returns None if any one of the Options is None",
            (
                options: readonly [
                    Option<number>,
                    Option<number>,
                    Option<number>,
                ]
            ) => {
                // act
                const actual = pipe(
                    options,
                    Option.map3((a, b) => a + b)
                )
                // assert
                expect(actual).toStrictEqual(Option.none)
            }
        )
    })

    describe("bind", () => {
        it("returns Some if the given Option is Some and the projection returns Some", () => {
            // arrange
            const appendS = (s: string) => Option.some(`${s}S`)
            // act
            const actual = pipe(Option.some("cheese"), Option.bind(appendS))
            // assert
            expect(actual).toStrictEqual(Option.some("cheeseS"))
        })

        it("returns None if the given Option is Some but the projection returns None", () => {
            // arrange
            const alwaysNone = () => Option.none
            // act
            const actual = pipe(Option.some("cheese"), Option.bind(alwaysNone))
            // assert
            expect(actual).toStrictEqual(Option.none)
        })

        it("returns None if the given Option is None, regardless of the projection", () => {
            // arrange
            const alwaysSome = () => Option.some("cheese")
            // act
            const actual = pipe(Option.none, Option.bind(alwaysSome))
            // assert
            expect(actual).toStrictEqual(Option.none)
        })
    })

    describe("defaultValue", () => {
        it("returns the wrapped value if the Option is Some", () => {
            const actual = pipe(Option.some(33), Option.defaultValue(1))
            expect(actual).toBe(33)
        })

        it("returns the default value if the Option is None", () => {
            const actual = pipe(Option.none, Option.defaultValue<number>(1))
            expect(actual).toBe(1)
        })
    })

    describe("defaultWith", () => {
        it("returns the wrapped value if the Option is Some", () => {
            const fallbackFn = vi.fn(() => "default")
            const actual = pipe(
                Option.some("cheese"),
                Option.defaultWith(fallbackFn)
            )
            expect(actual).toBe("cheese")
            expect(fallbackFn).not.toHaveBeenCalled()
        })

        it("returns the default lambda result if the Option is None", () => {
            const actual = pipe(
                Option.none,
                Option.defaultWith<string>(() => "default")
            )
            expect(actual).toBe("default")
        })
    })

    describe("match", () => {
        it.each([
            [Option.some("cheese"), "cheese!"],
            [Option.none, "!"],
        ])("can match with lambdas", (inp, expected) => {
            // arrange
            const exclaim = (s: string) => `${s}!`

            const matcher = {
                some: exclaim,
                none: () => "!",
            }
            // act
            const actual = pipe(inp, Option.match(matcher))
            // assert
            expect(actual).toBe(expected)
        })

        it.each([
            [Option.some("cheese"), "cheese!"],
            [Option.none, "!"],
        ])("can match with raw values", (inp, expected) => {
            // arrange
            const matcher = {
                some: "cheese!",
                none: "!",
            }
            // act
            const actual = pipe(inp, Option.match(matcher))
            // assert
            expect(actual).toBe(expected)
        })

        it.each([
            [Option.some(22), undefined],
            [Option.none, 0],
        ])("allows falsy values as matcher values", (inp, expected) => {
            // arrange
            const matcher = {
                some: undefined,
                none: 0,
            }
            // act
            const actual = pipe(inp as Option<number>, Option.match(matcher))
            // assert
            expect(actual).toBe(expected)
        })
    })

    describe("filter", () => {
        it("returns Some if the predicate holds", () => {
            expect(
                pipe(
                    Option.some("cheese"),
                    Option.filter(s => s.length < 10)
                )
            ).toStrictEqual(Option.some("cheese"))
        })

        it("returns None if the predicate does not hold", () => {
            expect(
                pipe(
                    Option.some("cheese"),
                    Option.filter(s => s.length > 10)
                )
            ).toStrictEqual(Option.none)
        })

        it("returns None if given None", () => {
            expect(
                pipe(
                    Option.none,
                    Option.filter((s: string) => s.length > 10)
                )
            ).toStrictEqual(Option.none)
        })
    })

    describe("refine", () => {
        it("returns Some if the type guard holds", () => {
            expect(
                pipe(
                    Option.some("cheese"),
                    Option.refine((s): s is "cheese" => s === "cheese")
                )
            ).toStrictEqual(Option.some("cheese"))
        })

        it("returns None if the predicate does not hold", () => {
            expect(
                pipe(
                    Option.some("cheese"),
                    Option.refine((s): s is "nope" => s === "nope")
                )
            ).toStrictEqual(Option.none)
        })

        it("returns None if given None", () => {
            expect(
                pipe(
                    Option.none,
                    Option.refine((s: string): s is "cheese" => s === "cheese")
                )
            ).toStrictEqual(Option.none)
        })
    })

    describe("tryCatch", () => {
        it("returns Some when function succeeds", () => {
            // arrange
            const f = () => 42
            // act
            const actual = Option.tryCatch(f)
            // assert
            expect(actual).toStrictEqual(Option.some(42))
        })

        it("returns None when function throws", () => {
            // arrange
            const f = () => {
                throw new Error("")
            }
            // act
            const actual = Option.tryCatch(f)
            // assert
            expect(actual).toStrictEqual(Option.none)
        })
    })

    describe("getEqualityComparer", () => {
        it.each([
            [
                true,
                "both are Somes and are equal",
                Option.some(1),
                Option.some(1),
            ],
            [
                false,
                "both are Somes but are not equal",
                Option.some(1),
                Option.some(2),
            ],
            [
                false,
                "one is a Some and one is a None",
                Option.some(1),
                Option.none,
            ],
            [
                false,
                "one is a None and one is an Some",
                Option.none,
                Option.some(1),
            ],
            [true, "both are Nones", Option.none, Option.none],
        ])(
            "gets an equality comparer that returns %o when %s",
            (expected, _, result1, result2) => {
                const { equals } = Option.getEqualityComparer(
                    EqualityComparer.Number
                )

                expect(equals(result1, result2)).toBe(equals(result2, result1))
                expect(equals(result1, result2)).toBe(expected)
            }
        )
    })

    describe("tee", () => {
        it("executes a side effect against Some", () => {
            const log = vi.fn<() => void>()
            const actual = pipe(
                Option.some(32),
                Option.tee(log),
                Option.map(n => n * 2)
            )
            expect(actual).toStrictEqual(Option.some(64))
            expect(log).toHaveBeenCalledOnce()
            expect(log).toHaveBeenCalledWith(32)
        })

        it("does not execute a side effect against None", () => {
            const log = vi.fn<() => void>()
            const actual = pipe(
                Option.none,
                Option.tee(log),
                Option.map((n: number) => n * 2)
            )
            expect(actual).toBe(Option.none)
            expect(log).not.toHaveBeenCalled()
        })
    })
})

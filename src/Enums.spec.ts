import { describe, expect, it } from "vitest"
import { type EnumOf, enumOf } from "../src/Enums"
import { Result } from "../src/Result"

const Cheese = enumOf(
    {
        Gouda: "Gouda",
        Muenster: "Muenster",
        Parmesan: "Parmesan",
    },
    "Cheese"
)
type Cheese = EnumOf<typeof Cheese>

const LogLevel = enumOf(
    {
        TRACE: 0,
        DEBUG: 1,
        CRAZY_PILLS: "over 9000",
    },
    "LogLevel"
)
type LogLevel = EnumOf<typeof LogLevel>

describe("enumOf module", () => {
    describe("value accessors", () => {
        it("preserves simple named value access", () => {
            expect(Cheese.Gouda).toBe("Gouda")
            expect(Cheese.Muenster).toBe("Muenster")
            expect(Cheese.Parmesan).toBe("Parmesan")
            expect(LogLevel.TRACE).toBe(0)
            expect(LogLevel.DEBUG).toBe(1)
            expect(LogLevel.CRAZY_PILLS).toBe("over 9000")
        })
    })

    describe("values array", () => {
        it("automatically produces a values property with all possible enum values", () => {
            expect(Cheese.values).toStrictEqual([
                "Gouda",
                "Muenster",
                "Parmesan",
            ])
            expect(LogLevel.values).toStrictEqual([0, 1, "over 9000"])
        })
    })

    describe("parse", () => {
        it.each([
            ["muenster ", Cheese.Muenster],
            ["GOUDA", Cheese.Gouda],
            ["  gOuDa ", Cheese.Gouda],
            ["Muenster", Cheese.Muenster],
        ])(
            "decodes valid input %s -> %s regardless of case or surrounding whitespace",
            (input, expected) => {
                expect(Cheese.parse(input)).toStrictEqual(Result.ok(expected))
            }
        )

        it.each([["i am 12"], ["swiss"], ["Mue- n-ster"]])(
            "fails invalid input: %s",
            input => {
                expect(Cheese.parse(input)).toStrictEqual(
                    Result.err(
                        expect.stringMatching(
                            /Must be an enum value in the set Cheese{.*}/
                        )
                    )
                )
            }
        )

        it.each([[null], [undefined]])("fails for nullish input %o", input => {
            expect(Cheese.parse(input)).toStrictEqual(
                Result.err("Enum Cheese cannot be null/undefined")
            )
        })

        it.each([
            [{ name: "cheese" }],
            [
                () => {
                    return
                },
            ],
        ])("fails for inputs of an incorrect type", input => {
            expect(Cheese.parse(input)).toStrictEqual(
                Result.err("Enum Cheese must be a string or number")
            )
        })
    })

    describe("match", () => {
        it.each([
            [0, "trace!"],
            [1, "debug!"],
            ["over 9000", "you're on crazy pills!"],
        ] as const)("it matches inputs (%o -> %s)", (input, expected) => {
            // arrange
            const matcher = {
                TRACE: "trace!",
                DEBUG: () => "debug!",
                CRAZY_PILLS() {
                    return "you're on crazy pills!"
                },
            }
            // act
            const actual = LogLevel.match(matcher)(input)
            // assert
            expect(actual).toBe(expected)
        })

        it.each([
            [LogLevel.TRACE, null],
            [LogLevel.DEBUG, undefined],
            [LogLevel.CRAZY_PILLS, 0],
        ])(
            "allows specifying null/undefined/falsy values in the matcher branches",
            (input, expected) => {
                // arrange
                const matcher = {
                    TRACE: null,
                    DEBUG: undefined,
                    CRAZY_PILLS: 0,
                }
                // act
                const actual = LogLevel.match(matcher)(input)
                // assert
                expect(actual).toBe(expected)
            }
        )

        it("throws a helpful error message if the matcher is missing a required case (if someone ignores compiler errors)", () => {
            // arrange
            const matcher = {
                DEBUG: () => "debug!",
                CRAZY_PILLS() {
                    return `you're on crazy pills!`
                },
            }
            // act & assert
            expect(() => LogLevel.match(matcher as any)(0)).toThrow(
                `Expected a matcher containing a case for 'TRACE'.`
            )
        })

        it("throws a helpful error message if the matcher gets passed an invalid enum value (if someone ignores compiler errors)", () => {
            // arrange
            const matcher = {
                TRACE: "trace!",
                DEBUG: () => "debug!",
                CRAZY_PILLS() {
                    return "you're on crazy pills!"
                },
            }
            // act & assert
            expect(() => LogLevel.match(matcher)(2 as any)).toThrow(
                `Expected to match against an enum where '2' is a valid value.`
            )
        })
    })

    describe("matchOrElse", () => {
        it.each([
            [0, "trace!"],
            [1, "unmatched"],
            ["over 9000", "you're on crazy pills!"],
        ] as const)("it matches inputs (%o -> %s)", (input, expected) => {
            // arrange
            const matcher = {
                TRACE: "trace!",
                CRAZY_PILLS() {
                    return "you're on crazy pills!"
                },
                orElse: "unmatched",
            }
            // act
            const actual = LogLevel.matchOrElse(matcher)(input)
            // assert
            expect(actual).toBe(expected)
        })

        it.each([
            [Cheese.Gouda, null],
            [Cheese.Muenster, undefined],
            [Cheese.Parmesan, ""],
        ])(
            "allows specifying null/undefined/falsy values in the matcher branches",
            (input, expected) => {
                // arrange
                const matcher = {
                    Gouda: null,
                    Muenster: undefined,
                    Parmesan: "",
                    orElse: "",
                }
                // act
                const actual = Cheese.matchOrElse(matcher)(input)
                // assert
                expect(actual).toBe(expected)
            }
        )

        it("throws a helpful error message if the matcher gets passed an invalid enum value (somehow?)", () => {
            // arrange
            const matcher = {
                TRACE: "trace!",
                DEBUG: () => "debug!",
                CRAZY_PILLS() {
                    return "you're on crazy pills!"
                },
                orElse: () => "unmatched",
            }
            // act & assert
            expect(() => LogLevel.matchOrElse(matcher)(2 as any)).toThrow(
                `Expected to match against an enum where '2' is a valid value.`
            )
        })
    })
})

import { describe, it, expect } from "vitest"
import * as String from "../src/string"
import { pipe } from "../src/Composition"

describe("String", () => {
    describe("isEmpty", () => {
        it.each([
            [true, ""],
            [false, "something"],
        ])("returns %o when given %s", (expected, inp) => {
            expect(String.isEmpty(inp)).toBe(expected)
        })
    })

    describe("trim", () => {
        it("trims", () => {
            expect(String.trim("  abc ")).toBe("abc")
        })
    })

    describe("toLowerCase", () => {
        it("lower-cases", () => {
            expect(String.toLowerCase("AAbdF")).toBe("aabdf")
        })
    })

    describe("toUpperCase", () => {
        it("upper-cases", () => {
            expect(String.toUpperCase("Dogs")).toBe("DOGS")
        })
    })

    describe("isString", () => {
        it.each([
            [true, ""],
            [true, "   "],
            [true, "  addc "],
            [true, "cheese"],
            [false, null],
            [false, undefined],
            [false, {}],
            [false, 42],
        ])("returns %o when given %o", (expected, inp) => {
            expect(String.isString(inp)).toBe(expected)
        })
    })

    describe("length", () => {
        it("returns the length", () => {
            expect(String.length("cheese")).toBe(6)
        })
    })

    describe("reverse", () => {
        it("reverses the string", () => {
            expect(String.reverse("cheese")).toBe("eseehc")
        })
    })

    describe("split", () => {
        it("splits using a string", () => {
            expect(pipe("C-H-E-D-D-A-R", String.split("-"))).toStrictEqual([
                "C",
                "H",
                "E",
                "D",
                "D",
                "A",
                "R",
            ])
        })

        it("splits using a regex", () => {
            expect(pipe("org.url.com", String.split(/\./))).toStrictEqual([
                "org",
                "url",
                "com",
            ])
        })

        it("handles the separator not existing in the string", () => {
            expect(pipe("CHEDDAR", String.split("-"))).toStrictEqual(["CHEDDAR"])
        })

        it("handles an empty string with an empty string separator", () => {
            expect(pipe("", String.split(""))).toStrictEqual([""])
        })
    })

    describe("capitalize", () => {
        it.each([
            ["", ""],
            ["cheese", "Cheese"],
            ["Cheese", "Cheese"],
        ])("capitalizes %s -> %s", (input, expected) => {
            expect(String.capitalize(input)).toBe(expected)
        })
    })

    describe("uncapitalize", () => {
        it.each([
            ["", ""],
            ["cheese", "cheese"],
            ["Cheese", "cheese"],
        ])("uncapitalizes %s -> %s", (input, expected) => {
            expect(String.uncapitalize(input)).toBe(expected)
        })
    })
})

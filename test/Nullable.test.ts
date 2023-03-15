/* eslint-disable @typescript-eslint/ban-types */
import { describe, it, expect } from "vitest"
import { Nullable } from "../src/Nullable"
import { pipe } from "../src/composition"
import { bind } from "fp-ts/lib/Chain"
import { EqualityComparer } from "../src/EqualityComparer"

describe("Nullable", () => {
    describe("defaultValue", () => {
        it.each([[null], [undefined]])(
            "returns the default value if given a nullish",
            n => {
                expect(pipe(n, Nullable.defaultValue(42))).toBe(42)
            }
        )

        it.each([[""], [[]], [0], ["cheese"], [42], [{}]])(
            "returns the value if given a non-nullish (including falsy, non-nullish)",
            val => {
                expect(pipe(val, Nullable.defaultValue<{}>(0))).toBe(val)
            }
        )
    })

    describe("defaultWith", () => {
        it.each([[null], [undefined]])(
            "returns the default value if given a nullish",
            n => {
                expect(
                    pipe(
                        n,
                        Nullable.defaultWith(() => 42)
                    )
                ).toBe(42)
            }
        )

        it.each([[""], [[]], [0], ["cheese"], [42], [{}]])(
            "returns the value if given a non-nullish (including falsy, non-nullish)",
            val => {
                expect(
                    pipe(
                        val,
                        Nullable.defaultWith<{}>(() => 0)
                    )
                ).toBe(val)
            }
        )
    })

    describe("map", () => {
        it.each([[null], [undefined]])(
            "returns the same nullish value if given a nullish",
            n => {
                expect(
                    pipe(
                        n,
                        Nullable.map(u => typeof u)
                    )
                ).toBe(n)
            }
        )

        it.each([
            ["", "string"],
            [[], "object"],
            [0, "number"],
            ["cheese", "string"],
            [42, "number"],
            [{}, "object"],
        ])(
            "returns the result of the map function if given a non-nullish (including falsy, non-nullish)",
            (val, expected) => {
                expect(
                    pipe(
                        val,
                        Nullable.map<{}, string>(u => typeof u)
                    )
                ).toBe(expected)
            }
        )
    })

    describe("bind", () => {
        it.each([[null], [undefined]])(
            "returns the same nullish value if given a nullish",
            n => {
                expect(
                    pipe(
                        n,
                        Nullable.bind(() => "cheese")
                    )
                ).toBe(n)
            }
        )

        it.each([
            [() => null, null],
            [() => undefined, undefined],
        ])(
            "returns the nullish value produced by the bind function if it produces a nullish",
            (bindFn, expected) => {
                expect(pipe("", Nullable.bind(bindFn))).toBe(expected)
            }
        )

        it.each([
            [() => 42, 42],
            [() => "", ""],
            [() => [], []],
            [() => ({}), {}],
            [() => "A", "A"],
        ])(
            "returns the result of the bind function if it produces a value",
            (bindFn, expected) => {
                expect(pipe("", Nullable.bind(bindFn))).toStrictEqual(expected)
            }
        )
    })

    describe("getEqualityComparer", () => {
        it.each([
            [null, undefined],
            [undefined, null],
            [null, null],
            [undefined, undefined],
        ])("produces an EqualityComparer that considers %o equivalent to %o", (a, b) => {
            // arrange
            const { equals } = Nullable.getEqualityComparer(EqualityComparer.String)
            // act & assert
            expect(equals(a, b)).toBe(equals(b, a))
            expect(equals(a, b)).toBe(true)
        })

        it.todo.each([[null], [undefined]])(
            "produces an EqualityComparer that doesn't consider [] equivalent to %o",
            falsy => {
                // arrange
                // const { equals } = Nullable.getEqualityComparer(Array.getEq(EqualityComparer.String))
                // act & assert
                // expect(equals([], falsy)).toBe(false)
            }
        )

        it.each([[null], [undefined]])(
            'produces an EqualityComparer that doesn\'t consider "" equivalent to %o',
            falsy => {
                // arrange
                const { equals } = Nullable.getEqualityComparer(EqualityComparer.String)
                // act & assert
                expect(equals("", falsy)).toBe(false)
            }
        )

        it.each([
            [null, "cheese", false],
            [undefined, "cheese", false],
            ["rawr", "monster", false],
            ["", "", true],
            ["hello", "hello", true],
        ])(
            "produces an EqualityComparer that considers equals(%o, %o) to be %o",
            (a, b, expected) => {
                // arrange
                const { equals } = Nullable.getEqualityComparer(EqualityComparer.String)
                // act
                expect(equals(a, b)).toBe(expected)
            }
        )
    })
})

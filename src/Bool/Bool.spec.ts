import { describe, expect, it } from "vitest"
import { pipe } from "../Composition"
import { Bool } from "../Bool"

describe("Bool", () => {
    describe("match", () => {
        describe("raw values", () => {
            it("returns the raw value for the true branch", () => {
                expect(
                    pipe(
                        true,
                        Bool.match({
                            true: 26,
                            false: 0,
                        })
                    )
                ).toBe(26)
            })

            it("returns the raw value for the false branch", () => {
                expect(
                    pipe(
                        false,
                        Bool.match({
                            true: 26,
                            false: 0,
                        })
                    )
                ).toBe(0)
            })
        })

        describe("lambdas", () => {
            it("returns the lambda result for the true branch", () => {
                expect(
                    pipe(
                        true,
                        Bool.match({
                            true: () => 26,
                            false: () => 0,
                        })
                    )
                ).toBe(26)
            })

            it("returns the lambda result for the false branch", () => {
                expect(
                    pipe(
                        false,
                        Bool.match({
                            true: () => 26,
                            false: () => 0,
                        })
                    )
                ).toBe(0)
            })
        })

        describe("falsy values", () => {
            it("can return a falsy raw value for the true branch", () => {
                expect(
                    pipe(
                        true,
                        Bool.match({
                            true: undefined,
                            false: 0,
                        })
                    )
                ).toBe(undefined)
            })

            it("can return a falsy raw value for the false branch", () => {
                expect(
                    pipe(
                        false,
                        Bool.match({
                            true: 26,
                            false: null,
                        })
                    )
                ).toBeNull()
            })
        })
    })
})

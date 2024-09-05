import { describe, expect, it } from "vitest"
import { pipe } from "../Composition"
import { Deferred } from "../Deferred"
import { DeferredResult } from "../DeferredResult"
import { Result } from "../Result"

describe("DeferredResult", () => {
    describe("ok", () => {
        it("creates a Resolved(Ok)", () => {
            expect(DeferredResult.ok(42)).toStrictEqual(
                Deferred.resolved(Result.ok(42))
            )
        })
    })

    describe("err", () => {
        it("creates a Resolved(Err)", () => {
            expect(DeferredResult.err(42)).toStrictEqual(
                Deferred.resolved(Result.err(42))
            )
        })
    })

    describe("match", () => {
        it.each([
            [
                "notStarted",
                Deferred.notStarted as DeferredResult<number, string>,
                "Not Started",
            ],
            [
                "inProgress",
                Deferred.inProgress as DeferredResult<number, string>,
                "In Progress",
            ],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<
                    number,
                    string
                >,
                "Ok",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<
                    number,
                    string
                >,
                "Err",
            ],
        ])(
            "uses the raw value for each match case if given (%s)",
            (_, input, expected) => {
                expect(
                    pipe(
                        input,
                        DeferredResult.match({
                            notStarted: "Not Started",
                            inProgress: "In Progress",
                            resolvedOk: "Ok",
                            resolvedErr: "Err",
                        })
                    )
                ).toBe(expected)
            }
        )

        it.each([
            [
                "notStarted",
                Deferred.notStarted as DeferredResult<number, string>,
                "",
            ],
            [
                "inProgress",
                Deferred.inProgress as DeferredResult<number, string>,
                0,
            ],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<
                    number,
                    string
                >,
                null,
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<
                    number,
                    string
                >,
                undefined,
            ],
        ])(
            "correctly returns falsy and nullish raw values for each match case if given (%s)",
            (_, input, expected) => {
                expect(
                    pipe(
                        input,
                        DeferredResult.match<
                            number,
                            string,
                            number | string | null | undefined
                        >({
                            notStarted: "",
                            inProgress: 0,
                            resolvedOk: null,
                            resolvedErr: undefined,
                        })
                    )
                ).toBe(expected)
            }
        )

        it.each([
            [
                "notStarted",
                Deferred.notStarted as DeferredResult<number, string>,
                "Not Started",
            ],
            [
                "inProgress",
                Deferred.inProgress as DeferredResult<number, string>,
                "In Progress",
            ],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<
                    number,
                    string
                >,
                "Ok(20)",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<
                    number,
                    string
                >,
                "Err(fail)",
            ],
        ])(
            "correctly uses lambda functions for each match case if given (%s)",
            (_, input, expected) => {
                expect(
                    pipe(
                        input,
                        DeferredResult.match({
                            notStarted: () => "Not Started",
                            inProgress: () => "In Progress",
                            resolvedOk: a => `Ok(${a})`,
                            resolvedErr: e => `Err(${e})`,
                        })
                    )
                ).toBe(expected)
            }
        )
    })

    describe("matchOrElse", () => {
        it.each([
            [
                "notStarted",
                Deferred.notStarted as DeferredResult<number, string>,
                "Default",
            ],
            [
                "inProgress",
                Deferred.inProgress as DeferredResult<number, string>,
                "Default",
            ],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<
                    number,
                    string
                >,
                "Ok",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<
                    number,
                    string
                >,
                "Err",
            ],
        ])(
            "uses the raw value for each match case if given (%s)",
            (_, input, expected) => {
                expect(
                    pipe(
                        input,
                        DeferredResult.matchOrElse({
                            resolvedOk: "Ok",
                            resolvedErr: "Err",
                            orElse: "Default",
                        })
                    )
                ).toBe(expected)
            }
        )

        it.each([
            [
                "notStarted",
                Deferred.notStarted as DeferredResult<number, string>,
                0,
            ],
            [
                "inProgress",
                Deferred.inProgress as DeferredResult<number, string>,
                0,
            ],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<
                    number,
                    string
                >,
                "",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<
                    number,
                    string
                >,
                undefined,
            ],
        ])(
            "correctly returns falsy and nullish raw values for each match case if given (%s)",
            (_, input, expected) => {
                expect(
                    pipe(
                        input,
                        DeferredResult.matchOrElse<
                            number,
                            string,
                            number | string | undefined
                        >({
                            resolvedOk: "",
                            resolvedErr: undefined,
                            orElse: 0,
                        })
                    )
                ).toBe(expected)
            }
        )

        it.each([
            [
                "notStarted",
                Deferred.notStarted as DeferredResult<number, string>,
                "Default",
            ],
            [
                "inProgress",
                Deferred.inProgress as DeferredResult<number, string>,
                "Default",
            ],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<
                    number,
                    string
                >,
                "Ok(20)",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<
                    number,
                    string
                >,
                "Err(fail)",
            ],
        ])(
            "correctly uses lambda functions for each match case if given (%s)",
            (_, input, expected) => {
                expect(
                    pipe(
                        input,
                        DeferredResult.matchOrElse({
                            resolvedOk: a => `Ok(${a})`,
                            resolvedErr: e => `Err(${e})`,
                            orElse: () => "Default",
                        })
                    )
                ).toBe(expected)
            }
        )
    })

    describe("map", () => {
        it("returns a Resolved with projected inner value if Resolved and Ok", () => {
            const incr = (n: number) => n + 1
            expect(
                pipe(DeferredResult.ok(22), DeferredResult.map(incr))
            ).toStrictEqual(DeferredResult.ok(23))
        })

        it("returns a Resolved with existing error if Resolved and Err", () => {
            expect(
                pipe(
                    DeferredResult.err(22),
                    DeferredResult.map((n: number) => n + 1)
                )
            ).toStrictEqual(DeferredResult.err(22))
        })

        it("returns InProgress if given InProgress", () => {
            expect(
                pipe(
                    Deferred.notStarted,
                    DeferredResult.map((n: number) => n + 1)
                )
            ).toStrictEqual(Deferred.notStarted)
        })

        it("returns NotStarted if given NotStarted", () => {
            expect(
                pipe(
                    Deferred.inProgress,
                    DeferredResult.map((n: number) => n + 1)
                )
            ).toStrictEqual(Deferred.inProgress)
        })
    })

    describe("mapErr", () => {
        it("returns a Resolved with existing value if Resolved and Ok", () => {
            expect(
                pipe(
                    DeferredResult.ok(22),
                    DeferredResult.mapErr((n: number) => n + 1)
                )
            ).toStrictEqual(DeferredResult.ok(22))
        })

        it("returns a Resolved with mapped error if Resolved and Err", () => {
            const incr = (n: number) => n + 1
            expect(
                pipe(DeferredResult.err(22), DeferredResult.mapErr(incr))
            ).toStrictEqual(DeferredResult.err(23))
        })

        it("returns InProgress if given InProgress", () => {
            expect(
                pipe(
                    Deferred.notStarted,
                    DeferredResult.mapErr((n: number) => n + 1)
                )
            ).toStrictEqual(Deferred.notStarted)
        })

        it("returns NotStarted if given NotStarted", () => {
            expect(
                pipe(
                    Deferred.inProgress,
                    DeferredResult.mapErr((n: number) => n + 1)
                )
            ).toStrictEqual(Deferred.inProgress)
        })
    })

    describe("unwrap", () => {
        it("returns the inner resolved ok value", () => {
            expect(
                pipe(
                    DeferredResult.ok<number, Error>(42),
                    DeferredResult.unwrap((): number => {
                        throw new Error("should not be called!")
                    })
                )
            ).toBe(42)
        })

        it.each([
            { scenario: "not started", inp: Deferred.notStarted },
            { scenario: "in progress", inp: Deferred.inProgress },
            {
                scenario: "resolved with error",
                inp: DeferredResult.err<Error, number>(new Error("")),
            },
        ] as const)(
            "returns the orElse value when the deferred result is $scenario",
            ({ inp }) => {
                expect(
                    pipe(
                        inp,
                        DeferredResult.unwrap(() => 0)
                    )
                ).toBe(0)
            }
        )
    })
})

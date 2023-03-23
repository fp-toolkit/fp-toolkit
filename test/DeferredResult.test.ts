import { describe, it, expect } from "vitest"
import * as DeferredResult from "../src/DeferredResult"
import { Deferred } from "../src/Deferred"
import { Result } from "../src/Result"
import { pipe } from "../src/Composition"

type DeferredResult<A, E> = DeferredResult.DeferredResult<A, E>

describe("DeferredResult", () => {
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
                Deferred.resolved(Result.ok(20)) as DeferredResult<number, string>,
                "Ok",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<number, string>,
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
            ["notStarted", Deferred.notStarted as DeferredResult<number, string>, ""],
            ["inProgress", Deferred.inProgress as DeferredResult<number, string>, 0],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<number, string>,
                null,
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<number, string>,
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
                Deferred.resolved(Result.ok(20)) as DeferredResult<number, string>,
                "Ok(20)",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<number, string>,
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
                Deferred.resolved(Result.ok(20)) as DeferredResult<number, string>,
                "Ok",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<number, string>,
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
            ["notStarted", Deferred.notStarted as DeferredResult<number, string>, 0],
            ["inProgress", Deferred.inProgress as DeferredResult<number, string>, 0],
            [
                "resolvedOk",
                Deferred.resolved(Result.ok(20)) as DeferredResult<number, string>,
                "",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<number, string>,
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
                Deferred.resolved(Result.ok(20)) as DeferredResult<number, string>,
                "Ok(20)",
            ],
            [
                "resolvedErr",
                Deferred.resolved(Result.err("fail")) as DeferredResult<number, string>,
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
})

import { describe, expect, it } from "vitest"
import { pipe } from "../Composition"
import { Deferred } from "../Deferred"

describe("Deferred", () => {
    describe("match", () => {
        it.each([
            [Deferred.notStarted, "not started"],
            [Deferred.inProgress, "in progress"],
            [Deferred.resolved(42), "resolved: 42"],
        ])("matches every case for %o", (input, expected) => {
            // act
            const actual = pipe(
                input,
                Deferred.match({
                    notStarted: "not started",
                    inProgress: () => "in progress",
                    resolved: n => `resolved: ${n}`,
                })
            )
            // assert
            expect(actual).toBe(expected)
        })
    })

    describe("matchOrElse", () => {
        it.each([
            [Deferred.notStarted, "not started"],
            [Deferred.inProgress, "unmatched"],
            [Deferred.resolved(42), "resolved"],
        ])("matches only specified cases for %o", (input, expected) => {
            // act
            const actual = pipe(
                input,
                Deferred.matchOrElse({
                    notStarted: "not started",
                    resolved: "resolved",
                    orElse: () => "unmatched",
                })
            )
            // assert
            expect(actual).toBe(expected)
        })

        it("considers falsy matcher values as valid", () => {
            // arrange
            const def1 = Deferred.inProgress
            const def2 = Deferred.notStarted
            const def3 = Deferred.resolved("resolve this, bro")
            // act
            const actual1 = pipe(
                def1,
                Deferred.matchOrElse({
                    inProgress: false,
                    orElse: true,
                })
            )
            const actual2 = pipe(
                def2,
                Deferred.matchOrElse({
                    notStarted: 0,
                    orElse: 1,
                })
            )
            const actual3 = pipe(
                def3,
                Deferred.matchOrElse({
                    resolved: false,
                    orElse: true,
                })
            )
            // assert
            expect(actual1).toBe(false)
            expect(actual2).toBe(0)
            expect(actual3).toBe(false)
        })
    })

    describe("isUnresolved", () => {
        it.each([
            [true, "in progress", Deferred.inProgress],
            [true, "not started", Deferred.notStarted],
            [false, "resolved", Deferred.resolved({})],
        ])("returns %o when deferred is %s", (expected, _, val) => {
            // act
            const actual = Deferred.isUnresolved(val)
            // assert
            expect(actual).toBe(expected)
        })
    })

    describe("isInProgress", () => {
        it.each([
            [true, "in progress", Deferred.inProgress],
            [false, "not started", Deferred.notStarted],
            [false, "resolved", Deferred.resolved({})],
        ])("returns %o when deferred is %s", (expected, _, val) => {
            // act
            const actual = Deferred.isInProgress(val)
            // assert
            expect(actual).toBe(expected)
        })
    })

    describe("isResolvedWith", () => {
        it.each([
            ["in progress", Deferred.inProgress],
            ["not started", Deferred.notStarted],
        ])("returns false if deferred is %s", (_, val) => {
            // act
            const actual = Deferred.isResolvedWith({})(val)
            // assert
            expect(actual).toBe(false)
        })

        it("returns false if deferred is resolved, but not Eq-equivalent to expected", () => {
            // arrange
            const def = Deferred.resolved(89)
            // act
            const actual = Deferred.isResolvedWith<number>(12)(def)
            // assert
            expect(actual).toBe(false)
        })

        it("returns true if deferred is resolved, and is Eq-equivalent to expected", () => {
            // arrange
            const def = Deferred.resolved(89)
            // act
            const actual = Deferred.isResolvedWith<number>(89)(def)
            // assert
            expect(actual).toBe(true)
        })
    })

    describe("isResolved", () => {
        it.each([
            [false, "in progress", Deferred.inProgress],
            [false, "not started", Deferred.notStarted],
            [true, "resolved", Deferred.resolved({})],
        ])("returns %o when deferred is %s", (expected, _, val) => {
            // act
            const actual = Deferred.isResolved(val)
            // assert
            expect(actual).toBe(expected)
        })
    })

    describe("map", () => {
        it("returns a Resolved with projected inner value if Resolved", () => {
            const incr = (n: number) => n + 1
            expect(
                pipe(Deferred.resolved(22), Deferred.map(incr))
            ).toStrictEqual(Deferred.resolved(23))
        })

        it("returns InProgress if given InProgress", () => {
            const incr = (n: number) => n + 1
            expect(pipe(Deferred.notStarted, Deferred.map(incr))).toStrictEqual(
                Deferred.notStarted
            )
        })

        it("returns NotStarted if given NotStarted", () => {
            const incr = (n: number) => n + 1
            expect(pipe(Deferred.inProgress, Deferred.map(incr))).toStrictEqual(
                Deferred.inProgress
            )
        })
    })
})

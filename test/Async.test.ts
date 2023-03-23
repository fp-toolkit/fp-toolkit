import { describe, it, expect, vi } from "vitest"
import { pipe } from "../src/Composition"
import * as Async from "../src/Async"

type Async<A> = Async.Async<A>

describe("Async", () => {
    describe("constructors", () => {
        describe("of", () => {
            it("wraps a value in an Async", async () => {
                expect(await Async.of(22)()).toBe(22)
            })
        })

        describe("ofPromise", () => {
            it("wraps a promise in a lambda", async () => {
                expect(
                    await pipe(
                        Promise.resolve("zebra skin"),
                        Async.ofPromise,
                        Async.map(s => s.length),
                        Async.start
                    )
                ).toBe(10)
            })
        })
    })

    describe("map", () => {
        it("maps the inner value", async () => {
            expect(
                await pipe(
                    Async.of("cheese"),
                    Async.map(s => `${s} melted`),
                    Async.start
                )
            ).toBe("cheese melted")
        })
    })

    describe("bind", () => {
        it("flatMaps the inner value", async () => {
            // arrange
            const asyncIncr = (n: number) => Async.of(n + 1)
            // act
            const actual = await pipe(Async.of(2), Async.bind(asyncIncr), Async.start)
            // assert
            expect(actual).toBe(3)
        })
    })

    describe("flatten", () => {
        it("flattens a nested structure", async () => {
            expect(await pipe(Async.of(Async.of("a")), Async.flatten, Async.start)).toBe(
                "a"
            )
        })
    })

    describe("sequential", () => {
        it("executes the computations in series and collects the results", async () => {
            // arrange
            vi.useFakeTimers()

            const comp1 = pipe(Async.of("1"))
            const comp2 = pipe(Async.of("2"), Async.delay(500))
            const comp3 = pipe(Async.of("3"), Async.delay(1000))
            // act
            const promise = pipe([comp3, comp2, comp1], Async.sequential, Async.start)
            await vi.runAllTimersAsync()
            const actual = await promise
            // assert
            expect(actual).toStrictEqual(["3", "2", "1"])
            // cleanup
            vi.useRealTimers()
        })
    })

    describe("parallel", () => {
        it("executes the computations in parallel and collects the results", async () => {
            // arrange
            vi.useFakeTimers()
            const log = vi.fn()

            const comp1 = pipe(Async.of("1"), Async.tee(log))
            const comp2 = pipe(Async.of("2"), Async.delay(500), Async.tee(log))
            const comp3 = pipe(Async.of("3"), Async.delay(1000), Async.tee(log))
            // act
            const promise = pipe([comp3, comp2, comp1], Async.parallel, Async.start)
            await vi.runAllTimersAsync()
            const actual = await promise
            // assert
            expect(log).toHaveBeenCalledTimes(3)
            expect(log.mock.calls).toStrictEqual([["1"], ["2"], ["3"]])
            ;["1", "2", "3"].forEach(i => {
                expect(actual).toContain(i)
            })
            // cleanup
            vi.useRealTimers()
        })
    })

    describe("asyncify", () => {
        it("converts a function with a single argument", async () => {
            // arrange
            const fakeIO = (fileName: string) => Promise.resolve([".txt", fileName])

            const asyncified = Async.asyncify(fakeIO)
            // act
            const actual = await asyncified("file")()
            // assert
            expect(actual).toStrictEqual([".txt", "file"])
        })

        it("converts a function with multiple arguments", async () => {
            // arrange
            const fakeIO = (fileName: string, lineNumber: number) =>
                Promise.resolve([".txt", fileName, `L${lineNumber}`])

            const asyncified = Async.asyncify(fakeIO)
            // act
            const actual = await asyncified("file", 32)()
            // assert
            expect(actual).toStrictEqual([".txt", "file", "L32"])
        })

        it("converts a function with multiple, mixed, array, object, and primitive arguments", async () => {
            // arrange
            const fakeIO = (
                fileName: string,
                extension: ".txt" | ".md",
                lines: number[],
                options?: { skipChecks?: boolean }
            ) =>
                Promise.resolve([
                    extension,
                    fileName,
                    `Lines:${lines.join(",")}`,
                    `Options:{ skipChecks = ${options?.skipChecks} }`,
                ])

            const asyncified = Async.asyncify(fakeIO)
            // act
            const actual = await asyncified("file", ".md", [2, 8, 22], {
                skipChecks: false,
            })()
            // assert
            expect(actual).toStrictEqual([
                ".md",
                "file",
                "Lines:2,8,22",
                "Options:{ skipChecks = false }",
            ])
        })
    })

    describe("tee", () => {
        it("allows executing an arbitrary side effect without affecting the inner value", async () => {
            // arrange
            const log = vi.fn<number[], void>()
            const logDouble = (n: number) => log(n * 2)
            // act
            const actual = await pipe(
                Async.of(100),
                Async.tee(logDouble),
                Async.map(String),
                Async.start
            )
            // assert
            expect(actual).toBe("100")
            expect(log).toHaveBeenCalledOnce()
            expect(log).toHaveBeenCalledWith(200)
        })
    })

    describe("start", () => {
        it("is equivalent to invoking the async as a lambda", async () => {
            // arrange
            const mock = vi.fn(() => Promise.resolve("a"))
            const f: Async<string> = () => mock()
            // act
            const actual1 = await Async.start(f)
            const actual2 = await f()
            // assert
            expect(mock).toHaveBeenCalledTimes(2)
            expect(actual1).toBe("a")
            expect(actual2).toBe("a")
        })
    })

    describe("never", () => {
        it("never resolves", () => {
            // arrange
            vi.useFakeTimers()
            const f = vi.fn()
            // act
            void pipe(Async.never, Async.tee(f), Async.start)
            vi.advanceTimersByTime(10_000_000)
            // assert
            expect(f).not.toHaveBeenCalled()
            // cleanup
            vi.useRealTimers()
        })
    })

    describe("delay", () => {
        it("normalizes the delay to a natural number", async () => {
            // act
            const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout")
            const actual = await pipe(Async.unit, Async.delay(-100), Async.start)
            // assert
            expect(actual).toBeDefined()
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.anything(), 0)
            expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.anything(), -100)
        })
    })
})

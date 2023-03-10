import { describe, it, expect } from "vitest"
import { AsyncResult } from "../src/AsyncResult"
import { Async } from "../src/Async"
import { Result } from "../src/Result"
import { pipe } from "../src/composition"

describe("AsyncResult", () => {
    describe("constructors", () => {
        describe("Ok", () => {
            it("produces a new Ok", async () => {
                expect(await pipe(AsyncResult.Ok(30), Async.start)).toStrictEqual(
                    Result.Ok(30)
                )
            })
        })

        describe("Err", () => {
            it("produces a new Err", async () => {
                expect(await pipe(AsyncResult.Err("err"), Async.start)).toStrictEqual(
                    Result.Err("err")
                )
            })
        })
    })

    describe("map", () => {
        it("projects the inner Ok value", async () => {
            expect(
                await pipe(
                    AsyncResult.Ok(10),
                    AsyncResult.map(n => n + 1),
                    Async.start
                )
            ).toStrictEqual(Result.Ok(11))
        })

        it("does nothing to an Err", async () => {
            expect(
                await pipe(
                    AsyncResult.Err(10),
                    AsyncResult.map((n: number) => n + 1),
                    Async.start
                )
            ).toStrictEqual(Result.Err(10))
        })
    })

    describe("mapErr", () => {
        it("projects the inner Err value", async () => {
            expect(
                await pipe(
                    AsyncResult.Err("err"),
                    AsyncResult.mapErr(s => s.length),
                    Async.start
                )
            ).toStrictEqual(Result.Err(3))
        })

        it("does nothing to an Ok", async () => {
            expect(
                await pipe(
                    AsyncResult.Ok(10),
                    AsyncResult.mapErr((n: number) => n + 1),
                    Async.start
                )
            ).toStrictEqual(Result.Ok(10))
        })
    })

    describe("bind", () => {
        it("projects the inner Ok value and flattens the result", async () => {
            // arrange
            const f1 = () => AsyncResult.Ok<string, Error>("ok")
            const f2 = (s: string) => AsyncResult.Ok<number, Error>(s.length)
            // act
            const actual = await pipe(f1(), AsyncResult.bind(f2), Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Ok(2))
        })

        it("does nothing to Err values", async () => {
            // arrange
            const f1 = () => AsyncResult.Err<Error, string>(new Error("err"))
            const f2 = (s: string) => AsyncResult.Ok<number, Error>(s.length)
            // act
            const actual = await pipe(f1(), AsyncResult.bind(f2), Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Err(new Error("err")))
        })

        it("returns a flattened Err if the bind projection returns an Err", async () => {
            // arrange
            const f1 = () => AsyncResult.Ok<string, Error>("ok")
            const f2 = (_: string) => AsyncResult.Err<Error, number>(new Error("err"))
            // act
            const actual = await pipe(f1(), AsyncResult.bind(f2), Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Err(new Error("err")))
        })
    })

    describe("bindResult", () => {
        it("projects the inner Ok value and flattens the result", async () => {
            // arrange
            const f1 = () => AsyncResult.Ok<string, Error>("ok")
            const f2 = (s: string) => Result.Ok<number, Error>(s.length)
            // act
            const actual = await pipe(f1(), AsyncResult.bindResult(f2), Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Ok(2))
        })

        it("does nothing to Err values", async () => {
            // arrange
            const f1 = () => AsyncResult.Err<Error, string>(new Error("err"))
            const f2 = (s: string) => Result.Ok<number, Error>(s.length)
            // act
            const actual = await pipe(f1(), AsyncResult.bindResult(f2), Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Err(new Error("err")))
        })

        it("returns a flattened Err if the bind projection returns an Err", async () => {
            // arrange
            const f1 = () => AsyncResult.Ok<string, Error>("ok")
            const f2 = (_: string) => Result.Err<Error, number>(new Error("err"))
            // act
            const actual = await pipe(f1(), AsyncResult.bindResult(f2), Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Err(new Error("err")))
        })
    })

    describe("ofResult", () => {
        it("lifts a result into an AsyncResult", async () => {
            expect(
                await pipe(Result.Err("failure"), AsyncResult.ofResult, Async.start)
            ).toStrictEqual(Result.Err("failure"))
        })
    })

    describe("ofAsync", () => {
        it("lifts an Async into an AsyncResult", async () => {
            expect(
                await pipe(Async.of(25), AsyncResult.ofAsync, Async.start)
            ).toStrictEqual(Result.Ok(25))
        })
    })

    describe("tryCatch", () => {
        it("returns an Ok if the computation does not throw", async () => {
            // arrange
            const f = Async.of(12)
            // act
            const actual = await pipe(f, AsyncResult.tryCatch, Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Ok(12))
        })

        it("returns an Err if the computation throws", async () => {
            // arrange
            const f = async () => {
                throw new Error("failure")
            }
            // act
            const actual = await pipe(f, AsyncResult.tryCatch, Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Err(new Error("failure")))
        })

        it("coerces thrown non-error objects to a stringified error by default", async () => {
            // arrange
            const f = async () => {
                throw "failure"
            }
            // act
            const actual = await pipe(f, AsyncResult.tryCatch, Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Err(new Error("failure")))
        })

        it("uses the onThrow function if given", async () => {
            // arrange
            const f = async (): Promise<number> => {
                throw "failure"
            }

            const onThrow = (u: unknown) => ({ err: String(u) })
            // act
            const actual = await pipe(AsyncResult.tryCatch(f, onThrow), Async.start)
            // assert
            expect(actual).toStrictEqual(Result.Err({ err: "failure" }))
        })
    })

    describe("match", () => {
        it("matches Ok using a lambda", async () => {
            // arrange
            const matcher = {
                ok: (n: number) => n + 100,
                err: (s: string) => s.length,
            }
            // act
            const actual = await pipe(
                AsyncResult.Ok<number, string>(10),
                AsyncResult.match(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe(110)
        })

        it("matches Ok using a raw value", async () => {
            // arrange
            const matcher = {
                ok: 99,
                err: (s: string) => s.length,
            }
            // act
            const actual = await pipe(
                AsyncResult.Ok<number, string>(10),
                AsyncResult.match(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe(99)
        })

        it("matches Err using a lambda", async () => {
            // arrange
            const matcher = {
                ok: (n: number) => n + 100,
                err: (s: string) => s.length,
            }
            // act
            const actual = await pipe(
                AsyncResult.Err<string, number>("fail"),
                AsyncResult.match(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe(4)
        })

        it("matches Err using a raw value", async () => {
            // arrange
            const matcher = {
                ok: "",
                err: "argh!",
            }
            // act
            const actual = await pipe(
                AsyncResult.Err<string, number>(""),
                AsyncResult.match(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe("argh!")
        })
    })

    describe("matchOrElse", () => {
        it("matches Ok if given a matcher", async () => {
            // arrange
            const matcher = {
                ok: (n: number) => n.toString(),
                orElse: "error",
            }
            // act
            const actual = await pipe(
                AsyncResult.Ok<number, string>(10),
                AsyncResult.matchOrElse(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe("10")
        })

        it("matches Err if given a matcher", async () => {
            // arrange
            const matcher = {
                err: (s: string) => `__${s}`,
                orElse: "error",
            }
            // act
            const actual = await pipe(
                AsyncResult.Err<string, number>("err"),
                AsyncResult.matchOrElse(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe("__err")
        })

        it("matches orElse if given an Ok with no matcher", async () => {
            // arrange
            const matcher = {
                err: (s: string) => `__${s}`,
                orElse: "default",
            }
            // act
            const actual = await pipe(
                AsyncResult.Ok<number, string>(10),
                AsyncResult.matchOrElse(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe("default")
        })

        it("matches orElse if given an Err with no matcher", async () => {
            // arrange
            const matcher = {
                ok: (n: number) => n.toString(),
                orElse: () => "default",
            }
            // act
            const actual = await pipe(
                AsyncResult.Err<string, number>(""),
                AsyncResult.matchOrElse(matcher),
                Async.start
            )
            // assert
            expect(actual).toBe("default")
        })
    })
})

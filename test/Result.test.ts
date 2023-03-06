import { describe, it, expect } from "vitest";
import { Result } from "../src/Result";
import { pipe } from "../src/composition";

describe("Result", () => {
    describe("constructors", () => {
        describe("Ok", () => {
            it("returns a new Ok object", () => {
                expect(Result.Ok("cheese")).toStrictEqual({
                    _tag: "result/ok",
                    ok: "cheese",
                });
            });
        });

        describe("Err", () => {
            it("returns a new Err object", () => {
                expect(Result.Err("melted")).toStrictEqual({
                    _tag: "result/err",
                    err: "melted",
                });
            });
        });
    });

    describe("match", () => {
        it("can match using lambdas", () => {
            // arrange
            const matcher = {
                ok: (s: string) => s.length,
                err: (e: number) => e,
            };
            // act
            const actual1 = pipe(Result.Ok("stink!"), Result.match(matcher));
            const actual2 = pipe(Result.Err(404), Result.match(matcher));
            // assert
            expect(actual1).toBe(6);
            expect(actual2).toBe(404);
        });

        it("can match using raw values", () => {
            // arrange
            const matcher = {
                ok: "ok?",
                err: "err!",
            };
            // act
            const actual1 = pipe(Result.Ok("stink!"), Result.match(matcher));
            const actual2 = pipe(Result.Err(404), Result.match(matcher));
            // assert
            expect(actual1).toBe("ok?");
            expect(actual2).toBe("err!");
        });

        it("allows nullish matcher values", () => {
            // arrange
            const matcher = {
                ok: null,
                err: undefined,
            };
            // act
            const actual1 = pipe(Result.Ok("stink!"), Result.match(matcher));
            const actual2 = pipe(Result.Err(404), Result.match(matcher));
            // assert
            expect(actual1).toBe(null);
            expect(actual2).toBe(undefined);
        });

        it("allows falsy matcher values", () => {
            // arrange
            const matcher = {
                ok: 0,
                err: "",
            };
            // act
            const actual1 = pipe(
                Result.Ok("stink!"),
                Result.match<string, never, number | string>(matcher)
            );
            const actual2 = pipe(
                Result.Err(404),
                Result.match<never, number, number | string>(matcher)
            );
            // assert
            expect(actual1).toBe(0);
            expect(actual2).toBe("");
        });
    });

    describe("matchOrElse", () => {
        it("can match using lambdas", () => {
            // arrange
            const matcher = {
                ok: (s: string) => s.length,
                orElse: () => 0,
            };
            // act
            const actual1 = pipe(Result.Ok("stink!"), Result.matchOrElse(matcher));
            const actual2 = pipe(Result.Err(404), Result.matchOrElse(matcher));
            // assert
            expect(actual1).toBe(6);
            expect(actual2).toBe(0);
        });

        it("can match using raw values", () => {
            // arrange
            const matcher = {
                err: "err!",
                orElse: "orElse",
            };
            // act
            const actual1 = pipe(Result.Ok("stink!"), Result.matchOrElse(matcher));
            const actual2 = pipe(Result.Err(404), Result.matchOrElse(matcher));
            // assert
            expect(actual1).toBe("orElse");
            expect(actual2).toBe("err!");
        });

        it("allows nullish matcher values", () => {
            // arrange
            const matcher = {
                ok: null,
                orElse: undefined,
            };
            // act
            const actual1 = pipe(Result.Ok("stink!"), Result.matchOrElse(matcher));
            // const actual2 = pipe(Result.Err(404), Result.matchOrElse(matcher));
            // assert
            expect(actual1).toBe(null);
            // expect(actual2).toBe(undefined);
        });

        it("allows falsy matcher values", () => {
            // arrange
            const matcher = {
                err: "",
                orElse: 0,
            };
            // act
            const actual1 = pipe(
                Result.Ok("stink!"),
                Result.matchOrElse<string, never, number | string>(matcher)
            );
            const actual2 = pipe(
                Result.Err(404),
                Result.matchOrElse<never, number, number | string>(matcher)
            );
            // assert
            expect(actual1).toBe(0);
            expect(actual2).toBe("");
        });
    });

    describe("map", () => {
        it("returns a mapped Ok if given an Ok", () => {
            expect(
                pipe(
                    Result.Ok(55),
                    Result.map(n => n * 2)
                )
            ).toStrictEqual(Result.Ok(110));
        });
    });
});

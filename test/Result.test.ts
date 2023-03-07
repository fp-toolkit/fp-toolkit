import { describe, it, expect, vi } from "vitest";
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
            const actual1 = pipe(Result.of("stink!"), Result.match(matcher));
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
            const actual2 = pipe(Result.Err(404), Result.matchOrElse(matcher));
            // assert
            expect(actual1).toBe(null);
            expect(actual2).toBe(undefined);
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

        it("ignores Err values", () => {
            expect(
                pipe(
                    Result.Err("cheese melted"),
                    Result.map((n: number) => n * 2)
                )
            ).toStrictEqual(Result.Err("cheese melted"));
        });
    });

    describe("mapErr", () => {
        it("returns a mapped Err if given an Err", () => {
            expect(
                pipe(
                    Result.Err(55),
                    Result.mapErr(n => n * 2)
                )
            ).toStrictEqual(Result.Err(110));
        });

        it("ignores Ok values", () => {
            expect(
                pipe(
                    Result.Ok("cheese"),
                    Result.mapErr((n: number) => n * 2)
                )
            ).toStrictEqual(Result.Ok("cheese"));
        });
    });

    describe("map2", () => {
        it("returns the projected value if both results are Ok", () => {
            // arrange
            const concat = (a: string, b: string) => `${a}${b}`;
            // act
            const actual = pipe([Result.Ok("a"), Result.Ok("b")], Result.map2(concat));
            // assert
            expect(actual).toStrictEqual(Result.Ok("ab"));
        });

        it.each([
            [[Result.Err("err1"), Result.Err("err2")], Result.Err("err1")],
            [[Result.Ok(20), Result.Err("err")], Result.Err("err")],
            [[Result.Err("err"), Result.Ok(20)], Result.Err("err")],
        ] as const)(
            "returns the first Err if either/both result is Err",
            (
                results: readonly [Result<number, string>, Result<number, string>],
                expected
            ) => {
                // arrange
                const add = (a: number, b: number) => a + b;
                // act
                const actual = pipe(results, Result.map2(add));
                // assert
                expect(actual).toStrictEqual(expected);
            }
        );
    });

    describe("map3", () => {
        it("returns the projected value if all three results are Ok", () => {
            // arrange
            const concat = (a: string, b: string, c: string) => `${a}${b}${c}`;
            // act
            const actual = pipe(
                [Result.Ok("a"), Result.Ok("b"), Result.Ok("c")],
                Result.map3(concat)
            );
            // assert
            expect(actual).toStrictEqual(Result.Ok("abc"));
        });

        it.each([
            [
                [Result.Err("err1"), Result.Err("err2"), Result.Err("err3")],
                Result.Err("err1"),
            ],
            [[Result.Ok(20), Result.Err("err1"), Result.Err("err2")], Result.Err("err1")],
            [[Result.Err("err1"), Result.Ok(20), Result.Err("err2")], Result.Err("err1")],
            [[Result.Err("err1"), Result.Err("err2"), Result.Ok(20)], Result.Err("err1")],
            [[Result.Err("err"), Result.Ok(10), Result.Ok(20)], Result.Err("err")],
            [[Result.Ok(10), Result.Ok(20), Result.Err("err")], Result.Err("err")],
        ] as const)(
            "returns the first found Err if any Result is Err",
            (
                results: readonly [
                    Result<number, string>,
                    Result<number, string>,
                    Result<number, string>
                ],
                expected
            ) => {
                // arrange
                const add = (a: number, b: number, c: number) => a + b + c;
                // act
                const actual = pipe(results, Result.map3(add));
                // assert
                expect(actual).toStrictEqual(expected);
            }
        );
    });

    describe("mapBoth", () => {
        it("returns a mapped Err if given an Err", () => {
            expect(
                pipe(
                    Result.Err(55),
                    Result.mapBoth(
                        (n: number) => n * 2,
                        n => n + 1
                    )
                )
            ).toStrictEqual(Result.Err(56));
        });

        it("returns a mapped Ok if given an Ok", () => {
            expect(
                pipe(
                    Result.Ok("cheese"),
                    Result.mapBoth(
                        s => s.length,
                        (s: string) => s.concat("eek")
                    )
                )
            ).toStrictEqual(Result.Ok(6));
        });
    });

    describe("defaultValue", () => {
        it("returns the Ok value for Oks", () => {
            expect(pipe(Result.Ok(1), Result.defaultValue(0))).toBe(1);
        });

        it("returns the fallback value for Errs", () => {
            expect(pipe(Result.Err("cheese"), Result.defaultValue(0))).toBe(0);
        });
    });

    describe("defaultWith", () => {
        it("returns the Ok value for Oks", () => {
            const f = vi.fn();
            expect(pipe(Result.Ok(1), Result.defaultWith(f))).toBe(1);
            expect(f).not.toHaveBeenCalled();
        });

        it("returns the fallback value for Errs", () => {
            const f = vi.fn(() => 0);
            expect(pipe(Result.Err("cheese"), Result.defaultWith(f))).toBe(0);
            expect(f).toHaveBeenCalledOnce();
        });
    });

    describe("bind", () => {
        it("maps the Ok value to a new Result", () => {
            expect(
                pipe(
                    Result.Ok(1),
                    Result.bind(n =>
                        n > 0 ? Result.Ok("positive") : Result.Err("not positive")
                    ),
                    Result.defaultValue("")
                )
            ).toBe("positive");
        });

        it("does nothing to an Err", () => {
            expect(
                pipe(
                    Result.Err("error"),
                    Result.bind((n: number) =>
                        n > 0 ? Result.Ok("positive") : Result.Err("not positive")
                    )
                )
            ).toStrictEqual(Result.Err("error"));
        });
    });

    describe("isOk", () => {
        it("returns true for Ok", () => {
            expect(Result.isOk(Result.Ok(1))).toBe(true);
        });

        it("returns false for Err", () => {
            expect(Result.isOk(Result.Err(1))).toBe(false);
        });
    });

    describe("isErr", () => {
        it("returns true for Err", () => {
            expect(Result.isErr(Result.Err(1))).toBe(true);
        });

        it("returns false for Ok", () => {
            expect(Result.isErr(Result.Ok(1))).toBe(false);
        });
    });

    describe("tryCatch", () => {
        it("yields an Ok if the function succeeds", () => {
            // arrange
            const f = () => 22;
            // act
            const actual = Result.tryCatch(f);
            // assert
            expect(actual).toStrictEqual(Result.Ok(22));
        });

        it.each([
            [new TypeError("type error"), new TypeError("type error")],
            [42, new Error("42")],
        ])(
            "yields an Err if the function throws (using default behavior when onThrow is omitted)",
            (thrown, expected) => {
                // arrange
                const f = () => {
                    throw thrown;
                };
                // act
                const actual = Result.tryCatch(f);
                // assert
                expect(actual).toStrictEqual(Result.Err(expected));
            }
        );

        it("yields an Err if the function throws (using onThrow when provided)", () => {
            // arrange
            const f = () => {
                throw new Error("cheese");
            };
            // act
            const actual = Result.tryCatch(f, () => new Error("aw, shucks"));
            // assert
            expect(actual).toStrictEqual(Result.Err(new Error("aw, shucks")));
        });
    });
});

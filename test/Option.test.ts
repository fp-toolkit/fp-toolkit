import { describe, it, expect, vi } from "vitest";
import { Option } from "../src/Option";
import { pipe } from "../src/composition";

describe("Option", () => {
    describe("constructors", () => {
        describe("Some", () => {
            it("creates a new Some instance", () => {
                expect(Option.Some(42)).toStrictEqual({
                    _tag: "option/some",
                    some: 42,
                });
            });
        });

        describe("None", () => {
            it("creates a new None instance", () => {
                expect(Option.None()).toStrictEqual({
                    _tag: "option/none",
                });
            });
        });
    });

    describe("ofNullish", () => {
        it.each([[null], [undefined]])("converts nullish values (%o) to None", inp => {
            expect(Option.ofNullish(inp)).toStrictEqual(Option.None());
        });

        it.each([
            [0, Option.Some(0)],
            [42, Option.Some(42)],
            ["", Option.Some("")],
            ["cheese", Option.Some("cheese")],
            [[], Option.Some([])],
            [[1], Option.Some([1])],
        ])("converts non-nullish values (%o) to Some", (inp, expected) => {
            expect(Option.ofNullish(inp)).toStrictEqual(expected);
        });
    });

    describe("toNullish", () => {
        it.each([
            [undefined, undefined],
            [false, undefined],
            [true, null],
        ])("converts None to a nullish value (useNull = %o)", (useNull, expected) => {
            expect(Option.toNullish(Option.None(), useNull)).toBe(expected);
        });

        it.each([
            [0, Option.Some(0)],
            [42, Option.Some(42)],
            ["", Option.Some("")],
            ["cheese", Option.Some("cheese")],
            [[], Option.Some([])],
            [[1], Option.Some([1])],
        ])("converts Some to a raw value (%o)", (expected, inp) => {
            expect(Option.toNullish<unknown>(inp)).toStrictEqual(expected);
        });
    });

    describe("isSome", () => {
        it("returns true for Some", () => {
            expect(Option.isSome(Option.Some(1))).toBe(true);
        });

        it("returns false for None", () => {
            expect(Option.isSome(Option.None())).toBe(false);
        });
    });

    describe("isNone", () => {
        it("returns true for None", () => {
            expect(Option.isNone(Option.None())).toBe(true);
        });

        it("returns false for Some", () => {
            expect(Option.isNone(Option.Some(1))).toBe(false);
        });
    });

    describe("map2", () => {
        it("returns the projected value if both Options are Some", () => {
            // arrange
            const add = (a: number, b: number) => a + b;
            // act
            const actual = pipe([Option.Some(2), Option.Some(3)], Option.map2(add));
            // assert
            expect(actual).toStrictEqual(Option.Some(5));
        });

        it.each([
            [[Option.None<number>(), Option.None<number>()]],
            [[Option.Some(2), Option.None<number>()]],
            [[Option.None<number>(), Option.Some(3)]],
        ] as const)("returns None if either/both of the Options are None", options => {
            // arrange
            const add = (a: number, b: number) => a + b;
            // act
            const actual = pipe(options, Option.map2(add));
            // assert
            expect(actual).toStrictEqual(Option.None());
        });
    });

    describe("bind", () => {
        it("returns Some if the given Option is Some and the projection returns Some", () => {
            // arrange
            const appendS = (s: string) => Option.Some(`${s}S`);
            // act
            const actual = pipe(Option.Some("cheese"), Option.bind(appendS));
            // assert
            expect(actual).toStrictEqual(Option.Some("cheeseS"));
        });

        it("returns None if the given Option is Some but the projection returns None", () => {
            // arrange
            const alwaysNone = () => Option.None();
            // act
            const actual = pipe(Option.Some("cheese"), Option.bind(alwaysNone));
            // assert
            expect(actual).toStrictEqual(Option.None());
        });

        it("returns None if the given Option is None, regardless of the projection", () => {
            // arrange
            const alwaysSome = () => Option.Some("cheese");
            // act
            const actual = pipe(Option.None(), Option.bind(alwaysSome));
            // assert
            expect(actual).toStrictEqual(Option.None());
        });
    });

    describe("defaultValue", () => {
        it("returns the wrapped value if the Option is Some", () => {
            const actual = pipe(Option.Some(33), Option.defaultValue(1));
            expect(actual).toBe(33);
        });

        it("returns the default value if the Option is None", () => {
            const actual = pipe(Option.None(), Option.defaultValue(1));
            expect(actual).toBe(1);
        });
    });

    describe("defaultWith", () => {
        it("returns the wrapped value if the Option is Some", () => {
            const fallbackFn = vi.fn(() => "default");
            const actual = pipe(Option.Some("cheese"), Option.defaultWith(fallbackFn));
            expect(actual).toBe("cheese");
            expect(fallbackFn).not.toHaveBeenCalled();
        });

        it("returns the default lambda result if the Option is None", () => {
            const actual = pipe(
                Option.None(),
                Option.defaultWith(() => "default")
            );
            expect(actual).toBe("default");
        });
    });

    describe("map", () => {
        it("returns a Some with projected inner value if Some", () => {
            const incr = (n: number) => n + 1;
            expect(pipe(Option.Some(22), Option.map(incr))).toStrictEqual(
                Option.Some(23)
            );
        });

        it("returns None if given None", () => {
            const incr = (n: number) => n + 1;
            expect(pipe(Option.None(), Option.map(incr))).toStrictEqual(Option.None());
        });
    });

    describe("match", () => {
        it.each([
            [Option.Some("cheese"), "cheese!"],
            [Option.None(), "!"],
        ])("can match with lambdas", (inp, expected) => {
            // arrange
            const exclaim = (s: string) => `${s}!`;

            const matcher = {
                some: exclaim,
                none: () => "!",
            };
            // act
            const actual = pipe(inp, Option.match(matcher));
            // assert
            expect(actual).toBe(expected);
        });

        it.each([
            [Option.Some("cheese"), "cheese!"],
            [Option.None(), "!"],
        ])("can match with raw values", (inp, expected) => {
            // arrange
            const matcher = {
                some: "cheese!",
                none: "!",
            };
            // act
            const actual = pipe(inp, Option.match(matcher));
            // assert
            expect(actual).toBe(expected);
        });

        it.each([
            [Option.Some(22), undefined],
            [Option.None<number>(), 0],
        ])("allows falsy values as matcher values", (inp, expected) => {
            // arrange
            const matcher = {
                some: undefined,
                none: 0,
            };
            // act
            const actual = pipe(inp, Option.match(matcher));
            // assert
            expect(actual).toBe(expected);
        });
    });

    describe("matchOrElse", () => {
        it("accepts a lambda for the orElse case", () => {
            // arrange
            const matcher = {
                orElse: () => 123,
            };
            // act
            const actual = pipe(Option.None(), Option.matchOrElse(matcher));
            // assert
            expect(actual).toBe(123);
        });

        it("accepts a raw value for the orElse case", () => {
            // arrange
            const matcher = {
                orElse: 123,
            };
            // act
            const actual = pipe(Option.None(), Option.matchOrElse(matcher));
            // assert
            expect(actual).toBe(123);
        });

        it("uses the Some case if given", () => {
            // arrange
            const matcher = {
                some: 456,
                orElse: 123,
            };
            // act
            const actual = pipe(Option.Some(0), Option.matchOrElse(matcher));
            // assert
            expect(actual).toBe(456);
        });

        it("uses the Nome case if given", () => {
            // arrange
            const matcher = {
                none: 456,
                orElse: 123,
            };
            // act
            const actual = pipe(Option.None(), Option.matchOrElse(matcher));
            // assert
            expect(actual).toBe(456);
        });
    });

    describe("filter", () => {
        it("returns Some if the predicate holds", () => {
            expect(
                pipe(
                    Option.Some("cheese"),
                    Option.filter(s => s.length < 10)
                )
            ).toStrictEqual(Option.Some("cheese"));
        });

        it("returns None if the predicate does not hold", () => {
            expect(
                pipe(
                    Option.Some("cheese"),
                    Option.filter(s => s.length > 10)
                )
            ).toStrictEqual(Option.None());
        });

        it("returns None if given None", () => {
            expect(
                pipe(
                    Option.None<string>(),
                    Option.filter(s => s.length > 10)
                )
            ).toStrictEqual(Option.None());
        });
    });

    describe("refine", () => {
        it("returns Some if the type guard holds", () => {
            expect(
                pipe(
                    Option.Some("cheese"),
                    Option.refine((s): s is "cheese" => s === "cheese")
                )
            ).toStrictEqual(Option.Some("cheese"));
        });

        it("returns None if the predicate does not hold", () => {
            expect(
                pipe(
                    Option.Some("cheese"),
                    Option.refine((s): s is "nope" => s === "nope")
                )
            ).toStrictEqual(Option.None());
        });

        it("returns None if given None", () => {
            expect(
                pipe(
                    Option.None<string>(),
                    Option.refine((s): s is "cheese" => s === "cheese")
                )
            ).toStrictEqual(Option.None());
        });
    });
});

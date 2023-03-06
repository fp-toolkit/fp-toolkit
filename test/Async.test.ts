import { describe, it, expect } from "vitest";
import { pipe } from "../src/composition";
import { Async } from "../src/Async";

describe("Async", () => {
    describe("constructors", () => {
        describe("of", () => {
            it("wraps a value in an Async", async () => {
                expect(await Async.of(22)()).toBe(22);
            });
        });
    });

    describe("map", () => {
        it("maps the inner value", async () => {
            expect(
                await pipe(
                    Async.of("cheese"),
                    Async.map(s => `${s} melted`),
                    Async.start
                )
            ).toBe("cheese melted");
        });
    });

    describe("bind", () => {
        it("flatMaps the inner value", async () => {
            // arrange
            const asyncIncr = (n: number) => Async.of(n + 1);
            // act
            const actual = await pipe(Async.of(2), Async.bind(asyncIncr), Async.start);
            // assert
            expect(actual).toBe(3);
        });
    });

    describe("flatten", () => {
        it("flattens a nested structure", async () => {
            expect(await pipe(Async.of(Async.of("a")), Async.flatten, Async.start)).toBe(
                "a"
            );
        });
    });

    describe("sequential", () => {
        it("executes the computations in series and collects the results", async () => {
            // arrange
            const comp1 = pipe(Async.of("1"));
            const comp2 = pipe(Async.of("2"), Async.delay(50));
            const comp3 = pipe(Async.of("3"), Async.delay(100));
            // act
            const actual = await pipe(
                [comp3, comp2, comp1],
                Async.sequential,
                Async.start
            );
            // assert
            expect(actual).toStrictEqual(["3", "2", "1"]);
        });
    });

    describe("asyncify", () => {
        it("converts a function with a single argument", async () => {
            // arrange
            const fakeIO = (fileName: string) => Promise.resolve([".txt", fileName]);

            const asyncified = Async.asyncify(fakeIO);
            // act
            const actual = await asyncified("file")();
            // assert
            expect(actual).toStrictEqual([".txt", "file"]);
        });

        it("converts a function with multiple arguments", async () => {
            // arrange
            const fakeIO = (fileName: string, lineNumber: number) =>
                Promise.resolve([".txt", fileName, `L${lineNumber}`]);

            const asyncified = Async.asyncify(fakeIO);
            // act
            const actual = await asyncified("file", 32)();
            // assert
            expect(actual).toStrictEqual([".txt", "file", "L32"]);
        });

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
                ]);

            const asyncified = Async.asyncify(fakeIO);
            // act
            const actual = await asyncified("file", ".md", [2, 8, 22], {
                skipChecks: false,
            })();
            // assert
            expect(actual).toStrictEqual([
                ".md",
                "file",
                "Lines:2,8,22",
                "Options:{ skipChecks = false }",
            ]);
        });
    });
});

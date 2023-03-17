import { describe, it, expect, test } from "vitest"
import { variant, variantC, VariantOf } from "../src/Variants"

const BasicTest = variant({
    emptyCase: {},
    dataCase: (datum: string) => ({ datum }),
    "1234": (field: number) => ({ field }),
})
type BasicTest = VariantOf<typeof BasicTest>

describe("Basic Tests", () => {
    describe("constructors", () => {
        it("generates a constructor (or constant for empty case) for every case", () => {
            expect(BasicTest.emptyCase).toStrictEqual({ _tag: "EmptyCase" })
            expect(BasicTest.dataCase("ipsum")).toStrictEqual({
                _tag: "DataCase",
                datum: "ipsum",
            })
            expect(BasicTest[1234](999)).toStrictEqual({ _tag: "1234", field: 999 })
        })
    })

    describe("match", () => {
        const matcher = {
            emptyCase: "empty",
            dataCase: ({ datum }: { datum: string }) => `datum=${datum}`,
            "1234": ({ field }: { field: number }) => `field=${field}`,
        }

        it.each([
            ["empty", BasicTest.emptyCase],
            ["datum=ipsum", BasicTest.dataCase("ipsum")],
            ["field=999", BasicTest[1234](999)],
        ] as const)("produces %s for %o", (expected, instance: BasicTest) => {
            expect(BasicTest.match(matcher)(instance)).toBe(expected)
        })
    })

    describe("matchOrElse", () => {
        const matcher = {
            emptyCase: "empty",
            dataCase: ({ datum }: { datum: string }) => `datum=${datum}`,
            orElse: "not matched",
        }

        it.each([
            ["empty", BasicTest.emptyCase],
            ["datum=ipsum", BasicTest.dataCase("ipsum")],
            ["not matched", BasicTest[1234](999)],
        ] as const)("produces %s for %o", (expected, instance: BasicTest) => {
            expect(BasicTest.matchOrElse(matcher)(instance)).toBe(expected)
        })
    })

    describe("types", () => {
        it("contains the expected types in the types 'magic' property", () => {
            expect(BasicTest.types.emptyCase).toBe("EmptyCase")
            expect(BasicTest.types.dataCase).toBe("DataCase")
            expect(BasicTest.types[1234]).toBe("1234")
        })
    })
})

const ScopedTest = variantC(
    {
        dog: (name: string) => ({ name }),
        cat: (livesLeft: number) => ({ livesLeft }),
        fish: {},
    },
    "type",
    "Pets/"
)
type ScopedTest = VariantOf<typeof ScopedTest>

const ConflictScopedTest = variantC(
    {
        dog: (name: string) => ({ name }),
        cat: (livesLeft: number) => ({ livesLeft }),
        fish: {},
    },
    "type",
    "Animals/"
)

describe("Scoped Tests", () => {
    describe("constructors", () => {
        it("generates a constructor for every entry", () => {
            expect(ScopedTest.dog("Fido")).toStrictEqual({
                type: "Pets/Dog",
                name: "Fido",
            })
            expect(ScopedTest.cat(7)).toStrictEqual({
                type: "Pets/Cat",
                livesLeft: 7,
            })
            expect(ScopedTest.fish).toStrictEqual({ type: "Pets/Fish" })
        })
    })

    describe("match", () => {
        const matcher = {
            dog: ({ name }: { name: string }) => `Woof! My name is ${name}.`,
            cat: ({ livesLeft }: { livesLeft: number }) =>
                `Meow! I have ${livesLeft} lives left.`,
            fish: () => "Blub blub.",
        }

        it.each([
            ["Woof! My name is Fido.", ScopedTest.dog("Fido")],
            ["Meow! I have 7 lives left.", ScopedTest.cat(7)],
            ["Blub blub.", ScopedTest.fish],
        ] as const)("produces %s for %o", (expected, instance: ScopedTest) => {
            expect(ScopedTest.match(matcher)(instance)).toBe(expected)
        })
    })

    describe("matchOrElse", () => {
        const matcher = {
            dog: "dog",
            cat: "cat",
            orElse: () => "not a mammal",
        }

        it.each([
            ["dog", ScopedTest.dog("Fido")],
            ["cat", ScopedTest.cat(7)],
            ["not a mammal", ScopedTest.fish],
        ] as const)("produces %s for %o", (expected, instance: ScopedTest) => {
            expect(ScopedTest.matchOrElse(matcher)(instance)).toBe(expected)
        })
    })

    describe("types", () => {
        it("contains the expected types in the types 'magic' property", () => {
            expect(ScopedTest.types.dog).toBe("Pets/Dog")
            expect(ScopedTest.types.cat).toBe("Pets/Cat")
            expect(ScopedTest.types.fish).toBe("Pets/Fish")
        })
    })
})

describe("Conflicting Scope Tests", () => {
    describe("matchOrElse", () => {
        test("a variant with the same structure will not match if their scopes are different", () => {
            // arrange
            const matcher = {
                dog: "pets dog",
                cat: "pets cat",
                fish: "pets fish",
                orElse: "not in scope",
            }

            const differentlyScoped = ConflictScopedTest.dog("Fido")
            // act
            // `as any` is because redux reducers don't get type-checked at runtime
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            const actual = ScopedTest.matchOrElse(matcher)(differentlyScoped as any)
            // assert
            expect(actual).toBe("not in scope")
        })
    })

    describe("match", () => {
        test("a variant with the same structure will not match if their scopes are different", () => {
            // arrange
            const matcher = {
                dog: () => "pets dog",
                cat: () => "pets cat",
                fish: () => "pets fish",
            }

            const differentlyScoped = ConflictScopedTest.dog("Fido")
            // act & assert
            // `as any` is because redux reducers don't get type-checked at runtime
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            expect(() => ScopedTest.match(matcher)(differentlyScoped as any)).toThrow(
                "Expected to be given a variant with scope Pets/. Actual type was Animals/Dog"
            )
        })
    })
})

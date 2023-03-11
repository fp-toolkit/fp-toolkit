import { describe, it, expect } from "vitest"
import { Map } from "../src/Map"
import { pipe } from "../src/composition"
import { EqualityComparer, OrderingComparer } from "../src/prelude"

interface Cheese {
    readonly name: string
    readonly age: number
}

const cheeseByAgeComparer: OrderingComparer<Cheese> = {
    compare: (c1, c2) => (c1.age === c2.age ? 0 : c1.age < c2.age ? -1 : 1),
    equals: (c1, c2) => c1.age === c2.age,
}

const cheeseEqualityComparer: EqualityComparer<Cheese> = {
    equals: (c1, c2) => c1.name === c2.name,
}

describe("Map", () => {
    describe("add", () => {
        it("adds a new key/value to an empty map", () => {
            expect(pipe(Map.empty(), Map.add(["Albus", 12]))).toStrictEqual(
                new globalThis.Map([["Albus", 12]])
            )
        })

        it("adds a new key/value to a non-empty map without the same key using default equality", () => {
            expect(
                pipe(new globalThis.Map([["Fido", 44]]), Map.add(["Albus", 12]))
            ).toStrictEqual(
                new globalThis.Map([
                    ["Fido", 44],
                    ["Albus", 12],
                ])
            )
        })

        it("overrides a key/value to a non-empty map with the same key using default equality", () => {
            expect(
                pipe(new globalThis.Map([["Fido", 44]]), Map.add(["Fido", 12]))
            ).toStrictEqual(new globalThis.Map([["Fido", 12]]))
        })

        it("adds a new key/value to a non-empty map without the same key using custom equality", () => {
            expect(
                pipe(
                    new globalThis.Map([[{ name: "Gouda", age: 2 }, "AA"]]),
                    Map.add([{ name: "Cheddar", age: 0.5 }, "C"], cheeseEqualityComparer)
                )
            ).toStrictEqual(
                new globalThis.Map([
                    [{ name: "Gouda", age: 2 }, "AA"],
                    [{ name: "Cheddar", age: 0.5 }, "C"],
                ])
            )
        })

        it("adds a new key/value to a non-empty map with the same key using custom equality", () => {
            expect(
                pipe(
                    new globalThis.Map([[{ name: "Gouda", age: 2 }, "AA"]]),
                    Map.add([{ name: "Gouda", age: 2 }, "B"], cheeseEqualityComparer)
                )
            ).toStrictEqual(new globalThis.Map([[{ name: "Gouda", age: 2 }, "B"]]))
        })
    })
})

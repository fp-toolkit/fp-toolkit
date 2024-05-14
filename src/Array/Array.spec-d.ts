import { describe, expectTypeOf, it } from "vitest"
import { pipe } from "../Composition"
import { Array } from "../Array"
import type { NonEmptyArray } from "../NonEmptyArray"

describe("Array", () => {
    it("returns the correct key type for a more specific string key", () => {
        // arrange
        type CheeseType = "fresh" | "soft" | "semi-soft"
        const arr: { type: CheeseType; name: string }[] = [
            { type: "fresh", name: "chevre" },
            { type: "fresh", name: "feta" },
            { type: "soft", name: "brie" },
            { type: "semi-soft", name: "muenster" },
            { type: "semi-soft", name: "mozzarella" },
        ]
        // act
        const actual = pipe(
            arr,
            Array.groupBy(c => c.type)
        )
        // assert
        expectTypeOf(actual).toEqualTypeOf<
            ReadonlyMap<
                CheeseType,
                NonEmptyArray<{
                    type: CheeseType
                    name: string
                }>
            >
        >()
    })
})

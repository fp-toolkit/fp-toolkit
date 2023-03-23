import { describe, it, expect, vi } from "vitest"
import { tee, teeAsync } from "../src/function"
import { flow, pipe } from "../src/Composition"

describe("function", () => {
    describe("tee", () => {
        it("executes the side effect and passes through the value", () => {
            // arrange
            const log = vi.fn()
            const double = (n: number) => n * 2
            // act
            const actual = pipe(42, tee(log), double, String)
            // assert
            expect(actual).toBe("84")
            expect(log).toHaveBeenCalledOnce()
            expect(log).toHaveBeenCalledWith(42)
        })
    })

    describe("teeAsync", () => {
        it("executes the side effect on the resolved value and passes through the promise", async () => {
            // arrange
            const log: (n: number) => void = vi.fn()
            const double = (n: number) => n * 2
            // act
            const actual = await pipe(Promise.resolve(42), teeAsync(log), p =>
                p.then(flow(double, String))
            )
            // assert
            expect(actual).toBe("84")
            expect(log).toHaveBeenCalledOnce()
            expect(log).toHaveBeenCalledWith(42)
        })
    })
})

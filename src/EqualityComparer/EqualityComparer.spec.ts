import { describe, expect, it } from "vitest"
import { EqualityComparer } from "../EqualityComparer"

interface ParentThing {
    readonly id: string
    readonly child: Thing
}

interface Thing {
    readonly id: number
}

describe("EqualityComparer", () => {
    describe("ofEquals", () => {
        const thing = { id: 1 }

        it.each([
            [true, "equal", { id: 12 }, { id: 12 }],
            [false, "not equal", { id: 3 }, { id: 9 }],
            [true, "same exact reference", thing, thing],
        ])(
            "constructs an equality comparer from an equals function (returns %o when %s)",
            (expected, _, t1, t2) => {
                const eq = EqualityComparer.ofEquals<Thing>(
                    (thing1, thing2) => thing1.id === thing2.id
                )

                expect(eq.equals(t1, t2)).toBe(eq.equals(t2, t1))
                expect(eq.equals(t1, t2)).toBe(expected)
            }
        )
    })

    describe("deriveFrom", () => {
        const thing = { id: 1 }

        it.each([
            [true, "equal", { id: 12 }, { id: 12 }],
            [false, "not equal", { id: 3 }, { id: 9 }],
            [true, "same exact reference", thing, thing],
        ])(
            "constructs an equality comparer from an existing one + a (contra)map function [returns %o when %s]",
            (expected, _, t1, t2) => {
                const eq = EqualityComparer.deriveFrom<number, Thing>(
                    EqualityComparer.Number,
                    thing => thing.id
                )

                expect(eq.equals(t1, t2)).toBe(eq.equals(t2, t1))
                expect(eq.equals(t1, t2)).toBe(expected)
            }
        )
    })

    describe("ofStruct", () => {
        const eqChild = EqualityComparer.ofStruct<Thing>({
            id: EqualityComparer.Number,
        })

        const eqParent = EqualityComparer.ofStruct<ParentThing>({
            id: EqualityComparer.String,
            child: eqChild,
        })

        it("returns true if comparing the exact same reference", () => {
            const parent: ParentThing = {
                id: "101",
                child: { id: 20 },
            }

            expect(eqParent.equals(parent, parent)).toBe(true)
        })

        it("returns true if comparing two structurally equivalent values", () => {
            const p1: ParentThing = {
                id: "101",
                child: { id: 20 },
            }

            const p2: ParentThing = {
                id: "101",
                child: { id: 20 },
            }

            expect(eqParent.equals(p1, p2)).toBe(eqParent.equals(p2, p1))
            expect(eqParent.equals(p1, p2)).toBe(true)
        })

        it("returns false if comparing two structurally inequivalent values", () => {
            const p1: ParentThing = {
                id: "101",
                child: { id: 20 },
            }

            const p2: ParentThing = {
                id: "10",
                child: { id: 20 },
            }

            expect(eqParent.equals(p1, p2)).toBe(eqParent.equals(p2, p1))
            expect(eqParent.equals(p1, p2)).toBe(false)
        })
    })

    describe("Date", () => {
        const piDay = new Date(2023, 2, 14)

        it.each([
            [true, "equal", new Date(2023, 2, 15), new Date(2023, 2, 15)],
            [true, "same exact reference", piDay, piDay],
            [false, "not equal", new Date(2023, 2, 15), new Date(2025, 1, 15)],
        ])(
            "provides equality for dates (returns %o when %s)",
            (expected, _, dt1, dt2) => {
                const { equals } = EqualityComparer.Date
                expect(equals(dt1, dt2)).toBe(equals(dt2, dt1))
                expect(equals(dt1, dt2)).toBe(expected)
            }
        )
    })
})

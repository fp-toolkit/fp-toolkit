import { describe, it, expect } from "vitest"
import { OrderingComparer } from "../src/OrderingComparer"

interface Person {
    readonly name: string
}

interface Cat {
    readonly name: string
    readonly age: number
    readonly livesRemaining: number
}

describe("OrderingComparer", () => {
    describe("ofCompare", () => {
        it("costructs a new OrderingComparer from a compare function", () => {
            const { compare } = OrderingComparer.ofCompare<number>(
                (n1, n2) => (n1 === n2 ? 0 : n1 > n2 ? -1 : 1) // numbers in desc order
            )
            expect(compare(5, 5)).toBe(0)
            expect(compare(6, 5)).toBe(-1)
            expect(compare(5, 6)).toBe(1)
            expect(compare(100, 0)).toBe(-1)
            expect(compare(0, 100)).toBe(1)
        })
    })

    describe("Number", () => {
        it("sorts numbers in ascending order", () => {
            const { compare } = OrderingComparer.Number

            const shuffledNumbers = [-11, -13, 2, 0, 45, 1, 8, 2, 100, -1]

            expect(shuffledNumbers.slice(0).sort(compare)).toStrictEqual([
                -13, -11, -1, 0, 1, 2, 2, 8, 45, 100,
            ])
        })
    })

    describe("reverse", () => {
        it("reverses the sort order", () => {
            const { compare } = OrderingComparer.reverse(OrderingComparer.Number)

            const shuffledNumbers = [-11, -13, 2, 0, 45, 1, 8, 2, 100, -1]

            expect(shuffledNumbers.slice(0).sort(compare)).toStrictEqual([
                100, 45, 8, 2, 2, 1, 0, -1, -11, -13,
            ])
        })
    })

    describe("deriveFrom", () => {
        it("can use an existing OrderingComparer to make a new one with a map function", () => {
            const { compare } = OrderingComparer.deriveFrom<string, Person>(
                OrderingComparer.String,
                p => p.name
            )

            const unsortedPeople = [
                { name: "Johnny" },
                { name: "Larry" },
                { name: "Amy" },
                { name: "Kevin" },
            ]

            expect(unsortedPeople.slice(0).sort(compare)).toStrictEqual([
                { name: "Amy" },
                { name: "Johnny" },
                { name: "Kevin" },
                { name: "Larry" },
            ])
        })
    })

    describe("getComposite", () => {
        it("applies multiple OrderingComparers in a 'and then by,' 'and then by,' fashion", () => {
            // arrange
            const byName = OrderingComparer.deriveFrom<string, Cat>(
                OrderingComparer.String,
                c => c.name
            )
            const byAge = OrderingComparer.deriveFrom<number, Cat>(
                OrderingComparer.Number,
                c => c.age
            )
            const byLivesRemainingDesc = OrderingComparer.deriveFrom<number, Cat>(
                OrderingComparer.reverse(OrderingComparer.Number),
                c => c.livesRemaining
            )

            const { compare } = OrderingComparer.getComposite(
                byName,
                byAge,
                byLivesRemainingDesc
            )

            const shuffledCats: Cat[] = [
                { name: "Gerald", age: 5, livesRemaining: 9 },
                { name: "Rufus", age: 10, livesRemaining: 3 },
                { name: "Gerald", age: 5, livesRemaining: 7 },
                { name: "Arnold", age: 1, livesRemaining: 9 },
                { name: "Rufus", age: 10, livesRemaining: 1 },
                { name: "Gerald", age: 7, livesRemaining: 8 },
            ]

            const sortedCats: Cat[] = [
                { name: "Arnold", age: 1, livesRemaining: 9 },
                { name: "Gerald", age: 5, livesRemaining: 9 },
                { name: "Gerald", age: 5, livesRemaining: 7 },
                { name: "Gerald", age: 7, livesRemaining: 8 },
                { name: "Rufus", age: 10, livesRemaining: 3 },
                { name: "Rufus", age: 10, livesRemaining: 1 },
            ]
            // act
            const actual = shuffledCats.slice(0).sort(compare)
            // assert
            expect(actual).toStrictEqual(sortedCats)
        })
    })

    describe("Date", () => {
        it("sorts dates in ascending order", () => {
            const { compare } = OrderingComparer.Date
            expect(
                [
                    new Date(2023, 2, 15),
                    new Date(2025, 2, 15),
                    new Date(2022, 2, 15),
                    new Date(2020, 2, 15),
                ]
                    .slice(0)
                    .sort(compare)
            ).toStrictEqual([
                new Date(2020, 2, 15),
                new Date(2022, 2, 15),
                new Date(2023, 2, 15),
                new Date(2025, 2, 15),
            ])
        })
    })
})

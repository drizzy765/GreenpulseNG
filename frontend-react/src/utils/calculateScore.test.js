import { describe, it, expect } from 'vitest'
import { calculateEmission } from './calculateScore'

describe('calculateEmission', () => {
    it('calculates correctly', () => {
        expect(calculateEmission(10, 0.5)).toBe(5)
    })
    it('handles zeros', () => {
        expect(calculateEmission(0, 0.5)).toBe(0)
        expect(calculateEmission(10, 0)).toBe(0)
    })
    it('handles strings', () => {
        expect(calculateEmission('10', '0.5')).toBe(5)
    })
    it('handles precision', () => {
        expect(calculateEmission(10.123, 2.5)).toBe(25.3075)
    })
})

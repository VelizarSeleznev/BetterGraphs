import { describe, expect, it } from 'vitest'
import { computeRegression, computeQuadraticRegression } from './regression'

describe('linear regression', () => {
  it('fits a perfect line', () => {
    const pts = [
      { x: 42, y: 1 },
      { x: 56, y: 2 },
      { x: 70, y: 3 },
      { x: 84, y: 4 },
    ]
    const r = computeRegression(pts, false)
    expect(r.n).toBe(4)
    expect(r.r2).toBeCloseTo(1, 10)
  })
  it('through origin changes slope', () => {
    const pts = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]
    const r = computeRegression(pts, true)
    expect(r.b).toBe(0)
    expect(r.a).toBeCloseTo(1, 6)
  })
  it('no variance in X', () => {
    const pts = [
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 3 },
    ]
    const r = computeRegression(pts, false)
    expect(Number.isFinite(r.a)).toBe(false)
  })
})

describe('quadratic regression', () => {
  it('fits a simple parabola', () => {
    // y = 2x^2 + 3x + 1
    const pts = [] as { x: number; y: number }[]
    for (let x = -3; x <= 3; x++) pts.push({ x, y: 2 * x * x + 3 * x + 1 })
    const r = computeQuadraticRegression(pts)
    expect(r.n).toBe(7)
    expect(r.model).toBe('quadratic')
    expect(r.r2).toBeCloseTo(1, 10)
    expect(r.a).toBeCloseTo(2, 6)
    expect(r.b).toBeCloseTo(3, 6)
    expect(r.c!).toBeCloseTo(1, 6)
  })
})

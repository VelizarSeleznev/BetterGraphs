import type { XYPair } from '../types'

export function computeRegression(points: XYPair[], throughZero: boolean) {
  const n = points.length
  if (n === 0) return { a: NaN, b: NaN, r2: NaN, n: 0 }
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0,
    sumYY = 0
  for (const { x, y } of points) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
    sumYY += y * y
  }
  let a: number
  let b: number
  if (throughZero) {
    if (sumXX === 0) return { a: NaN, b: 0, r2: 0, n }
    a = sumXY / sumXX
    b = 0
  } else {
    const denom = n * sumXX - sumX * sumX
    if (denom === 0) return { a: NaN, b: NaN, r2: 0, n }
    a = (n * sumXY - sumX * sumY) / denom
    b = (sumY - a * sumX) / n
  }
  // R^2
  const yBar = sumY / n
  let ssTot = 0
  let ssRes = 0
  for (const { x, y } of points) {
    const yHat = a * x + b
    ssTot += (y - yBar) * (y - yBar)
    ssRes += (y - yHat) * (y - yHat)
  }
  let r2: number
  if (ssTot === 0) {
    r2 = ssRes === 0 ? 1 : 0
  } else {
    r2 = 1 - ssRes / ssTot
  }
  return { a, b, r2, n }
}


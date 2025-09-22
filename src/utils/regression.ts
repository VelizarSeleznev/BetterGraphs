import type { XYPair } from '../types'

export function computeLinearRegression(points: XYPair[], throughZero: boolean) {
  const n = points.length
  if (n === 0) return { a: NaN, b: NaN, r2: NaN, n: 0, model: 'linear' as const }
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
    if (sumXX === 0) return { a: NaN, b: 0, r2: 0, n, model: 'linear' as const }
    a = sumXY / sumXX
    b = 0
  } else {
    const denom = n * sumXX - sumX * sumX
    if (denom === 0) return { a: NaN, b: NaN, r2: 0, n, model: 'linear' as const }
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
  return { a, b, r2, n, model: 'linear' as const }
}

export function computeQuadraticRegression(points: XYPair[]) {
  const n = points.length
  if (n === 0) return { a: NaN, b: NaN, c: NaN, r2: NaN, n: 0, model: 'quadratic' as const }
  let Sx = 0,
    Sx2 = 0,
    Sx3 = 0,
    Sx4 = 0,
    Sy = 0,
    Sxy = 0,
    Sx2y = 0
  for (const { x, y } of points) {
    const x2 = x * x
    Sx += x
    Sx2 += x2
    Sx3 += x2 * x
    Sx4 += x2 * x2
    Sy += y
    Sxy += x * y
    Sx2y += x2 * y
  }
  // Normal equations
  // [ Sx4 Sx3 Sx2 ] [a] = [ Sx2y ]
  // [ Sx3 Sx2 Sx  ] [b]   [ Sxy  ]
  // [ Sx2 Sx  n   ] [c]   [ Sy   ]
  const A = [
    [Sx4, Sx3, Sx2],
    [Sx3, Sx2, Sx],
    [Sx2, Sx, n],
  ]
  const B = [Sx2y, Sxy, Sy]

  function solve3(a: number[][], b: number[]): number[] | null {
    // Gaussian elimination with partial pivoting (3x3)
    const M = [a[0].slice(), a[1].slice(), a[2].slice()]
    const v = b.slice()
    for (let col = 0; col < 3; col++) {
      // pivot
      let piv = col
      for (let r = col + 1; r < 3; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
      }
      if (Math.abs(M[piv][col]) < 1e-12) return null
      if (piv !== col) {
        ;[M[col], M[piv]] = [M[piv], M[col]]
        ;[v[col], v[piv]] = [v[piv], v[col]]
      }
      // eliminate below
      for (let r = col + 1; r < 3; r++) {
        const f = M[r][col] / M[col][col]
        for (let c = col; c < 3; c++) M[r][c] -= f * M[col][c]
        v[r] -= f * v[col]
      }
    }
    // back substitution
    const x = [0, 0, 0]
    for (let i = 2; i >= 0; i--) {
      let s = v[i]
      for (let j = i + 1; j < 3; j++) s -= M[i][j] * x[j]
      x[i] = s / M[i][i]
    }
    return x
  }

  const sol = solve3(A, B)
  if (!sol) return { a: NaN, b: NaN, c: NaN, r2: 0, n, model: 'quadratic' as const }
  const [a, b, c] = sol

  // R^2
  const yBar = Sy / n
  let ssTot = 0
  let ssRes = 0
  for (const { x, y } of points) {
    const yHat = a * x * x + b * x + c
    ssTot += (y - yBar) * (y - yBar)
    ssRes += (y - yHat) * (y - yHat)
  }
  const r2 = ssTot === 0 ? (ssRes === 0 ? 1 : 0) : 1 - ssRes / ssTot
  return { a, b, c, r2, n, model: 'quadratic' as const }
}

// Backwards-compatible name used by existing store code (linear only)
export function computeRegression(points: XYPair[], throughZero: boolean) {
  return computeLinearRegression(points, throughZero)
}

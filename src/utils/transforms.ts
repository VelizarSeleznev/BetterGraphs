import type { XYPair, ViewSpec } from '../types'

export function dropNaNFinite(pairs: XYPair[]): XYPair[] {
  return pairs.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
}

export function autoDomain(vals: number[], padRatio = 0.08): [number, number] {
  if (vals.length === 0) return [0, 1]
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  const pad = span * padRatio
  return [min - pad, max + pad]
}

export function hasVariance(vals: number[]): boolean {
  if (vals.length === 0) return false
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  return min !== max
}

export function applyDisplayTransforms(pairs: XYPair[], view: ViewSpec): [XYPair[], string[]] {
  let out = pairs
  const messages: string[] = []
  if (view.normalize) {
    const xs = out.map((p) => p.x)
    const ys = out.map((p) => p.y)
    const [xmin, xmax] = autoDomain(xs, 0)
    const [ymin, ymax] = autoDomain(ys, 0)
    const dx = xmax - xmin || 1
    const dy = ymax - ymin || 1
    out = out.map((p) => ({ x: (p.x - xmin) / dx, y: (p.y - ymin) / dy }))
  }
  if (view.logX || view.logY) {
    const was = out
    out = out.filter((p) => (!view.logX || p.x > 0) && (!view.logY || p.y > 0))
    if (out.length < was.length) messages.push('Log scale hides ≤ 0 values from view')
    out = out.map((p) => ({
      x: view.logX ? Math.log10(p.x) : p.x,
      y: view.logY ? Math.log10(p.y) : p.y,
    }))
  }
  return [out, messages]
}

export function estimateScreenSlope(a: number, scaleX: number, scaleY: number): number {
  // slope in screen px per px: dy/dx in screen space
  // data y = a x + b; in screen, slope multiplied by scale factors
  return Math.abs(a) * (scaleY / scaleX)
}


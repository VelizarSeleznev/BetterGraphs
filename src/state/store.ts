import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Column, DatasetState, PredictionMode, TableData, XYPair, RegressionModel } from '../types'
import { computeLinearRegression, computeQuadraticRegression } from '../utils/regression'
import { autoDomain, applyDisplayTransforms, dropNaNFinite, hasVariance } from '../utils/transforms'

function makeInitialTable(): TableData {
  const rows = 10
  const blank = Array.from({ length: rows }, () => null as number | null)
  return {
    columns: [
      { key: uuidv4(), name: 'X', values: [...blank], type: 'number' },
      { key: uuidv4(), name: 'Y', values: [...blank], type: 'number' },
    ],
  }
}

function defaultState(): DatasetState {
  const table = makeInitialTable()
  const [x, y] = table.columns
  return {
    table,
    plot: {
      xKey: x.key,
      yKey: y.key,
      mode: 'scatter',
      axisLabelX: x.name,
      axisLabelY: y.name,
      color: '#60a5fa',
      lineColor: '#60a5fa',
      pointColor: '#60a5fa',
      lineWidth: 3,
      pointRadius: 5.5,
    },
    regression: { enabled: false, throughZero: false, model: 'linear' },
    prediction: { enabled: false, mode: 'x', color: '#ff4d8d' },
    view: {
      aspect: 1,
      normalize: false,
      logX: false,
      logY: false,
      margins: { top: 16, right: 16, bottom: 48, left: 72 },
    },
  }
}

export type Store = DatasetState & {
  // table ops
  setTable: (td: TableData) => void
  addRow: () => void
  addColumn: (col: Partial<Pick<Column, 'name' | 'type'>>) => void
  removeColumn: (key: string) => void
  setCell: (colKey: string, row: number, value: number | null) => void
  renameColumn: (colKey: string, name: string) => void
  setUnit: (colKey: string, unit?: string) => void

  // plot ops
  setXY: (xKey: string, yKey: string) => void
  setAxisLabels: (x: string, y: string) => void
  setMode: (mode: 'scatter' | 'line') => void
  setPlotStyle: (s: Partial<{ color: string; lineWidth: number; pointRadius: number; lineColor: string; pointColor: string }>) => void

  // view ops
  setAspect: (a: number) => void
  setNormalize: (b: boolean) => void
  setLogX: (b: boolean) => void
  setLogY: (b: boolean) => void
  setDomains: (dx?: [number, number], dy?: [number, number]) => void
  fitNicely: () => void

  // regression
  toggleRegression: (enabled: boolean) => void
  setThroughZero: (b: boolean) => void
  setRegressionModel: (m: RegressionModel) => void
  recomputeRegression: () => void

  // prediction point
  setPredictionEnabled: (b: boolean) => void
  setPredictionMode: (m: PredictionMode) => void
  setPredictionValue: (v?: number) => void
  setPredictionColor: (c: string) => void

  // derived
  numericPairs: () => XYPair[]
}

export const useDatasetStore = create<Store>()((set, get) => ({
  ...defaultState(),

  setTable: (td) => set({ table: td }),
  addRow: () =>
    set((s) => ({
      table: {
        columns: s.table.columns.map((c) => ({ ...c, values: [...c.values, null] })),
      },
    })),
  addColumn: ({ name = 'C', type = 'number' }) =>
    set((s) => ({
      table: {
        columns: [
          ...s.table.columns,
          {
            key: crypto.randomUUID ? crypto.randomUUID() : uuidv4(),
            name,
            type,
            values: Array.from({ length: s.table.columns[0]?.values.length ?? 0 }, () => null),
          },
        ],
      },
    })),
  removeColumn: (key) =>
    set((s) => ({ table: { columns: s.table.columns.filter((c) => c.key !== key) } })),
  setCell: (colKey, row, value) =>
    set((s) => ({
      table: {
        columns: s.table.columns.map((c) =>
          c.key === colKey
            ? { ...c, values: c.values.map((v, i) => (i === row ? value : v)) }
            : c
        ),
      },
    })),
  renameColumn: (colKey, name) =>
    set((s) => ({
      table: { columns: s.table.columns.map((c) => (c.key === colKey ? { ...c, name } : c)) },
      plot:
        s.plot.xKey === colKey
          ? { ...s.plot, axisLabelX: name }
          : s.plot.yKey === colKey
          ? { ...s.plot, axisLabelY: name }
          : s.plot,
    })),
  setUnit: (colKey, unit) =>
    set((s) => ({
      table: { columns: s.table.columns.map((c) => (c.key === colKey ? { ...c, unit } : c)) },
      plot:
        s.plot.xKey === colKey
          ? { ...s.plot, axisLabelX: unit ? `${s.plot.axisLabelX.split(' [')[0]} [${unit}]` : s.plot.axisLabelX.split(' [')[0] }
          : s.plot.yKey === colKey
          ? { ...s.plot, axisLabelY: unit ? `${s.plot.axisLabelY.split(' [')[0]} [${unit}]` : s.plot.axisLabelY.split(' [')[0] }
          : s.plot,
    })),

  setXY: (xKey, yKey) => set((s) => ({ plot: { ...s.plot, xKey, yKey } })),
  setAxisLabels: (axisLabelX, axisLabelY) => set((s) => ({ plot: { ...s.plot, axisLabelX, axisLabelY } })),
  setMode: (mode) => set((s) => ({ plot: { ...s.plot, mode } })),
  setPlotStyle: (sty) => set((s) => ({ plot: { ...s.plot, ...sty } })),

  setAspect: (a) => set((s) => ({ view: { ...s.view, aspect: a } })),
  setNormalize: (b) => set((s) => ({ view: { ...s.view, normalize: b } })),
  setLogX: (b) => set((s) => ({ view: { ...s.view, logX: b } })),
  setLogY: (b) => set((s) => ({ view: { ...s.view, logY: b } })),
  setDomains: (dx, dy) => set((s) => ({ view: { ...s.view, domainX: dx, domainY: dy } })),
  fitNicely: () => {
    const s = get()
    const pairs = s.numericPairs()
    const { view, regression, prediction } = s
    const [displayPairs] = applyDisplayTransforms(pairs, view)
    const xValues = displayPairs.map((p) => p.x)
    const yValues = displayPairs.map((p) => p.y)

    // If regression is enabled and has a result, include curve endpoints in domain
    if (regression.enabled && regression.result && Number.isFinite(regression.result.a) && Number.isFinite(regression.result.b)) {
      const [xMin, xMax] = autoDomain(xValues)
      if ((regression.result.model || 'linear') === 'quadratic' && Number.isFinite(regression.result.c as number)) {
        const a = regression.result.a
        const b = regression.result.b
        const c = regression.result.c as number
        const f = (x: number) => a * x * x + b * x + c
        const y0 = f(xMin)
        const y1 = f(xMax)
        yValues.push(y0, y1)
        if (a !== 0) {
          const xv = -b / (2 * a)
          if (xv > xMin && xv < xMax) yValues.push(f(xv))
        }
      } else {
        const a = regression.result.a
        const b = regression.result.b
        const y0 = a * xMin + b
        const y1 = a * xMax + b
        yValues.push(y0, y1)
      }
    }

    // Include prediction point if enabled and solvable
    if (prediction.enabled && regression.enabled && regression.result) {
      const { a, b } = regression.result
      const v = prediction.value
      if (Number.isFinite(v as number)) {
        const isQuad = (regression.result.model || 'linear') === 'quadratic'
        if (!isQuad) {
          if (prediction.mode === 'x') {
            const x = v as number
            const y = a * x + b
            if (Number.isFinite(y)) {
              xValues.push(x)
              yValues.push(y)
            }
          } else {
            if (a !== 0) {
              const y = v as number
              const x = (y - b) / a
              if (Number.isFinite(x)) {
                xValues.push(x)
                yValues.push(y)
              }
            }
          }
        } else {
          const c = regression.result.c as number
          if (prediction.mode === 'x') {
            const x = v as number
            const y = a * x * x + b * x + c
            if (Number.isFinite(y)) {
              xValues.push(x)
              yValues.push(y)
            }
          } else {
            // solve ax^2 + bx + (c - y) = 0
            const y = v as number
            const A = a
            const B = b
            const C = (c as number) - y
            let xSol: number | undefined
            if (Math.abs(A) < 1e-12) {
              if (B !== 0) xSol = -C / B
            } else {
              const D = B * B - 4 * A * C
              if (D >= 0) {
                const r1 = (-B - Math.sign(B) * Math.sqrt(D)) / (2 * A)
                const r2 = C / (A * r1) * -1
                const [xxMin, xxMax] = autoDomain(xValues)
                const xc = (xxMin + xxMax) / 2
                xSol = Math.abs(r1 - xc) <= Math.abs(r2 - xc) ? r1 : r2
              }
            }
            if (Number.isFinite(xSol as number)) {
              xValues.push(xSol as number)
              yValues.push(y)
            }
          }
        }
      }
    }

    const dx = autoDomain(xValues)
    const dy = autoDomain(yValues)
    set({ view: { ...view, domainX: dx, domainY: dy } })
  },

  toggleRegression: (enabled) => set((s) => ({ regression: { ...s.regression, enabled } })),
  setThroughZero: (b) => set((s) => ({ regression: { ...s.regression, throughZero: b } })),
  setRegressionModel: (m) => set((s) => ({ regression: { ...s.regression, model: m } })),
  recomputeRegression: () => {
    const s = get()
    const pairs = s.numericPairs()
    if (!hasVariance(pairs.map((p) => p.x))) {
      set({ regression: { ...s.regression, result: undefined, error: 'Regression undefined (X has no variance).' } })
      return
    }
    const model = s.regression.model || 'linear'
    const res = model === 'quadratic'
      ? computeQuadraticRegression(pairs)
      : computeLinearRegression(pairs, s.regression.throughZero)
    set({ regression: { ...s.regression, result: res, error: undefined } })
  },

  setPredictionEnabled: (b) => set((s) => ({ prediction: { ...s.prediction, enabled: b } })),
  setPredictionMode: (m) => set((s) => ({ prediction: { ...s.prediction, mode: m } })),
  setPredictionValue: (v) => set((s) => ({ prediction: { ...s.prediction, value: v } })),
  setPredictionColor: (c) => set((s) => ({ prediction: { ...s.prediction, color: c } })),

  numericPairs: () => {
    const s = get()
    const xCol = s.table.columns.find((c) => c.key === s.plot.xKey)
    const yCol = s.table.columns.find((c) => c.key === s.plot.yKey)
    if (!xCol || !yCol) return []
    const out: XYPair[] = []
    const n = Math.max(xCol.values.length, yCol.values.length)
    for (let i = 0; i < n; i++) {
      const x = xCol.values[i]
      const y = yCol.values[i]
      if (typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y)) {
        out.push({ x, y })
      }
    }
    return dropNaNFinite(out)
  },
}))

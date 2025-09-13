import { useMemo } from 'react'
import { useDatasetStore } from '../state/store'

function fmtNum(n: number, sig = 4) {
  if (!Number.isFinite(n)) return '—'
  return Number(n.toPrecision(sig))
}

const PRESET_COLORS = [
  { label: 'Fuchsia', value: '#ff4d8d' },
  { label: 'Sky (blue)', value: '#60a5fa' },
  { label: 'Mint (teal)', value: '#2bd9d9' },
  { label: 'Lime', value: '#a5ff3d' },
  { label: 'Orange', value: '#ffb84d' },
  { label: 'Purple', value: '#a78bfa' },
]

export function RegressionPanel() {
  const regression = useDatasetStore((s) => s.regression)
  const toggle = useDatasetStore((s) => s.toggleRegression)
  const setThroughZero = useDatasetStore((s) => s.setThroughZero)
  const recompute = useDatasetStore((s) => s.recomputeRegression)
  const prediction = useDatasetStore((s) => s.prediction)
  const setPredictionEnabled = useDatasetStore((s) => s.setPredictionEnabled)
  const setPredictionMode = useDatasetStore((s) => s.setPredictionMode)
  const setPredictionValue = useDatasetStore((s) => s.setPredictionValue)
  const setPredictionColor = useDatasetStore((s) => s.setPredictionColor)
  // Avoid calling s.numericPairs() directly in the selector because it
  // returns a new array every time, which can cause an update loop in zustand v5.
  // Instead, subscribe to stable slices and derive pairs locally.
  const table = useDatasetStore((s) => s.table)
  const plot = useDatasetStore((s) => s.plot)
  const pairs = useMemo(() => {
    const xCol = table.columns.find((c) => c.key === plot.xKey)
    const yCol = table.columns.find((c) => c.key === plot.yKey)
    if (!xCol || !yCol) return [] as { x: number; y: number }[]
    const out: { x: number; y: number }[] = []
    const n = Math.max(xCol.values.length, yCol.values.length)
    for (let i = 0; i < n; i++) {
      const x = xCol.values[i]
      const y = yCol.values[i]
      if (typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y)) {
        out.push({ x, y })
      }
    }
    return out
  }, [table, plot.xKey, plot.yKey])

  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <input id="reg-toggle" type="checkbox" checked={regression.enabled}
          onChange={(e) => { toggle(e.target.checked); if (e.target.checked) recompute() }} aria-label="Enable regression" />
        <label htmlFor="reg-toggle" className="font-medium">Linear Regression</label>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input id="through-zero" type="checkbox" checked={regression.throughZero}
          onChange={(e) => { setThroughZero(e.target.checked); if (regression.enabled) recompute() }} aria-label="Force intercept = 0" />
        <label htmlFor="through-zero">Force intercept = 0</label>
      </div>
      {regression.enabled && (
        <div className="text-sm">
          {regression.error ? (
            <div className="text-red-400">{regression.error}</div>
          ) : regression.result ? (
            <div>
              <div>y = {fmtNum(regression.result.a)}·x + {fmtNum(regression.result.b)}</div>
              <div>R² = {fmtNum(regression.result.r2, 4)}; N = {regression.result.n}</div>
              {/* Prediction controls */}
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <input id="pred-enable" type="checkbox" checked={prediction.enabled}
                    onChange={(e) => setPredictionEnabled(e.target.checked)} aria-label="Enable prediction point" />
                  <label htmlFor="pred-enable" className="font-medium">Prediction Point</label>
                </div>
                {prediction.enabled && (
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div className="col-span-2 flex items-center gap-3">
                      <label className="flex items-center gap-2"><input type="radio" name="pred-mode" checked={prediction.mode==='x'} onChange={() => setPredictionMode('x')} aria-label="Predict by X"/> By X</label>
                      <label className="flex items-center gap-2"><input type="radio" name="pred-mode" checked={prediction.mode==='y'} onChange={() => setPredictionMode('y')} aria-label="Predict by Y"/> By Y</label>
                    </div>
                    <label style={{ color: 'var(--muted)' }}>{prediction.mode === 'x' ? 'X value' : 'Y value'}</label>
                    <input className="input" type="number" value={Number.isFinite(prediction.value as number) ? prediction.value : ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') { setPredictionValue(undefined); return }
                        const n = Number(v)
                        if (Number.isFinite(n)) setPredictionValue(n)
                      }} aria-label="Prediction input" />
                    <label style={{ color: 'var(--muted)' }}>Point color</label>
                    <select className="input" value={prediction.color || '#ff4d8d'} onChange={(e) => setPredictionColor(e.target.value)} aria-label="Prediction color">
                      {PRESET_COLORS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    {(() => {
                      const res = regression.result!
                      const v = prediction.value
                      if (!Number.isFinite(v as number)) return null
                      let x: number, y: number
                      if (prediction.mode === 'x') {
                        x = v as number
                        y = res.a * x + res.b
                      } else {
                        const denom = res.a
                        if (denom === 0) return <div className="col-span-2 text-red-400">Cannot solve X when slope = 0</div>
                        y = v as number
                        x = (y - res.b) / denom
                      }
                      const fmt = (n: number) => Number.isFinite(n) ? Number(n.toPrecision(4)) : '—'
                      return <div className="col-span-2" style={{ color: 'var(--muted)' }}>Point: ({fmt(x)}, {fmt(y)})</div>
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : pairs.length > 1 ? (
            <button className="btn-accent btn" onClick={recompute}>Compute regression</button>
          ) : (
            <div style={{ color: 'var(--muted)' }}>Not enough points</div>
          )}
        </div>
      )}
    </div>
  )
}

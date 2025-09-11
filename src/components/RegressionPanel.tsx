import { useMemo } from 'react'
import { useDatasetStore } from '../state/store'

function fmtNum(n: number, sig = 4) {
  if (!Number.isFinite(n)) return '—'
  return Number(n.toPrecision(sig))
}

export function RegressionPanel() {
  const regression = useDatasetStore((s) => s.regression)
  const toggle = useDatasetStore((s) => s.toggleRegression)
  const setThroughZero = useDatasetStore((s) => s.setThroughZero)
  const recompute = useDatasetStore((s) => s.recomputeRegression)
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

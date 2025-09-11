import { useDatasetStore } from '../state/store'

export function ReadabilityPanel() {
  const view = useDatasetStore((s) => s.view)
  const setAspect = useDatasetStore((s) => s.setAspect)
  const setNormalize = useDatasetStore((s) => s.setNormalize)
  const setLogX = useDatasetStore((s) => s.setLogX)
  const setLogY = useDatasetStore((s) => s.setLogY)
  const fitNicely = useDatasetStore((s) => s.fitNicely)
  return (
    <div className="panel p-4">
      <div className="font-medium mb-3">Readability</div>
      <div className="flex items-center gap-2 mb-3 text-sm">
        <label className="text-sm" style={{ color: 'var(--muted)' }}>Aspect</label>
        <select className="input" value={view.aspect}
          onChange={(e) => setAspect(Number(e.target.value))} aria-label="Aspect ratio">
          <option value={1}>1:1</option>
          <option value={4/3}>4:3</option>
          <option value={16/9}>16:9</option>
        </select>
        <input className="input w-24" type="number" step="0.1" value={view.aspect}
          onChange={(e) => setAspect(Number(e.target.value))} aria-label="Aspect custom" />
      </div>
      <div className="flex items-center gap-4 text-sm mb-3">
        <label className="flex items-center gap-1"><input type="checkbox" checked={view.normalize} onChange={(e) => setNormalize(e.target.checked)} aria-label="Normalize" /> Normalize</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={view.logX} onChange={(e) => setLogX(e.target.checked)} aria-label="Log X" /> Log X</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={view.logY} onChange={(e) => setLogY(e.target.checked)} aria-label="Log Y" /> Log Y</label>
      </div>
      <button className="btn" onClick={fitNicely} aria-label="Fit nicely">Fit nicely</button>
    </div>
  )
}
